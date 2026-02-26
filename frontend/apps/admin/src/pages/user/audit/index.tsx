import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Avatar, Button, Card, Descriptions, Drawer, Form, Image, Input, Space, Table, Tabs, Tag, Typography, App } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CheckCircleOutlined, CloseCircleOutlined, EyeOutlined, ReloadOutlined, SearchOutlined, ShopOutlined } from '@ant-design/icons';
import { getMerchantList, auditMerchant } from '../../../services/merchant';
import type { Merchant, MerchantQuery } from '../../../services/merchant';

const MerchantAudit: React.FC = () => {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Merchant[]>([]);
  const [total, setTotal] = useState(0);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  // 默认查看待审核 (status=0)
  const [statusFilter, setStatusFilter] = useState<number>(0);
  const [query, setQuery] = useState<MerchantQuery>({
    page: 1,
    size: 10,
  });

  // 详情/审核抽屉
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentMerchant, setCurrentMerchant] = useState<Merchant | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [filterForm] = Form.useForm();
  const [auditForm] = Form.useForm();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMerchantList({ ...query, auditStatus: statusFilter });
      if (res.code === 200) {
        setData(res.data.records);
        setTotal(res.data.total);
        setLastUpdatedAt(Date.now());
      } else {
        message.error(res.message);
      }
    } catch (error) {
      message.error('获取商家列表失败');
    } finally {
      setLoading(false);
    }
  }, [message, query, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAudit = useCallback(async (pass: boolean) => {
    if (!currentMerchant) return;
    try {
      const auditStatus = pass ? 1 : 2;
      const values = auditForm.getFieldsValue();
      const remark = (values?.auditRemark || '').trim();
      if (!pass && !remark) {
        message.warning('请填写驳回原因');
        return;
      }

      setAuditLoading(true);
      const res = await auditMerchant(currentMerchant.id, auditStatus, remark || undefined);
      if (res.code === 200) {
        message.success('操作成功');
        setDrawerOpen(false);
        fetchData();
      } else {
        message.error(res.message);
      }
    } catch (error) {
      message.error('操作失败');
    } finally {
      setAuditLoading(false);
    }
  }, [auditForm, currentMerchant, fetchData, message]);

  const showDetail = useCallback((record: Merchant) => {
    setCurrentMerchant(record);
    auditForm.resetFields();
    setDrawerOpen(true);
  }, [auditForm]);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setCurrentMerchant(null);
  }, []);

  const statusMeta = useCallback((status: number) => {
    if (status === 0) return { color: 'warning', text: '待审核' };
    if (status === 1) return { color: 'success', text: '已通过' };
    if (status === 2) return { color: 'error', text: '已驳回' };
    return { color: 'default', text: '未知' };
  }, []);

  const statusTitle = useMemo(() => {
    if (statusFilter === 0) return '待审核';
    if (statusFilter === 1) return '已通过';
    if (statusFilter === 2) return '已驳回';
    return '全部';
  }, [statusFilter]);

  const columns: ColumnsType<Merchant> = useMemo(() => {
    return [
      {
        title: '商家',
        key: 'merchant',
        width: 360,
        render: (_, record) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar
              shape="square"
              size={44}
              src={record.shopLogo}
              icon={<ShopOutlined />}
              style={{ background: 'rgba(37, 99, 235, 1)', borderRadius: 12 }}
            />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 900, color: 'rgba(15, 23, 42, 0.86)', lineHeight: 1.15 }}>
                <Typography.Text ellipsis style={{ maxWidth: 280 }}>
                  {record.shopName || `商家 #${record.id}`}
                </Typography.Text>
              </div>
              <div style={{ fontSize: 12, color: 'rgba(15, 23, 42, 0.56)' }}>
                <Typography.Text ellipsis style={{ maxWidth: 320 }}>
                  {record.contactName ? `${record.contactName} · ` : ''}
                  {record.contactPhone || '—'}
                </Typography.Text>
              </div>
            </div>
          </div>
        ),
      },
      {
        title: '联系地址',
        dataIndex: 'address',
        key: 'address',
        ellipsis: true,
        render: (v: string) => (
          <Typography.Text ellipsis style={{ maxWidth: 320, color: 'rgba(15, 23, 42, 0.78)' }}>
            {v || '-'}
          </Typography.Text>
        ),
      },
      {
        title: '申请时间',
        dataIndex: 'createTime',
        key: 'createTime',
        width: 200,
      },
      {
        title: '状态',
        dataIndex: 'auditStatus',
        key: 'auditStatus',
        width: 120,
        render: (s: number) => {
          const meta = statusMeta(s);
          return (
            <Tag color={meta.color} style={{ borderRadius: 999, paddingInline: 10 }}>
              {meta.text}
            </Tag>
          );
        },
      },
      {
        title: '操作',
        key: 'action',
        width: 160,
        fixed: 'right',
        render: (_, record) => (
          <Space size={8}>
            <Button icon={<EyeOutlined />} onClick={() => showDetail(record)} style={{ borderRadius: 999 }}>
              查看
            </Button>
          </Space>
        ),
      },
    ];
  }, [showDetail, statusMeta]);

  const handleSearch = useCallback(
    (values: any) => {
      const keyword = (values?.keyword || '').trim();
      setQuery((prev) => ({
        ...prev,
        page: 1,
        keyword: keyword || undefined,
      }));
    },
    [],
  );

  const handleReset = useCallback(() => {
    filterForm.resetFields();
    setQuery({ page: 1, size: 10 });
  }, [filterForm]);

  const pageStyles = `
    .ma-root { position: relative; padding: 8px 0; }
    .ma-hero {
      position: relative;
      overflow: hidden;
      border-radius: 18px;
      border: 1px solid rgba(15, 23, 42, 0.10);
      background:
        radial-gradient(860px 360px at 12% 14%, rgba(37, 99, 235, 0.22), rgba(37, 99, 235, 0) 55%),
        radial-gradient(760px 360px at 75% 18%, rgba(16, 185, 129, 0.14), rgba(16, 185, 129, 0) 60%),
        linear-gradient(180deg, rgba(255, 255, 255, 0.90) 0%, rgba(255, 255, 255, 0.82) 100%);
      box-shadow: 0 26px 80px rgba(2, 6, 23, 0.10);
      padding: 14px 14px 12px;
      margin-bottom: 14px;
    }
    .ma-hero::after {
      content: '';
      position: absolute;
      inset: 0;
      pointer-events: none;
      opacity: 0.30;
      background-image: radial-gradient(rgba(15, 23, 42, 0.16) 1px, transparent 1px);
      background-size: 26px 26px;
      mask-image: radial-gradient(620px 460px at 70% 22%, rgba(0, 0, 0, 1), rgba(0, 0, 0, 0));
    }
    .ma-top {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 14px;
      flex-wrap: wrap;
    }
    .ma-title {
      margin: 0;
      font-size: 20px;
      font-weight: 900;
      letter-spacing: -0.3px;
      color: rgba(15, 23, 42, 0.92);
    }
    .ma-sub {
      margin-top: 4px;
      font-size: 12px;
      color: rgba(15, 23, 42, 0.62);
    }
    .ma-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .ma-chip.ant-tag {
      border-radius: 999px;
      padding-inline: 10px;
      margin-inline-end: 0;
      background: rgba(2, 6, 23, 0.04);
      border-color: rgba(15, 23, 42, 0.10);
      color: rgba(15, 23, 42, 0.70);
      font-weight: 650;
    }
    .ma-actions .ant-btn {
      border-radius: 999px;
      height: 36px;
      padding: 0 14px;
      font-weight: 650;
      border-color: rgba(15, 23, 42, 0.12);
      color: rgba(15, 23, 42, 0.78);
      background: rgba(255,255,255,0.78);
    }
    .ma-card.ant-card {
      border-radius: 18px;
      border: 1px solid rgba(15, 23, 42, 0.10);
      box-shadow: 0 20px 60px rgba(2, 6, 23, 0.08);
      background: rgba(255,255,255,0.86);
      overflow: hidden;
    }
    .ma-card .ant-card-body { padding: 14px; }
    .ma-filters { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-end; }
    .ma-filters .ant-form-item { margin-bottom: 0; }
    .ma-tabs .ant-tabs-nav { margin: 0; }
    .ma-table .ant-table-container {
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid rgba(15, 23, 42, 0.08);
    }
    .ma-table .ant-table-thead > tr > th {
      background: rgba(2, 6, 23, 0.02);
      color: rgba(15, 23, 42, 0.70);
      font-weight: 900;
    }
    .ma-table .ant-table-tbody > tr > td {
      border-bottom: 1px solid rgba(15, 23, 42, 0.06);
    }
    .ma-drawer .ant-drawer-body { padding: 16px; }
  `;

  return (
    <div className="ma-root">
      <style>{pageStyles}</style>

      <div className="ma-hero" aria-label="商家审核概览">
        <div className="ma-top">
          <div>
            <h2 className="ma-title">商家审核</h2>
            <div className="ma-sub">当前：{statusTitle} · 支持关键词筛选与材料核验</div>
          </div>
          <div className="ma-actions">
            <Tag className="ma-chip">总计 {total}</Tag>
            <Tag className="ma-chip">
              {lastUpdatedAt ? `更新于 ${new Date(lastUpdatedAt).toLocaleTimeString()}` : '未刷新'}
            </Tag>
            <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
              刷新
            </Button>
          </div>
        </div>
      </div>

      <Card className="ma-card" variant="outlined">
        <div className="ma-tabs">
          <Tabs
            activeKey={String(statusFilter)}
            items={[
              { key: '0', label: '待审核' },
              { key: '1', label: '已通过' },
              { key: '2', label: '已驳回' },
            ]}
            onChange={(key) => {
              setStatusFilter(Number(key));
              setQuery((prev) => ({ ...prev, page: 1 }));
            }}
          />
        </div>

        <Form form={filterForm} layout="vertical" onFinish={handleSearch} style={{ marginTop: 10 }}>
          <div className="ma-filters">
            <Form.Item name="keyword" label="关键词">
              <Input
                allowClear
                prefix={<SearchOutlined />}
                placeholder="店铺名称 / 联系人 / 电话 / 信用代码"
                style={{ width: 320 }}
              />
            </Form.Item>
            <Form.Item label=" ">
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SearchOutlined />}
                  style={{
                    borderRadius: 999,
                    background: 'linear-gradient(90deg, rgba(37, 99, 235, 1), rgba(16, 185, 129, 1))',
                    border: 'none',
                    boxShadow: '0 18px 42px rgba(37, 99, 235, 0.16)',
                  }}
                >
                  查询
                </Button>
                <Button onClick={handleReset} icon={<ReloadOutlined />} style={{ borderRadius: 999 }}>
                  重置
                </Button>
              </Space>
            </Form.Item>
          </div>
        </Form>
      </Card>

      <Card className="ma-card ma-table" variant="outlined" style={{ marginTop: 14 }}>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          scroll={{ x: 980 }}
          pagination={{
            current: query.page,
            pageSize: query.size,
            total: total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (page, size) => setQuery((prev) => ({ ...prev, page, size })),
          }}
        />
      </Card>

      <Drawer
        className="ma-drawer"
        title="商家详情"
        open={drawerOpen}
        onClose={closeDrawer}
        width={560}
        destroyOnClose
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <Button onClick={closeDrawer} style={{ borderRadius: 999 }}>
              关闭
            </Button>
            {currentMerchant?.auditStatus === 0 ? (
              <Space>
                <Button
                  danger
                  icon={<CloseCircleOutlined />}
                  onClick={() => handleAudit(false)}
                  loading={auditLoading}
                  style={{ borderRadius: 999 }}
                >
                  驳回
                </Button>
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleAudit(true)}
                  loading={auditLoading}
                  style={{
                    borderRadius: 999,
                    background: 'linear-gradient(90deg, rgba(37, 99, 235, 1), rgba(16, 185, 129, 1))',
                    border: 'none',
                    boxShadow: '0 18px 42px rgba(16, 185, 129, 0.14)',
                  }}
                >
                  通过
                </Button>
              </Space>
            ) : null}
          </div>
        }
      >
        {currentMerchant ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar
                shape="square"
                size={56}
                src={currentMerchant.shopLogo}
                icon={<ShopOutlined />}
                style={{ background: 'rgba(37, 99, 235, 1)', borderRadius: 14 }}
              />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <Typography.Text style={{ fontSize: 18, fontWeight: 900, color: 'rgba(15, 23, 42, 0.88)' }} ellipsis>
                    {currentMerchant.shopName || `商家 #${currentMerchant.id}`}
                  </Typography.Text>
                  <Tag color={statusMeta(currentMerchant.auditStatus).color} style={{ borderRadius: 999, paddingInline: 10 }}>
                    {statusMeta(currentMerchant.auditStatus).text}
                  </Tag>
                </div>
                <div style={{ marginTop: 3, fontSize: 12, color: 'rgba(15, 23, 42, 0.56)' }}>
                  商家ID：{currentMerchant.id} · 用户ID：{currentMerchant.userId}
                </div>
              </div>
            </div>

            <Card className="ma-card" variant="outlined">
              <Descriptions bordered column={1} size="small">
                <Descriptions.Item label="联系人">
                  <Space size={10} wrap>
                    <span>{currentMerchant.contactName || '-'}</span>
                    <Typography.Text copyable={currentMerchant.contactPhone ? { text: currentMerchant.contactPhone } : false}>
                      {currentMerchant.contactPhone || '-'}
                    </Typography.Text>
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="联系地址">{currentMerchant.address || '-'}</Descriptions.Item>
                <Descriptions.Item label="统一社会信用代码">
                  <Typography.Text copyable={currentMerchant.creditCode ? { text: currentMerchant.creditCode } : false}>
                    {currentMerchant.creditCode || '-'}
                  </Typography.Text>
                </Descriptions.Item>
                <Descriptions.Item label="店铺简介">{currentMerchant.description || '-'}</Descriptions.Item>
                <Descriptions.Item label="申请时间">{currentMerchant.createTime || '-'}</Descriptions.Item>
                <Descriptions.Item label="更新时间">{currentMerchant.updateTime || '-'}</Descriptions.Item>
              </Descriptions>
            </Card>

            <Card className="ma-card" variant="outlined" title="证件材料" styles={{ header: { fontWeight: 900 } }}>
              <Image.PreviewGroup>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 12, color: 'rgba(15, 23, 42, 0.60)', marginBottom: 6 }}>身份证正面</div>
                    {currentMerchant.idCardFront ? (
                      <Image src={currentMerchant.idCardFront} style={{ width: '100%', borderRadius: 12 }} />
                    ) : (
                      <div style={{ padding: 12, borderRadius: 12, border: '1px dashed rgba(15, 23, 42, 0.16)', color: 'rgba(15, 23, 42, 0.56)' }}>未上传</div>
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'rgba(15, 23, 42, 0.60)', marginBottom: 6 }}>身份证背面</div>
                    {currentMerchant.idCardBack ? (
                      <Image src={currentMerchant.idCardBack} style={{ width: '100%', borderRadius: 12 }} />
                    ) : (
                      <div style={{ padding: 12, borderRadius: 12, border: '1px dashed rgba(15, 23, 42, 0.16)', color: 'rgba(15, 23, 42, 0.56)' }}>未上传</div>
                    )}
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: 12, color: 'rgba(15, 23, 42, 0.60)', marginBottom: 6 }}>营业执照</div>
                    {currentMerchant.licenseUrl ? (
                      <Image src={currentMerchant.licenseUrl} style={{ width: '100%', borderRadius: 12 }} />
                    ) : (
                      <div style={{ padding: 12, borderRadius: 12, border: '1px dashed rgba(15, 23, 42, 0.16)', color: 'rgba(15, 23, 42, 0.56)' }}>未上传</div>
                    )}
                  </div>
                </div>
              </Image.PreviewGroup>
            </Card>

            {currentMerchant.auditStatus === 0 ? (
              <Card className="ma-card" variant="outlined" title="审核意见" styles={{ header: { fontWeight: 900 } }}>
                <Form form={auditForm} layout="vertical">
                  <Form.Item name="auditRemark" label="备注">
                    <Input.TextArea rows={3} placeholder="通过可选填；驳回请填写原因" />
                  </Form.Item>
                </Form>
              </Card>
            ) : null}

            {currentMerchant.auditStatus === 2 ? (
              <Card className="ma-card" variant="outlined" title="驳回原因" styles={{ header: { fontWeight: 900 } }}>
                <div style={{ color: 'rgba(185, 28, 28, 0.92)', fontWeight: 650 }}>{currentMerchant.auditRemark || '—'}</div>
              </Card>
            ) : null}
          </div>
        ) : null}
      </Drawer>
    </div>
  );
};

export default MerchantAudit;
