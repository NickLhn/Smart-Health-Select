import React from 'react';
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
  MessageOutlined
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

  const headerStyle: React.CSSProperties = {
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(8px)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    padding: '0 50px',
  };

  const contentStyle: React.CSSProperties = {
    background: '#ffffff',
  };

  const heroSectionStyle: React.CSSProperties = {
    minHeight: '680px',
    background: 'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 50%, #e6f7ff 100%)',
    display: 'flex',
    alignItems: 'center',
    padding: '0 50px',
    position: 'relative',
    overflow: 'hidden',
  };

  const floatingAnimation = `
    @keyframes float {
      0% { transform: translateY(0px); }
      50% { transform: translateY(-20px); }
      100% { transform: translateY(0px); }
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .hover-card:hover {
      transform: translateY(-10px) !important;
      box-shadow: 0 20px 40px rgba(0,0,0,0.1) !important;
    }
  `;

  const statsSectionStyle: React.CSSProperties = {
    background: 'linear-gradient(to right, #001529, #003a8c)',
    padding: '80px 50px',
    color: 'white',
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

  return (
    <Layout className="layout">
      <style>{floatingAnimation}</style>
      <Header style={headerStyle}>
        <div className="logo" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <Title level={4} style={{ margin: 0, color: colorPrimary, display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '32px', marginRight: '12px' }}>🏥</span>
            <span style={{ fontWeight: 800, fontSize: '24px', background: `linear-gradient(45deg, ${colorPrimary}, #1890ff)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>智健商家端</span>
          </Title>
        </div>
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
        {/* Hero Section */}
        <div style={heroSectionStyle}>
          <div style={{ 
            position: 'absolute', 
            top: '-10%', 
            right: '-5%', 
            width: '600px', 
            height: '600px', 
            borderRadius: '50%', 
            background: 'radial-gradient(circle, rgba(24,144,255,0.1) 0%, rgba(255,255,255,0) 70%)', 
            zIndex: 0 
          }} />
          <Row gutter={[64, 48]} align="middle" style={{ width: '100%', maxWidth: '1400px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
            <Col xs={24} md={12}>
              <div style={{ paddingRight: '20px', animation: 'fadeInUp 1s ease-out' }}>
                <div style={{ 
                  display: 'inline-block', 
                  padding: '8px 16px', 
                  background: '#e6f7ff', 
                  borderRadius: '20px', 
                  color: colorPrimary, 
                  fontWeight: 600, 
                  marginBottom: '24px',
                  border: `1px solid ${colorPrimary}40`
                }}>
                  🚀 医疗数字化转型的最佳伙伴
                </div>
                <Title level={1} style={{ fontSize: '64px', marginBottom: '24px', lineHeight: 1.1, fontWeight: 900, letterSpacing: '-1px' }}>
                  连接医生与患者<br />
                  <span style={{ 
                    background: `linear-gradient(45deg, ${colorPrimary}, #52c41a)`, 
                    WebkitBackgroundClip: 'text', 
                    WebkitTextFillColor: 'transparent' 
                  }}>共建智慧医疗生态</span>
                </Title>
                <Paragraph style={{ fontSize: '20px', color: '#555', marginBottom: '48px', lineHeight: 1.8, maxWidth: '540px' }}>
                  智健医疗商家平台为您提供全方位的药品销售、订单管理、客户服务解决方案。
                  加入我们，依托大数据精准匹配，让优质医疗资源触手可及。
                </Paragraph>
                <Space size="large">
                  {!isAuthenticated && (
                    <Button type="primary" size="large" style={{ 
                      height: '64px', 
                      padding: '0 56px', 
                      fontSize: '20px', 
                      borderRadius: '32px',
                      boxShadow: '0 10px 20px rgba(24,144,255,0.3)',
                      fontWeight: 600
                    }} onClick={() => navigate('/register')}>
                      免费注册开店
                    </Button>
                  )}
                  <Button size="large" style={{ 
                    height: '64px', 
                    padding: '0 56px', 
                    fontSize: '20px', 
                    borderRadius: '32px', 
                    borderColor: colorPrimary, 
                    color: colorPrimary,
                    background: 'white',
                    fontWeight: 600
                  }} onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}>
                    {isAuthenticated ? '进入工作台' : '商家登录'}
                  </Button>
                </Space>
                <div style={{ marginTop: '56px', display: 'flex', alignItems: 'center', gap: '32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '24px', height: '24px', background: '#f6ffed', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    </div>
                    <span style={{ fontWeight: 500, color: '#333' }}>资质认证</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '24px', height: '24px', background: '#e6f7ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       <CheckCircleOutlined style={{ color: '#1890ff' }} />
                    </div>
                    <span style={{ fontWeight: 500, color: '#333' }}>极速审核</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '24px', height: '24px', background: '#fff7e6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       <CheckCircleOutlined style={{ color: '#fa8c16' }} />
                    </div>
                    <span style={{ fontWeight: 500, color: '#333' }}>专属客服</span>
                  </div>
                </div>
              </div>
            </Col>
            <Col xs={24} md={12} style={{ textAlign: 'center' }}>
              <div style={{ animation: 'float 6s ease-in-out infinite' }}>
                <img 
                  src="https://gw.alipayobjects.com/zos/rmsportal/BiazfanxmamNRoxxVxka.png" 
                  alt="Hero Illustration" 
                  style={{ maxWidth: '110%', height: 'auto', filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.15))', transform: 'scale(1.1)' }} 
                />
              </div>
            </Col>
          </Row>
        </div>

        {/* Stats Section */}
        <div style={statsSectionStyle}>
           <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'url(https://gw.alipayobjects.com/zos/rmsportal/FfdJeJRQWjEeGTpqgBKj.png) repeat', opacity: 0.05 }}></div>
          <Row gutter={[48, 48]} justify="center" style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
            <Col xs={12} md={6} style={{ textAlign: 'center' }}>
              <Statistic title={<span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '16px' }}>入驻商家</span>} value={1200} suffix="+" valueStyle={{ color: '#fff', fontSize: '48px', fontWeight: 900, fontFamily: 'Arial, sans-serif' }} />
            </Col>
            <Col xs={12} md={6} style={{ textAlign: 'center' }}>
              <Statistic title={<span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '16px' }}>覆盖城市</span>} value={50} suffix="+" valueStyle={{ color: '#fff', fontSize: '48px', fontWeight: 900, fontFamily: 'Arial, sans-serif' }} />
            </Col>
            <Col xs={12} md={6} style={{ textAlign: 'center' }}>
              <Statistic title={<span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '16px' }}>服务患者</span>} value={100} suffix="万+" valueStyle={{ color: '#fff', fontSize: '48px', fontWeight: 900, fontFamily: 'Arial, sans-serif' }} />
            </Col>
            <Col xs={12} md={6} style={{ textAlign: 'center' }}>
              <Statistic title={<span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '16px' }}>日均订单</span>} value={5000} suffix="+" valueStyle={{ color: '#fff', fontSize: '48px', fontWeight: 900, fontFamily: 'Arial, sans-serif' }} />
            </Col>
          </Row>
        </div>

        {/* Feature Section */}
        <div style={featureSectionStyle}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '80px' }}>
              <Title level={2} style={{ marginBottom: '24px', fontSize: '40px', fontWeight: 800 }}>为什么选择我们</Title>
              <Paragraph style={{ fontSize: '20px', color: '#666', maxWidth: '700px', margin: '0 auto' }}>
                我们致力于为商家提供最优质的服务体验，全方位赋能您的医疗业务
              </Paragraph>
            </div>
            <Row gutter={[32, 32]}>
              <Col xs={24} sm={12} lg={6}>
                <Card className="hover-card" hoverable style={cardStyle} styles={{ body: { padding: '48px 32px' } }}>
                  <div style={{ width: '80px', height: '80px', background: '#e6f7ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
                    <RocketOutlined style={{ fontSize: '40px', color: colorPrimary }} />
                  </div>
                  <Title level={3} style={{ marginBottom: '20px', fontSize: '24px' }}>极速入驻</Title>
                  <Paragraph style={{ color: '#666', fontSize: '16px', lineHeight: 1.8 }}>
                    全程在线操作，智能化审核流程，最快2小时完成开店，快速开启您的线上业务。
                  </Paragraph>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card className="hover-card" hoverable style={cardStyle} styles={{ body: { padding: '48px 32px' } }}>
                  <div style={{ width: '80px', height: '80px', background: '#f6ffed', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
                    <TeamOutlined style={{ fontSize: '40px', color: '#52c41a' }} />
                  </div>
                  <Title level={3} style={{ marginBottom: '20px', fontSize: '24px' }}>精准流量</Title>
                  <Paragraph style={{ color: '#666', fontSize: '16px', lineHeight: 1.8 }}>
                    依托智健医疗生态，连接海量精准患者用户，智能推荐算法，提升转化率。
                  </Paragraph>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card className="hover-card" hoverable style={cardStyle} styles={{ body: { padding: '48px 32px' } }}>
                  <div style={{ width: '80px', height: '80px', background: '#e6fffb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
                    <BarChartOutlined style={{ fontSize: '40px', color: '#13c2c2' }} />
                  </div>
                  <Title level={3} style={{ marginBottom: '20px', fontSize: '24px' }}>智能管理</Title>
                  <Paragraph style={{ color: '#666', fontSize: '16px', lineHeight: 1.8 }}>
                    提供强大的后台管理系统，订单、库存、财务数据可视化，经营状况一目了然。
                  </Paragraph>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card className="hover-card" hoverable style={cardStyle} styles={{ body: { padding: '48px 32px' } }}>
                  <div style={{ width: '80px', height: '80px', background: '#fff7e6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
                    <SafetyCertificateOutlined style={{ fontSize: '40px', color: '#fa8c16' }} />
                  </div>
                  <Title level={3} style={{ marginBottom: '20px', fontSize: '24px' }}>安全保障</Title>
                  <Paragraph style={{ color: '#666', fontSize: '16px', lineHeight: 1.8 }}>
                    严格的资质审核与隐私保护机制，保障交易安全，让您经营无忧。
                  </Paragraph>
                </Card>
              </Col>
            </Row>
          </div>
        </div>

        {/* Process Section */}
        <div style={processSectionStyle}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <Title level={2} style={{ marginBottom: '80px', fontSize: '40px', fontWeight: 800 }}>简单四步，轻松开店</Title>
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
            <div style={{ marginTop: '80px' }}>
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
             <div style={{ textAlign: 'center', marginBottom: '60px' }}>
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
                </Col>
              ))}
            </Row>
          </div>
        </div>

        {/* FAQ Section */}
        <div style={{ padding: '100px 50px', background: '#f9f9f9' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '60px' }}>
              <Title level={2} style={{ marginBottom: '16px', fontSize: '36px' }}>常见问题</Title>
              <Paragraph style={{ fontSize: '18px', color: '#888' }}>
                解答您关于入驻和经营的疑问
              </Paragraph>
            </div>
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
             <div style={{ textAlign: 'center', marginTop: '48px' }}>
              <Button size="large" icon={<QuestionCircleOutlined />} onClick={() => window.open('https://help.zhijian.com', '_blank')}>
                查看更多帮助
              </Button>
            </div>
          </div>
        </div>

        {/* Partner Section (Optional Placeholder) */}
        <div style={{ padding: '80px 50px', background: '#fff', textAlign: 'center' }}>
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
            Copyright © 2035-2026 Zhijian.com Liuhaonan Tech Co.,Ltd All Rights Reserved.
          </Text>
          <Text style={{ color: 'rgba(255, 255, 255, 0.45)' }}>
            桂ICP备20250001号 | 增值电信业务经营许可证：桂A1-20250001
          </Text>
          <Text style={{ color: 'rgba(255, 255, 255, 0.45)' }}>
            桂公安网备 2025122501871号
          </Text>
        </Space>
      </Footer>
    </Layout>
  );
};

export default LandingPage;
