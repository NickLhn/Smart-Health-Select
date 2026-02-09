import React, { useState } from 'react';
import { Form, Input, Button, App as AntdApp } from 'antd';
import { MobileOutlined, LockOutlined, SafetyCertificateOutlined, UserOutlined, MedicineBoxOutlined } from '@ant-design/icons';
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
    <div className="min-h-screen flex bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      {/* Left Side - Image/Banner */}
      <div className="hidden lg:flex lg:w-1/2 bg-cover bg-center relative overflow-hidden group" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1631549916768-4119b2e5f926?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80')" }}>
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/80 to-teal-900/70 backdrop-blur-[2px] transition-all duration-700 group-hover:backdrop-blur-0 mix-blend-multiply"></div>
        <div className="relative z-10 flex flex-col justify-center px-16 text-white h-full max-w-2xl mx-auto">
          <div className="mb-8 animate-fade-in">
            <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center mb-8 border border-white/20 shadow-2xl">
              <MedicineBoxOutlined className="text-4xl text-emerald-300" />
            </div>
            <h1 className="text-5xl font-bold mb-6 tracking-tight leading-tight text-shadow-lg">
              加入智健优选<br/>
              <span className="text-emerald-300">开启健康生活</span>
            </h1>
            <p className="text-xl leading-relaxed opacity-90 font-light">
              专业 · 可靠 · 智能<br/>
              <span className="text-base opacity-75 mt-2 block">为您提供全方位的医疗健康服务体验</span>
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-6 mt-12 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="glass-panel bg-white/10 border-white/20 p-6 rounded-2xl hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-1">
              <h3 className="font-bold text-lg mb-2 text-emerald-300">智能问诊</h3>
              <p className="text-white/80 text-sm leading-relaxed">AI 辅助快速诊断，专业医生在线复核，让看病更简单。</p>
            </div>
            <div className="glass-panel bg-white/10 border-white/20 p-6 rounded-2xl hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-1">
              <h3 className="font-bold text-lg mb-2 text-emerald-300">正品保障</h3>
              <p className="text-white/80 text-sm leading-relaxed">严格药品溯源，全流程质量监控，让用药更放心。</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:px-6 lg:px-8 relative bg-white lg:bg-transparent">
         {/* Mobile Background Decoration */}
         <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 lg:hidden -z-10"></div>
        
        <div className="absolute inset-0 overflow-hidden pointer-events-none lg:block hidden">
          <div className="absolute top-10 right-10 w-64 h-64 bg-emerald-200/20 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-10 left-10 w-48 h-48 bg-teal-200/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1.5s' }}></div>
        </div>

        <div className="max-w-md w-full glass-panel !bg-white/80 lg:!bg-white/60 backdrop-blur-xl p-8 sm:p-10 rounded-3xl relative z-10 animate-fade-in shadow-xl shadow-emerald-900/5 border border-white/60">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-800 to-teal-700 mb-3">注册新账号</h2>
            <p className="text-gray-500">
              填写以下信息完成注册
            </p>
          </div>
          
          <Form
            form={form}
            name="register"
            className="register-form space-y-5"
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
              className="mb-5"
            >
              <Input 
                prefix={<UserOutlined className="text-emerald-500 text-lg mr-2" />} 
                placeholder="用户名" 
                className="rounded-2xl h-14 bg-white/50 border-gray-200 hover:bg-white focus:bg-white focus:border-emerald-500 focus:shadow-sm transition-all pl-4 backdrop-blur-sm" 
              />
            </Form.Item>

            <Form.Item
              name="mobile"
              rules={[
                { required: true, message: '请输入手机号!' },
                { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号!' }
              ]}
              className="mb-5"
            >
              <Input 
                prefix={<MobileOutlined className="text-emerald-500 text-lg mr-2" />} 
                placeholder="手机号" 
                className="rounded-2xl h-14 bg-white/50 border-gray-200 hover:bg-white focus:bg-white focus:border-emerald-500 focus:shadow-sm transition-all pl-4 backdrop-blur-sm" 
              />
            </Form.Item>

            <Form.Item
              name="captcha"
              rules={[{ required: true, message: '请输入验证码!' }]}
              className="mb-5"
            >
              <div className="flex gap-3">
                <Input
                  prefix={<SafetyCertificateOutlined className="text-emerald-500 text-lg mr-2" />}
                  placeholder="验证码"
                  className="rounded-2xl h-14 bg-white/50 border-gray-200 hover:bg-white focus:bg-white focus:border-emerald-500 focus:shadow-sm transition-all pl-4 backdrop-blur-sm flex-1"
                />
                <Button 
                  disabled={countdown > 0} 
                  onClick={getCaptcha} 
                  className={`rounded-2xl h-14 px-6 font-bold transition-all border ${
                    countdown > 0 
                      ? 'bg-gray-100 text-gray-400 border-gray-200' 
                      : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100 hover:border-emerald-300 hover:text-emerald-700'
                  }`}
                >
                  {countdown > 0 ? `${countdown}s` : '获取验证码'}
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
              className="mb-5"
            >
              <Input.Password 
                prefix={<LockOutlined className="text-emerald-500 text-lg mr-2" />} 
                placeholder="设置密码" 
                className="rounded-2xl h-14 bg-white/50 border-gray-200 hover:bg-white focus:bg-white focus:border-emerald-500 focus:shadow-sm transition-all pl-4 backdrop-blur-sm" 
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
              className="mb-8"
            >
              <Input.Password 
                prefix={<LockOutlined className="text-emerald-500 text-lg mr-2" />} 
                placeholder="确认密码" 
                className="rounded-2xl h-14 bg-white/50 border-gray-200 hover:bg-white focus:bg-white focus:border-emerald-500 focus:shadow-sm transition-all pl-4 backdrop-blur-sm" 
              />
            </Form.Item>

            <Form.Item className="mb-4">
              <Button 
                type="primary" 
                htmlType="submit" 
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 border-none h-14 rounded-2xl text-lg font-bold shadow-lg shadow-emerald-500/30 transition-all hover:scale-[1.02] active:scale-95" 
                loading={loading}
              >
                注 册
              </Button>
            </Form.Item>
            
            <div className="text-center">
              <span className="text-gray-500 text-sm">已有账号？ </span>
              <Link to="/login" className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors">
                立即登录
              </Link>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default Register;
