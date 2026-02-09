import React, { useState } from 'react';
import { Form, Input, Button, App as AntdApp } from 'antd';
import { MobileOutlined, LockOutlined, SafetyCertificateOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { register, sendVerifyCode } from '../../services/auth';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { message } = AntdApp.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const payload = {
        username: values.username,
        password: values.password,
        mobile: values.mobile,
        captcha: values.captcha,
        role: 'SELLER' // 明确角色为商家
      };
      
      const res = await register(payload);
      if (res.code === 200) {
        message.success('入驻申请提交成功，请登录');
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
        message.error('请输入手机号');
        return;
      }
      if (!/^1[3-9]\d{9}$/.test(mobile)) {
        message.error('请输入有效的手机号');
        return;
      }

      await sendVerifyCode(mobile);
      message.success('验证码已发送');
      
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
    } catch (error: any) {
      message.error(error.message || '发送失败');
    }
  };

  return (
    <div className="min-h-screen flex bg-emerald-50">
      {/* Left Side - Image/Banner */}
      <div className="hidden lg:flex lg:w-1/2 bg-cover bg-center relative" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80')" }}>
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/90 via-emerald-900/85 to-emerald-800/80"></div>
        <div className="relative z-10 flex flex-col justify-center px-16 text-white h-full">
          <h1 className="text-5xl font-bold mb-6">入驻智健平台</h1>
          <p className="text-xl leading-relaxed opacity-90">
            开启数字化经营新篇章，<br/>
            共创健康未来。
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-emerald-100 -z-10" />
        <div className="absolute -top-32 -right-16 w-72 h-72 bg-emerald-200/40 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 -left-10 w-80 h-80 bg-emerald-100/60 rounded-full blur-3xl -z-10" />
        <div className="max-w-md w-full bg-white/80 backdrop-blur-xl px-6 sm:px-8 py-10 rounded-3xl shadow-xl border border-white/60 space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-800 to-emerald-600">
              商家入驻
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              填写以下信息完成入驻
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
              <Input
                prefix={<UserOutlined className="text-emerald-500 text-lg mr-2" />}
                placeholder="用户名"
                className="rounded-2xl h-14 bg-white/60 border-gray-200 hover:bg-white focus:bg-white focus:border-emerald-500 focus:shadow-sm transition-all pl-4 backdrop-blur-sm"
              />
            </Form.Item>

            <Form.Item
              name="mobile"
              rules={[
                { required: true, message: '请输入手机号!' },
                { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号!' }
              ]}
            >
              <Input
                prefix={<MobileOutlined className="text-emerald-500 text-lg mr-2" />}
                placeholder="手机号"
                className="rounded-2xl h-14 bg-white/60 border-gray-200 hover:bg-white focus:bg-white focus:border-emerald-500 focus:shadow-sm transition-all pl-4 backdrop-blur-sm"
              />
            </Form.Item>

            <Form.Item
              name="captcha"
              rules={[{ required: true, message: '请输入验证码!' }]}
            >
              <div className="flex gap-2">
                <Input
                  prefix={<SafetyCertificateOutlined className="text-emerald-500 text-lg mr-2" />}
                  placeholder="验证码"
                  className="rounded-2xl h-14 bg-white/60 border-gray-200 hover:bg-white focus:bg-white focus:border-emerald-500 focus:shadow-sm transition-all pl-4 backdrop-blur-sm flex-1"
                />
                <Button
                  disabled={countdown > 0}
                  onClick={getCaptcha}
                  className="rounded-2xl h-14 px-5 font-semibold transition-all border border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 hover:text-emerald-800 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200"
                >
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
              <Input.Password
                prefix={<LockOutlined className="text-emerald-500 text-lg mr-2" />}
                placeholder="密码"
                className="rounded-2xl h-14 bg-white/60 border-gray-200 hover:bg-white focus:bg-white focus:border-emerald-500 focus:shadow-sm transition-all pl-4 backdrop-blur-sm"
              />
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
              <Input.Password
                prefix={<LockOutlined className="text-emerald-500 text-lg mr-2" />}
                placeholder="确认密码"
                className="rounded-2xl h-14 bg-white/60 border-gray-200 hover:bg-white focus:bg-white focus:border-emerald-500 focus:shadow-sm transition-all pl-4 backdrop-blur-sm"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 border-none h-14 rounded-2xl text-lg font-bold shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02] active:scale-95"
                loading={loading}
              >
                立即入驻
              </Button>
            </Form.Item>
            
            <div className="text-center text-sm">
              已有账号？ <Link to="/login" className="font-semibold text-emerald-600 hover:text-emerald-700">立即登录</Link>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default Register;
