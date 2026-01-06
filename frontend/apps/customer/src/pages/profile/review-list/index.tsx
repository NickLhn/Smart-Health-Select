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
        <List.Item key={item.id} className="block mb-4 border rounded-xl p-4 hover:shadow-md transition-all bg-white">
          <div className="flex justify-between items-start mb-2">
            <div className="flex gap-3">
              {item.medicineImage && (
                <img 
                  src={item.medicineImage} 
                  alt={item.medicineName} 
                  className="w-12 h-12 object-cover rounded-md border border-gray-100"
                />
              )}
              <div>
                <div className="font-bold text-gray-800 mb-1">
                   {item.medicineName || `药品ID: ${item.medicineId}`}
                </div>
                <div className="flex items-center gap-2">
                  <Rate disabled defaultValue={item.star} className="text-sm" />
                  <span className="text-gray-400 text-xs">{item.createTime}</span>
                </div>
              </div>
            </div>
            <Button size="small" onClick={() => navigate(`/product/${item.medicineId}`)}>
              查看商品
            </Button>
          </div>
          
          <p className="text-gray-600 my-2">{item.content}</p>
          
          {item.images && (
            <div className="flex gap-2 mt-2">
              {item.images.split(',').map((img, idx) => (
                <Image
                  key={idx}
                  src={img}
                  width={60}
                  height={60}
                  className="rounded-lg object-cover"
                />
              ))}
            </div>
          )}

          {item.reply && (
            <div className="mt-3 bg-gray-50 p-3 rounded text-sm text-gray-600">
              <div className="font-bold text-gray-800 mb-1">商家回复：</div>
              <div>{item.reply}</div>
              {item.replyTime && <div className="text-xs text-gray-400 mt-1">{item.replyTime}</div>}
            </div>
          )}
        </List.Item>
      )}
      locale={{ emptyText: <Empty description="您还没有发表过评价" /> }}
    />
  );
};

export default ReviewList;
