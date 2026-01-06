import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, App as AntdApp, Tabs } from 'antd';
import { UserOutlined, LockOutlined, MobileOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { login, sendVerifyCode } from '../../services/auth';
import { useAuth } from '../../context/AuthContext';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
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

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const res = await login({ ...values, role: 'USER' });
      if (res.code === 200) {
        message.success('登录成功');
        authLogin(res.data.token, res.data.userInfo);
        navigate('/');
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
    <div className="min-h-screen flex bg-gray-50">
      {/* Left Side - Image/Banner */}
      <div className="hidden lg:flex lg:w-1/2 bg-cover bg-center relative" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80')" }}>
        <div className="absolute inset-0 bg-gradient-to-r from-[#004d2c] to-[#00B96B] opacity-80"></div>
        <div className="relative z-10 flex flex-col justify-center px-20 text-white h-full">
          <div className="mb-8">
             <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6">
                <SafetyCertificateOutlined style={{ fontSize: 32 }} />
             </div>
             <h1 className="text-5xl font-bold mb-6 tracking-tight">智健优选</h1>
          </div>
          <p className="text-xl leading-relaxed opacity-90 font-light">
            连接医生与患者，<br/>
            让优质医疗触手可及。
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-white lg:rounded-l-[40px] shadow-2xl z-10">
        <div className="max-w-md w-full space-y-10 py-12">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">欢迎回来</h2>
            <p className="mt-2 text-sm text-gray-500">
              登录您的账号，开启健康生活
            </p>
          </div>
          
          <Tabs
            defaultActiveKey="account"
            centered
            size="large"
            className="custom-tabs"
            items={[
              {
                key: 'account',
                label: '账号登录',
                children: (
                  <Form
                    name="normal_login"
                    className="login-form mt-6 space-y-6"
                    initialValues={{ remember: true }}
                    onFinish={onFinish}
                    size="large"
                  >
                    <Form.Item
                      name="username"
                      rules={[{ required: true, message: '请输入用户名!' }]}
                    >
                      <Input 
                        prefix={<UserOutlined className="site-form-item-icon text-gray-400 text-lg" />} 
                        placeholder="用户名 / 手机号" 
                        className="rounded-xl h-12 bg-gray-50 border-gray-200 hover:bg-white focus:bg-white transition-all" 
                        variant="borderless"
                      />
                    </Form.Item>
                    <Form.Item
                      name="password"
                      rules={[{ required: true, message: '请输入密码!' }]}
                    >
                      <Input.Password
                        prefix={<LockOutlined className="site-form-item-icon text-gray-400 text-lg" />}
                        placeholder="密码"
                        className="rounded-xl h-12 bg-gray-50 border-gray-200 hover:bg-white focus:bg-white transition-all"
                        variant="borderless"
                      />
                    </Form.Item>
                    <Form.Item>
                      <div className="flex justify-between items-center text-sm">
                        <Form.Item name="remember" valuePropName="checked" noStyle>
                          <Checkbox className="text-gray-500">记住我</Checkbox>
                        </Form.Item>
                        <Link to="/forgot-password" className="text-[#00B96B] hover:text-[#009456] font-medium">
                          忘记密码?
                        </Link>
                      </div>
                    </Form.Item>
            
                    <Form.Item>
                      <Button type="primary" htmlType="submit" className="w-full bg-[#00B96B] hover:bg-[#009456] border-none h-12 rounded-xl text-lg font-bold shadow-lg shadow-[#00B96B]/30 transition-all hover:scale-[1.02]" loading={loading}>
                        登 录
                      </Button>
                    </Form.Item>
                  </Form>
                ),
              },
              {
                key: 'mobile',
                label: '手机登录',
                children: (
                  <Form
                    form={mobileForm}
                    name="mobile_login"
                    className="login-form mt-6 space-y-6"
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
                      <Input 
                        prefix={<MobileOutlined className="site-form-item-icon text-gray-400 text-lg" />} 
                        placeholder="手机号" 
                        className="rounded-xl h-12 bg-gray-50 border-gray-200 hover:bg-white focus:bg-white transition-all" 
                        variant="borderless"
                      />
                    </Form.Item>
                    <Form.Item
                      name="captcha"
                      rules={[{ required: true, message: '请输入验证码!' }]}
                    >
                      <div className="flex gap-3">
                        <Input
                          prefix={<SafetyCertificateOutlined className="site-form-item-icon text-gray-400 text-lg" />}
                          placeholder="验证码"
                          className="rounded-xl h-12 bg-gray-50 border-gray-200 hover:bg-white focus:bg-white transition-all"
                          variant="borderless"
                        />
                        <Button 
                          className="h-12 rounded-xl px-6 font-medium text-gray-600 hover:text-[#00B96B] border-gray-200"
                          disabled={countdown > 0}
                          onClick={handleSendCode}
                        >
                          {countdown > 0 ? `${countdown}s后重新获取` : '获取验证码'}
                        </Button>
                      </div>
                    </Form.Item>
            
                    <Form.Item>
                      <Button type="primary" htmlType="submit" className="w-full bg-[#00B96B] hover:bg-[#009456] border-none h-12 rounded-xl text-lg font-bold shadow-lg shadow-[#00B96B]/30 transition-all hover:scale-[1.02]" loading={loading}>
                        登 录
                      </Button>
                    </Form.Item>
                  </Form>
                ),
              },
            ]}
          />
          
          <div className="text-center mt-6">
             <p className="text-sm text-gray-500">
              还没有账号？{' '}
              <Link to="/register" className="font-bold text-[#00B96B] hover:text-[#009456] hover:underline">
                立即注册
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
