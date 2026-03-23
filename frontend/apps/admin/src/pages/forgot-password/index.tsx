import React, { useState } from 'react';
import { Form, Input, Button, message, Steps } from 'antd';
import { MobileOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { resetPassword, sendVerifyCode } from '../../services/auth';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [mobileInfo, setMobileInfo] = useState({ mobile: '', captcha: '' });

  const onFinish = async (values: any) => {
    if (currentStep === 0) {
      // 第一步只缓存手机号和验证码，第二步再真正提交重置请求。
      setMobileInfo({ mobile: values.mobile, captcha: values.captcha });
      setCurrentStep(1);
    } else {
      setLoading(true);
      try {
        const res = await resetPassword({
          mobile: mobileInfo.mobile,
          captcha: mobileInfo.captcha,
          newPassword: values.password,
          role: 'ADMIN'
        });
        if (res.code === 200) {
          message.success('密码重置成功，请重新登录');
          navigate('/login');
        } else {
          message.error(res.message || '重置失败');
        }
      } catch (error: any) {
        message.error(error.message || '重置失败');
      } finally {
        setLoading(false);
      }
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

      // 忘记密码同样复用短信验证码接口。
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
    <div className="min-h-screen flex bg-white">
      <div
        className="hidden lg:flex lg:w-1/2 bg-cover bg-center relative"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80')",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-800/85 to-blue-900/80 mix-blend-multiply" />
        <div className="relative z-10 flex flex-col justify-center px-20 text-white h-full">
          <div className="mb-10 max-w-lg">
            <h1 className="text-4xl font-extrabold mb-4 tracking-tight leading-snug">
              重置管理员密码
            </h1>
            <p className="text-sm text-white/80 leading-relaxed">
              通过手机号验证身份，保障后台账号安全。
            </p>
          </div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-4 sm:px-6 lg:px-8 relative bg-white lg:bg-transparent">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-slate-50 to-blue-50 lg:hidden -z-10" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none lg:block hidden">
          <div className="absolute top-10 right-10 w-64 h-64 bg-slate-200/30 rounded-full blur-3xl" />
          <div
            className="absolute bottom-10 left-10 w-48 h-48 bg-blue-200/25 rounded-full blur-3xl"
            style={{ animationDelay: '1.5s' }}
          />
        </div>
        <div className="max-w-md w-full glass-panel !bg-white/80 lg:!bg-white/70 backdrop-blur-xl p-8 sm:p-10 rounded-3xl relative z-10 shadow-xl shadow-slate-900/5 border border-white/60">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-blue-700 mb-3">
              重置密码
            </h2>
            <p className="text-gray-500">请按照步骤重置您的密码</p>
          </div>
          <Steps
            current={currentStep}
            className="mb-10"
            items={[
              { title: '验证身份' },
              { title: '重置密码' },
            ]}
          />
          <Form
            form={form}
            name="forgot-password"
            className="forgot-password-form space-y-6"
            onFinish={onFinish}
            size="large"
          >
            {currentStep === 0 && (
              <div className="space-y-5">
                <Form.Item
                  name="mobile"
                  rules={[
                    { required: true, message: '请输入手机号!' },
                    { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号!' },
                  ]}
                  className="mb-5"
                >
                  <Input
                    prefix={<MobileOutlined className="text-blue-500 text-lg mr-2" />}
                    placeholder="手机号"
                    className="rounded-2xl h-14 bg-white/60 border-gray-200 hover:bg-white focus:bg-white focus:border-blue-500 focus:shadow-sm transition-all pl-4 backdrop-blur-sm"
                  />
                </Form.Item>
                <Form.Item
                  name="captcha"
                  rules={[{ required: true, message: '请输入验证码!' }]}
                  className="mb-5"
                >
                  <div className="flex gap-3">
                    <Input
                      prefix={<SafetyCertificateOutlined className="text-blue-500 text-lg mr-2" />}
                      placeholder="验证码"
                      className="rounded-2xl h-14 bg-white/60 border-gray-200 hover:bg-white focus:bg-white focus:border-blue-500 focus:shadow-sm transition-all pl-4 backdrop-blur-sm flex-1"
                    />
                    <Button
                      disabled={countdown > 0}
                      onClick={getCaptcha}
                      className={`rounded-2xl h-14 px-6 font-semibold transition-all border ${
                        countdown > 0
                          ? 'bg-gray-100 text-gray-400 border-gray-200'
                          : 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100 hover:border-blue-300 hover:text-blue-800'
                      }`}
                    >
                      {countdown > 0 ? `${countdown}s` : '获取验证码'}
                    </Button>
                  </div>
                </Form.Item>
                <Form.Item className="mb-2">
                  <Button
                    type="primary"
                    htmlType="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-slate-900 hover:from-blue-700 hover:to-slate-950 border-none h-14 rounded-2xl text-lg font-bold shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-95"
                    loading={loading}
                  >
                    下一步
                  </Button>
                </Form.Item>
              </div>
            )}
            {currentStep === 1 && (
              <div className="space-y-5">
                <Form.Item
                  name="password"
                  rules={[
                    { required: true, message: '请输入新密码!' },
                    { min: 6, message: '密码至少6位!' },
                  ]}
                  hasFeedback
                  className="mb-5"
                >
                  <Input.Password
                    prefix={<LockOutlined className="text-blue-500 text-lg mr-2" />}
                    placeholder="新密码"
                    className="rounded-2xl h-14 bg-white/60 border-gray-200 hover:bg-white focus:bg-white focus:border-blue-500 focus:shadow-sm transition-all pl-4 backdrop-blur-sm"
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
                    prefix={<LockOutlined className="text-blue-500 text-lg mr-2" />}
                    placeholder="确认新密码"
                    className="rounded-2xl h-14 bg-white/60 border-gray-200 hover:bg-white focus:bg-white focus:border-blue-500 focus:shadow-sm transition-all pl-4 backdrop-blur-sm"
                  />
                </Form.Item>
                <Form.Item className="mb-2">
                  <Button
                    type="primary"
                    htmlType="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-slate-900 hover:from-blue-700 hover:to-slate-950 border-none h-14 rounded-2xl text-lg font-bold shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-95"
                    loading={loading}
                  >
                    重置密码
                  </Button>
                </Form.Item>
              </div>
            )}
            <div className="text-center mt-6">
              <span className="text-gray-500 text-sm">记起密码了？ </span>
              <Link
                to="/login"
                className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
              >
                立即登录
              </Link>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
