import React, { useState } from 'react';
import { Form, Input, Button, App as AntdApp } from 'antd';
import { MobileOutlined, LockOutlined, SafetyCertificateOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { register, sendVerifyCode } from '../../services/auth';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { message } = AntdApp.useApp();
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [form] = Form.useForm();

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const payload = {
        username: values.username,
        password: values.password,
        mobile: values.mobile,
        role: 'USER'
      };
      
      const res = await register(payload);
      if (res.code === 200) {
        message.success('注册成功，请登录');
        navigate('/login');
      } else {
        message.error(res.message || '注册失败');
      }
    } catch (error: any) {
      console.error('Register error:', error);
      message.error(error.message || '注册发生错误');
    } finally {
      setLoading(false);
    }
  };

  const getCaptcha = async () => {
    try {
      const mobile = form.getFieldValue('mobile');
      if (!mobile) {
        message.error('请先输入手机号');
        return;
      }
      if (!/^1[3-9]\d{9}$/.test(mobile)) {
        message.error('请输入有效的手机号');
        return;
      }

      const res = await sendVerifyCode(mobile);
      if (res.code === 200) {
        message.success(res.message || '验证码发送成功');
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        message.error(res.message || '发送失败');
      }
    } catch (error: any) {
      console.error('Send code error:', error);
      message.error(error.message || '发送验证码发生错误');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Image/Banner */}
      <div className="hidden lg:flex lg:w-1/2 bg-cover bg-center relative" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1631549916768-4119b2e5f926?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80')" }}>
        <div className="absolute inset-0 bg-green-900 opacity-40"></div>
        <div className="relative z-10 flex flex-col justify-center px-16 text-white h-full">
          <h1 className="text-5xl font-bold mb-6">加入智健优选</h1>
          <p className="text-xl leading-relaxed opacity-90">
            开启健康生活新篇章，<br/>
            享受专业可靠的医疗健康服务。
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center bg-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">注册新账号</h2>
            <p className="mt-2 text-sm text-gray-600">
              填写以下信息完成注册
            </p>
          </div>
          
          <Form
            form={form}
            name="register"
            className="register-form mt-8 space-y-6"
            onFinish={onFinish}
            size="large"
            scrollToFirstError
          >
            <Form.Item
              name="username"
              rules={[
                { required: true, message: '请输入用户名!' },
                { min: 4, message: '用户名至少4位!' }
              ]}
            >
              <Input prefix={<UserOutlined className="text-gray-400" />} placeholder="用户名" className="rounded-md" />
            </Form.Item>

            <Form.Item
              name="mobile"
              rules={[
                { required: true, message: '请输入手机号!' },
                { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号!' }
              ]}
            >
              <Input prefix={<MobileOutlined className="text-gray-400" />} placeholder="手机号" className="rounded-md" />
            </Form.Item>

            <Form.Item
              name="captcha"
              rules={[{ required: true, message: '请输入验证码!' }]}
            >
              <div className="flex gap-2">
                <Input
                  prefix={<SafetyCertificateOutlined className="text-gray-400" />}
                  placeholder="验证码"
                  className="rounded-md"
                />
                <Button disabled={countdown > 0} onClick={getCaptcha} className="rounded-md">
                  {countdown > 0 ? `${countdown}秒后重试` : '获取验证码'}
                </Button>
              </div>
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: '请输入密码!' },
                { min: 6, message: '密码至少6位!' }
              ]}
              hasFeedback
            >
              <Input.Password prefix={<LockOutlined className="text-gray-400" />} placeholder="密码" className="rounded-md" />
            </Form.Item>

            <Form.Item
              name="confirm"
              dependencies={['password']}
              hasFeedback
              rules={[
                { required: true, message: '请确认密码!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('两次输入的密码不一致!'));
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined className="text-gray-400" />} placeholder="确认密码" className="rounded-md" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" className="w-full bg-green-600 hover:bg-green-500 border-none h-10 rounded-md text-lg" loading={loading}>
                注 册
              </Button>
            </Form.Item>
            
            <div className="text-center text-sm">
              已有账号？ <Link to="/login" className="font-medium text-green-600 hover:text-green-500">立即登录</Link>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default Register;
