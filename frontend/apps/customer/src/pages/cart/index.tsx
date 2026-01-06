import React from 'react';
import { Table, Button, InputNumber, Empty } from 'antd';
import { DeleteOutlined, ShoppingCartOutlined, MinusOutlined, PlusOutlined, LeftOutlined } from '@ant-design/icons';
import { useCart } from '../../context/CartContext';
import type { CartItem } from '../../context/CartContext';
import { useNavigate } from 'react-router-dom';

const Cart: React.FC = () => {
  const { cartItems, removeFromCart, updateQuantity, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();

  const columns = [
    {
      title: '商品信息',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: CartItem) => (
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
             {record.image ? <img src={record.image} alt={text} className="w-full h-full object-cover" /> : null}
          </div>
          <div>
            <div className="font-medium">{text}</div>
            <div className="text-xs text-gray-500">{record.specs}</div>
          </div>
        </div>
      ),
    },
    {
      title: '单价',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => `¥${(price || 0).toFixed(2)}`,
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (quantity: number, record: CartItem) => (
        <InputNumber 
          min={1} 
          max={99} 
          value={quantity} 
          onChange={(val) => updateQuantity(record.id, val || 1)} 
        />
      ),
    },
    {
      title: '小计',
      key: 'subtotal',
      render: (_: any, record: CartItem) => (
        <span className="font-bold text-red-500">¥{((record.price || 0) * record.quantity).toFixed(2)}</span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: CartItem) => (
        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeFromCart(record.id)}>
          删除
        </Button>
      ),
    },
  ];

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="bg-white p-4 sticky top-0 md:hidden flex items-center">
            <LeftOutlined className="mr-4" onClick={() => navigate(-1)} />
            <h1 className="text-lg font-bold flex-1 text-center pr-6">购物车</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center py-20">
            <Empty description="购物车空空如也" />
            <Button type="primary" onClick={() => navigate('/')} className="mt-6 bg-[#00B96B] rounded-full px-8 h-10">
            去逛逛
            </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32 md:pb-8">
      {/* Mobile Header */}
      <div className="bg-white p-4 sticky top-0 z-10 md:hidden shadow-sm flex items-center justify-between">
         <div className="flex items-center" onClick={() => navigate(-1)}>
             <LeftOutlined className="text-gray-600 text-lg" />
         </div>
         <h1 className="text-lg font-bold text-gray-800">购物车 ({cartItems.length})</h1>
         <div className="text-sm text-gray-500" onClick={clearCart}>清空</div>
      </div>

      <div className="max-w-6xl mx-auto md:mt-8 px-4">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2 hidden md:flex">
            <ShoppingCartOutlined /> 购物车
        </h1>
      
        {/* Desktop Table */}
        <div className="hidden md:block bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
            <Table 
            columns={columns} 
            dataSource={cartItems} 
            rowKey="id" 
            pagination={false} 
            />
        </div>

        {/* Mobile List */}
        <div className="md:hidden mt-4 space-y-4">
            {cartItems.map(item => (
                <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm flex gap-3 animate-fade-in">
                    <div className="w-24 h-24 bg-gray-50 rounded-lg flex-shrink-0 overflow-hidden">
                        {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : null}
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-1">
                        <div>
                            <div className="flex justify-between items-start">
                                <h3 className="font-bold text-gray-800 line-clamp-2 text-sm mb-1">{item.name}</h3>
                                <DeleteOutlined className="text-gray-400 p-1" onClick={() => removeFromCart(item.id)} />
                            </div>
                            <p className="text-xs text-gray-400 bg-gray-50 inline-block px-2 py-0.5 rounded">{item.specs}</p>
                        </div>
                        <div className="flex justify-between items-end">
                            <div className="text-[#ff4d4f] font-bold text-lg">
                                <span className="text-xs">¥</span>{item.price}
                            </div>
                            <div className="flex items-center border rounded-lg overflow-hidden border-gray-200">
                                <button 
                                    className="w-8 h-7 flex items-center justify-center bg-gray-50 active:bg-gray-200"
                                    onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                >
                                    <MinusOutlined className="text-xs" />
                                </button>
                                <div className="w-10 h-7 flex items-center justify-center text-sm font-medium border-l border-r border-gray-200">
                                    {item.quantity}
                                </div>
                                <button 
                                    className="w-8 h-7 flex items-center justify-center bg-gray-50 active:bg-gray-200"
                                    onClick={() => updateQuantity(item.id, Math.min(99, item.quantity + 1))}
                                >
                                    <PlusOutlined className="text-xs" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>

        {/* Desktop Footer Action */}
        <div className="hidden md:flex bg-white rounded-2xl shadow-sm p-6 justify-between items-center">
            <Button danger onClick={clearCart}>清空购物车</Button>
            <div className="flex items-center gap-8">
                <div className="text-right">
                    <span className="text-gray-500 mr-2">共 {cartItems.reduce((acc, item) => acc + item.quantity, 0)} 件商品</span>
                    <span className="text-lg">合计：</span>
                    <span className="text-2xl font-bold text-[#ff4d4f]">¥{totalPrice.toFixed(2)}</span>
                </div>
                <Button type="primary" size="large" className="px-10 h-12 rounded-full bg-[#00B96B] hover:bg-[#009456] text-lg font-bold shadow-lg shadow-[#00B96B]/30" onClick={() => navigate('/order/checkout')}>
                    去结算
                </Button>
            </div>
        </div>
      </div>

      {/* Mobile Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-3 px-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50 md:hidden pb-safe">
          <div className="flex justify-between items-center">
              <div>
                  <div className="text-xs text-gray-500">
                      共 {cartItems.reduce((acc, item) => acc + item.quantity, 0)} 件
                  </div>
                  <div className="text-[#ff4d4f] font-bold text-xl leading-none mt-0.5">
                      <span className="text-xs mr-0.5">¥</span>{totalPrice.toFixed(2)}
                  </div>
              </div>
              <Button 
                type="primary" 
                className="h-10 px-8 rounded-full bg-[#00B96B] hover:bg-[#009456] font-bold shadow-lg shadow-[#00B96B]/30 border-none"
                onClick={() => navigate('/order/checkout')}
              >
                  去结算
              </Button>
          </div>
      </div>
    </div>
  );
};

export default Cart;
