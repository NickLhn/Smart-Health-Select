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
      className: 'bg-transparent',
      render: (text: string, record: CartItem) => (
        <div className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate(`/product/${record.id}`)}>
          <div className="w-20 h-20 bg-gray-50 rounded-xl flex-shrink-0 overflow-hidden border border-gray-100 shadow-sm group-hover:shadow-md transition-all">
             {record.image ? (
                <img src={record.image} alt={text} className="w-full h-full object-contain p-2 mix-blend-multiply" />
             ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">无图</div>
             )}
          </div>
          <div>
            <div className="font-bold text-gray-800 text-base group-hover:text-emerald-600 transition-colors">{text}</div>
            <div className="text-xs text-gray-500 mt-1 bg-gray-50 inline-block px-2 py-0.5 rounded-full border border-gray-100">{record.specs}</div>
          </div>
        </div>
      ),
    },
    {
      title: '单价',
      dataIndex: 'price',
      key: 'price',
      className: 'bg-transparent',
      render: (price: number) => <span className="font-medium text-gray-600">¥{(price || 0).toFixed(2)}</span>,
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      className: 'bg-transparent',
      render: (quantity: number, record: CartItem) => (
        <div className="flex items-center border border-gray-200 rounded-full overflow-hidden w-fit shadow-sm bg-white">
            <button 
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 active:bg-gray-100 transition-colors text-gray-500"
                onClick={() => updateQuantity(record.id, Math.max(1, record.quantity - 1))}
            >
                <MinusOutlined className="text-xs" />
            </button>
            <div className="w-10 h-8 flex items-center justify-center text-sm font-bold text-gray-700 border-l border-r border-gray-100">
                {quantity}
            </div>
            <button 
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 active:bg-gray-100 transition-colors text-gray-500"
                onClick={() => updateQuantity(record.id, Math.min(99, record.quantity + 1))}
            >
                <PlusOutlined className="text-xs" />
            </button>
        </div>
      ),
    },
    {
      title: '小计',
      key: 'subtotal',
      className: 'bg-transparent',
      render: (_: any, record: CartItem) => (
        <span className="font-bold text-red-500 text-lg">¥{((record.price || 0) * record.quantity).toFixed(2)}</span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      className: 'bg-transparent',
      render: (_: any, record: CartItem) => (
        <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => removeFromCart(record.id)}
            className="hover:bg-red-50 rounded-full"
        >
          删除
        </Button>
      ),
    },
  ];

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 relative overflow-hidden flex flex-col">
        {/* Background Elements */}
        <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-emerald-200/20 blur-3xl" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-teal-200/20 blur-3xl" />
          <div className="absolute top-[40%] left-[20%] w-[300px] h-[300px] rounded-full bg-cyan-200/20 blur-3xl" />
        </div>

        <div className="bg-white/60 backdrop-blur-xl p-4 sticky top-0 md:hidden flex items-center border-b border-white/50 z-10">
            <LeftOutlined className="mr-4 text-gray-600" onClick={() => navigate(-1)} />
            <h1 className="text-lg font-bold flex-1 text-center pr-6 text-gray-800">购物车</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 relative z-10">
            <div className="w-48 h-48 bg-white/50 backdrop-blur-sm rounded-full flex items-center justify-center mb-8 shadow-inner shadow-gray-200/50">
                <ShoppingCartOutlined className="text-6xl text-emerald-200/50" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">购物车空空如也</h2>
            <p className="text-gray-500 mb-8">去挑选一些健康的药品吧</p>
            <Button 
                type="primary" 
                onClick={() => navigate('/')} 
                className="bg-gradient-to-r from-emerald-500 to-teal-500 border-none rounded-full px-12 h-12 text-lg font-bold shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:scale-105 transition-all"
            >
                去逛逛
            </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-32 md:pb-8 relative overflow-hidden">
      {/* Background Elements */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-emerald-200/20 blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-teal-200/20 blur-3xl" />
        <div className="absolute top-[40%] left-[20%] w-[300px] h-[300px] rounded-full bg-cyan-200/20 blur-3xl" />
      </div>

      {/* Mobile Header */}
      <div className="bg-white/70 backdrop-blur-xl p-4 sticky top-0 z-10 md:hidden shadow-sm border-b border-white/50 flex items-center justify-between">
         <div className="flex items-center w-10 h-10 justify-center -ml-2 rounded-full active:bg-gray-100 transition-colors" onClick={() => navigate(-1)}>
             <LeftOutlined className="text-gray-600 text-lg" />
         </div>
         <h1 className="text-lg font-bold text-gray-800">购物车 ({cartItems.length})</h1>
         <div className="text-sm text-gray-500 active:text-gray-800 px-2 py-1" onClick={clearCart}>清空</div>
      </div>

      <div className="max-w-6xl mx-auto md:mt-8 px-4 pt-4 md:pt-0 relative z-10">
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3 hidden md:flex text-gray-800">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                <ShoppingCartOutlined className="text-2xl" />
            </div>
            购物车
        </h1>
      
        {/* Desktop Table */}
        <div className="hidden md:block glass-panel !bg-white/70 rounded-3xl shadow-sm border border-white/60 overflow-hidden mb-6 p-4">
            <Table 
                columns={columns} 
                dataSource={cartItems} 
                rowKey="id" 
                pagination={false} 
                rowClassName="hover:bg-emerald-50/50 transition-colors"
            />
        </div>

        {/* Mobile List */}
        <div className="md:hidden space-y-4">
            {cartItems.map(item => (
                <div key={item.id} className="glass-panel !bg-white/70 p-4 rounded-2xl shadow-sm border border-white/60 flex gap-4 animate-fade-in relative overflow-hidden group">
                    <div className="w-24 h-24 bg-white rounded-xl flex-shrink-0 overflow-hidden border border-gray-100 shadow-sm">
                        {item.image ? (
                            <img src={item.image} className="w-full h-full object-contain p-2 mix-blend-multiply" alt={item.name} />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">无图</div>
                        )}
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-1 z-10">
                        <div>
                            <div className="flex justify-between items-start gap-2">
                                <h3 className="font-bold text-gray-800 line-clamp-2 text-sm mb-1 leading-snug">{item.name}</h3>
                                <div className="active:bg-red-50 p-1.5 rounded-full transition-colors -mr-2 -mt-2" onClick={() => removeFromCart(item.id)}>
                                    <DeleteOutlined className="text-gray-400" />
                                </div>
                            </div>
                            <p className="text-xs text-emerald-600 bg-emerald-50 inline-block px-2 py-0.5 rounded-md font-medium">{item.specs}</p>
                        </div>
                        <div className="flex justify-between items-end mt-2">
                            <div className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-pink-600 font-bold text-xl flex items-baseline">
                                <span className="text-xs mr-0.5 text-red-500">¥</span>{item.price}
                            </div>
                            <div className="flex items-center border rounded-full overflow-hidden border-gray-200 bg-white shadow-sm">
                                <button 
                                    className="w-8 h-7 flex items-center justify-center active:bg-gray-100 text-gray-500 hover:text-emerald-600"
                                    onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                >
                                    <MinusOutlined className="text-xs" />
                                </button>
                                <div className="w-8 h-7 flex items-center justify-center text-sm font-bold text-gray-800 border-l border-r border-gray-100 bg-gray-50/50">
                                    {item.quantity}
                                </div>
                                <button 
                                    className="w-8 h-7 flex items-center justify-center active:bg-gray-100 text-gray-500 hover:text-emerald-600"
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
        <div className="hidden md:flex glass-panel !bg-white/80 rounded-2xl shadow-lg border border-white/60 p-6 justify-between items-center mt-6 sticky bottom-6 backdrop-blur-xl">
            <Button danger type="text" onClick={clearCart} icon={<DeleteOutlined />}>清空购物车</Button>
            <div className="flex items-center gap-8">
                <div className="text-right">
                    <span className="text-gray-500 mr-2">共 <span className="font-bold text-gray-800">{cartItems.reduce((acc, item) => acc + item.quantity, 0)}</span> 件商品</span>
                    <span className="text-lg text-gray-600">合计：</span>
                    <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-pink-600 font-din">¥{totalPrice.toFixed(2)}</span>
                </div>
                <Button 
                    type="primary" 
                    size="large" 
                    className="px-12 h-14 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 border-none text-xl font-bold shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:scale-105 active:scale-95 transition-all" 
                    onClick={() => navigate('/order/checkout')}
                >
                    去结算
                </Button>
            </div>
        </div>
      </div>

      {/* Mobile Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-100 p-3 px-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50 md:hidden pb-safe">
          <div className="flex justify-between items-center">
              <div>
                  <div className="text-xs text-gray-500 mb-1">
                      共 <span className="font-bold text-gray-800">{cartItems.reduce((acc, item) => acc + item.quantity, 0)}</span> 件
                  </div>
                  <div className="text-red-500 font-bold text-2xl leading-none flex items-baseline">
                      <span className="text-sm mr-0.5">¥</span>{totalPrice.toFixed(2)}
                  </div>
              </div>
              <Button 
                type="primary" 
                className="h-11 px-10 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 border-none font-bold text-lg shadow-lg shadow-emerald-500/30 hover:brightness-110 active:scale-95 transition-all"
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
