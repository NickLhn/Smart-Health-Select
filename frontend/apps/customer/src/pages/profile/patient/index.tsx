import React, { useEffect, useState } from 'react';
import { Card, Button, Table, Modal, Form, Input, Select, DatePicker, Popconfirm, Tag, App as AntdApp, Upload } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, UserOutlined } from '@ant-design/icons';
import { getPatientList, addPatient, updatePatient, deletePatient } from '../../../services/patient';
import type { Patient } from '../../../services/patient';
import { uploadFile } from '../../../services/file';
import dayjs from 'dayjs';

const PatientList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [form] = Form.useForm();
  const { message } = AntdApp.useApp();

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await getPatientList();
      if (res && res.code === 200) {
        setPatients(res.data || []);
      }
    } catch (error) {
      console.error(error);
      message.error('获取就诊人列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const customRequest = async (options: any) => {
    const { onSuccess, onError, file } = options;
    try {
      const res = await uploadFile(file);
      if (res.code === 200) {
        onSuccess(res);
      } else {
        onError(new Error(res.message));
        message.error(res.message);
      }
    } catch (err) {
      onError(err);
      message.error('上传失败');
    }
  };

  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  const handleSubmit = async (values: any) => {
    try {
      const getFileUrl = (fileList: any[]) => {
        if (!fileList || fileList.length === 0) return undefined;
        const file = fileList[0];
        if (file.url) return file.url;
        if (file.response && file.response.code === 200) return file.response.data;
        return undefined;
      };

      const data = {
        ...values,
        id: currentId,
        birthday: values.birthday ? values.birthday.format('YYYY-MM-DD') : undefined,
        gender: Number(values.gender),
        idCardFront: getFileUrl(values.idCardFront),
        idCardBack: getFileUrl(values.idCardBack),
      };
      
      let res;
      if (currentId) {
        res = await updatePatient(data);
      } else {
        res = await addPatient(data);
      }

      if (res && res.code === 200) {
        message.success(currentId ? '修改成功' : '添加成功');
        setIsModalOpen(false);
        setCurrentId(null);
        form.resetFields();
        fetchPatients();
      } else {
        message.error(res.message || (currentId ? '修改失败' : '添加失败'));
      }
    } catch (error) {
      console.error(error);
      message.error(currentId ? '修改失败' : '添加失败');
    }
  };

  const handleEdit = (record: Patient) => {
    setCurrentId(record.id);
    form.setFieldsValue({
      ...record,
      gender: String(record.gender),
      birthday: record.birthday ? dayjs(record.birthday) : undefined,
      idCardFront: record.idCardFront ? [{ uid: '-1', name: 'front.jpg', status: 'done', url: record.idCardFront }] : [],
      idCardBack: record.idCardBack ? [{ uid: '-1', name: 'back.jpg', status: 'done', url: record.idCardBack }] : [],
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await deletePatient(id);
      if (res && res.code === 200) {
        message.success('删除成功');
        fetchPatients();
      } else {
        message.error(res.message || '删除失败');
      }
    } catch (error) {
      console.error(error);
      message.error('删除失败');
    }
  };

  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      render: (gender: number) => gender === 1 ? '男' : '女',
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '身份证号',
      dataIndex: 'idCard',
      key: 'idCard',
    },
    {
      title: '出生日期',
      dataIndex: 'birthday',
      key: 'birthday',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Patient) => (
        <>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>修改</Button>
          <Popconfirm title="确定删除吗?" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </>
      ),
    },
  ];

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Card 
        title={<><UserOutlined /> 就诊人管理</>} 
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => { setCurrentId(null); form.resetFields(); setIsModalOpen(true); }}>添加就诊人</Button>}
      >
        <Table 
          loading={loading}
          columns={columns} 
          dataSource={patients} 
          rowKey="id" 
          pagination={false}
          locale={{ emptyText: '暂无就诊人信息' }}
        />
      </Card>

      <Modal
        title={currentId ? "修改就诊人" : "添加就诊人"}
        open={isModalOpen}
        onCancel={() => { setIsModalOpen(false); setCurrentId(null); form.resetFields(); }}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input placeholder="请输入真实姓名" />
          </Form.Item>
          <Form.Item name="gender" label="性别" rules={[{ required: true, message: '请选择性别' }]}>
            <Select>
              <Select.Option value="1">男</Select.Option>
              <Select.Option value="2">女</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="idCard" label="身份证号" rules={[{ required: true, message: '请输入身份证号' }]}>
            <Input placeholder="请输入18位身份证号" />
          </Form.Item>
          <Form.Item name="idCardFront" label="身份证正面" valuePropName="fileList" getValueFromEvent={normFile}>
            <Upload listType="picture-card" maxCount={1} customRequest={customRequest}>
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>上传正面</div>
              </div>
            </Upload>
          </Form.Item>
          <Form.Item name="idCardBack" label="身份证背面" valuePropName="fileList" getValueFromEvent={normFile}>
            <Upload listType="picture-card" maxCount={1} customRequest={customRequest}>
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>上传背面</div>
              </div>
            </Upload>
          </Form.Item>
          <Form.Item name="phone" label="手机号" rules={[{ required: true, message: '请输入手机号' }]}>
            <Input placeholder="请输入手机号" />
          </Form.Item>
          <Form.Item name="birthday" label="出生日期">
            <DatePicker className="w-full" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PatientList;
