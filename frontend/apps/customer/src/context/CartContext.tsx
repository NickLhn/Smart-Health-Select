import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { App } from 'antd';
import { addToCart as apiAddToCart, getCartList, deleteCartItems, updateCartCount } from '../services/cart';
import type { CartItemVO } from '../services/cart';

// Map backend VO to frontend interface for compatibility, 
// or update frontend to use VO directly. 
// Let's adapt the frontend interface to match backend data but keep friendly names if needed.
export interface CartItem {
  id: number; // Cart Item ID
  medicineId: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  specs?: string;
  stock?: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (medicineId: number, quantity: number) => Promise<boolean>;
  removeFromCart: (id: number) => Promise<void>;
  updateQuantity: (id: number, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  totalPrice: number;
  totalItems: number;
  loading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { message } = App.useApp();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getCartList();
      if (res && res.code === 200) {
        // Map VO to CartItem
        const items = (res.data || []).map(item => ({
          id: item.id,
          medicineId: item.medicineId,
          name: item.medicineName,
          price: item.price || 0, // Ensure price is not undefined
          quantity: item.count,
          image: item.medicineImage,
          stock: item.stock,
          specs: '标准规格' // Backend doesn't return specs yet, default it
        }));
        setCartItems(items);
      }
    } catch (error) {
      console.error('Failed to fetch cart', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on mount
  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = async (medicineId: number, quantity: number) => {
    try {
      const res = await apiAddToCart({ medicineId, count: quantity });
      if (res && res.code === 200) {
        await refreshCart();
        return true;
      } else {
        message.error(res.message || '添加失败');
        return false;
      }
    } catch (error) {
      console.error('Add to cart failed', error);
      message.error('添加失败');
      return false;
    }
  };

  const removeFromCart = async (id: number) => {
    try {
      const res = await deleteCartItems([id]);
      if (res && res.code === 200) {
        message.success('删除成功');
        await refreshCart();
      } else {
        message.error(res.message || '删除失败');
      }
    } catch (error) {
      console.error('Remove from cart failed', error);
      message.error('删除失败');
    }
  };

  const updateQuantity = async (id: number, quantity: number) => {
    if (quantity <= 0) {
      return removeFromCart(id);
    }
    try {
      const res = await updateCartCount({ id, count: quantity });
      if (res && res.code === 200) {
        await refreshCart();
      } else {
        message.error(res.message || '更新失败');
      }
    } catch (error) {
      console.error('Update quantity failed', error);
      message.error('更新失败');
    }
  };

  const clearCart = async () => {
    // Collect all IDs
    const ids = cartItems.map(item => item.id);
    if (ids.length === 0) return;
    
    try {
      const res = await deleteCartItems(ids);
      if (res && res.code === 200) {
        message.success('已清空');
        await refreshCart();
      } else {
        message.error(res.message || '清空失败');
      }
    } catch (error) {
      console.error('Clear cart failed', error);
      message.error('清空失败');
    }
  };

  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ 
      cartItems, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart, 
      refreshCart,
      totalPrice, 
      totalItems,
      loading 
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
