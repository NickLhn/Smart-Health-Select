import React from 'react';
import { Layout, FloatButton } from 'antd';
import { Outlet } from 'react-router-dom';
import { RobotOutlined } from '@ant-design/icons';
import { useAI } from '../context/AIContext';
import Header from '../components/layout/Header';
import BottomNav from '../components/layout/BottomNav';

const { Content, Footer } = Layout;

const MainLayout: React.FC = () => {
  const { openAI } = useAI();
  
  return (
    <Layout className="layout min-h-screen bg-surface-subtle selection:bg-primary/20 selection:text-primary-800 flex flex-col">
      <Header />
      
      <Content className="flex-grow md:px-6 md:py-8 pb-24 md:pb-8 max-w-7xl mx-auto w-full animate-fade-in relative z-0">
        <Outlet />
      </Content>

      <Footer className="text-center text-gray-400 text-sm bg-transparent py-8 hidden md:block border-t border-gray-100">
        <div className="max-w-7xl mx-auto">
          <p className="mb-2 font-medium">© 2025-2026 Zhijianshangcheng.cn Liuhaonan Tech co.Ltd</p>
          <p className="text-xs opacity-60 font-mono">黑ICP备2026000416号</p>
        </div>
      </Footer>
      
      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* AI Consultation Float Button */}
      <FloatButton 
        icon={<RobotOutlined />} 
        type="primary" 
        style={{ right: 24, bottom: 100 }}
        onClick={openAI}
        tooltip="AI 医生助手"
        className="shadow-lg shadow-primary/30 animate-bounce-slow"
      />
    </Layout>
  );
};

export default MainLayout;
