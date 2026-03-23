import React, { useCallback, useEffect, useState } from 'react';
import { Form, Input, Button, Card, message, InputNumber, Switch, Spin, Tag, Divider } from 'antd';
import { ReloadOutlined, SaveOutlined, ShopOutlined } from '@ant-design/icons';
import { getMyStore, updateStoreSettings } from '../../../services/store';

const StoreSetting: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [storeInfo, setStoreInfo] = useState<any>(null);

  const fetchStoreInfo = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyStore();
      if (res.code === 200 && res.data) {
        setStoreInfo(res.data);
        // 开关控件使用 boolean，回填时先把后端 0/1 转成 true/false。
        const data = {
          ...res.data,
          businessStatus: res.data.businessStatus === 1,
        };
        form.setFieldsValue(data);
      }
    } catch (error) {
      console.error(error);
      message.error('获取店铺信息失败');
    } finally {
      setLoading(false);
    }
  }, [form]);

  useEffect(() => {
    fetchStoreInfo();
  }, [fetchStoreInfo]);

  const onFinish = async (values: any) => {
    setSubmitting(true);
    try {
      // 保存前把开关值转回后端约定的 0/1。
      const data = {
        ...values,
        businessStatus: values.businessStatus ? 1 : 0,
      };

      const res = await updateStoreSettings(data);
      if (res.code === 200) {
        message.success('店铺设置已更新');
      } else {
        message.error(res.message || '更新失败');
      }
    } catch (error) {
      console.error(error);
      message.error('更新失败');
    } finally {
      setSubmitting(false);
    }
  };

  const pageStyles = `
    .ss-root {
      position: relative;
      padding-bottom: 78px;
    }
    .ss-hero {
      position: relative;
      overflow: hidden;
      border-radius: 18px;
      border: 1px solid rgba(15, 23, 42, 0.10);
      background:
        radial-gradient(900px 380px at 10% 10%, rgba(16, 185, 129, 0.22), rgba(16, 185, 129, 0) 55%),
        radial-gradient(760px 360px at 75% 18%, rgba(34, 211, 238, 0.16), rgba(34, 211, 238, 0) 60%),
        linear-gradient(180deg, rgba(255, 255, 255, 0.88) 0%, rgba(255, 255, 255, 0.78) 100%);
      box-shadow: 0 26px 80px rgba(2, 6, 23, 0.10);
      padding: 14px 14px 12px;
      margin-bottom: 16px;
    }
    .ss-hero::after {
      content: '';
      position: absolute;
      inset: 0;
      pointer-events: none;
      opacity: 0.34;
      background-image: radial-gradient(rgba(15, 23, 42, 0.16) 1px, transparent 1px);
      background-size: 26px 26px;
      mask-image: radial-gradient(620px 460px at 65% 20%, rgba(0, 0, 0, 1), rgba(0, 0, 0, 0));
    }
    .ss-top {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 14px;
      flex-wrap: wrap;
    }
    .ss-title {
      margin: 0;
      font-size: 20px;
      font-weight: 900;
      letter-spacing: -0.3px;
      color: rgba(15, 23, 42, 0.92);
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .ss-sub {
      margin-top: 4px;
      font-size: 12px;
      color: rgba(15, 23, 42, 0.62);
    }
    .ss-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .ss-actions .ant-btn {
      border-radius: 999px;
      height: 36px;
      padding: 0 14px;
      font-weight: 650;
      border-color: rgba(15, 23, 42, 0.12);
      color: rgba(15, 23, 42, 0.78);
      background: rgba(255,255,255,0.78);
    }
    .ss-chip.ant-tag {
      border-radius: 999px;
      padding-inline: 10px;
      margin-inline-end: 0;
      background: rgba(2, 6, 23, 0.04);
      border-color: rgba(15, 23, 42, 0.10);
      color: rgba(15, 23, 42, 0.70);
      font-weight: 650;
    }

    .ss-grid {
      display: grid;
      grid-template-columns: 1.2fr 0.8fr;
      gap: 14px;
    }
    .ss-card.ant-card {
      border-radius: 18px;
      border: 1px solid rgba(15, 23, 42, 0.10);
      box-shadow: 0 20px 60px rgba(2, 6, 23, 0.08);
      background: rgba(255,255,255,0.86);
      overflow: hidden;
    }
    .ss-card .ant-card-head {
      border-bottom: 1px solid rgba(15, 23, 42, 0.08);
      background: rgba(2, 6, 23, 0.02);
    }
    .ss-card .ant-card-head-title {
      font-weight: 900;
      color: rgba(15, 23, 42, 0.82);
    }
    .ss-card .ant-card-body { padding: 14px; }

    .ss-formGrid2 {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }

    .ss-info {
      display: grid;
      gap: 10px;
    }
    .ss-infoRow {
      display: grid;
      grid-template-columns: 88px 1fr;
      gap: 10px;
      align-items: start;
    }
    .ss-label {
      color: rgba(15, 23, 42, 0.55);
      font-size: 12px;
    }
    .ss-value {
      color: rgba(15, 23, 42, 0.85);
      font-weight: 650;
      word-break: break-word;
    }
    .ss-footer {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 50;
      padding: 10px 18px;
      background: rgba(255,255,255,0.78);
      backdrop-filter: blur(10px);
      border-top: 1px solid rgba(15, 23, 42, 0.10);
    }
    .ss-footerInner {
      max-width: 1100px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .ss-footerLeft {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
      color: rgba(15, 23, 42, 0.60);
      font-size: 12px;
    }
    .ss-footerRight {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .ss-primary.ant-btn {
      border: none;
      border-radius: 999px;
      height: 40px;
      padding: 0 18px;
      font-weight: 800;
      background: linear-gradient(90deg, rgba(5, 150, 105, 1), rgba(16, 185, 129, 1));
      box-shadow: 0 18px 42px rgba(5, 150, 105, 0.20);
    }
    .ss-primary.ant-btn:hover { filter: brightness(1.02); }

    @media (max-width: 920px) {
      .ss-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 768px) {
      .ss-root { padding-bottom: 92px; }
      .ss-formGrid2 { grid-template-columns: 1fr; }
      .ss-footerRight { width: 100%; justify-content: flex-end; }
    }
  `;

  return (
    <div className="ss-root">
      <style>{pageStyles}</style>

      <div className="ss-hero" aria-label="店铺设置概览">
        <div className="ss-top">
          <div>
            <h2 className="ss-title">
              <ShopOutlined />
              店铺设置
            </h2>
            <div className="ss-sub">配置营业状态、配送规则和公告信息，影响用户下单与履约体验</div>
          </div>
          <div className="ss-actions">
            <Tag className="ss-chip">{storeInfo?.shopName ? storeInfo.shopName : '当前店铺'}</Tag>
            <Button icon={<ReloadOutlined />} onClick={fetchStoreInfo} disabled={loading || submitting}>
              刷新
            </Button>
          </div>
        </div>
      </div>

      <Spin spinning={loading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          name="store_setting_form"
          id="store_setting_form"
          initialValues={{
            businessStatus: true,
            businessHours: '09:00-22:00',
            deliveryFee: 0,
            minDeliveryAmount: 0,
          }}
        >
          <div className="ss-grid">
            <Card className="ss-card" title="经营与公告" variant="outlined">
              <div className="ss-formGrid2">
                <Form.Item name="businessStatus" label="营业状态" valuePropName="checked">
                  <Switch checkedChildren="营业中" unCheckedChildren="休息中" />
                </Form.Item>

                <Form.Item name="businessHours" label="营业时间" rules={[{ required: true, message: '请输入营业时间' }]}>
                  <Input placeholder="例如：09:00-22:00" />
                </Form.Item>
              </div>

              <Divider style={{ margin: '6px 0 12px' }} />

              <Form.Item name="notice" label="店铺公告">
                <Input.TextArea rows={4} placeholder="公告会展示在店铺页与下单流程，建议简洁明了" showCount maxLength={200} />
              </Form.Item>
            </Card>

            <div style={{ display: 'grid', gap: 14 }}>
              <Card className="ss-card" title="配送规则" variant="outlined">
                <div className="ss-formGrid2">
                  <Form.Item name="deliveryFee" label="配送费 (元)" rules={[{ required: true, message: '请输入配送费' }]}>
                    <InputNumber min={0} precision={2} style={{ width: '100%' }} placeholder="0.00" />
                  </Form.Item>

                  <Form.Item name="minDeliveryAmount" label="起送金额 (元)" rules={[{ required: true, message: '请输入起送金额' }]}>
                    <InputNumber min={0} precision={2} style={{ width: '100%' }} placeholder="0.00" />
                  </Form.Item>
                </div>
              </Card>

              <Card className="ss-card" title="店铺信息" variant="outlined">
                <div className="ss-info">
                  <div className="ss-infoRow">
                    <div className="ss-label">店铺名称</div>
                    <div className="ss-value">{storeInfo?.shopName || '-'}</div>
                  </div>
                  <div className="ss-infoRow">
                    <div className="ss-label">联系人</div>
                    <div className="ss-value">
                      {storeInfo?.contactName || '-'}
                      {storeInfo?.contactPhone ? ` · ${storeInfo.contactPhone}` : ''}
                    </div>
                  </div>
                  <div className="ss-infoRow">
                    <div className="ss-label">店铺地址</div>
                    <div className="ss-value">{storeInfo?.address || '-'}</div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </Form>
      </Spin>

      <div className="ss-footer" aria-label="保存栏">
        <div className="ss-footerInner">
          <div className="ss-footerLeft">
            <span>修改后记得保存，设置会影响用户端展示</span>
          </div>
          <div className="ss-footerRight">
            <Button onClick={fetchStoreInfo} disabled={loading || submitting}>
              恢复
            </Button>
            <Button className="ss-primary" type="primary" htmlType="submit" form="store_setting_form" icon={<SaveOutlined />} loading={submitting}>
              保存设置
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreSetting;
