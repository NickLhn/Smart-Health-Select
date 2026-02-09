import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Upload, message, Card, Steps, Alert } from 'antd';
import { UploadOutlined, ShopOutlined, IdcardOutlined, FileProtectOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { useNavigate } from 'react-router-dom';
import { getMyStore, applyStore } from '../../../services/store';
import type { Merchant } from '../../../services/store';
import { uploadFile } from '../../../services/file';

const { TextArea } = Input;

const StoreApply: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [licenseList, setLicenseList] = useState<UploadFile[]>([]);
  const [idCardFrontList, setIdCardFrontList] = useState<UploadFile[]>([]);
  const [idCardBackList, setIdCardBackList] = useState<UploadFile[]>([]);

  useEffect(() => {
    fetchStoreInfo();
  }, []);

  const fetchStoreInfo = async () => {
    try {
      const res = await getMyStore();
      if (res.code === 200 && res.data) {
        setMerchant(res.data);
        form.setFieldsValue(res.data);
        
        if (res.data.shopLogo) {
          setFileList([{ uid: '-1', name: 'logo.png', status: 'done', url: res.data.shopLogo }]);
        }
        if (res.data.licenseUrl) {
          setLicenseList([{ uid: '-1', name: 'license.png', status: 'done', url: res.data.licenseUrl }]);
        }
        if (res.data.idCardFront) {
          setIdCardFrontList([{ uid: '-1', name: 'id_card_front.png', status: 'done', url: res.data.idCardFront }]);
        }
        if (res.data.idCardBack) {
          setIdCardBackList([{ uid: '-1', name: 'id_card_back.png', status: 'done', url: res.data.idCardBack }]);
        }
      }
    } catch (error) {
      // 忽略错误，可能是第一次填写
    }
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const getFileUrl = (file: any) => {
        if (file.url) return file.url;
        if (file.response && file.response.code === 200) return file.response.data;
        return '';
      };

      const payload = {
        ...values,
        shopLogo: getFileUrl(fileList[0]),
        licenseUrl: getFileUrl(licenseList[0]),
        idCardFront: getFileUrl(idCardFrontList[0]),
        idCardBack: getFileUrl(idCardBackList[0]),
      };
      
      const res = await applyStore(payload);
      if (res.code === 200) {
        message.success('提交成功，请等待审核');
        fetchStoreInfo(); // 刷新状态
      }
    } catch (error) {
      console.error(error);
      message.error('提交失败');
    } finally {
      setLoading(false);
    }
  };

  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  // 真实上传
  const customRequest = async (options: any) => {
    const { onSuccess, onError, file } = options;
    try {
      const res = await uploadFile(file);
      if (res.code === 200) {
        onSuccess(res, file);
      } else {
        onError(new Error(res.message));
        message.error(res.message);
      }
    } catch (err) {
      onError(err);
      message.error('上传失败');
    }
  };

  const renderStatus = () => {
    if (!merchant) return null;
    if (merchant.auditStatus === 0) {
      return (
        <Alert
          message="店铺审核中"
          description="您的资料正在审核中，请耐心等待。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      );
    }
    if (merchant.auditStatus === 1) {
      return (
        <Alert
          message="审核通过"
          description="恭喜，您的店铺已通过审核！"
          type="success"
          showIcon
          style={{ marginBottom: 16 }}
        />
      );
    }
    if (merchant.auditStatus === 2) {
      return (
        <Alert
          message="审核驳回"
          description={`驳回原因: ${merchant.auditRemark}`}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      );
    }
    return null;
  };

  const currentStep = (() => {
    if (!merchant) return 0;
    if (merchant.auditStatus === 0) return 2;
    if (merchant.auditStatus === 1) return 3;
    if (merchant.auditStatus === 2) return 1;
    return 0;
  })();

  return (
    <div>
      <div
        style={{
          marginBottom: 16,
          padding: '8px 12px 12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: 16,
          borderBottom: '1px solid #E5E7EB',
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 600,
              color: '#022c22',
            }}
          >
            商家入驻信息完善
          </h2>
          <div
            style={{
              marginTop: 4,
              fontSize: 12,
              color: '#6B7280',
            }}
          >
            请填写真实、完整的店铺及资质信息，以便平台审核
          </div>
        </div>
        {merchant?.auditStatus === 1 && (
          <Button
            type="primary"
            size="middle"
            onClick={() => navigate('/dashboard')}
            style={{
              borderRadius: 999,
              paddingInline: 18,
              background: 'linear-gradient(90deg, #059669, #10B981)',
              border: 'none',
            }}
          >
            进入商家工作台
          </Button>
        )}
      </div>

      {renderStatus()}

      <Card
        variant="outlined"
        style={{
          borderRadius: 16,
          borderColor: '#E5E7EB',
        }}
      >
        <div style={{ marginBottom: 24 }}>
          <Steps
            current={currentStep}
            responsive
            items={[
              { title: '填写基本信息' },
              { title: '上传证件资料' },
              { title: '等待平台审核' },
              { title: '审核通过开始经营' },
            ]}
          />
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          disabled={merchant?.auditStatus === 0}
          style={{ marginTop: 8 }}
        >
            <Form.Item
              name="shopName"
              label="店铺名称"
              rules={[{ required: true, message: '请输入店铺名称' }]}
            >
              <Input prefix={<ShopOutlined />} placeholder="请输入店铺名称" />
            </Form.Item>

            <Form.Item
              name="description"
              label="店铺简介"
            >
              <TextArea rows={4} placeholder="请输入店铺简介" />
            </Form.Item>

            <Form.Item
              name="address"
              label="店铺地址"
              rules={[{ required: true, message: '请输入店铺地址' }]}
            >
              <Input placeholder="请输入详细地址" />
            </Form.Item>

            <Form.Item
              name="contactName"
              label="联系人姓名"
              rules={[{ required: true, message: '请输入联系人姓名' }]}
            >
              <Input placeholder="请输入联系人姓名" />
            </Form.Item>

            <Form.Item
              name="contactPhone"
              label="联系电话"
              rules={[{ required: true, message: '请输入联系电话' }]}
            >
              <Input placeholder="请输入联系电话" />
            </Form.Item>

            <Form.Item
              name="creditCode"
              label="统一社会信用代码"
              rules={[{ required: true, message: '请输入统一社会信用代码' }]}
            >
              <Input placeholder="请输入统一社会信用代码" />
            </Form.Item>

            <Form.Item label="法人身份证正面" required>
              <Upload
                listType="picture-card"
                fileList={idCardFrontList}
                onChange={({ fileList }) => setIdCardFrontList(fileList)}
                customRequest={customRequest}
                maxCount={1}
              >
                {idCardFrontList.length < 1 && <div><IdcardOutlined /><div style={{ marginTop: 8 }}>上传正面</div></div>}
              </Upload>
            </Form.Item>

            <Form.Item label="法人身份证背面" required>
              <Upload
                listType="picture-card"
                fileList={idCardBackList}
                onChange={({ fileList }) => setIdCardBackList(fileList)}
                customRequest={customRequest}
                maxCount={1}
              >
                {idCardBackList.length < 1 && <div><IdcardOutlined /><div style={{ marginTop: 8 }}>上传背面</div></div>}
              </Upload>
            </Form.Item>

            <Form.Item label="店铺Logo">
              <Upload
                listType="picture-card"
                fileList={fileList}
                onChange={({ fileList }) => setFileList(fileList)}
                customRequest={customRequest} // 实际项目中应替换为真实上传
                maxCount={1}
              >
                {fileList.length < 1 && <div><UploadOutlined /><div style={{ marginTop: 8 }}>上传</div></div>}
              </Upload>
            </Form.Item>

            <Form.Item label="营业执照" required>
              <Upload
                listType="picture-card"
                fileList={licenseList}
                onChange={({ fileList }) => setLicenseList(fileList)}
                customRequest={customRequest}
                maxCount={1}
              >
                {licenseList.length < 1 && <div><FileProtectOutlined /><div style={{ marginTop: 8 }}>上传</div></div>}
              </Upload>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                size="large"
                style={{
                  borderRadius: 999,
                  background: 'linear-gradient(90deg, #059669, #10B981)',
                  border: 'none',
                }}
              >
                提交审核
              </Button>
            </Form.Item>
          </Form>
      </Card>
    </div>
  );
};

export default StoreApply;
