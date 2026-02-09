import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Card, message, InputNumber, Switch, Spin } from 'antd';
import { getMyStore, updateStoreSettings } from '../../../services/store';

const StoreSetting: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchStoreInfo();
  }, []);

  const fetchStoreInfo = async () => {
    setLoading(true);
    try {
      const res = await getMyStore();
      if (res.code === 200 && res.data) {
        // 转换数据格式
        const data = {
          ...res.data,
          businessStatus: res.data.businessStatus === 1,
        };
        form.setFieldsValue(data);
      }
    } catch (error) {
      console.error(error);
      message.error('获取店铺信息失败');
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values: any) => {
    setSubmitting(true);
    try {
      const data = {
        ...values,
        businessStatus: values.businessStatus ? 1 : 0,
      };

      const res = await updateStoreSettings(data);
      if (res.code === 200) {
        message.success('店铺设置已更新');
      } else {
        message.error(res.message || '更新失败');
      }
    } catch (error) {
      console.error(error);
      message.error('更新失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div
        style={{
          marginBottom: 16,
          padding: '8px 12px 12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: 16,
          borderBottom: '1px solid #E5E7EB',
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 600,
              color: '#022c22',
            }}
          >
            店铺设置
          </h2>
          <div
            style={{
              marginTop: 4,
              fontSize: 12,
              color: '#6B7280',
            }}
          >
            配置店铺营业状态、配送规则和公告信息
          </div>
        </div>
      </div>
      <Card variant="borderless">
        <Spin spinning={loading}>
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{
              businessStatus: true,
              businessHours: '09:00-22:00',
              deliveryFee: 0,
              minDeliveryAmount: 0,
            }}
          >
            <Form.Item
              name="businessStatus"
              label="营业状态"
              valuePropName="checked"
            >
              <Switch checkedChildren="营业中" unCheckedChildren="休息中" />
            </Form.Item>

            <Form.Item
              name="businessHours"
              label="营业时间"
              rules={[{ required: true, message: '请输入营业时间' }]}
            >
              <Input placeholder="例如: 09:00-22:00" />
            </Form.Item>

            <Form.Item
              name="deliveryFee"
              label="配送费 (元)"
              rules={[{ required: true, message: '请输入配送费' }]}
            >
              <InputNumber
                min={0}
                precision={2}
                style={{ width: '100%' }}
                placeholder="请输入配送费"
              />
            </Form.Item>

            <Form.Item
              name="minDeliveryAmount"
              label="起送金额 (元)"
              rules={[{ required: true, message: '请输入起送金额' }]}
            >
              <InputNumber
                min={0}
                precision={2}
                style={{ width: '100%' }}
                placeholder="请输入起送金额"
              />
            </Form.Item>

            <Form.Item
              name="notice"
              label="店铺公告"
            >
              <Input.TextArea
                rows={4}
                placeholder="请输入店铺公告"
                showCount
                maxLength={200}
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                style={{
                  borderRadius: 999,
                  paddingInline: 24,
                  background: 'linear-gradient(90deg, #059669, #10B981)',
                  border: 'none',
                }}
              >
                保存设置
              </Button>
            </Form.Item>
          </Form>
        </Spin>
      </Card>
    </div>
  );
};

export default StoreSetting;
