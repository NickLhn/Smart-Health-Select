import React, { useState, useEffect } from 'react';
import { Radio, Button, Steps, Divider, Empty, Upload, App as AntdApp } from 'antd';
import { CheckCircleOutlined, EnvironmentOutlined, PayCircleOutlined, UserOutlined, PlusOutlined, UploadOutlined, ShoppingOutlined, WalletOutlined } from '@ant-design/icons';
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
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white/80 backdrop-blur-xl p-12 rounded-3xl shadow-xl shadow-emerald-900/5 border border-white/60 text-center animate-fade-in">
          <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircleOutlined style={{ fontSize: 48 }} className="text-emerald-500" />
          </div>
          <h2 className="text-3xl font-bold mb-4 text-gray-800">订单支付成功</h2>
          <p className="text-gray-500 mb-10 text-lg">我们将尽快为您发货，请保持电话畅通。</p>
          <div className="flex justify-center gap-6">
            <Button size="large" onClick={() => navigate('/')} className="rounded-xl px-8 h-12">返回首页</Button>
            <Button type="primary" size="large" onClick={() => navigate('/order/list')} className="rounded-xl px-8 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 border-none shadow-lg shadow-emerald-500/20">查看订单</Button>
          </div>
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
    <div className="min-h-screen bg-gray-50/50 pb-20 pt-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 max-w-3xl mx-auto">
            <Steps
                current={currentStep}
                items={[
                { title: '确认订单' },
                { title: '在线支付' },
                { title: '完成' },
                ]}
                className="site-navigation-steps"
            />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Order Info */}
          <div className="lg:col-span-2 space-y-6">
            {currentStep === 0 && (
               <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                 <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                    <EnvironmentOutlined className="text-emerald-500 text-lg" />
                    <h3 className="text-lg font-bold text-gray-800 m-0">收货地址</h3>
                 </div>
                 <div className="p-6">
                   {addresses.length > 0 ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {addresses.map(addr => (
                         <div 
                           key={addr.id}
                           className={`p-5 border-2 rounded-2xl cursor-pointer relative transition-all duration-200 ${selectedAddressId === addr.id ? 'border-emerald-500 bg-emerald-50/30' : 'border-gray-100 hover:border-emerald-200 hover:shadow-md'}`}
                           onClick={() => setSelectedAddressId(addr.id)}
                         >
                           <div className="font-bold mb-2 text-gray-800 text-lg">{addr.receiverName} <span className="font-normal text-gray-500 ml-2 text-base">{addr.receiverPhone}</span></div>
                           <div className="text-sm text-gray-600 leading-relaxed">{addr.province} {addr.city} {addr.region} <br/>{addr.detailAddress}</div>
                           {addr.isDefault === 1 && (
                             <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs px-2 py-1 rounded-bl-xl font-medium">默认</div>
                           )}
                           {selectedAddressId === addr.id && (
                             <div className="absolute bottom-3 right-3 text-emerald-500">
                               <CheckCircleOutlined className="text-xl" />
                             </div>
                           )}
                         </div>
                       ))}
                     </div>
                   ) : (
                     <Empty description="暂无收货地址" />
                   )}
                   <Button type="dashed" icon={<PlusOutlined />} className="mt-4 w-full h-12 rounded-xl border-emerald-200 text-emerald-600 hover:text-emerald-700 hover:border-emerald-400" onClick={() => navigate('/profile')}>管理地址</Button>
                 </div>
               </div>
            )}

            {currentStep === 0 && (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                   <UserOutlined className="text-emerald-500 text-lg" />
                   <h3 className="text-lg font-bold text-gray-800 m-0">就诊人信息</h3>
                   <span className="text-xs text-gray-400 font-normal bg-gray-100 px-2 py-0.5 rounded-full">购买处方药必填</span>
                </div>
                <div className="p-6">
                  {patients.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {patients.map(patient => (
                        <div 
                          key={patient.id}
                          className={`p-5 border-2 rounded-2xl cursor-pointer relative transition-all duration-200 ${selectedPatientId === patient.id ? 'border-emerald-500 bg-emerald-50/30' : 'border-gray-100 hover:border-emerald-200 hover:shadow-md'}`}
                          onClick={() => setSelectedPatientId(patient.id)}
                        >
                          <div className="font-bold mb-2 text-gray-800 text-lg">{patient.name} <span className="font-normal text-gray-500 ml-2 text-base">{patient.gender === 1 ? '男' : '女'} {patient.birthday}</span></div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div>身份证: {patient.idCard}</div>
                            <div>手机号: {patient.phone}</div>
                          </div>
                          {patient.isDefault === 1 && (
                            <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs px-2 py-1 rounded-bl-xl font-medium">默认</div>
                          )}
                          {selectedPatientId === patient.id && (
                             <div className="absolute bottom-3 right-3 text-emerald-500">
                               <CheckCircleOutlined className="text-xl" />
                             </div>
                           )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Empty description="暂无就诊人信息" />
                  )}
                   <Button type="dashed" icon={<PlusOutlined />} className="mt-4 w-full h-12 rounded-xl border-emerald-200 text-emerald-600 hover:text-emerald-700 hover:border-emerald-400" onClick={() => navigate('/profile/patient')}>管理就诊人</Button>
                </div>
              </div>
            )}

            {currentStep === 0 && (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                   <UploadOutlined className="text-emerald-500 text-lg" />
                   <h3 className="text-lg font-bold text-gray-800 m-0">上传处方</h3>
                   <span className="text-xs text-gray-400 font-normal bg-gray-100 px-2 py-0.5 rounded-full">购买处方药必填</span>
                </div>
                <div className="p-6">
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
                    className="upload-list-inline"
                  >
                    {fileList.length < 1 && (
                       <div className="flex flex-col items-center justify-center text-gray-400 hover:text-emerald-500 transition-colors">
                         <PlusOutlined className="text-2xl mb-2" />
                         <div className="text-sm">上传处方图片</div>
                       </div>
                    )}
                  </Upload>
                </div>
              </div>
            )}

            {currentStep === 0 && (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                 <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                    <WalletOutlined className="text-emerald-500 text-lg" />
                    <h3 className="text-lg font-bold text-gray-800 m-0">优惠券</h3>
                 </div>
                 <div className="p-6">
                   {cartItems.length > 1 && (
                     <div className="mb-4 text-amber-600 bg-amber-50 px-4 py-2 rounded-lg text-sm border border-amber-100 inline-block">
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
                               <div key={coupon.id} className={`border-2 rounded-2xl p-4 flex items-center justify-between transition-all ${!isApplicable ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'cursor-pointer hover:border-emerald-200 hover:shadow-md'} ${selectedCouponId === coupon.id ? 'border-emerald-500 bg-emerald-50/30' : 'border-gray-100'}`}>
                                 <Radio value={coupon.id} disabled={!isApplicable} className="w-full">
                                    <div className="flex justify-between w-full pl-2">
                                       <div>
                                         <div className="font-bold text-emerald-600 text-xl">¥{coupon.amount}</div>
                                         <div className="text-xs text-gray-500 mt-1">满 {coupon.minPoint} 可用</div>
                                       </div>
                                       <div className="text-right">
                                         <div className="font-medium text-gray-800">{coupon.name}</div>
                                         <div className="text-xs text-gray-400 mt-1">{coupon.startTime.split(' ')[0]} - {coupon.endTime.split(' ')[0]}</div>
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
                     <Button type="link" className="pl-0 mt-4 text-gray-500 hover:text-emerald-600" onClick={() => setSelectedCouponId(undefined)}>不使用优惠券</Button>
                   )}
                </div>
              </div>
            )}

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
               <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                  <ShoppingOutlined className="text-emerald-500 text-lg" />
                  <h3 className="text-lg font-bold text-gray-800 m-0">商品清单</h3>
               </div>
              <div className="p-6">
                {/* If step 0, show from cartItems. If step 1, show submitted items. */}
                {(currentStep === 0 ? cartItems : (currentStep === 1 ? submittedItems : [])).map(item => (
                  <div key={item.id} className="flex justify-between items-center py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors rounded-xl px-2">
                    <div className="flex items-center gap-4">
                       <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                         {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
                       </div>
                       <div>
                         <div className="font-bold text-gray-800 text-lg">{item.name}</div>
                         <div className="text-sm text-gray-500 mt-1">数量: x {item.quantity}</div>
                       </div>
                    </div>
                    <div className="font-bold text-lg text-gray-800">¥{(item.price * item.quantity).toFixed(2)}</div>
                  </div>
                ))}
                {currentStep === 1 && (
                    <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-xl mt-4 border border-dashed border-gray-200">
                        订单已生成，请尽快完成支付
                    </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Payment & Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-lg shadow-emerald-900/5 border border-emerald-100/50 sticky top-24 overflow-hidden">
               <div className="p-6 space-y-4">
                 <h3 className="text-lg font-bold text-gray-800 mb-4">结算摘要</h3>
                 <div className="flex justify-between text-gray-600">
                   <span>商品总额</span>
                   <span>¥{displayTotalPrice.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between">
                  <span className="text-gray-600">运费</span>
                  <span className={freight === 0 ? "text-emerald-600 font-medium" : "text-gray-800"}>
                    {freight > 0 ? `¥${freight.toFixed(2)}` : '免运费'}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>优惠</span>
                   <span className="text-rose-500">-¥{discountAmount.toFixed(2)}</span>
                 </div>
                 
                 <div className="my-4 border-t border-dashed border-gray-200"></div>
                 
                 <div className="flex justify-between items-end mb-2">
                   <span className="text-lg font-bold text-gray-800">实付款</span>
                   <span className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
                     <span className="text-lg align-top pt-1 inline-block mr-0.5">¥</span>
                     {finalPrice.toFixed(2)}
                   </span>
                 </div>
               </div>

               {currentStep === 1 && (
                 <div className="px-6 pb-6 animate-fade-in">
                   <div className="mb-3 font-bold text-gray-800">支付方式</div>
                   <Radio.Group onChange={e => setPaymentMethod(e.target.value)} value={paymentMethod} className="flex flex-col gap-3 w-full">
                     <Radio value="wechat" className="flex items-center w-full border border-gray-200 p-3 rounded-xl hover:border-emerald-200 transition-colors [&.ant-radio-wrapper-checked]:border-emerald-500 [&.ant-radio-wrapper-checked]:bg-emerald-50/30">
                       <div className="flex items-center">
                          <PayCircleOutlined style={{ color: '#09BB07', fontSize: 24, marginRight: 12 }} /> 
                          <span className="font-medium">微信支付</span>
                       </div>
                     </Radio>
                     <Radio value="alipay" className="flex items-center w-full border border-gray-200 p-3 rounded-xl hover:border-emerald-200 transition-colors [&.ant-radio-wrapper-checked]:border-emerald-500 [&.ant-radio-wrapper-checked]:bg-emerald-50/30">
                       <div className="flex items-center">
                          <PayCircleOutlined style={{ color: '#1677FF', fontSize: 24, marginRight: 12 }} /> 
                          <span className="font-medium">支付宝</span>
                       </div>
                     </Radio>
                   </Radio.Group>
                 </div>
               )}

               <div className="p-6 bg-gray-50 border-t border-gray-100">
                 {currentStep === 0 && (
                    <Button 
                      type="primary" 
                      size="large" 
                      block 
                      onClick={handleCreateOrder}
                      loading={loading}
                      className="h-14 rounded-2xl text-lg font-bold bg-gradient-to-r from-emerald-500 to-teal-600 border-none shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:scale-[1.02] transition-all active:scale-95"
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
                      className="h-14 rounded-2xl text-lg font-bold bg-gradient-to-r from-emerald-500 to-teal-600 border-none shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:scale-[1.02] transition-all active:scale-95"
                    >
                      立即支付
                    </Button>
                 )}
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;