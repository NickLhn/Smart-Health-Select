import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Rate, Tag, InputNumber, App, Image, Tabs, Card, Breadcrumb, Spin, Divider, List, Avatar, Empty } from 'antd';
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
        const res = await getMedicineDetail(Number(id));
        if (res && res.code === 200) {
          setMedicine(res.data);
          // Check favorite status
          try {
            const favRes = await checkFavorite(Number(id));
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
        const res = await getMedicineCommentList(Number(id), 1, 10);
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
      <div className="max-w-[1200px] mx-auto px-4 py-6">
        <div className="bg-white rounded-xl p-6 mb-4 flex gap-8">
            <div className="w-[400px] h-[400px] bg-gray-100 rounded-lg animate-pulse" />
            <div className="flex-1 space-y-4">
                <div className="h-8 bg-gray-100 rounded w-3/4 animate-pulse" />
                <div className="h-4 bg-gray-100 rounded w-1/2 animate-pulse" />
                <div className="h-24 bg-gray-100 rounded w-full animate-pulse" />
                <div className="h-10 bg-gray-100 rounded w-1/3 animate-pulse" />
            </div>
        </div>
      </div>
    );
  }

  if (!medicine) {
    return (
      <div className="text-center mt-20">
        <h2 className="text-xl font-bold mb-4">商品不存在或已下架</h2>
        <Button type="primary" onClick={() => navigate('/')}>返回首页</Button>
      </div>
    );
  }

  // Generate tags based on data
  const tags = ['正品保障', '极速发货'];
  if (medicine.categoryName) tags.push(medicine.categoryName);

  // Mobile Bottom Action Bar
  const MobileActionBar = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-2 px-4 flex items-center justify-between md:hidden z-50 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <div className="flex items-center gap-4 mr-2">
        <div className="flex flex-col items-center justify-center cursor-pointer text-gray-500" onClick={() => navigate('/')}>
           <ShopOutlined className="text-xl" />
           <span className="text-[10px]">店铺</span>
        </div>
        <div className="flex flex-col items-center justify-center cursor-pointer text-gray-500" onClick={() => setChatOpen(true)}>
           <MessageOutlined className="text-xl" />
           <span className="text-[10px]">客服</span>
        </div>
        <div className="flex flex-col items-center justify-center cursor-pointer text-gray-500" onClick={handleFavorite}>
           {isFavorite ? <HeartFilled className="text-xl text-red-500" /> : <HeartOutlined className="text-xl" />}
           <span className="text-[10px]">{isFavorite ? '已藏' : '收藏'}</span>
        </div>
        <div className="flex flex-col items-center justify-center cursor-pointer text-gray-500 relative" onClick={() => navigate('/cart')}>
           <ShoppingCartOutlined className="text-xl" />
           <span className="text-[10px]">购物车</span>
        </div>
      </div>
      <div className="flex-1 flex gap-2">
        <Button 
          className="flex-1 h-10 rounded-full bg-yellow-400 text-white border-none font-bold shadow-sm"
          onClick={handleAddToCart}
        >
          加入购物车
        </Button>
        <Button 
          className="flex-1 h-10 rounded-full bg-[#00B96B] text-white border-none font-bold shadow-md shadow-[#00B96B]/30"
          onClick={handleBuyNow}
        >
          立即购买
        </Button>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-0 md:px-4 py-0 md:py-6 pb-20 md:pb-0 bg-[#f5f7fa] md:bg-transparent min-h-screen">
      <div className="hidden md:block mb-4">
        <Breadcrumb 
          items={[
            { title: <a onClick={() => navigate('/')}>首页</a> },
            { title: <a onClick={() => navigate('/medicine')}>全部药品</a> },
            { title: medicine.name },
          ]}
        />
      </div>

      <div className="bg-white md:rounded-2xl p-0 md:p-8 shadow-sm flex flex-col md:flex-row gap-8 lg:gap-12">
        {/* Left: Images */}
        <div className="w-full md:w-2/5 lg:w-1/3">
          <div className="relative aspect-square md:rounded-xl overflow-hidden bg-gray-50 flex justify-center items-center group">
            <Image 
              src={medicine.mainImage} 
              alt={medicine.name}
              className="w-full h-full object-cover md:object-contain transition-transform duration-500 group-hover:scale-105"
              fallback="https://via.placeholder.com/400x400?text=No+Image"
              preview={{ mask: <div className="text-white text-sm">点击查看大图</div> }}
            />
            <div className="absolute top-4 right-4 md:hidden">
              <Button shape="circle" icon={<ShareAltOutlined />} />
            </div>
          </div>
          {/* Thumbnail placeholder */}
          <div className="hidden md:flex gap-3 mt-4">
            {[medicine.mainImage].map((img, idx) => (
              <div key={idx} className="w-20 h-20 border-2 border-transparent hover:border-[#00B96B] rounded-lg cursor-pointer overflow-hidden flex justify-center items-center bg-gray-50 transition-all">
                <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>

        {/* Right: Info */}
        <div className="flex-1 px-4 md:px-0 pt-4 md:pt-0">
          <div className="flex justify-between items-start">
             <h1 className="text-xl md:text-3xl font-bold text-gray-800 mb-2 leading-snug">{medicine.name}</h1>
             <Button 
               className="hidden md:flex" 
               type="text" 
               icon={<ShareAltOutlined />} 
             >
               分享
             </Button>
          </div>
          
          <div className="text-gray-500 text-sm mb-6 flex flex-wrap gap-4 items-center">
            {medicine.categoryName && <Tag color="blue">{medicine.categoryName}</Tag>}
            {medicine.specs && <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600">规格: {medicine.specs}</span>}
            <span className="text-gray-400">库存: {medicine.stock}</span>
          </div>
          
          <div className="bg-gray-50/80 p-4 md:p-6 rounded-xl mb-6 border border-gray-100">
            <div className="flex items-baseline gap-3 mb-2">
              <span className="text-3xl md:text-4xl font-bold text-[#ff4d4f]">
                <span className="text-lg mr-1">¥</span>{medicine.price?.toFixed(2) || '0.00'}
              </span>
              {medicine.price && (
                <span className="text-gray-400 line-through text-sm">¥{(medicine.price * 1.2).toFixed(2)}</span>
              )}
              <Tag color="red" className="ml-2 border-none">限时特惠</Tag>
            </div>
            <div className="flex gap-6 text-sm text-gray-500 items-center mt-3">
              <span>销量 {medicine.sales > 1000 ? '1000+' : medicine.sales}</span>
              <span className="flex items-center gap-1"><Rate disabled defaultValue={4.5} style={{ fontSize: 12 }} /> 4.5分</span>
              <span>24小时发货</span>
            </div>
          </div>

          {/* Merchant Info */}
          {medicine.sellerName && (
            <div className="mb-6 p-4 border border-green-100 bg-green-50/50 rounded-xl flex items-center justify-between hover:shadow-sm transition-shadow cursor-pointer" onClick={() => navigate(`/shop/${medicine.sellerId}`)}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-green-600">
                   <ShopOutlined className="text-xl" />
                </div>
                <div>
                  <div className="font-bold text-gray-800 text-base">{medicine.sellerName}</div>
                  <div className="text-xs text-green-600 flex items-center gap-1">
                    <SafetyCertificateOutlined /> 官方认证商家
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="small" className="border-green-500 text-green-600 hover:bg-green-50 rounded-full px-4" onClick={(e) => { e.stopPropagation(); navigate(`/shop/${medicine.sellerId}`); }}>
                  进店
                </Button>
                <Button size="small" className="border-blue-500 text-blue-600 hover:bg-blue-50 rounded-full px-4" icon={<MessageOutlined />} onClick={(e) => { e.stopPropagation(); setChatOpen(true); }}>
                  联系商家
                </Button>
              </div>
            </div>
          )}

          <div className="mb-8 hidden md:block">
            <div className="mb-3 text-gray-800 font-medium">服务保障</div>
            <div className="flex gap-3 flex-wrap">
               {tags.map(tag => (
                 <div key={tag} className="flex items-center text-sm text-gray-600">
                    <SafetyCertificateOutlined className="text-[#00B96B] mr-1" />
                    {tag}
                 </div>
               ))}
            </div>
          </div>

          <div className="mb-8 hidden md:flex items-center gap-4 p-4 bg-gray-50 rounded-xl w-fit">
            <span className="text-gray-600 font-medium">购买数量</span>
            <InputNumber 
              min={1} 
              max={medicine.stock} 
              value={quantity} 
              onChange={(val) => setQuantity(val || 1)} 
              className="w-24"
            />
            <span className="text-gray-400 text-sm">库存: {medicine.stock}件</span>
          </div>

          <div className="hidden md:flex gap-4 flex-wrap">
            <Button type="primary" size="large" onClick={handleBuyNow} className="h-12 px-10 text-lg rounded-full bg-[#00B96B] hover:bg-[#009456] shadow-lg shadow-[#00B96B]/20 border-none">
              立即购买
            </Button>
            <Button size="large" icon={<ShoppingCartOutlined />} onClick={handleAddToCart} className="h-12 px-8 text-lg rounded-full hover:border-[#00B96B] hover:text-[#00B96B]">
              加入购物车
            </Button>
            <Button 
              size="large" 
              icon={isFavorite ? <HeartFilled className="text-red-500" /> : <HeartOutlined />} 
              onClick={handleFavorite}
              className={`h-12 w-12 rounded-full flex items-center justify-center ${isFavorite ? "border-red-200 bg-red-50" : ""}`}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 md:mt-8 bg-white md:rounded-2xl p-4 md:p-8 shadow-sm min-h-[400px]">
        <Tabs
          defaultActiveKey="1"
          size="large"
          items={[
            {
              key: '1',
              label: '商品详情',
              children: (
                <div className="py-4 md:px-4">
                   <div className="mb-8">
                     <h3 className="font-bold mb-3 text-lg border-l-4 border-[#00B96B] pl-3">功能主治/适应症</h3>
                     <p className="text-gray-600 leading-loose text-base bg-gray-50 p-4 rounded-lg">{medicine.indication || medicine.description || '暂无描述'}</p>
                   </div>
                   
                   {medicine.usageMethod && (
                     <div className="mb-8">
                       <h3 className="font-bold mb-3 text-lg border-l-4 border-[#00B96B] pl-3">用法用量</h3>
                       <p className="text-gray-600 leading-loose text-base bg-gray-50 p-4 rounded-lg">{medicine.usageMethod}</p>
                     </div>
                   )}
                   
                   {medicine.contraindication && (
                     <div className="mb-8">
                       <h3 className="font-bold mb-3 text-lg border-l-4 border-[#ff4d4f] pl-3">禁忌</h3>
                       <p className="text-gray-600 leading-loose text-base bg-red-50 p-4 rounded-lg">{medicine.contraindication}</p>
                     </div>
                   )}
                </div>
              ),
            },
            {
              key: '2',
              label: `用户评价 (${commentsTotal})`,
              children: (
                  <div className="py-4">
                      {commentsLoading ? <Spin /> : (
                          <List
                            itemLayout="horizontal"
                            dataSource={comments}
                            renderItem={(item) => (
                              <List.Item className="!border-b-gray-100">
                                <List.Item.Meta
                                  avatar={<Avatar src={item.userAvatar} icon={<UserOutlined />} size="large" />}
                                  title={
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="font-medium text-gray-800">{item.userName || '匿名用户'}</span>
                                      <span className="text-gray-400 text-xs">{item.createTime}</span>
                                    </div>
                                  }
                                  description={
                                    <div>
                                      <Rate disabled defaultValue={item.star} style={{ fontSize: 14 }} className="mb-2" />
                                      <div className="text-gray-700 text-base leading-relaxed">{item.content}</div>
                                      {item.images && (
                                        <Image.PreviewGroup>
                                          <div className="flex gap-2 mt-3">
                                            {item.images.split(',').map((img, idx) => (
                                              <Image
                                                key={idx}
                                                src={img}
                                                width={80}
                                                height={80}
                                                className="rounded-lg object-cover border border-gray-100"
                                              />
                                            ))}
                                          </div>
                                        </Image.PreviewGroup>
                                      )}
                                      {item.reply && (
                                        <div className="mt-3 bg-gray-50 p-3 rounded-lg text-sm text-gray-600">
                                            <div className="font-bold text-gray-800 mb-1">商家回复：</div>
                                            <div>{item.reply}</div>
                                            {item.replyTime && <div className="text-xs text-gray-400 mt-1">{item.replyTime}</div>}
                                        </div>
                                      )}
                                    </div>
                                  }
                                />
                              </List.Item>
                            )}
                            locale={{ emptyText: <Empty description="暂无评价" /> }}
                          />
                      )}
                  </div>
              ),
            },
          ]}
        />
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
