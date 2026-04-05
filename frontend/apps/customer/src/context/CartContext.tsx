import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { App } from 'antd';
import { addToCart as apiAddToCart, getCartList, deleteCartItems, updateCartCount } from '../services/cart';
import type { CartItemVO } from '../services/cart';

// 购物车上下文会把后端返回的 VO 映射为前端更易用的结构。
export interface CartItem {
  id: string;
  medicineId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  specs?: string;
  stock?: number;
}

// 购物车上下文负责维护购物车项、总价和常用操作。
interface CartContextType {
  cartItems: CartItem[];
  addToCart: (medicineId: string, quantity: number) => Promise<boolean>;
  removeFromCart: (id: string) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
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
        // 把后端 VO 转成前端页面直接消费的字段结构。
        const items = (res.data || []).map(item => ({
          id: item.id,
          medicineId: item.medicineId,
          name: item.medicineName,
          price: item.price || 0,
          quantity: item.count,
          image: item.medicineImage,
          stock: item.stock,
          // 后端暂未返回规格，先给前端一个占位值。
          specs: '标准规格'
        }));
        setCartItems(items);
      }
    } catch (error) {
      console.error('Failed to fetch cart', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Provider 挂载后先拉一次购物车。
  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = async (medicineId: string, quantity: number) => {
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

  const removeFromCart = async (id: string) => {
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

  const updateQuantity = async (id: string, quantity: number) => {
    if (quantity <= 0) {
      // 数量减到 0 及以下时，直接视为删除。
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
    // 清空购物车本质上是批量删除当前所有购物车项。
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

  // 总价和件数在上下文层统一计算，页面直接消费。
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
    // 强制在 Provider 内部使用，避免拿到空上下文。
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
