import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, App as AntdApp, Tabs } from 'antd';
import { UserOutlined, LockOutlined, MobileOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { login, sendVerifyCode } from '../../services/auth';
import { useAuth } from '../../context/AuthContext';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login: authLogin, isAuthenticated } = useAuth();
  const { message } = AntdApp.useApp();
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [mobileForm] = Form.useForm();

  const handleSendCode = async () => {
    try {
      const values = await mobileForm.validateFields(['mobile']);
      const mobile = values.mobile;
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
      if (error.errorFields) {
        return;
      }
      console.error('Send code error:', error);
      message.error(error.message || '发送验证码发生错误');
    }
  };

  // 如果已登录，直接跳转到工作台
  React.useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const res = await login({ ...values, role: 'SELLER' });
      if (res.code === 200) {
        message.success('登录成功');
        authLogin(res.data.token, res.data.userInfo);
        const from = (location.state as any)?.from?.pathname || '/';
        navigate(from, { replace: true });
      } else {
        message.error(res.message || '登录失败');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      message.error(error.message || '登录发生错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Image/Banner */}
      <div className="hidden lg:flex lg:w-1/2 bg-cover bg-center relative" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80')" }}>
        <div className="absolute inset-0 bg-green-900 opacity-40"></div>
        <div className="relative z-10 flex flex-col justify-center px-16 text-white h-full">
          <h1 className="text-5xl font-bold mb-6">智健商家端</h1>
          <p className="text-xl leading-relaxed opacity-90">
            高效管理店铺，<br/>
            连接千万优质用户。
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center bg-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">商家登录</h2>
            <p className="mt-2 text-sm text-gray-600">
              请选择登录方式
            </p>
          </div>
          
          <Tabs
            defaultActiveKey="account"
            centered
            items={[
              {
                key: 'account',
                label: '账号密码登录',
                children: (
                  <Form
                    name="normal_login"
                    className="login-form mt-4 space-y-6"
                    initialValues={{ remember: true }}
                    onFinish={onFinish}
                    size="large"
                  >
                    <Form.Item
                      name="username"
                      rules={[{ required: true, message: '请输入用户名!' }]}
                    >
                      <Input prefix={<UserOutlined className="site-form-item-icon text-gray-400" />} placeholder="用户名/手机号" className="rounded-md" />
                    </Form.Item>
                    <Form.Item
                      name="password"
                      rules={[{ required: true, message: '请输入密码!' }]}
                    >
                      <Input
                        prefix={<LockOutlined className="site-form-item-icon text-gray-400" />}
                        type="password"
                        placeholder="密码"
                        className="rounded-md"
                      />
                    </Form.Item>
                    <Form.Item>
                      <div className="flex justify-between items-center">
                        <Form.Item name="remember" valuePropName="checked" noStyle>
                          <Checkbox>记住我</Checkbox>
                        </Form.Item>
                        <Link to="/forgot-password" className="text-green-600 hover:text-green-500">
                          忘记密码
                        </Link>
                      </div>
                    </Form.Item>
            
                    <Form.Item>
                      <Button type="primary" htmlType="submit" className="w-full bg-green-600 hover:bg-green-500 border-none h-10 rounded-md text-lg" loading={loading}>
                        登 录
                      </Button>
                    </Form.Item>
                  </Form>
                ),
              },
              {
                key: 'mobile',
                label: '手机号登录',
                children: (
                  <Form
                    form={mobileForm}
                    name="mobile_login"
                    className="login-form mt-4 space-y-6"
                    onFinish={onFinish}
                    size="large"
                  >
                    <Form.Item
                      name="mobile"
                      rules={[
                        { required: true, message: '请输入手机号!' },
                        { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号!' }
                      ]}
                    >
                      <Input prefix={<MobileOutlined className="site-form-item-icon text-gray-400" />} placeholder="手机号" className="rounded-md" />
                    </Form.Item>
                    <Form.Item
                      name="captcha"
                      rules={[{ required: true, message: '请输入验证码!' }]}
                    >
                      <div className="flex gap-2">
                        <Input
                          prefix={<SafetyCertificateOutlined className="site-form-item-icon text-gray-400" />}
                          placeholder="验证码"
                          className="rounded-md"
                        />
                        <Button 
                          className="rounded-md"
                          disabled={countdown > 0}
                          onClick={handleSendCode}
                        >
                          {countdown > 0 ? `${countdown}s后重新获取` : '获取验证码'}
                        </Button>
                      </div>
                    </Form.Item>
            
                    <Form.Item>
                      <Button type="primary" htmlType="submit" className="w-full bg-green-600 hover:bg-green-500 border-none h-10 rounded-md text-lg" loading={loading}>
                        登 录
                      </Button>
                    </Form.Item>
                  </Form>
                ),
              },
            ]}
          />
          
          <div className="text-center mt-4">
             <p className="text-sm text-gray-600">
              还没有商家账号？{' '}
              <Link to="/register" className="font-medium text-green-600 hover:text-green-500">
                立即入驻
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
