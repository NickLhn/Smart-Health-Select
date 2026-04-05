import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Select, InputNumber, Upload, Button, message, App as AntdApp } from 'antd';
import { UploadOutlined, LeftOutlined } from '@ant-design/icons';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { applyRefund, RefundType } from '../../../services/aftersales';
import { getOrderDetail } from '../../../services/order';
import type { Order } from '../../../services/order';

const { Option } = Select;
const { TextArea } = Input;

const RefundApplyPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (orderId) {
      // 申请售后前先拉订单详情，默认带出可退金额。
      fetchOrderDetail(orderId);
    }
  }, [orderId]);

  const fetchOrderDetail = async (id: string) => {
    try {
      const res = await getOrderDetail(id);
      if (res.code === 200) {
        setOrder(res.data);
        form.setFieldsValue({ amount: res.data.payAmount });
      } else {
        message.error('获取订单信息失败');
      }
    } catch (error) {
      console.error(error);
      message.error('获取订单信息失败');
    }
  };

  const onFinish = async (values: any) => {
    if (!orderId) return;
    setLoading(true);
    try {
      // 页面只负责收集售后参数，真正状态流转由后端控制。
      const res = await applyRefund({
        orderId,
        ...values,
      });

      if (res.code === 200) {
        message.success('售后申请提交成功');
        navigate('/orders');
      } else {
        message.error(res.message || '提交失败');
      }
    } catch (error) {
      console.error(error);
      message.error('提交失败');
    } finally {
      setLoading(false);
    }
  };

  if (!order) {
    return <div className="p-8 text-center">加载中...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-4">
        <Button icon={<LeftOutlined />} onClick={() => navigate(-1)}>返回</Button>
      </div>
      
      <Card title="申请售后">
        <div className="mb-6 p-4 bg-gray-50 rounded">
           <p className="font-bold">订单编号: {order.orderNo}</p>
           <p>商品名称: {order.medicineName}</p>
           <p>实付金额: ¥{order.payAmount.toFixed(2)}</p>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            type: RefundType.ONLY_REFUND,
          }}
        >
          <Form.Item
            name="type"
            label="售后类型"
            rules={[{ required: true, message: '请选择售后类型' }]}
          >
            <Select>
              <Option value={RefundType.ONLY_REFUND}>仅退款</Option>
              <Option value={RefundType.RETURN_REFUND}>退货退款</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="amount"
            label="退款金额"
            rules={[{ required: true, message: '请输入退款金额' }]}
            help={`最多可退 ¥${order.payAmount.toFixed(2)}`}
          >
            <InputNumber
              style={{ width: '100%' }}
              prefix="¥"
              max={order.payAmount}
              min={0.01}
              precision={2}
            />
          </Form.Item>

          <Form.Item
            name="reason"
            label="申请原因"
            rules={[{ required: true, message: '请输入申请原因' }]}
          >
            <TextArea rows={4} placeholder="请详细描述申请售后的原因" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              提交申请
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default RefundApplyPage;
