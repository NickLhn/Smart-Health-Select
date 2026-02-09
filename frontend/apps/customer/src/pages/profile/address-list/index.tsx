import React, { useEffect, useState } from 'react';
import { List, Button, Tag, Modal, Form, Input, Checkbox, Space, Popconfirm, Empty, App } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getAddressList, addAddress, updateAddress, deleteAddress, setDefaultAddress } from '@/services/address';
import type { UserAddress } from '@/services/address';

const AddressList: React.FC = () => {
  const { message } = App.useApp();
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingRecord, setEditingRecord] = useState<UserAddress | null>(null);
  const [form] = Form.useForm();

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const res = await getAddressList();
      if (res && res.data) {
        setAddresses(res.data);
      }
    } catch (error) {
      console.error(error);
      // message.error('获取地址列表失败'); // Fail silently or show error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  useEffect(() => {
    if (modalVisible) {
      if (editingRecord) {
        form.setFieldsValue({
          ...editingRecord,
          isDefault: editingRecord.isDefault === 1,
        });
      } else {
        form.resetFields();
      }
    }
  }, [modalVisible, editingRecord, form]);

  const handleAdd = () => {
    setEditingId(null);
    setEditingRecord(null);
    setModalVisible(true);
  };

  const handleEdit = (record: UserAddress) => {
    setEditingId(record.id);
    setEditingRecord(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteAddress(id);
      message.success('删除成功');
      fetchAddresses();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await setDefaultAddress(id);
      message.success('设置成功');
      fetchAddresses();
    } catch (error) {
      message.error('设置失败');
    }
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        isDefault: values.isDefault ? 1 : 0,
      };

      if (editingId) {
        await updateAddress({ ...payload, id: editingId });
        message.success('更新成功');
      } else {
        await addAddress(payload);
        message.success('添加成功');
      }
      setModalVisible(false);
      fetchAddresses();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-800">收货地址</h3>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={handleAdd}
          className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 border-none shadow-md shadow-emerald-500/20 hover:shadow-lg hover:scale-105 transition-all"
        >
          添加新地址
        </Button>
      </div>

      <List
        loading={loading}
        dataSource={addresses}
        locale={{ emptyText: <Empty description="暂无收货地址" /> }}
        renderItem={(item) => (
          <div className="glass-panel !bg-white/40 border border-white/60 rounded-2xl p-5 mb-4 flex justify-between items-start hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
            {item.isDefault === 1 && (
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-emerald-400 to-teal-500"></div>
            )}
            <div className="flex-1 pl-2">
              <div className="flex items-center gap-3 mb-2">
                <span className="font-bold text-lg text-gray-800">{item.receiverName}</span>
                <span className="text-gray-500 font-din text-base">{item.receiverPhone}</span>
                {item.isDefault === 1 && <Tag className="border-none bg-emerald-100 text-emerald-700 font-bold rounded-full px-2">默认</Tag>}
              </div>
              <div className="text-gray-600 leading-relaxed pr-4">
                {item.province} {item.city} {item.region} {item.detailAddress}
              </div>
            </div>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {item.isDefault === 0 && (
                <Button type="link" size="small" className="text-emerald-600 hover:text-emerald-700" onClick={() => handleSetDefault(item.id)}>
                  设为默认
                </Button>
              )}
              <Button type="text" className="text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-full" icon={<EditOutlined />} onClick={() => handleEdit(item)} />
              <Popconfirm title="确定删除吗？" onConfirm={() => handleDelete(item.id)}>
                <Button type="text" danger className="hover:bg-red-50 rounded-full" icon={<DeleteOutlined />} />
              </Popconfirm>
            </div>
          </div>
        )}
      />

      <Modal
        title={editingId ? '编辑地址' : '添加地址'}
        open={modalVisible}
        onOk={handleOk}
        onCancel={() => setModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="receiverName" label="收货人" rules={[{ required: true, message: '请输入收货人姓名' }]}>
            <Input placeholder="请输入收货人姓名" />
          </Form.Item>
          <Form.Item name="receiverPhone" label="手机号码" rules={[{ required: true, message: '请输入手机号码' }]}>
            <Input placeholder="请输入手机号码" />
          </Form.Item>
          <Form.Item label="所在地区" required style={{ marginBottom: 0 }}>
             <Space.Compact block>
                <Form.Item name="province" rules={[{ required: true, message: '省份' }]} noStyle>
                  <Input placeholder="省" style={{ width: '33%' }} />
                </Form.Item>
                <Form.Item name="city" rules={[{ required: true, message: '城市' }]} noStyle>
                  <Input placeholder="市" style={{ width: '33%' }} />
                </Form.Item>
                <Form.Item name="region" rules={[{ required: true, message: '区/县' }]} noStyle>
                  <Input placeholder="区/县" style={{ width: '34%' }} />
                </Form.Item>
             </Space.Compact>
          </Form.Item>
          <Form.Item name="detailAddress" label="详细地址" rules={[{ required: true, message: '请输入详细地址' }]}>
            <Input.TextArea placeholder="请输入详细地址，如街道、门牌号等" rows={2} />
          </Form.Item>
          <Form.Item name="isDefault" valuePropName="checked">
            <Checkbox>设为默认地址</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AddressList;
