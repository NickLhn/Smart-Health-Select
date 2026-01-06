import React, { useEffect, useState } from 'react';
import { Card, List, Rate, Image, Tag, Space, Typography, Button } from 'antd';
import { getMyCommentList, type MedicineComment } from '../../../services/medicine';
import { useNavigate } from 'react-router-dom';
import { MessageOutlined } from '@ant-design/icons';

const { Text } = Typography;

const MyCommentList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<MedicineComment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const loadData = async (currentPage: number) => {
    setLoading(true);
    try {
      const res = await getMyCommentList(currentPage, 10);
      if (res.code === 200) {
        setData(res.data.records);
        setTotal(res.data.total);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(page);
  }, [page]);

  return (
    <Card title="我的评价" variant="borderless">
      <List
        loading={loading}
        itemLayout="vertical"
        dataSource={data}
        pagination={{
          current: page,
          pageSize: 10,
          total: total,
          onChange: (p) => setPage(p),
        }}
        renderItem={(item) => (
          <List.Item
            key={item.id}
            actions={[
              <Text type="secondary">{item.createTime}</Text>,
              <Button type="link" size="small" onClick={() => navigate(`/product/${item.medicineId}`)}>
                查看商品
              </Button>
            ]}
          >
            <List.Item.Meta
              title={
                <Space>
                   <Rate disabled defaultValue={item.star} style={{ fontSize: 16 }} />
                </Space>
              }
              description={
                <div className="mt-2">
                  <div className="text-gray-800 mb-2">{item.content}</div>
                  {item.images && (
                    <Image.PreviewGroup>
                      {item.images.split(',').map((img, index) => (
                        <Image key={index} width={80} height={80} src={img} className="object-cover rounded mr-2 mb-2" />
                      ))}
                    </Image.PreviewGroup>
                  )}
                  {item.reply && (
                    <div className="mt-3 bg-gray-50 p-3 rounded text-sm text-gray-600">
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
      />
    </Card>
  );
};

export default MyCommentList;
