import React, { useCallback, useEffect, useRef } from 'react';
import { Layout, Button, Typography, Row, Col, Space, Divider, theme, Card, Statistic, Steps, Avatar, Collapse, Rate } from 'antd';
import { useNavigate } from 'react-router-dom';
import { 
  LoginOutlined, 
  UserAddOutlined, 
  DashboardOutlined, 
  RocketOutlined, 
  SafetyCertificateOutlined, 
  BarChartOutlined, 
  TeamOutlined,
  CheckCircleOutlined,
  ShopOutlined,
  FileProtectOutlined,
  QuestionCircleOutlined,
  MessageOutlined,
  DownOutlined
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';

const { Header, Content, Footer } = Layout;
const { Title, Paragraph, Text } = Typography;

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const {
    token: { colorPrimary },
  } = theme.useToken();
  const contentRootRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  const headerStyle: React.CSSProperties = {
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'rgba(255, 255, 255, 0.72)',
    backdropFilter: 'blur(14px)',
    borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
    padding: '0 50px',
  };

  const contentStyle: React.CSSProperties = {
    background: '#ffffff',
  };

  const heroSectionStyle: React.CSSProperties = {
    minHeight: '680px',
    background:
      'radial-gradient(1000px 620px at 8% 14%, rgba(16, 185, 129, 0.18), rgba(16, 185, 129, 0) 60%), radial-gradient(820px 520px at 86% 18%, rgba(56, 189, 248, 0.16), rgba(56, 189, 248, 0) 62%), radial-gradient(700px 420px at 55% 82%, rgba(99, 102, 241, 0.10), rgba(99, 102, 241, 0) 60%), linear-gradient(180deg, #fbfffd 0%, #f5fbff 48%, #ffffff 100%)',
    display: 'flex',
    alignItems: 'center',
    padding: '0 50px',
    position: 'relative',
    overflow: 'hidden',
  };

  const scrollToStats = useCallback(() => {
    statsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const landingCss = `
    :root {
      --lp-accent: ${colorPrimary};
      --lp-accent2: #22d3ee;
      --lp-ink: rgba(15, 23, 42, 0.94);
      --lp-muted: rgba(15, 23, 42, 0.66);
      --lp-border: rgba(15, 23, 42, 0.10);
      --lp-surface: rgba(255, 255, 255, 0.78);
      --lp-shadow: 0 22px 70px rgba(2, 6, 23, 0.10);
    }

    @keyframes float {
      0% { transform: translateY(0px); }
      50% { transform: translateY(-20px); }
      100% { transform: translateY(0px); }
    }
    @keyframes bob {
      0% { transform: translateY(0); }
      60% { transform: translateY(10px); }
      100% { transform: translateY(0); }
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes shimmer {
      0% { transform: translateX(-65%) rotate(10deg); }
      100% { transform: translateX(65%) rotate(10deg); }
    }
    .hover-card:hover {
      transform: translateY(-10px) !important;
      box-shadow: 0 20px 40px rgba(0,0,0,0.1) !important;
    }
    .lp-reveal {
      opacity: 0;
      transform: translateY(-22px);
      filter: blur(8px);
      transition:
        opacity 900ms cubic-bezier(0.2, 0.8, 0.2, 1),
        transform 900ms cubic-bezier(0.2, 0.8, 0.2, 1),
        filter 900ms cubic-bezier(0.2, 0.8, 0.2, 1);
      will-change: opacity, transform, filter;
    }
    .lp-reveal.is-in {
      opacity: 1;
      transform: translateY(0);
      filter: blur(0);
    }

    .lp-chip {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      border-radius: 999px;
      border: 1px solid rgba(15, 23, 42, 0.10);
      background: rgba(255, 255, 255, 0.72);
      box-shadow: 0 10px 40px rgba(2, 6, 23, 0.06);
      color: rgba(15, 23, 42, 0.88);
      font-weight: 650;
      letter-spacing: 0.2px;
      backdrop-filter: blur(10px);
      user-select: none;
    }
    .lp-chip-dot {
      width: 10px;
      height: 10px;
      border-radius: 999px;
      background: linear-gradient(90deg, var(--lp-accent), var(--lp-accent2));
      box-shadow: 0 0 0 6px rgba(16, 185, 129, 0.12);
    }

    .lp-hero-title {
      margin: 0;
      line-height: 1.06;
      letter-spacing: -0.8px;
      color: var(--lp-ink);
    }
    .lp-hero-title-gradient {
      background: linear-gradient(90deg, var(--lp-accent), var(--lp-accent2));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .lp-hero-subtitle {
      color: var(--lp-muted);
      font-size: 18px;
      line-height: 1.9;
      max-width: 580px;
    }

    .lp-cta-primary.ant-btn {
      height: 58px;
      padding: 0 44px;
      border-radius: 999px;
      font-size: 18px;
      font-weight: 750;
      border: none;
      background: linear-gradient(90deg, var(--lp-accent), var(--lp-accent2));
      box-shadow: 0 18px 48px rgba(16, 185, 129, 0.22);
      position: relative;
      overflow: hidden;
    }
    .lp-cta-primary.ant-btn::after {
      content: "";
      position: absolute;
      top: -30%;
      left: -60%;
      width: 70%;
      height: 180%;
      background: linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.55), rgba(255,255,255,0));
      opacity: 0.55;
      transform: rotate(10deg);
      animation: shimmer 3.2s ease-in-out infinite;
      pointer-events: none;
    }
    .lp-cta-ghost.ant-btn {
      height: 58px;
      padding: 0 44px;
      border-radius: 999px;
      font-size: 18px;
      font-weight: 750;
      border: 1px solid rgba(15, 23, 42, 0.16);
      background: rgba(255, 255, 255, 0.72);
      color: rgba(15, 23, 42, 0.90);
      backdrop-filter: blur(10px);
    }

    .lp-trust {
      display: flex;
      flex-wrap: wrap;
      gap: 16px 22px;
      align-items: center;
      margin-top: 44px;
    }
    .lp-trust-item {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      border-radius: 999px;
      border: 1px solid rgba(15, 23, 42, 0.10);
      background: rgba(255, 255, 255, 0.66);
      color: rgba(15, 23, 42, 0.80);
      font-weight: 600;
    }
    .lp-trust-icon {
      width: 22px;
      height: 22px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 999px;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.18);
      color: rgba(16, 185, 129, 0.92);
    }

    .lp-mock {
      width: min(560px, 92vw);
      margin: 0 auto;
      border-radius: 22px;
      background: linear-gradient(180deg, rgba(255,255,255,0.86), rgba(255,255,255,0.66));
      border: 1px solid rgba(15, 23, 42, 0.12);
      box-shadow: var(--lp-shadow);
      overflow: hidden;
      position: relative;
    }
    .lp-mock::before {
      content: "";
      position: absolute;
      inset: -40%;
      background:
        radial-gradient(circle at 20% 20%, rgba(16, 185, 129, 0.22), transparent 46%),
        radial-gradient(circle at 75% 30%, rgba(56, 189, 248, 0.18), transparent 48%),
        radial-gradient(circle at 50% 80%, rgba(99, 102, 241, 0.10), transparent 48%);
      filter: blur(20px);
      opacity: 0.55;
      pointer-events: none;
    }
    .lp-mock-top {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 14px;
      border-bottom: 1px solid rgba(15, 23, 42, 0.10);
      background: rgba(255,255,255,0.70);
      backdrop-filter: blur(12px);
    }
    .lp-dots {
      display: inline-flex;
      gap: 7px;
      align-items: center;
    }
    .lp-dot {
      width: 9px;
      height: 9px;
      border-radius: 999px;
      background: rgba(15, 23, 42, 0.18);
    }
    .lp-mock-title {
      font-weight: 760;
      letter-spacing: 0.3px;
      color: rgba(15, 23, 42, 0.86);
      font-size: 13px;
    }
    .lp-mock-body {
      position: relative;
      z-index: 1;
      padding: 16px;
    }
    .lp-kpis {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
    }
    .lp-kpi {
      border-radius: 16px;
      background: rgba(255,255,255,0.78);
      border: 1px solid rgba(15, 23, 42, 0.10);
      padding: 14px 14px 12px;
    }
    .lp-kpi-label {
      font-size: 12px;
      color: rgba(15, 23, 42, 0.64);
      font-weight: 650;
    }
    .lp-kpi-value {
      margin-top: 8px;
      font-size: 24px;
      letter-spacing: -0.6px;
      font-weight: 840;
      color: rgba(15, 23, 42, 0.92);
    }
    .lp-kpi-trend {
      margin-top: 6px;
      font-size: 12px;
      color: rgba(16, 185, 129, 0.90);
      font-weight: 650;
    }
    .lp-chart {
      margin-top: 12px;
      border-radius: 18px;
      border: 1px solid rgba(15, 23, 42, 0.10);
      background: rgba(255,255,255,0.72);
      padding: 14px;
    }
    .lp-chart-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }
    .lp-chart-title {
      font-weight: 760;
      color: rgba(15, 23, 42, 0.84);
      letter-spacing: 0.2px;
    }
    .lp-pill {
      padding: 6px 10px;
      border-radius: 999px;
      border: 1px solid rgba(15, 23, 42, 0.10);
      background: rgba(255,255,255,0.74);
      color: rgba(15, 23, 42, 0.66);
      font-weight: 650;
      font-size: 12px;
    }
    .lp-orders {
      margin-top: 12px;
      border-radius: 18px;
      border: 1px solid rgba(15, 23, 42, 0.10);
      background: rgba(255,255,255,0.70);
      overflow: hidden;
    }
    .lp-order-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 14px;
      border-top: 1px solid rgba(15, 23, 42, 0.08);
    }
    .lp-order-row:first-child { border-top: none; }
    .lp-order-left {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .lp-order-no {
      font-weight: 750;
      color: rgba(15, 23, 42, 0.86);
      font-size: 13px;
      letter-spacing: 0.2px;
    }
    .lp-order-meta {
      font-size: 12px;
      color: rgba(15, 23, 42, 0.60);
      font-weight: 600;
    }
    .lp-badge {
      padding: 6px 10px;
      border-radius: 999px;
      font-weight: 750;
      font-size: 12px;
      border: 1px solid rgba(15, 23, 42, 0.12);
      background: rgba(16, 185, 129, 0.10);
      color: rgba(16, 185, 129, 0.92);
    }
    .lp-badge.orange {
      background: rgba(251, 146, 60, 0.14);
      color: rgba(194, 65, 12, 0.92);
      border-color: rgba(194, 65, 12, 0.18);
    }
    .lp-badge.blue {
      background: rgba(56, 189, 248, 0.14);
      color: rgba(2, 132, 199, 0.92);
      border-color: rgba(2, 132, 199, 0.18);
    }
    .lp-scroll-cue {
      position: absolute;
      left: 50%;
      bottom: 26px;
      transform: translateX(-50%);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 10px 14px;
      border-radius: 999px;
      border: 1px solid rgba(15, 23, 42, 0.14);
      background: rgba(255,255,255,0.76);
      backdrop-filter: blur(10px);
      color: rgba(15, 23, 42, 0.82);
      cursor: pointer;
      transition: transform 220ms ease, background 220ms ease, border-color 220ms ease;
      user-select: none;
    }
    .lp-scroll-cue:hover {
      transform: translateX(-50%) translateY(-2px);
      background: rgba(255,255,255,0.92);
      border-color: rgba(15, 23, 42, 0.20);
    }
    .lp-scroll-cue-icon {
      width: 32px;
      height: 32px;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.20);
      color: rgba(16, 185, 129, 0.92);
      animation: bob 1.8s ease-in-out infinite;
    }
    @media (max-width: 768px) {
      .lp-cta-primary.ant-btn,
      .lp-cta-ghost.ant-btn {
        height: 54px;
        padding: 0 28px;
        font-size: 16px;
      }
      .lp-scroll-cue {
        bottom: 16px;
      }
      .lp-mock {
        width: min(520px, 92vw);
      }
      .lp-kpis {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .lp-reveal { transition: none; transform: none; filter: none; opacity: 1; }
      .lp-scroll-cue-icon { animation: none; }
      .hover-card:hover { transform: none !important; }
    }
  `;

  const statsSectionStyle: React.CSSProperties = {
    background:
      'radial-gradient(920px 440px at 10% 8%, rgba(16, 185, 129, 0.10), rgba(16, 185, 129, 0) 60%), radial-gradient(840px 520px at 90% 10%, rgba(56, 189, 248, 0.10), rgba(56, 189, 248, 0) 60%), linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
    padding: '92px 50px',
    color: 'rgba(15, 23, 42, 0.86)',
    position: 'relative',
  };

  const featureSectionStyle: React.CSSProperties = {
    padding: '120px 50px',
    textAlign: 'center',
    background: '#ffffff',
  };

  const processSectionStyle: React.CSSProperties = {
    padding: '120px 50px',
    background: '#f8fafc',
    textAlign: 'center',
  };

  const footerStyle: React.CSSProperties = {
    textAlign: 'center',
    background: '#001529',
    color: 'rgba(255, 255, 255, 0.65)',
    padding: '80px 50px 24px',
  };

  const footerLinkStyle: React.CSSProperties = {
    color: 'rgba(255, 255, 255, 0.65)',
    margin: '0 12px',
    cursor: 'pointer',
    transition: 'color 0.3s',
  };

  const cardStyle: React.CSSProperties = {
    height: '100%',
    border: 'none',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    transition: 'all 0.4s ease',
    borderRadius: '16px',
    overflow: 'hidden',
  };

  useEffect(() => {
    const root = contentRootRef.current;
    if (!root) return;

    const targets = Array.from(root.querySelectorAll<HTMLElement>('[data-lp-reveal]'));
    targets.forEach((el) => {
      const delay = el.dataset.lpDelay;
      if (delay) {
        el.style.transitionDelay = `${Number(delay)}ms`;
      }
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const el = entry.target as HTMLElement;
          if (entry.isIntersecting) {
            el.classList.add('is-in');
            observer.unobserve(el);
          }
        });
      },
      { root: null, rootMargin: '0px 0px -10% 0px', threshold: 0.12 }
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <Layout className="layout">
      <style>{landingCss}</style>
      <Header style={headerStyle}>
        <button type="button" className="logo" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', background: 'transparent', border: 0, padding: 0 }} onClick={() => navigate('/')} aria-label="返回首页">
          <Title level={4} style={{ margin: 0, color: colorPrimary, display: 'flex', alignItems: 'center' }}>
            <ShopOutlined style={{ fontSize: '28px', marginRight: '12px', color: colorPrimary }} />
            <span style={{ fontWeight: 800, fontSize: '24px', background: `linear-gradient(45deg, ${colorPrimary}, #1890ff)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>智健商家端</span>
          </Title>
        </button>
        <div className="menu-right">
          <Space size="middle">
            {isAuthenticated ? (
              <Button type="primary" size="large" icon={<DashboardOutlined />} onClick={() => navigate('/dashboard')} style={{ borderRadius: '24px', paddingLeft: '24px', paddingRight: '24px' }}>
                进入控制台
              </Button>
            ) : (
              <>
                <Button type="text" size="large" icon={<LoginOutlined />} onClick={() => navigate('/login')} style={{ fontWeight: 500 }}>
                  商家登录
                </Button>
                <Button type="primary" size="large" icon={<UserAddOutlined />} onClick={() => navigate('/register')} style={{ borderRadius: '24px', paddingLeft: '24px', paddingRight: '24px', fontWeight: 600 }}>
                  立即入驻
                </Button>
              </>
            )}
          </Space>
        </div>
      </Header>
      
      <Content style={contentStyle}>
        <div ref={contentRootRef}>
        {/* Hero Section */}
        <div style={heroSectionStyle}>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.22, backgroundImage: 'radial-gradient(rgba(15,23,42,0.18) 1px, transparent 1px)', backgroundSize: '26px 26px', maskImage: 'radial-gradient(620px 460px at 65% 25%, rgba(0,0,0,1), rgba(0,0,0,0))' }} />
          <div style={{ position: 'absolute', inset: 0, opacity: 0.10, backgroundImage: 'linear-gradient(135deg, rgba(15,23,42,0.08), transparent 42%)' }} />
          <Row gutter={[64, 48]} align="middle" style={{ width: '100%', maxWidth: '1400px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
            <Col xs={24} md={12}>
              <div style={{ paddingRight: '20px', animation: 'fadeInUp 900ms ease-out' }}>
                <div className="lp-chip">
                  <span className="lp-chip-dot" />
                  合规经营 · 智能增长 · 上线级后台
                </div>
                <Title level={1} className="lp-hero-title" style={{ fontSize: 'clamp(40px, 6vw, 64px)', marginTop: 20, marginBottom: 18 }}>
                  让你的门店经营<br />
                  <span className="lp-hero-title-gradient">更快、更稳、更省心</span>
                </Title>
                <Paragraph className="lp-hero-subtitle" style={{ marginBottom: 38 }}>
                  从商品上架、订单履约、售后退款到客服与数据看板，一套平台跑通线上经营闭环。
                  支持多角色协作与流程化管理，让增长变得可追踪、可复制。
                </Paragraph>
                <Space size="large">
                  {!isAuthenticated && (
                    <Button type="primary" size="large" className="lp-cta-primary" onClick={() => navigate('/register')}>
                      立即入驻
                    </Button>
                  )}
                  <Button size="large" className="lp-cta-ghost" onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}>
                    {isAuthenticated ? '进入工作台' : '商家登录'}
                  </Button>
                </Space>
                <div className="lp-trust" aria-label="平台优势">
                  <span className="lp-trust-item">
                    <span className="lp-trust-icon"><SafetyCertificateOutlined /></span>
                    资质审核合规
                  </span>
                  <span className="lp-trust-item">
                    <span className="lp-trust-icon"><RocketOutlined /></span>
                    极速上架出单
                  </span>
                  <span className="lp-trust-item">
                    <span className="lp-trust-icon"><MessageOutlined /></span>
                    专属客服支持
                  </span>
                </div>
              </div>
            </Col>
            <Col xs={24} md={12} style={{ textAlign: 'center' }}>
              <div style={{ animation: 'float 7s ease-in-out infinite' }} className="lp-reveal" data-lp-reveal data-lp-delay="120">
                <div className="lp-mock" aria-label="商家后台界面示意">
                  <div className="lp-mock-top">
                    <span className="lp-dots" aria-hidden="true">
                      <span className="lp-dot" />
                      <span className="lp-dot" />
                      <span className="lp-dot" />
                    </span>
                    <span className="lp-mock-title">商家控制台 · 今日概览</span>
                    <span className="lp-pill" aria-hidden="true">实时</span>
                  </div>
                  <div className="lp-mock-body">
                    <div className="lp-kpis" aria-label="关键指标">
                      <div className="lp-kpi">
                        <div className="lp-kpi-label">今日订单</div>
                        <div className="lp-kpi-value">128</div>
                        <div className="lp-kpi-trend">+12.8%</div>
                      </div>
                      <div className="lp-kpi">
                        <div className="lp-kpi-label">今日销售额</div>
                        <div className="lp-kpi-value">¥9,420</div>
                        <div className="lp-kpi-trend">+7.4%</div>
                      </div>
                      <div className="lp-kpi">
                        <div className="lp-kpi-label">待处理售后</div>
                        <div className="lp-kpi-value">6</div>
                        <div className="lp-kpi-trend">需跟进</div>
                      </div>
                    </div>

                    <div className="lp-chart" aria-label="趋势图示意">
                      <div className="lp-chart-head">
                        <span className="lp-chart-title">近7日订单趋势</span>
                        <span className="lp-pill">周</span>
                      </div>
                      <svg width="100%" height="92" viewBox="0 0 520 92" role="img" aria-label="趋势折线">
                        <defs>
                          <linearGradient id="lpLine" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0" stopColor="rgba(16,185,129,0.95)" />
                            <stop offset="1" stopColor="rgba(34,211,238,0.92)" />
                          </linearGradient>
                          <linearGradient id="lpArea" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0" stopColor="rgba(16,185,129,0.20)" />
                            <stop offset="1" stopColor="rgba(34,211,238,0)" />
                          </linearGradient>
                        </defs>
                        <path d="M18 72 C 76 58, 98 40, 152 44 C 204 48, 228 66, 276 52 C 330 36, 362 18, 416 30 C 464 41, 486 56, 502 46" fill="none" stroke="url(#lpLine)" strokeWidth="4" strokeLinecap="round" />
                        <path d="M18 72 C 76 58, 98 40, 152 44 C 204 48, 228 66, 276 52 C 330 36, 362 18, 416 30 C 464 41, 486 56, 502 46 L 502 92 L 18 92 Z" fill="url(#lpArea)" />
                        <g stroke="rgba(15,23,42,0.10)" strokeWidth="1">
                          <line x1="0" y1="91" x2="520" y2="91" />
                          <line x1="0" y1="61" x2="520" y2="61" />
                          <line x1="0" y1="31" x2="520" y2="31" />
                        </g>
                      </svg>
                    </div>

                    <div className="lp-orders" aria-label="订单列表示意">
                      <div className="lp-order-row">
                        <div className="lp-order-left">
                          <span className="lp-order-no">#20260210-0182</span>
                          <span className="lp-order-meta">用户：张** · 2件商品</span>
                        </div>
                        <span className="lp-badge orange">待发货</span>
                      </div>
                      <div className="lp-order-row">
                        <div className="lp-order-left">
                          <span className="lp-order-no">#20260210-0176</span>
                          <span className="lp-order-meta">用户：李** · 1件商品</span>
                        </div>
                        <span className="lp-badge blue">待审核</span>
                      </div>
                      <div className="lp-order-row">
                        <div className="lp-order-left">
                          <span className="lp-order-no">#20260210-0169</span>
                          <span className="lp-order-meta">用户：王** · 3件商品</span>
                        </div>
                        <span className="lp-badge">已完成</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
          <button type="button" className="lp-scroll-cue" onClick={scrollToStats} aria-label="向下滚动查看" title="向下查看">
            <span className="lp-scroll-cue-icon">
              <DownOutlined />
            </span>
            <span style={{ fontWeight: 600, letterSpacing: 0.2 }}>向下探索</span>
          </button>
        </div>

        {/* Stats Section */}
        <div ref={statsRef} style={statsSectionStyle}>
          <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
            <div style={{ textAlign: 'center', marginBottom: 54 }} className="lp-reveal" data-lp-reveal>
              <Title level={2} style={{ marginBottom: 12, fontSize: 38, fontWeight: 850, color: 'rgba(15,23,42,0.92)' }}>
                用数据说话，经营更踏实
              </Title>
              <Paragraph style={{ margin: 0, fontSize: 18, color: 'rgba(15,23,42,0.62)' }}>
                关键指标一屏掌握，运营节奏更可控
              </Paragraph>
            </div>

            <Row gutter={[18, 18]}>
              {[
                { title: '入驻商家', value: 1200, suffix: '+', tone: 'mint' as const },
                { title: '覆盖城市', value: 50, suffix: '+', tone: 'cyan' as const },
                { title: '服务患者', value: 100, suffix: '万+', tone: 'indigo' as const },
                { title: '日均订单', value: 5000, suffix: '+', tone: 'orange' as const },
              ].map((item, idx) => {
                const tone =
                  item.tone === 'mint'
                    ? { bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.18)', dot: 'rgba(16,185,129,0.92)' }
                    : item.tone === 'cyan'
                      ? { bg: 'rgba(34,211,238,0.10)', border: 'rgba(34,211,238,0.18)', dot: 'rgba(2,132,199,0.92)' }
                      : item.tone === 'indigo'
                        ? { bg: 'rgba(99,102,241,0.10)', border: 'rgba(99,102,241,0.18)', dot: 'rgba(79,70,229,0.92)' }
                        : { bg: 'rgba(251,146,60,0.12)', border: 'rgba(251,146,60,0.22)', dot: 'rgba(194,65,12,0.92)' };

                return (
                  <Col xs={24} sm={12} md={6} key={item.title}>
                    <div className="lp-reveal" data-lp-reveal data-lp-delay={String(idx * 80)}>
                      <Card
                        hoverable
                        style={{
                          borderRadius: 20,
                          border: `1px solid ${tone.border}`,
                          background: 'rgba(255,255,255,0.78)',
                          boxShadow: '0 18px 60px rgba(2,6,23,0.08)',
                          overflow: 'hidden',
                        }}
                        styles={{ body: { padding: 18 } }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                          <span style={{ fontWeight: 750, color: 'rgba(15,23,42,0.74)' }}>{item.title}</span>
                          <span style={{ width: 10, height: 10, borderRadius: 999, background: tone.dot, boxShadow: `0 0 0 10px ${tone.bg}` }} />
                        </div>
                        <Statistic
                          value={item.value}
                          suffix={item.suffix}
                          valueStyle={{ color: 'rgba(15,23,42,0.92)', fontSize: 40, fontWeight: 900, letterSpacing: -0.6 }}
                        />
                      </Card>
                    </div>
                  </Col>
                );
              })}
            </Row>
          </div>
        </div>

        {/* Feature Section */}
        <div style={featureSectionStyle}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '80px' }} className="lp-reveal" data-lp-reveal>
              <Title level={2} style={{ marginBottom: '24px', fontSize: '40px', fontWeight: 800 }}>为什么选择我们</Title>
              <Paragraph style={{ fontSize: '20px', color: '#666', maxWidth: '700px', margin: '0 auto' }}>
                我们致力于为商家提供最优质的服务体验，全方位赋能您的医疗业务
              </Paragraph>
            </div>
            <Row gutter={[32, 32]}>
              <Col xs={24} sm={12} lg={6}>
                <div className="lp-reveal" data-lp-reveal data-lp-delay="0">
                  <Card className="hover-card" hoverable style={cardStyle} styles={{ body: { padding: '48px 32px' } }}>
                    <div style={{ width: '80px', height: '80px', background: '#e6f7ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
                      <RocketOutlined style={{ fontSize: '40px', color: colorPrimary }} />
                    </div>
                    <Title level={3} style={{ marginBottom: '20px', fontSize: '24px' }}>极速入驻</Title>
                    <Paragraph style={{ color: '#666', fontSize: '16px', lineHeight: 1.8 }}>
                      全程在线操作，智能化审核流程，最快2小时完成开店，快速开启您的线上业务。
                    </Paragraph>
                  </Card>
                </div>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <div className="lp-reveal" data-lp-reveal data-lp-delay="80">
                  <Card className="hover-card" hoverable style={cardStyle} styles={{ body: { padding: '48px 32px' } }}>
                    <div style={{ width: '80px', height: '80px', background: '#f6ffed', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
                      <TeamOutlined style={{ fontSize: '40px', color: '#52c41a' }} />
                    </div>
                    <Title level={3} style={{ marginBottom: '20px', fontSize: '24px' }}>精准流量</Title>
                    <Paragraph style={{ color: '#666', fontSize: '16px', lineHeight: 1.8 }}>
                      依托智健医疗生态，连接海量精准患者用户，智能推荐算法，提升转化率。
                    </Paragraph>
                  </Card>
                </div>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <div className="lp-reveal" data-lp-reveal data-lp-delay="160">
                  <Card className="hover-card" hoverable style={cardStyle} styles={{ body: { padding: '48px 32px' } }}>
                    <div style={{ width: '80px', height: '80px', background: '#e6fffb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
                      <BarChartOutlined style={{ fontSize: '40px', color: '#13c2c2' }} />
                    </div>
                    <Title level={3} style={{ marginBottom: '20px', fontSize: '24px' }}>智能管理</Title>
                    <Paragraph style={{ color: '#666', fontSize: '16px', lineHeight: 1.8 }}>
                      提供强大的后台管理系统，订单、库存、财务数据可视化，经营状况一目了然。
                    </Paragraph>
                  </Card>
                </div>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <div className="lp-reveal" data-lp-reveal data-lp-delay="240">
                  <Card className="hover-card" hoverable style={cardStyle} styles={{ body: { padding: '48px 32px' } }}>
                    <div style={{ width: '80px', height: '80px', background: '#fff7e6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
                      <SafetyCertificateOutlined style={{ fontSize: '40px', color: '#fa8c16' }} />
                    </div>
                    <Title level={3} style={{ marginBottom: '20px', fontSize: '24px' }}>安全保障</Title>
                    <Paragraph style={{ color: '#666', fontSize: '16px', lineHeight: 1.8 }}>
                      严格的资质审核与隐私保护机制，保障交易安全，让您经营无忧。
                    </Paragraph>
                  </Card>
                </div>
              </Col>
            </Row>
          </div>
        </div>

        {/* Process Section */}
        <div style={processSectionStyle}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div className="lp-reveal" data-lp-reveal>
              <Title level={2} style={{ marginBottom: '80px', fontSize: '40px', fontWeight: 800 }}>简单四步，轻松开店</Title>
            </div>
            <Steps
              current={-1}
              labelPlacement="vertical"
              items={[
                {
                  title: <span style={{ fontSize: '20px', fontWeight: 600 }}>注册账号</span>,
                  description: <span style={{ fontSize: '16px', color: '#888' }}>使用手机号注册商家账号</span>,
                  icon: <div style={{ width: '60px', height: '60px', background: '#fff', border: '2px solid #1890ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1890ff', fontSize: '24px', fontWeight: 'bold' }}>1</div>,
                },
                {
                  title: <span style={{ fontSize: '20px', fontWeight: 600 }}>提交资质</span>,
                  description: <span style={{ fontSize: '16px', color: '#888' }}>上传营业执照等相关证件</span>,
                  icon: <div style={{ width: '60px', height: '60px', background: '#fff', border: '2px solid #1890ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1890ff', fontSize: '24px', fontWeight: 'bold' }}>2</div>,
                },
                {
                  title: <span style={{ fontSize: '20px', fontWeight: 600 }}>等待审核</span>,
                  description: <span style={{ fontSize: '16px', color: '#888' }}>平台将在1-3个工作日内审核</span>,
                  icon: <div style={{ width: '60px', height: '60px', background: '#fff', border: '2px solid #1890ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1890ff', fontSize: '24px', fontWeight: 'bold' }}>3</div>,
                },
                {
                  title: <span style={{ fontSize: '20px', fontWeight: 600 }}>发布商品</span>,
                  description: <span style={{ fontSize: '16px', color: '#888' }}>审核通过后即可发布商品</span>,
                  icon: <div style={{ width: '60px', height: '60px', background: '#fff', border: '2px solid #1890ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1890ff', fontSize: '24px', fontWeight: 'bold' }}>4</div>,
                },
              ]}
            />
            <div style={{ marginTop: '80px' }} className="lp-reveal" data-lp-reveal data-lp-delay="120">
              <Button type="primary" size="large" style={{ 
                height: '60px', 
                padding: '0 56px', 
                fontSize: '20px', 
                borderRadius: '30px',
                fontWeight: 600,
                boxShadow: '0 8px 16px rgba(24,144,255,0.2)'
              }} onClick={() => navigate('/register')}>
                立即开始
              </Button>
            </div>
          </div>
        </div>

        {/* Testimonials Section */}
        <div style={{ padding: '100px 50px', background: '#ffffff' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
             <div style={{ textAlign: 'center', marginBottom: '60px' }} className="lp-reveal" data-lp-reveal>
              <Title level={2} style={{ marginBottom: '16px', fontSize: '36px' }}>商家心声</Title>
              <Paragraph style={{ fontSize: '18px', color: '#888' }}>
                听听已经入驻的商家伙伴们怎么说
              </Paragraph>
            </div>
            <Row gutter={[32, 32]}>
              {[
                {
                  content: "平台流量非常精准，入驻第一周就出单了，客服也很负责，手把手教我怎么上传商品。",
                  author: "张先生",
                  role: "连锁药店负责人",
                  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                },
                {
                  content: "后台管理系统很好用，库存和订单一目了然，大大提高了我们的效率，对账也很方便。",
                  author: "李女士",
                  role: "医疗器械供应商",
                  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka"
                },
                {
                  content: "资质审核速度很快，流程规范。平台的营销工具很丰富，帮助我们获得了不少新客户。",
                  author: "王经理",
                  role: "制药厂商销售总监",
                  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Zack"
                }
              ].map((item, index) => (
                <Col xs={24} md={8} key={index}>
                  <div className="lp-reveal" data-lp-reveal data-lp-delay={String(index * 90)}>
                    <Card hoverable style={{ height: '100%', border: '1px solid #f0f0f0', borderRadius: '8px' }} styles={{ body: { padding: '32px' } }}>
                      <div style={{ marginBottom: '24px' }}>
                        <Rate disabled defaultValue={5} style={{ color: '#faad14', fontSize: '16px' }} />
                      </div>
                      <Paragraph style={{ fontSize: '16px', color: '#666', minHeight: '80px', marginBottom: '24px' }}>
                        "{item.content}"
                      </Paragraph>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar src={item.avatar} size={48} icon={<UserAddOutlined />} />
                        <div style={{ marginLeft: '16px' }}>
                          <Title level={5} style={{ margin: 0, fontSize: '16px' }}>{item.author}</Title>
                          <Text style={{ color: '#999', fontSize: '14px' }}>{item.role}</Text>
                        </div>
                      </div>
                    </Card>
                  </div>
                </Col>
              ))}
            </Row>
          </div>
        </div>

        {/* FAQ Section */}
        <div style={{ padding: '100px 50px', background: '#f9f9f9' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '60px' }} className="lp-reveal" data-lp-reveal>
              <Title level={2} style={{ marginBottom: '16px', fontSize: '36px' }}>常见问题</Title>
              <Paragraph style={{ fontSize: '18px', color: '#888' }}>
                解答您关于入驻和经营的疑问
              </Paragraph>
            </div>
            <div className="lp-reveal" data-lp-reveal data-lp-delay="90">
            <Collapse 
              ghost 
              expandIconPosition="end"
              items={[
                {
                  key: '1',
                  label: <span style={{ fontSize: '18px', fontWeight: 500 }}>入驻需要什么资质？</span>,
                  children: <p style={{ fontSize: '16px', color: '#666', lineHeight: 1.8 }}>需要提供营业执照、药品经营许可证（或医疗器械经营许可证）、法定代表人身份证复印件等相关行业资质文件。具体要求会在注册流程中详细说明。</p>,
                },
                {
                  key: '2',
                  label: <span style={{ fontSize: '18px', fontWeight: 500 }}>入驻收费吗？</span>,
                  children: <p style={{ fontSize: '16px', color: '#666', lineHeight: 1.8 }}>目前平台免收商家入驻费和年费，仅在交易成功后收取少量技术服务费（费率根据品类不同在0.6%-2%之间）。</p>,
                },
                {
                  key: '3',
                  label: <span style={{ fontSize: '18px', fontWeight: 500 }}>如何结算货款？</span>,
                  children: <p style={{ fontSize: '16px', color: '#666', lineHeight: 1.8 }}>订单完成后（用户确认收货或系统自动确认），资金将自动结算至您的商家账户余额。您支持随时申请提现到绑定的银行账户，通常T+1到账。</p>,
                },
                {
                  key: '4',
                  label: <span style={{ fontSize: '18px', fontWeight: 500 }}>没有网店运营经验可以吗？</span>,
                  children: <p style={{ fontSize: '16px', color: '#666', lineHeight: 1.8 }}>当然可以。我们提供完善的商家培训体系，包括视频教程、文档指南，还有专属客服一对一指导，帮助您快速上手。</p>,
                },
              ]}
            />
            </div>
             <div style={{ textAlign: 'center', marginTop: '48px' }}>
              <Button size="large" icon={<QuestionCircleOutlined />} onClick={() => window.open('https://help.zhijian.com', '_blank')}>
                查看更多帮助
              </Button>
            </div>
          </div>
        </div>

        {/* Partner Section (Optional Placeholder) */}
        {/* <div style={{ padding: '80px 50px', background: '#fff', textAlign: 'center' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <Title level={4} style={{ marginBottom: '40px', color: '#999', textTransform: 'uppercase', letterSpacing: '2px' }}>
              合作伙伴
            </Title>
            <Row justify="center" align="middle" gutter={[48, 24]}>
              {[1, 2, 3, 4, 5].map((item) => (
                <Col key={item}>
                   <div style={{ 
                     width: '120px', 
                     height: '60px', 
                     background: '#f5f5f5', 
                     borderRadius: '4px',
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'center',
                     color: '#ccc',
                     fontWeight: 'bold'
                   }}>
                     LOGO
                   </div>
                </Col>
              ))}
            </Row>
          </div>
        </div> */}
        </div>
      </Content>

      <Footer style={footerStyle}>
        <div style={{ marginBottom: '40px' }}>
          <Row gutter={[32, 32]} justify="center" style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'left' }}>
            <Col xs={24} md={6}>
              <Title level={4} style={{ color: 'white' }}>智健医疗</Title>
              <Paragraph style={{ color: 'rgba(255,255,255,0.65)' }}>
                致力于通过技术创新，为医疗行业提供更高效、更便捷的数字化解决方案。
              </Paragraph>
            </Col>
            <Col xs={24} md={6}>
              <Title level={5} style={{ color: 'white' }}>关于我们</Title>
              <Space direction="vertical" style={{ width: '100%' }}>
                <span style={footerLinkStyle}>公司简介</span>
                <span style={footerLinkStyle}>加入我们</span>
                <span style={footerLinkStyle}>联系方式</span>
              </Space>
            </Col>
            <Col xs={24} md={6}>
              <Title level={5} style={{ color: 'white' }}>帮助中心</Title>
              <Space direction="vertical" style={{ width: '100%' }}>
                <span style={footerLinkStyle}>商家指南</span>
                <span style={footerLinkStyle}>常见问题</span>
                <span style={footerLinkStyle}>技术支持</span>
              </Space>
            </Col>
            <Col xs={24} md={6}>
              <Title level={5} style={{ color: 'white' }}>法律条款</Title>
              <Space direction="vertical" style={{ width: '100%' }}>
                <span style={footerLinkStyle}>服务协议</span>
                <span style={footerLinkStyle}>隐私政策</span>
                <span style={footerLinkStyle}>免责声明</span>
              </Space>
            </Col>
          </Row>
        </div>

        <Divider style={{ borderColor: 'rgba(255,255,255,0.1)' }} />

        <div style={{ marginTop: '24px' }}>
          <Space split={<Divider type="vertical" style={{ background: 'rgba(255,255,255,0.2)' }} />} wrap style={{ justifyContent: 'center', marginBottom: '16px' }}>
            <span style={footerLinkStyle}>了解我们</span>
            <span style={footerLinkStyle}>关于我们</span>
            <span style={footerLinkStyle}>公司资质</span>
            <span style={footerLinkStyle}>合作流程</span>
            <span style={footerLinkStyle}>法律声明</span>
            <span style={footerLinkStyle}>隐私政策</span>
            <span style={footerLinkStyle}>商户协议</span>
            <span style={footerLinkStyle}>用户协议</span>
            <span style={footerLinkStyle}>新闻动态</span>
          </Space>
        </div>
        
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Text style={{ color: 'rgba(255, 255, 255, 0.45)' }}>
            2025-2026 Zhijianshangcheng.cn Liuhaonan Tech co.Ltd
          </Text>
          <Text style={{ color: 'rgba(255, 255, 255, 0.45)', cursor: 'pointer' }} onClick={() => window.open('https://beian.miit.gov.cn/', '_blank')}>
            黑ICP备2026000416号
          </Text>
        </Space>
      </Footer>
    </Layout>
  );
};

export default LandingPage;
