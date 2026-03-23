import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Card, message, Spin } from 'antd';
import { getAllConfigs, updateConfigs } from '../../../services/config';

const SystemSetting: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      // 系统设置页以 key-value 形式整体拉取配置。
      const res = await getAllConfigs();
      if (res.code === 200 && res.data) {
        form.setFieldsValue(res.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values: any) => {
    setSubmitting(true);
    try {
      // 提交时整表覆盖更新，避免每个字段单独维护保存逻辑。
      const res = await updateConfigs(values);
      if (res.code === 200) {
        message.success('配置已更新');
      } else {
        message.error(res.message || '更新失败');
      }
    } catch (error) {
      message.error('更新失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card title="系统设置" variant="borderless">
      <Spin spinning={loading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            // 这里提供的是首次进入时的兜底值，真实值会被 fetchConfigs 覆盖。
            site_title: '智简医药供应链平台',
            site_copyright: '© 2024 Zhijian System. All Rights Reserved.',
          }}
        >
          <Form.Item
            name="site_title"
            label="平台名称"
            rules={[{ required: true, message: '请输入平台名称' }]}
          >
            <Input placeholder="请输入平台名称" />
          </Form.Item>

          <Form.Item
            name="site_copyright"
            label="版权信息"
            rules={[{ required: true, message: '请输入版权信息' }]}
          >
            <Input placeholder="请输入版权信息" />
          </Form.Item>

          <Form.Item
            name="site_icp"
            label="ICP备案号"
          >
            <Input placeholder="请输入ICP备案号" />
          </Form.Item>

          <Form.Item
            name="service_phone"
            label="客服电话"
          >
            <Input placeholder="请输入客服电话" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting}>
              保存设置
            </Button>
          </Form.Item>
        </Form>
      </Spin>
    </Card>
  );
};

export default SystemSetting;
