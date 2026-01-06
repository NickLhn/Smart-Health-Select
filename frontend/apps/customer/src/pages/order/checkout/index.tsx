import React, { useState, useEffect } from 'react';
import { Card, Radio, Button, Steps, Divider, Empty, Upload, App as AntdApp } from 'antd';
import { CheckCircleOutlined, EnvironmentOutlined, PayCircleOutlined, UserOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { useCart } from '../../../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { getAddressList } from '../../../services/address';
import type { UserAddress } from '../../../services/address';
import { getPatientList } from '../../../services/patient';
import type { Patient } from '../../../services/patient';
import { getMyCoupons } from '../../../services/coupon';
import type { UserCoupon } from '../../../services/coupon';
import { createOrderFromCart, payOrder, calculateFreight } from '../../../services/order';
import { uploadFile } from '../../../services/file';

const Checkout: React.FC = () => {
  const { cartItems, totalPrice, refreshCart } = useCart();
  const navigate = useNavigate();
  const { message } = AntdApp.useApp();
  const [currentStep, setCurrentStep] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('wechat');
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number>();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<number>();
  const [coupons, setCoupons] = useState<UserCoupon[]>([]);
  const [selectedCouponId, setSelectedCouponId] = useState<number>();
  const [freight, setFreight] = useState(0);
  const [loading, setLoading] = useState(false);
  const [orderIds, setOrderIds] = useState<number[]>([]);
  const [prescriptionImage, setPrescriptionImage] = useState<string>();
  const [fileList, setFileList] = useState<any[]>([]);
  const [submittedItems, setSubmittedItems] = useState<any[]>([]);

  useEffect(() => {
    getAddressList().then(res => {
      if (res.data) {
        setAddresses(res.data);
        const defaultAddr = res.data.find(a => a.isDefault === 1) || res.data[0];
        if (defaultAddr) setSelectedAddressId(defaultAddr.id);
      }
    });

    getPatientList().then(res => {
      if (res.data) {
        setPatients(res.data);
        const defaultPatient = res.data.find(p => p.isDefault === 1) || res.data[0];
        if (defaultPatient) setSelectedPatientId(defaultPatient.id);
      }
    });

    getMyCoupons(0).then(res => { // 0 for unused
      if (res.data) {
        setCoupons(res.data);
      }
    });
  }, []);

  useEffect(() => {
    if (cartItems.length > 0 && selectedAddressId) {
      calculateFreight({
        cartItemIds: cartItems.map(item => item.id),
        addressId: selectedAddressId
      }).then(res => {
        if (res.code === 200 && res.data !== undefined) {
          setFreight(res.data);
        }
      });
    }
  }, [cartItems, selectedAddressId]);

  useEffect(() => {
    if (cartItems.length === 0 && currentStep === 0) {
      navigate('/cart');
    }
  }, [cartItems, currentStep, navigate]);

  if (cartItems.length === 0 && currentStep === 0) {
    return null;
  }


  const handleUploadChange = ({ fileList: newFileList }: any) => {
    setFileList(newFileList);
    if (newFileList.length > 0 && newFileList[0].status === 'done') {
      const response = newFileList[0].response;
      if (response?.code === 200) {
         setPrescriptionImage(response.data);
         message.success('处方上传成功');
      }
    } else if (newFileList.length === 0) {
      setPrescriptionImage(undefined);
    }
  };

  const handleCreateOrder = async () => {
    if (!selectedAddressId) {
      message.error('请选择收货地址');
      return;
    }
    setLoading(true);
    try {
      if (cartItems.length === 0) {
        message.error('购物车为空');
        return;
      }

      // Create Order
      const res = await createOrderFromCart({
        cartItemIds: cartItems.map(item => item.id),
        addressId: selectedAddressId,
        patientId: selectedPatientId,
        prescriptionImage: prescriptionImage,
        userCouponId: selectedCouponId
      });

      if (res.code === 200) {
        setOrderIds(res.data);
        setSubmittedItems(cartItems); // Save items for display
        setCurrentStep(1);
        await refreshCart(); // Backend clears items, just refresh local state
        message.success('订单创建成功');
      } else {
        message.error(res.message || '订单创建失败');
      }
    } catch (error) {
      console.error(error);
      message.error('订单创建失败');
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    setLoading(true);
    try {
      // Pay all orders
      let successCount = 0;
      for (const id of orderIds) {
        const res = await payOrder(id);
        if (res.code === 200) successCount++;
      }
      
      if (successCount === orderIds.length) {
        message.success('支付成功');
        setCurrentStep(2);
      } else {
        message.warning(`部分订单支付失败 (${successCount}/${orderIds.length})`);
        // If at least one success, maybe go to success page?
        // Or stay here.
        if (successCount > 0) setCurrentStep(2);
      }
    } catch (error) {
      console.error(error);
      message.error('支付失败');
    } finally {
      setLoading(false);
    }
  };

  if (currentStep === 2) {
    return (
      <div className="max-w-2xl mx-auto bg-white p-12 rounded-lg shadow-sm text-center">
        <CheckCircleOutlined style={{ fontSize: 72, color: '#52c41a' }} className="mb-6" />
        <h2 className="text-2xl font-bold mb-2">订单支付成功</h2>
        <p className="text-gray-500 mb-8">我们将尽快为您发货，请保持电话畅通。</p>
        <div className="flex justify-center gap-4">
          <Button onClick={() => navigate('/')}>返回首页</Button>
          <Button type="primary" onClick={() => navigate('/order/list')}>查看订单</Button>
        </div>
      </div>
    );
  }

  const selectedAddress = addresses.find(a => a.id === selectedAddressId);
  const selectedCoupon = coupons.find(c => c.id === selectedCouponId);
  const discountAmount = selectedCoupon ? selectedCoupon.amount : 0;
  
  const displayItems = currentStep === 0 ? cartItems : submittedItems;
  const displayTotalPrice = displayItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  const finalPrice = Math.max(0, displayTotalPrice + freight - discountAmount);

  return (
    <div className="max-w-4xl mx-auto">
      <Steps
        current={currentStep}
        items={[
          { title: '确认订单' },
          { title: '在线支付' },
          { title: '完成' },
        ]}
        className="mb-8"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Order Info */}
        <div className="md:col-span-2 space-y-6">
          {currentStep === 0 && (
             <Card title={<><EnvironmentOutlined /> 收货地址</>} variant="borderless">
               {addresses.length > 0 ? (
                 <div className="space-y-4">
                   {addresses.map(addr => (
                     <div 
                       key={addr.id}
                       className={`p-4 border rounded cursor-pointer relative ${selectedAddressId === addr.id ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300'}`}
                       onClick={() => setSelectedAddressId(addr.id)}
                     >
                       <div className="font-bold mb-1">{addr.receiverName} <span className="font-normal text-gray-500 ml-2">{addr.receiverPhone}</span></div>
                       <div className="text-sm text-gray-600">{addr.province} {addr.city} {addr.region} {addr.detailAddress}</div>
                       {addr.isDefault === 1 && (
                         <div className="absolute top-0 right-0 bg-green-500 text-white text-xs px-2 py-1 rounded-bl">默认</div>
                       )}
                     </div>
                   ))}
                 </div>
               ) : (
                 <Empty description="暂无收货地址" />
               )}
               <Button type="link" className="pl-0 mt-2" onClick={() => navigate('/profile')}>管理地址</Button>
             </Card>
          )}

          {currentStep === 0 && (
            <Card title={<><UserOutlined /> 就诊人信息 <span className="text-xs text-gray-400 font-normal ml-2">(购买处方药必填)</span></>} variant="borderless">
              {patients.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {patients.map(patient => (
                    <div 
                      key={patient.id}
                      className={`p-4 border rounded cursor-pointer relative ${selectedPatientId === patient.id ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300'}`}
                      onClick={() => setSelectedPatientId(patient.id)}
                    >
                      <div className="font-bold mb-1">{patient.name} <span className="font-normal text-gray-500 ml-2">{patient.gender === 1 ? '男' : '女'} {patient.birthday}</span></div>
                      <div className="text-sm text-gray-600">身份证: {patient.idCard}</div>
                      <div className="text-sm text-gray-600">手机号: {patient.phone}</div>
                      {patient.isDefault === 1 && (
                        <div className="absolute top-0 right-0 bg-green-500 text-white text-xs px-2 py-1 rounded-bl">默认</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <Empty description="暂无就诊人信息" />
              )}
               <Button type="link" className="pl-0 mt-2" onClick={() => navigate('/profile/patient')}>管理就诊人</Button>
            </Card>
          )}

          {currentStep === 0 && (
            <Card title={<><UploadOutlined /> 上传处方 <span className="text-xs text-gray-400 font-normal ml-2">(购买处方药必填)</span></>} variant="borderless">
               <Upload
                customRequest={async (options) => {
                  const { file, onSuccess, onError } = options;
                  try {
                    const res = await uploadFile(file as File);
                    if (res.code === 200) {
                        onSuccess?.({ code: 200, data: res.data });
                    } else {
                        onError?.(new Error(res.message));
                        message.error(res.message || '上传失败');
                    }
                  } catch (err) {
                    onError?.(err as Error);
                    message.error('上传失败');
                  }
                }}
                listType="picture-card"
                fileList={fileList}
                onChange={handleUploadChange}
                maxCount={1}
              >
                {fileList.length < 1 && (
                   <div>
                     <PlusOutlined />
                     <div style={{ marginTop: 8 }}>上传处方</div>
                   </div>
                )}
              </Upload>
            </Card>
          )}

          {currentStep === 0 && (
            <Card title={<><PayCircleOutlined /> 优惠券</>} variant="borderless">
               {cartItems.length > 1 && (
                 <div className="mb-2 text-amber-500 text-sm">
                   注：多商品合并下单暂不支持使用优惠券
                 </div>
               )}
               {coupons.length > 0 ? (
                 <Radio.Group 
                    className="w-full" 
                    value={selectedCouponId} 
                    onChange={e => setSelectedCouponId(e.target.value)}
                    disabled={cartItems.length > 1}
                 >
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     {coupons.map(coupon => {
                        const isApplicable = totalPrice >= coupon.minPoint;
                        return (
                           <div key={coupon.id} className={`border rounded p-4 flex items-center justify-between ${!isApplicable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${selectedCouponId === coupon.id ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}>
                             <Radio value={coupon.id} disabled={!isApplicable} className="w-full">
                                <div className="flex justify-between w-full pl-2">
                                   <div>
                                     <div className="font-bold text-red-500 text-lg">¥{coupon.amount}</div>
                                     <div className="text-xs text-gray-500">满 {coupon.minPoint} 可用</div>
                                   </div>
                                   <div className="text-right">
                                     <div className="font-medium">{coupon.name}</div>
                                     <div className="text-xs text-gray-500">{coupon.startTime.split(' ')[0]} - {coupon.endTime.split(' ')[0]}</div>
                                   </div>
                                </div>
                             </Radio>
                           </div>
                        );
                     })}
                   </div>
                 </Radio.Group>
               ) : (
                 <Empty description="暂无可用优惠券" />
               )}
               {selectedCouponId && (
                 <Button type="link" className="pl-0 mt-2 text-gray-500" onClick={() => setSelectedCouponId(undefined)}>不使用优惠券</Button>
               )}
            </Card>
          )}

          <Card title="商品清单" variant="borderless">
            {/* If step 0, show from cartItems. If step 1, show submitted items. */}
            {(currentStep === 0 ? cartItems : (currentStep === 1 ? submittedItems : [])).map(item => (
              <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-0">
                <div className="flex items-center gap-3">
                   <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden">
                     {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
                   </div>
                   <div>
                     <div className="font-medium">{item.name}</div>
                     <div className="text-xs text-gray-500">x {item.quantity}</div>
                   </div>
                </div>
                <div className="font-bold">¥{(item.price * item.quantity).toFixed(2)}</div>
              </div>
            ))}
            {currentStep === 1 && (
                <div className="text-center py-4 text-gray-500 border-t mt-2 pt-2">
                    订单已生成，请尽快完成支付
                </div>
            )}
          </Card>
        </div>

        {/* Right: Payment & Summary */}
        <div className="md:col-span-1">
          <Card title="结算摘要" variant="borderless" className="sticky top-24">
             <div className="flex justify-between mb-2 text-gray-600">
               <span>商品总额</span>
               <span>¥{displayTotalPrice.toFixed(2)}</span>
             </div>
             <div className="flex justify-between mb-2">
              <span>运费</span>
              <span className={freight === 0 ? "text-green-600" : ""}>
                {freight > 0 ? `¥${freight.toFixed(2)}` : '免运费'}
              </span>
            </div>
            <div className="flex justify-between mb-4 text-gray-600">
              <span>优惠</span>
               <span>-¥{discountAmount.toFixed(2)}</span>
             </div>
             <Divider className="my-4" />
             <div className="flex justify-between mb-6 text-lg font-bold">
               <span>实付款</span>
               <span className="text-red-500">¥{finalPrice.toFixed(2)}</span>
             </div>

             {currentStep === 1 && (
               <div className="mb-6">
                 <div className="mb-2 font-medium">支付方式</div>
                 <Radio.Group onChange={e => setPaymentMethod(e.target.value)} value={paymentMethod} className="flex flex-col gap-2">
                   <Radio value="wechat" className="flex items-center">
                     <PayCircleOutlined style={{ color: '#09BB07', marginRight: 8 }} /> 微信支付
                   </Radio>
                   <Radio value="alipay" className="flex items-center">
                     <PayCircleOutlined style={{ color: '#1677FF', marginRight: 8 }} /> 支付宝
                   </Radio>
                 </Radio.Group>
               </div>
             )}

             {currentStep === 0 && (
                <Button 
                  type="primary" 
                  size="large" 
                  block 
                  onClick={handleCreateOrder}
                  loading={loading}
                >
                  提交订单
                </Button>
             )}
             {currentStep === 1 && (
                <Button 
                  type="primary" 
                  size="large" 
                  block 
                  onClick={handlePay}
                  loading={loading}
                >
                  立即支付
                </Button>
             )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
