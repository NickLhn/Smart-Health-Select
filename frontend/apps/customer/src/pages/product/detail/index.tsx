import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Rate, Tag, InputNumber, App, Image, Tabs, Breadcrumb, Spin, List, Avatar, Empty } from 'antd';
import { ShoppingCartOutlined, HeartOutlined, HeartFilled, ShareAltOutlined, SafetyCertificateOutlined, ShopOutlined, UserOutlined, MessageOutlined } from '@ant-design/icons';
import { useCart } from '@/context/CartContext';
import { getMedicineDetail, getMedicineCommentList } from '@/services/medicine';
import type { Medicine, MedicineComment } from '@/services/medicine';
import { checkFavorite, toggleFavorite } from '@/services/favorite';
import ChatDrawer from '@/components/chat-drawer';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  // Comment State
  const [comments, setComments] = useState<MedicineComment[]>([]);
  const [commentsTotal, setCommentsTotal] = useState(0);
  const [commentsLoading, setCommentsLoading] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return;
      setLoading(true);
      try {
        // 药品 ID 可能是 19 位 Long，不能再先转 Number，否则会丢精度。
        const res = await getMedicineDetail(id);
        if (res && res.code === 200) {
          setMedicine(res.data);
          // Check favorite status
          try {
            const favRes = await checkFavorite(id);
            if (favRes.code === 200) {
              setIsFavorite(favRes.data);
            }
          } catch (e) {
            // ignore
          }
        } else {
          message.error(res.message || '获取药品详情失败');
        }
      } catch (error) {
        console.error('Fetch medicine detail failed', error);
        message.error('获取药品详情失败');
      } finally {
        setLoading(false);
      }
    };

    const fetchComments = async () => {
      if (!id) return;
      setCommentsLoading(true);
      try {
        const res = await getMedicineCommentList(id, 1, 10);
        if (res.code === 200) {
            setComments(res.data.records);
            setCommentsTotal(res.data.total);
        }
      } catch (error) {
          console.error(error);
      } finally {
          setCommentsLoading(false);
      }
    };

    fetchDetail();
    fetchComments();
  }, [id]);

  const handleAddToCart = async () => {
    if (!medicine) return;
    const success = await addToCart(medicine.id, quantity);
    if (success) {
      message.success('已加入购物车');
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    navigate('/cart');
  };

  const handleFavorite = async () => {
    if (!medicine) return;
    try {
      const res = await toggleFavorite({ medicineId: medicine.id });
      if (res.code === 200) {
        setIsFavorite(!isFavorite);
        message.success(isFavorite ? '已取消收藏' : '已收藏');
      } else {
        message.error(res.message || '操作失败');
      }
    } catch (error) {
      message.error('操作失败，请先登录');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 pt-20 pb-10 relative overflow-hidden">
        {/* Background Elements */}
        <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-emerald-200/20 blur-3xl" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-teal-200/20 blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="glass-panel !bg-white/60 rounded-3xl p-8 shadow-sm flex flex-col md:flex-row gap-8 animate-pulse">
             <div className="w-full md:w-1/2 aspect-square bg-white/50 rounded-2xl" />
             <div className="flex-1 space-y-6">
                <div className="h-10 bg-white/50 rounded-lg w-3/4" />
                <div className="h-6 bg-white/50 rounded-lg w-1/2" />
                <div className="h-32 bg-white/50 rounded-2xl w-full" />
                <div className="h-14 bg-white/50 rounded-full w-1/3" />
             </div>
          </div>
        </div>
      </div>
    );
  }

  if (!medicine) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden">
        {/* Background Elements */}
        <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-emerald-200/20 blur-3xl" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-teal-200/20 blur-3xl" />
        </div>

        <div className="text-center p-8 glass-panel !bg-white/70 rounded-3xl shadow-soft max-w-md w-full mx-4 border border-white/50 relative z-10">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-inner">💊</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2 font-display">商品不存在</h2>
          <p className="text-gray-500 mb-8">该商品可能已下架或链接错误</p>
          <Button type="primary" size="large" onClick={() => navigate('/')} className="rounded-full px-8 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-none shadow-lg shadow-emerald-500/20">
            返回首页
          </Button>
        </div>
      </div>
    );
  }

  // Generate tags based on data
  const tags = ['正品保障', '极速发货'];
  if (medicine.categoryName) tags.push(medicine.categoryName);

  // Mobile Bottom Action Bar
  const MobileActionBar = () => (
    <div className="fixed bottom-0 left-0 right-0 glass-panel !bg-white/80 border-t border-white/30 p-3 px-4 flex items-center justify-between md:hidden z-50 pb-safe shadow-[0_-4px_30px_rgba(0,0,0,0.05)]">
      <div className="flex items-center gap-5 mr-4">
        <button type="button" className="bg-transparent border-0 p-0 flex flex-col items-center justify-center cursor-pointer text-gray-400 hover:text-emerald-600 transition-colors" onClick={() => navigate('/')} aria-label="返回首页">
           <ShopOutlined className="text-xl mb-0.5" />
           <span className="text-[10px] font-medium">店铺</span>
        </button>
        <button type="button" className="bg-transparent border-0 p-0 flex flex-col items-center justify-center cursor-pointer text-gray-400 hover:text-emerald-600 transition-colors" onClick={() => setChatOpen(true)} aria-label="联系商家客服">
           <MessageOutlined className="text-xl mb-0.5" />
           <span className="text-[10px] font-medium">客服</span>
        </button>
        <button type="button" className="bg-transparent border-0 p-0 flex flex-col items-center justify-center cursor-pointer text-gray-400 hover:text-red-500 transition-colors" onClick={handleFavorite} aria-label={isFavorite ? '取消收藏' : '收藏'}>
           {isFavorite ? <HeartFilled className="text-xl mb-0.5 text-red-500" /> : <HeartOutlined className="text-xl mb-0.5" />}
           <span className="text-[10px] font-medium">{isFavorite ? '已藏' : '收藏'}</span>
        </button>
        <button type="button" className="bg-transparent border-0 p-0 flex flex-col items-center justify-center cursor-pointer text-gray-400 hover:text-emerald-600 transition-colors relative" onClick={() => navigate('/cart')} aria-label="打开购物车">
           <ShoppingCartOutlined className="text-xl mb-0.5" />
           <span className="text-[10px] font-medium">购物车</span>
        </button>
      </div>
      <div className="flex-1 flex gap-3">
        <Button 
          className="flex-1 h-11 rounded-full bg-emerald-50 text-emerald-700 border-none font-bold shadow-none hover:bg-emerald-100"
          onClick={handleAddToCart}
        >
          加入购物车
        </Button>
        <Button 
          className="flex-1 h-11 rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white border-none font-bold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 transform active:scale-95 transition-all"
          onClick={handleBuyNow}
        >
          立即购买
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-12 pt-4 md:pt-8 relative overflow-hidden">
      {/* Background Elements */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-emerald-200/20 blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-teal-200/20 blur-3xl" />
        <div className="absolute top-[40%] left-[20%] w-[300px] h-[300px] rounded-full bg-cyan-200/20 blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Breadcrumb */}
        <div className="hidden md:block mb-6">
          <Breadcrumb 
            separator=">"
            className="text-sm"
            items={[
              { title: <a onClick={() => navigate('/')} className="text-gray-500 hover:text-emerald-600 transition-colors">首页</a> },
              { title: <a onClick={() => navigate('/medicine')} className="text-gray-500 hover:text-emerald-600 transition-colors">全部药品</a> },
              { title: <span className="text-gray-800 font-medium">{medicine.name}</span> },
            ]}
          />
        </div>

        <div className="glass-panel !bg-white/70 rounded-[2rem] p-6 md:p-8 shadow-soft flex flex-col lg:flex-row gap-10 lg:gap-16 mb-8 relative overflow-hidden border border-white/50">
          {/* Decorative background gradient */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-emerald-100/30 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          
          {/* Left: Images */}
          <div className="w-full lg:w-[45%] xl:w-[40%]">
            <div className="sticky top-24">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-white/50 border border-white/50 shadow-inner group mb-4">
                <Image 
                  src={medicine.mainImage} 
                  alt={medicine.name}
                  className="w-full h-full object-contain p-8 transition-transform duration-700 ease-out group-hover:scale-110 mix-blend-multiply"
                  fallback="https://via.placeholder.com/400x400?text=No+Image"
                  preview={{ 
                    mask: <div className="text-white font-medium bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full">点击查看大图</div> 
                  }}
                />
                <div className="absolute top-4 right-4 md:hidden">
                  <Button shape="circle" icon={<ShareAltOutlined />} className="bg-white/80 backdrop-blur border-none shadow-sm" />
                </div>
              </div>
              
              {/* Thumbnail Gallery */}
              <div className="hidden md:grid grid-cols-5 gap-3">
                {[medicine.mainImage].map((img, idx) => (
                  <div key={idx} className="aspect-square border-2 border-transparent hover:border-emerald-500 rounded-xl cursor-pointer overflow-hidden flex justify-center items-center bg-white/50 transition-all duration-300 transform hover:-translate-y-1 shadow-sm hover:shadow-md">
                    <img src={img} alt="thumbnail" className="w-full h-full object-contain p-2 mix-blend-multiply" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Info */}
          <div className="flex-1 relative z-10">
            <div className="flex justify-between items-start mb-4">
               <h1 className="text-2xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-700 leading-tight font-display">{medicine.name}</h1>
               <Button 
                 className="hidden md:flex text-gray-400 hover:text-emerald-600 border-gray-200 hover:border-emerald-200 !bg-transparent" 
                 shape="round"
                 icon={<ShareAltOutlined />} 
               >
                 分享
               </Button>
            </div>
            
            <div className="flex flex-wrap gap-3 items-center mb-8">
              {medicine.categoryName && <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg text-sm font-semibold shadow-sm border border-emerald-100">{medicine.categoryName}</span>}
              {medicine.specs && <span className="bg-gray-50 text-gray-600 px-3 py-1 rounded-lg text-sm font-medium border border-gray-100">规格: {medicine.specs}</span>}
              <span className="text-gray-400 text-sm flex items-center gap-1"><SafetyCertificateOutlined className="text-emerald-500" /> 库存: {medicine.stock}</span>
            </div>
            
            <div className="glass-panel !bg-white/50 p-6 md:p-8 rounded-2xl mb-8 border border-white/60 shadow-inner">
              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 font-display tracking-tight">
                  <span className="text-2xl mr-1 font-bold text-red-500">¥</span>{medicine.price?.toFixed(2) || '0.00'}
                </span>
                {medicine.price && (
                  <span className="text-gray-400 line-through text-lg">¥{(medicine.price * 1.2).toFixed(2)}</span>
                )}
                <Tag color="#ef4444" className="ml-2 border-none px-2 py-0.5 text-xs rounded bg-red-50 text-red-500 font-bold">限时特惠</Tag>
              </div>
              
              <div className="flex gap-8 text-sm text-gray-500 items-center pt-4 border-t border-gray-200/50">
                <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span> 销量 {medicine.sales > 1000 ? '1000+' : medicine.sales}</span>
                <span className="flex items-center gap-2"><Rate disabled defaultValue={4.5} className="text-yellow-400 text-sm" /> 4.5分</span>
                <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> 24小时发货</span>
              </div>
            </div>

            {/* Merchant Info */}
            {medicine.sellerName && (
              <div className="mb-8 p-4 border border-white/60 bg-white/60 rounded-2xl flex items-center justify-between hover:shadow-lg hover:bg-white/80 transition-all cursor-pointer group backdrop-blur-sm" onClick={() => navigate(`/shop/${medicine.sellerId}`)}>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-50 to-white rounded-xl flex items-center justify-center shadow-sm text-emerald-600 group-hover:scale-110 transition-transform duration-300 border border-emerald-100">
                     <ShopOutlined className="text-2xl" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-800 text-lg group-hover:text-emerald-600 transition-colors">{medicine.sellerName}</div>
                    <div className="text-xs text-emerald-600 flex items-center gap-1 mt-1 bg-emerald-50 w-fit px-2 py-0.5 rounded-md">
                      <SafetyCertificateOutlined /> 官方认证商家
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button size="middle" className="border-emerald-200 text-emerald-600 hover:bg-emerald-50 rounded-full px-5 hover:border-emerald-300 bg-transparent" onClick={(e) => { e.stopPropagation(); navigate(`/shop/${medicine.sellerId}`); }}>
                    进店逛逛
                  </Button>
                  <Button size="middle" className="bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 hover:text-gray-800 rounded-full w-10 p-0 flex items-center justify-center" icon={<MessageOutlined />} onClick={(e) => { e.stopPropagation(); setChatOpen(true); }} />
                </div>
              </div>
            )}

            <div className="mb-8 hidden md:block">
              <div className="mb-4 text-gray-900 font-bold font-display text-sm uppercase tracking-wider">服务保障</div>
              <div className="flex gap-4 flex-wrap">
                 {tags.map(tag => (
                   <div key={tag} className="flex items-center text-sm text-gray-600 bg-white/60 border border-white/60 px-3 py-1.5 rounded-lg shadow-sm backdrop-blur-sm">
                      <SafetyCertificateOutlined className="text-emerald-500 mr-2" />
                      {tag}
                   </div>
                 ))}
              </div>
            </div>

            <div className="mb-10 hidden md:flex items-center gap-6 p-5 bg-white/40 rounded-2xl w-fit border border-white/60 shadow-sm backdrop-blur-sm">
              <span className="text-gray-700 font-bold">购买数量</span>
              <InputNumber 
                min={1} 
                max={medicine.stock} 
                value={quantity} 
                onChange={(val) => setQuantity(val || 1)} 
                className="w-32 rounded-lg border-gray-200"
                size="large"
              />
              <span className="text-gray-400 text-sm">库存: {medicine.stock}件</span>
            </div>

            <div className="hidden md:flex gap-4 flex-wrap items-center">
              <Button type="primary" size="large" onClick={handleBuyNow} className="h-14 px-12 text-lg rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 shadow-lg shadow-emerald-500/30 border-none transform hover:-translate-y-1 transition-all duration-300 font-bold">
                立即购买
              </Button>
              <Button size="large" icon={<ShoppingCartOutlined />} onClick={handleAddToCart} className="h-14 px-8 text-lg rounded-full hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 border-gray-300 text-gray-600 font-medium transition-all duration-300 bg-white/50">
                加入购物车
              </Button>
              <Button 
                size="large" 
                icon={isFavorite ? <HeartFilled className="text-red-500" /> : <HeartOutlined />} 
                onClick={handleFavorite}
                className={`h-14 w-14 rounded-full flex items-center justify-center border-gray-200 shadow-sm hover:shadow-md transition-all bg-white/50 ${isFavorite ? "bg-red-50 border-red-100" : "hover:bg-gray-50"}`}
              />
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="glass-panel !bg-white/70 rounded-[2rem] p-6 md:p-10 shadow-soft min-h-[500px] relative overflow-hidden border border-white/50">
          <Tabs
            defaultActiveKey="1"
            size="large"
            className="custom-tabs"
            items={[
              {
                key: '1',
                label: <span className="text-lg font-bold px-4 py-2">商品详情</span>,
                children: (
                  <div className="py-8 md:px-4 max-w-4xl mx-auto">
                     <div className="mb-10">
                       <h3 className="font-bold mb-4 text-xl flex items-center gap-2 text-gray-800">
                         <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
                         功能主治/适应症
                       </h3>
                       <div className="text-gray-600 leading-loose text-base bg-white/50 p-6 rounded-2xl border border-white/60 shadow-sm">
                         {medicine.indication || medicine.description || '暂无描述'}
                       </div>
                     </div>
                     
                     {medicine.usageMethod && (
                       <div className="mb-10">
                         <h3 className="font-bold mb-4 text-xl flex items-center gap-2 text-gray-800">
                           <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
                           用法用量
                         </h3>
                         <div className="text-gray-600 leading-loose text-base bg-white/50 p-6 rounded-2xl border border-white/60 shadow-sm">
                           {medicine.usageMethod}
                         </div>
                       </div>
                     )}
                     
                     {medicine.contraindication && (
                       <div className="mb-10">
                         <h3 className="font-bold mb-4 text-xl flex items-center gap-2 text-gray-800">
                           <span className="w-1.5 h-6 bg-red-500 rounded-full"></span>
                           禁忌
                         </h3>
                         <div className="text-gray-600 leading-loose text-base bg-red-50/30 p-6 rounded-2xl border border-red-100">
                           {medicine.contraindication}
                         </div>
                       </div>
                     )}
                  </div>
                ),
              },
              {
                key: '2',
                label: <span className="text-lg font-bold px-4 py-2">用户评价 <span className="text-sm font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full ml-1">{commentsTotal}</span></span>,
                children: (
                    <div className="py-6 max-w-4xl mx-auto">
                        {commentsLoading ? <div className="flex justify-center py-20"><Spin size="large" /></div> : (
                            <List
                              itemLayout="vertical"
                              dataSource={comments}
                              split={false}
                              className="space-y-6"
                              renderItem={(item) => (
                                <List.Item className="!border-none bg-[#F8FAFC] rounded-2xl p-6 hover:bg-gray-50 transition-colors">
                                  <List.Item.Meta
                                    avatar={<Avatar src={item.userAvatar} icon={<UserOutlined />} size={48} className="border-2 border-white shadow-sm" />}
                                    title={
                                      <div className="flex justify-between items-center mb-2">
                                        <span className="font-bold text-gray-800 text-lg">{item.userName || '匿名用户'}</span>
                                        <span className="text-gray-400 text-sm font-normal">{item.createTime}</span>
                                      </div>
                                    }
                                    description={
                                      <div>
                                        <Rate disabled defaultValue={item.star} style={{ fontSize: 14 }} className="mb-3 text-yellow-400" />
                                        <div className="text-gray-700 text-base leading-relaxed mb-4">{item.content}</div>
                                        {item.images && (
                                          <Image.PreviewGroup>
                                            <div className="flex gap-3 mt-3 flex-wrap">
                                              {item.images.split(',').map((img, idx) => (
                                                <Image
                                                  key={idx}
                                                  src={img}
                                                  width={100}
                                                  height={100}
                                                  className="rounded-xl object-cover border border-gray-200 shadow-sm hover:scale-105 transition-transform duration-300"
                                                />
                                              ))}
                                            </div>
                                          </Image.PreviewGroup>
                                        )}
                                        {item.reply && (
                                          <div className="mt-4 bg-white p-4 rounded-xl text-sm text-gray-600 border border-gray-100 shadow-sm relative overflow-hidden">
                                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
                                              <div className="font-bold text-gray-800 mb-1 flex items-center gap-2">
                                                <ShopOutlined className="text-emerald-500" /> 商家回复：
                                              </div>
                                              <div className="pl-6">{item.reply}</div>
                                              {item.replyTime && <div className="text-xs text-gray-400 mt-2 pl-6">{item.replyTime}</div>}
                                          </div>
                                        )}
                                      </div>
                                    }
                                  />
                                </List.Item>
                              )}
                              locale={{ 
                                emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<span className="text-gray-400">暂无评价，快来抢沙发吧~</span>} /> 
                              }}
                            />
                        )}
                    </div>
                ),
              },
            ]}
          />
        </div>
      </div>
      
      <MobileActionBar />
      
      <ChatDrawer 
        open={chatOpen} 
        onClose={() => setChatOpen(false)} 
        targetUserId={medicine.sellerId || 0}
        targetUserName={medicine.sellerName}
      />
    </div>
  );
};

export default ProductDetail;
