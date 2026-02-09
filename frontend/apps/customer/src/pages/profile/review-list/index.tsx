import React, { useEffect, useState } from 'react';
import { List, Rate, Image, Empty, message, Tag, Button } from 'antd';
import { getMyCommentList } from '@/services/medicine';
import type { MedicineComment } from '@/services/medicine';
import { useNavigate } from 'react-router-dom';

interface ReviewListProps {
  active?: boolean;
}

const ReviewList: React.FC<ReviewListProps> = ({ active }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState<MedicineComment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const fetchReviews = async (currPage = 1) => {
    setLoading(true);
    try {
      const res = await getMyCommentList(currPage, 10);
      if (res.code === 200) {
        setReviews(res.data.records);
        setTotal(res.data.total);
        setPage(currPage);
      }
    } catch (error) {
      console.error(error);
      message.error('获取评价列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (active) {
      fetchReviews(1);
    }
  }, [active]);

  return (
    <List
      loading={loading}
      dataSource={reviews}
      pagination={{
        current: page,
        total,
        pageSize: 10,
        onChange: (p) => fetchReviews(p),
      }}
      renderItem={(item) => (
        <List.Item key={item.id} className="block mb-4 glass-panel !bg-white/40 border border-white/60 rounded-2xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="flex gap-4">
              <div className="relative group cursor-pointer" onClick={() => navigate(`/product/${item.medicineId}`)}>
                  {item.medicineImage && (
                    <img 
                      src={item.medicineImage} 
                      alt={item.medicineName} 
                      className="w-14 h-14 object-cover rounded-xl border border-white shadow-sm group-hover:shadow-md transition-shadow"
                    />
                  )}
              </div>
              <div>
                <div className="font-bold text-gray-800 mb-1 text-lg line-clamp-1 cursor-pointer hover:text-emerald-600 transition-colors" onClick={() => navigate(`/product/${item.medicineId}`)}>
                   {item.medicineName || `药品ID: ${item.medicineId}`}
                </div>
                <div className="flex items-center gap-3">
                  <Rate disabled defaultValue={item.star} className="text-sm text-emerald-400" />
                  <span className="text-gray-400 text-xs bg-white/50 px-2 py-0.5 rounded-full">{item.createTime}</span>
                </div>
              </div>
            </div>
            <Button size="small" className="rounded-full text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 border-gray-200" onClick={() => navigate(`/product/${item.medicineId}`)}>
              查看商品
            </Button>
          </div>
          
          <p className="text-gray-600 my-3 leading-relaxed pl-1">{item.content}</p>
          
          {item.images && (
            <div className="flex gap-3 mt-3">
              {item.images.split(',').map((img, idx) => (
                <Image
                  key={idx}
                  src={img}
                  width={80}
                  height={80}
                  className="rounded-xl object-cover border border-white/60 shadow-sm hover:scale-105 transition-transform cursor-pointer"
                />
              ))}
            </div>
          )}

          {item.reply && (
            <div className="mt-4 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 text-sm text-gray-600 relative">
              <div className="absolute top-0 left-4 -translate-y-1/2 w-3 h-3 bg-emerald-50 border-t border-l border-emerald-100 rotate-45"></div>
              <div className="font-bold text-emerald-700 mb-1 flex items-center gap-2">
                  <span className="w-1 h-4 bg-emerald-500 rounded-full"></span>
                  商家回复
              </div>
              <div className="pl-3 text-gray-700">{item.reply}</div>
              {item.replyTime && <div className="text-xs text-emerald-400/60 mt-2 text-right">{item.replyTime}</div>}
            </div>
          )}
        </List.Item>
      )}
      locale={{ emptyText: <Empty description="您还没有发表过评价" /> }}
    />
  );
};

export default ReviewList;
