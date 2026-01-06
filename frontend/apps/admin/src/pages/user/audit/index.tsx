import React, { useState, useEffect } from 'react';
import { Table, Tag, Space, Button, Card, App, Modal, Tabs, Image, Descriptions, Input, Form } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CheckCircleOutlined, CloseCircleOutlined, EyeOutlined } from '@ant-design/icons';
import { getMerchantList, auditMerchant } from '../../../services/merchant';
import type { Merchant, MerchantQuery } from '../../../services/merchant';

const MerchantAudit: React.FC = () => {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Merchant[]>([]);
  const [total, setTotal] = useState(0);
  // 默认查看待审核 (status=0)
  const [statusFilter, setStatusFilter] = useState<number>(0);
  const [query, setQuery] = useState<MerchantQuery>({
    page: 1,
    size: 10,
    auditStatus: 0
  });

  // 详情/审核弹窗
  const [modalVisible, setModalVisible] = useState(false);
  const [currentMerchant, setCurrentMerchant] = useState<Merchant | null>(null);
  const [auditForm] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getMerchantList({ ...query, auditStatus: statusFilter });
      if (res.code === 200) {
        setData(res.data.records);
        setTotal(res.data.total);
      } else {
        message.error(res.message);
      }
    } catch (error) {
      message.error('获取商家列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [query.page, query.size, statusFilter]);

  const handleAudit = async (pass: boolean) => {
    try {
      const values = await auditForm.validateFields();
      const auditStatus = pass ? 1 : 2;
      
      const res = await auditMerchant(currentMerchant!.id, auditStatus, values.auditRemark);
      if (res.code === 200) {
        message.success('操作成功');
        setModalVisible(false);
        fetchData();
      } else {
        message.error(res.message);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const showDetail = (record: Merchant) => {
    setCurrentMerchant(record);
    auditForm.resetFields();
    setModalVisible(true);
  };

  const columns: ColumnsType<Merchant> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: '店铺名称', dataIndex: 'shopName', key: 'shopName' },
    { 
        title: '店铺Logo', 
        dataIndex: 'shopLogo', 
        key: 'shopLogo',
        render: (url) => url ? <Image src={url} width={40} height={40} /> : '-'
    },
    { title: '联系地址', dataIndex: 'address', key: 'address', ellipsis: true },
    { title: '申请时间', dataIndex: 'createTime', key: 'createTime' },
    {
      title: '状态',
      dataIndex: 'auditStatus',
      key: 'auditStatus',
      render: (status) => {
        switch (status) {
            case 0: return <Tag color="warning">待审核</Tag>;
            case 1: return <Tag color="success">已通过</Tag>;
            case 2: return <Tag color="error">已驳回</Tag>;
            default: return <Tag>未知</Tag>;
        }
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="primary" 
            size="small" 
            icon={<EyeOutlined />} 
            onClick={() => showDetail(record)}
          >
            详情/审核
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card styles={{ body: { padding: '0 24px 24px' } }}>
        <Tabs
          defaultActiveKey="0"
          items={[
            { key: '0', label: '待审核' },
            { key: '1', label: '已通过' },
            { key: '2', label: '已驳回' },
          ]}
          onChange={(key) => {
            setStatusFilter(Number(key));
            setQuery(prev => ({ ...prev, page: 1 }));
          }}
        />
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            current: query.page,
            pageSize: query.size,
            total: total,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, size) => setQuery(prev => ({ ...prev, page, size })),
          }}
        />
      </Card>

      <Modal
        title="商家详情与审核"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            关闭
          </Button>,
          currentMerchant?.auditStatus === 0 && (
            <Button key="reject" danger onClick={() => handleAudit(false)}>
              驳回
            </Button>
          ),
          currentMerchant?.auditStatus === 0 && (
            <Button key="pass" type="primary" onClick={() => handleAudit(true)}>
              通过
            </Button>
          ),
        ]}
      >
        {currentMerchant && (
            <div className="space-y-4">
                <Descriptions bordered column={2}>
                    <Descriptions.Item label="店铺名称">{currentMerchant.shopName}</Descriptions.Item>
                    <Descriptions.Item label="店铺地址">{currentMerchant.address}</Descriptions.Item>
                    <Descriptions.Item label="联系人姓名">{currentMerchant.contactName}</Descriptions.Item>
                    <Descriptions.Item label="联系电话">{currentMerchant.contactPhone}</Descriptions.Item>
                    <Descriptions.Item label="统一社会信用代码" span={2}>{currentMerchant.creditCode}</Descriptions.Item>
                    <Descriptions.Item label="法人身份证正面" span={1}>
                        {currentMerchant.idCardFront ? <Image src={currentMerchant.idCardFront} width={150} /> : '未上传'}
                    </Descriptions.Item>
                    <Descriptions.Item label="法人身份证背面" span={1}>
                        {currentMerchant.idCardBack ? <Image src={currentMerchant.idCardBack} width={150} /> : '未上传'}
                    </Descriptions.Item>
                    <Descriptions.Item label="店铺简介" span={2}>{currentMerchant.description}</Descriptions.Item>
                    <Descriptions.Item label="营业执照" span={2}>
                        <Image src={currentMerchant.licenseUrl} width={200} />
                    </Descriptions.Item>
                    {currentMerchant.shopLogo && (
                        <Descriptions.Item label="店铺Logo" span={2}>
                            <Image src={currentMerchant.shopLogo} width={100} />
                        </Descriptions.Item>
                    )}
                </Descriptions>
                
                {currentMerchant.auditStatus === 0 && (
                    <Card title="审核意见" size="small">
                        <Form form={auditForm}>
                            <Form.Item name="auditRemark" label="备注">
                                <Input.TextArea rows={2} placeholder="如有驳回，请填写原因" />
                            </Form.Item>
                        </Form>
                    </Card>
                )}
                 {currentMerchant.auditStatus === 2 && (
                    <div className="text-red-500">
                        驳回原因: {currentMerchant.auditRemark}
                    </div>
                )}
            </div>
        )}
      </Modal>
    </div>
  );
};

export default MerchantAudit;
