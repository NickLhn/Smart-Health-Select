import React, { useState } from 'react';
import { Form, Input, Button, App as AntdApp, Card } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { updatePassword } from '../../services/auth';

const Password: React.FC = () => {
  const { message } = AntdApp.useApp();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const res = await updatePassword(values);
      if (res.code === 200) {
        message.success('密码修改成功');
        form.resetFields();
      } else {
        message.error(res.message || '修改失败');
      }
    } catch (error: any) {
      console.error('Update password error:', error);
      message.error(error.message || '修改发生错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="修改密码" variant="borderless">
      <Form
        form={form}
        name="password"
        onFinish={onFinish}
        layout="vertical"
        style={{ maxWidth: 400 }}
      >
        <Form.Item
          name="oldPassword"
          label="旧密码"
          rules={[{ required: true, message: '请输入旧密码!' }]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="旧密码" />
        </Form.Item>

        <Form.Item
          name="newPassword"
          label="新密码"
          rules={[
            { required: true, message: '请输入新密码!' },
            { min: 6, message: '密码至少6位!' }
          ]}
          hasFeedback
        >
          <Input.Password prefix={<LockOutlined />} placeholder="新密码" />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label="确认新密码"
          dependencies={['newPassword']}
          hasFeedback
          rules={[
            { required: true, message: '请确认新密码!' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('两次输入的密码不一致!'));
              },
            }),
          ]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="确认新密码" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            确认修改
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default Password;
