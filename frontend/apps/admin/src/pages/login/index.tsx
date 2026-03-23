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
      // 手机登录和重置密码复用同一个验证码发送接口。
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
      const res = await login({ ...values, role: 'ADMIN' });
      if (res.code === 200) {
        message.success('登录成功');
        // 登录成功后统一把 token 和用户信息写进 AuthContext。
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
    <div className="min-h-screen flex bg-white">
      <div
        className="hidden lg:flex lg:w-1/2 bg-cover bg-center relative"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80')",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 to-slate-800/85 mix-blend-multiply" />
        <div className="relative z-10 flex flex-col justify-center px-20 text-white h-full">
          <div className="mb-8">
            <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center mb-8 border border-white/20 shadow-2xl">
              <SafetyCertificateOutlined style={{ fontSize: 40 }} className="text-blue-300" />
            </div>
            <h1 className="text-5xl font-bold mb-4 tracking-tight leading-tight">
              智健运营<br />
              <span className="text-blue-300">稳定守护</span>
            </h1>
          </div>
          <p className="text-lg leading-relaxed opacity-80 font-light max-w-lg">
            面向平台运营与管理人员，统一监控用户、订单与药品履约情况。
          </p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-slate-50 lg:hidden -z-20" />
        <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none lg:hidden -z-10">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-slate-200/30 blur-3xl" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-200/20 blur-3xl" />
        </div>
        <div className="max-w-md w-full py-12 lg:py-0 glass-panel !bg-white/70 lg:!bg-transparent backdrop-blur-xl lg:backdrop-blur-none p-8 lg:p-0 rounded-3xl lg:rounded-none shadow-xl lg:shadow-none border border-white/60 lg:border-none relative z-10">
          <div className="text-center lg:text-left mb-10">
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-blue-700">
              管理员登录
            </h2>
            <p className="mt-3 text-base text-gray-500">
              登录运营后台，管理平台数据与配置
            </p>
          </div>
          <Tabs
            defaultActiveKey="account"
            centered={false}
            size="large"
            className="custom-tabs"
          items={[
            {
              key: 'account',
              label: '账号登录',
              children: (
                // 管理端保留账号密码登录，适合固定运营账号使用。
                <Form
                    name="normal_login"
                    className="login-form mt-4 space-y-5"
                    initialValues={{ remember: true }}
                    onFinish={onFinish}
                    size="large"
                  >
                    <Form.Item
                      name="username"
                      rules={[{ required: true, message: '请输入用户名!' }]}
                    >
                      <Input
                        prefix={<UserOutlined className="site-form-item-icon text-blue-500 text-lg" />}
                        placeholder="用户名 / 手机号"
                        className="rounded-2xl h-14 bg-white/60 border-gray-200 hover:bg-white focus:bg-white focus:border-blue-500 focus:shadow-sm transition-all pl-4 backdrop-blur-sm"
                      />
                    </Form.Item>
                    <Form.Item
                      name="password"
                      rules={[{ required: true, message: '请输入密码!' }]}
                    >
                      <Input.Password
                        prefix={<LockOutlined className="site-form-item-icon text-blue-500 text-lg" />}
                        placeholder="密码"
                        className="rounded-2xl h-14 bg-white/60 border-gray-200 hover:bg-white focus:bg-white focus:border-blue-500 focus:shadow-sm transition-all pl-4 backdrop-blur-sm"
                      />
                    </Form.Item>
                    <Form.Item>
                      <div className="flex justify-between items-center text-sm">
                        <Form.Item name="remember" valuePropName="checked" noStyle>
                          <Checkbox className="text-gray-500">记住我</Checkbox>
                        </Form.Item>
                        <Link
                          to="/forgot-password"
                          className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                        >
                          忘记密码?
                        </Link>
                      </div>
                    </Form.Item>
                    <Form.Item>
                      <Button
                        type="primary"
                        htmlType="submit"
                        className="w-full bg-gradient-to-r from-blue-600 to-slate-900 hover:from-blue-700 hover:to-slate-950 border-none h-14 rounded-2xl text-lg font-bold shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-95"
                        loading={loading}
                      >
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
                // 手机登录主要方便临时登录或忘记密码场景。
                <Form
                    form={mobileForm}
                    name="mobile_login"
                    className="login-form mt-4 space-y-5"
                    onFinish={onFinish}
                    size="large"
                  >
                    <Form.Item
                      name="mobile"
                      rules={[
                        { required: true, message: '请输入手机号!' },
                        { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号!' },
                      ]}
                    >
                      <Input
                        prefix={<MobileOutlined className="site-form-item-icon text-blue-500 text-lg" />}
                        placeholder="手机号"
                        className="rounded-2xl h-14 bg-white/60 border-gray-200 hover:bg-white focus:bg-white focus:border-blue-500 focus:shadow-sm transition-all pl-4 backdrop-blur-sm"
                      />
                    </Form.Item>
                    <Form.Item
                      name="captcha"
                      rules={[{ required: true, message: '请输入验证码!' }]}
                    >
                      <div className="flex gap-3">
                        <Input
                          prefix={<SafetyCertificateOutlined className="site-form-item-icon text-blue-500 text-lg" />}
                          placeholder="验证码"
                          className="rounded-2xl h-14 bg-white/60 border-gray-200 hover:bg-white focus:bg-white focus:border-blue-500 focus:shadow-sm transition-all pl-4 backdrop-blur-sm"
                        />
                        <Button
                          className="h-14 rounded-2xl px-6 font-semibold text-blue-700 hover:text-blue-800 border-blue-100 hover:border-blue-300 bg-blue-50 hover:bg-blue-100 transition-all"
                          disabled={countdown > 0}
                          onClick={handleSendCode}
                        >
                          {countdown > 0 ? `${countdown}s` : '获取验证码'}
                        </Button>
                      </div>
                    </Form.Item>
                    <Form.Item>
                      <Button
                        type="primary"
                        htmlType="submit"
                        className="w-full bg-gradient-to-r from-blue-600 to-slate-900 hover:from-blue-700 hover:to-slate-950 border-none h-14 rounded-2xl text-lg font-bold shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-95"
                        loading={loading}
                      >
                        登 录
                      </Button>
                    </Form.Item>
                  </Form>
                ),
              },
            ]}
          />
          <div className="text-center mt-8">
            <p className="text-gray-500">
              需要管理员权限？{' '}
              <Link
                to="/register"
                className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
              >
                申请加入
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
