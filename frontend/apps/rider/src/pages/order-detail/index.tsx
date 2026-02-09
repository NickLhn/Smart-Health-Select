import React, { useState, useEffect } from 'react'
import { View, Text, Button, Image, Input } from '@tarojs/components'
import { Map as RiderMap } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import request, { getApiBaseUrl } from '../../services/request'
import './index.scss'

declare global {
  interface Window {
    AMap: any;
  }
}

const OrderDetail: React.FC = () => {
  const router = useRouter()
  const { id } = router.params
  const [info, setInfo] = useState<any>(null)
  const [proofImage, setProofImage] = useState('')
  const [mapInstance, setMapInstance] = useState<any>(null)
  const [mapError, setMapError] = useState<string>('')
  const [targetLngLat, setTargetLngLat] = useState<{lng: number, lat: number} | null>(null)
  const [statusBarHeight, setStatusBarHeight] = useState(0)

  useEffect(() => {
    const info = Taro.getSystemInfoSync()
    setStatusBarHeight(info.statusBarHeight || 0)
  }, [])

  useEffect(() => {
    if (id) {
      fetchDetail(id)
    }
  }, [id])

  useEffect(() => {
    // Init map only when info is loaded and status is delivering (1)
    if (info && info.status === 1 && !mapInstance) {
       // H5 Map Initialization
       if (process.env.TARO_ENV === 'h5') {
           if (!window.AMap) {
               console.warn('AMap not loaded yet, retrying...');
               const timer = setTimeout(() => {
                   if (!window.AMap) {
                       setMapError('地图加载失败，请检查网络或Key配置');
                   }
               }, 3000);
               setTimeout(() => setInfo({...info}), 500);
               return () => clearTimeout(timer);
           }
    
           setTimeout(() => {
               const container = document.getElementById('amap-container');
               if (!container) return;
    
               try {
                   const map = new window.AMap.Map('amap-container', {
                      zoom: 14,
                      center: [116.397428, 39.90923],
                      viewMode: '2D',
                   });
                   
                   map.on('error', (e: any) => {
                       console.error('Map internal error:', e);
                       setMapError('地图加载异常');
                   });
                   
                   setTimeout(() => { map.resize(); }, 200);
                   setMapInstance(map);
            
                   window.AMap.plugin(['AMap.Geocoder', 'AMap.Driving', 'AMap.Marker', 'AMap.ToolBar'], function() {
                      try {
                          map.addControl(new window.AMap.ToolBar());
                          var geocoder = new window.AMap.Geocoder({});
                          
                          if (info.receiverAddress) {
                              geocoder.getLocation(info.receiverAddress, function(status: string, result: any) {
                                  if (status === 'complete' && result.geocodes.length) {
                                      var lnglat = result.geocodes[0].location
                                       setTargetLngLat({ lng: lnglat.lng, lat: lnglat.lat })
                                       
                                      var marker = new window.AMap.Marker({
                                          position: lnglat,
                                          title: '终点'
                                      });
                                      map.add(marker);
                                      map.setFitView();
                                      
                                      var driving = new window.AMap.Driving({ map: map }); 
                                  }
                              });
                          }
                      } catch(e) { console.error('Plugin init error', e); }
                   });
               } catch (e) {
                   console.error('Map init error:', e);
                   setMapError('地图初始化失败');
               }
           }, 200);
       } else {
            if (info.receiverAddress && !targetLngLat) {
                const key = '44bb291fa15e965c72a710f23b18c49c';
                Taro.request({
                    url: 'https://restapi.amap.com/v3/geocode/geo',
                   data: { address: info.receiverAddress, key: key },
                   success: (res) => {
                       if (res.data.status === '1' && res.data.geocodes && res.data.geocodes.length > 0) {
                           const location = res.data.geocodes[0].location;
                           const [lng, lat] = location.split(',').map(Number);
                           setTargetLngLat({ lng, lat });
                       } else {
                           if (res.data.status === '0') setMapError(`地图解析失败: ${res.data.info}`);
                       }
                   },
                   fail: (err) => { setMapError('网络请求失败'); }
               });
           }
       }
    }
  }, [info, mapInstance])

  const fetchDetail = async (orderId: string) => {
    let res = await request.get('/delivery/pending/list', { page: 1, size: 100 })
    let found = res.data?.records?.find((item: any) => item.id == orderId)
    
    if (!found) {
      res = await request.get('/delivery/my/list', { page: 1, size: 100 })
      found = res.data?.records?.find((item: any) => item.id == orderId)
    }

    if (found) {
      setInfo(found)
      if (found.proofImage) {
        setProofImage(found.proofImage)
      }
    }
  }

  const handleAction = async () => {
    if (!info) return
    
    if (info.status === 0) {
      const res = await request.post(`/delivery/${info.id}/accept`)
      if (res.code === 200) {
        Taro.showToast({ title: '抢单成功', icon: 'success' })
        setTimeout(() => Taro.navigateBack(), 1500)
      }
    } else if (info.status === 1) {
      if (!proofImage) {
        Taro.showToast({ title: '请上传送达凭证', icon: 'none' })
        return
      }
      const res = await request.post(`/delivery/${info.id}/complete?proofImage=${encodeURIComponent(proofImage)}`)
      if (res.code === 200) {
        Taro.showToast({ title: '已送达', icon: 'success' })
        setTimeout(() => Taro.navigateBack(), 1500)
      } else {
        Taro.showToast({ title: res.msg || '操作失败', icon: 'none' })
      }
    }
  }
  
  const handleNavigate = (type: 'shop' | 'receiver') => {
      const destName = type === 'shop' ? info.shopAddress : info.receiverAddress
      
      if (process.env.TARO_ENV === 'h5') {
          if (!destName) {
              Taro.showToast({ title: '无法获取目的地', icon: 'none' })
              return
          }
          const url = `https://uri.amap.com/navigation?to=,,${destName}&mode=ride&policy=1&src=zhijian&callnative=1`
          window.location.href = url
      } else {
          const key = 'e43c92dca357b9d01d0183da81ea9af8';
          Taro.showLoading({ title: '准备导航...' });
          
          const performNavigation = (city?: string, isRetry = false) => {
              Taro.request({
                  url: 'https://restapi.amap.com/v3/place/text',
                  data: {
                      keywords: destName,
                      key: key,
                      city: city,
                      citylimit: !!city && !isRetry,
                      offset: 1,
                      page: 1,
                      extensions: 'base'
                  },
                  success: (res) => {
                      if (res.data.status === '1' && res.data.pois && res.data.pois.length > 0) {
                           Taro.hideLoading();
                           const poi = res.data.pois[0];
                           const location = poi.location;
                           const [lng, lat] = location.split(',').map(Number);
                           
                           Taro.openLocation({
                               latitude: lat,
                               longitude: lng,
                               name: poi.name,
                               address: poi.address
                           })
                       } else {
                           if (!isRetry && city) {
                               performNavigation(undefined, true);
                               return;
                           }

                           Taro.hideLoading();
                           Taro.showModal({
                               title: '导航提示',
                               content: `系统无法找到: ${destName}\n建议手动复制地址在地图中搜索。`,
                               showCancel: false,
                               confirmText: '复制地址',
                               success: (modalRes) => {
                                   if (modalRes.confirm) {
                                       Taro.setClipboardData({
                                           data: destName,
                                           success: () => {
                                               Taro.showToast({ title: '地址已复制', icon: 'success' })
                                           }
                                       })
                                   }
                               }
                           })
                       }
                  },
                  fail: () => {
                      Taro.hideLoading();
                      Taro.showToast({ title: '网络请求失败', icon: 'none' });
                  }
              });
          };

          Taro.getLocation({
              type: 'gcj02',
              success: (res) => {
                  const { latitude, longitude } = res;
                  Taro.request({
                      url: 'https://restapi.amap.com/v3/geocode/regeo',
                      data: {
                          location: `${longitude},${latitude}`,
                          key: key,
                          extensions: 'base'
                      },
                      success: (regeoRes) => {
                          let city = '';
                          if (regeoRes.data.status === '1' && regeoRes.data.regeocode) {
                              const addressComponent = regeoRes.data.regeocode.addressComponent;
                              city = (typeof addressComponent.city === 'string' && addressComponent.city) ? addressComponent.city : addressComponent.province;
                          }
                          performNavigation(city);
                      },
                      fail: () => {
                          performNavigation();
                      }
                  });
              },
              fail: () => {
                  performNavigation();
              }
          });
      }
  }

  const handleReportException = () => {
      Taro.showModal({
          title: '异常上报',
          editable: true,
          placeholderText: '请输入异常原因',
          success: async (res) => {
              if (res.confirm && res.content) {
                  const apiRes = await request.post(`/delivery/${info.id}/exception?reason=${res.content}`);
                  if (apiRes.code === 200) {
                      Taro.showToast({ title: '上报成功', icon: 'success' });
                  } else {
                      Taro.showToast({ title: apiRes.msg || '上报失败', icon: 'none' });
                  }
              }
          }
      })
  }

  const handleUpload = () => {
    Taro.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0]
        Taro.showLoading({ title: '上传中...' })
        
        const uploadUrl = `${getApiBaseUrl()}/file/upload`
        
        Taro.uploadFile({
          url: uploadUrl, 
          filePath: tempFilePath,
          name: 'file',
          header: {
            'Authorization': `Bearer ${Taro.getStorageSync('token')}`
          },
          success: (uploadRes) => {
            Taro.hideLoading()
            try {
              const data = JSON.parse(uploadRes.data)
              if (data.code === 200) {
                setProofImage(data.data)
                Taro.showToast({ title: '上传成功', icon: 'success' })
              } else {
                Taro.showToast({ title: data.msg || '上传失败', icon: 'none' })
              }
            } catch (e) {
              Taro.showToast({ title: '上传异常', icon: 'none' })
            }
          },
          fail: () => {
            Taro.hideLoading()
            Taro.showToast({ title: '网络错误', icon: 'none' })
          }
        })
      }
    })
  }
  
  if (!info) return <View className='detail-container loading'><Text>加载中...</Text></View>

  return (
    <View className='detail-container'>
       {/* Custom Navigation Bar */}
       <View className='nav-header' style={{
           position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
           height: '44px', background: '#fff', display: 'flex', alignItems: 'center', padding: '0 10px',
           paddingTop: `${statusBarHeight}px`,
           boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
           boxSizing: 'content-box'
       }}>
           <View className='back-btn' onClick={() => {
               const pages = Taro.getCurrentPages()
               if (pages.length > 1) {
                   Taro.navigateBack()
               } else {
                   Taro.reLaunch({ url: '/pages/index/index' })
               }
           }} style={{ padding: '10px' }}>
               <Text style={{ fontSize: '20px', color: '#111827', fontFamily: 'monospace', fontWeight: 'bold' }}>{'<'}</Text>
           </View>
           <Text style={{ fontSize: '16px', fontWeight: '800', flex: 1, textAlign: 'center', marginRight: '40px', color: '#111827', letterSpacing: '1px' }}>
               订单号 #{info.orderId || info.id}
           </Text>
       </View>

       {info.status === 1 && (
           <View className="map-container" style={{ marginTop: `${44 + statusBarHeight}px` }}>
               {process.env.TARO_ENV === 'h5' ? (
                   <View id="amap-container" style={{ width: '100%', height: '100%' }}></View>
               ) : (
                   <RiderMap
                        id="map"
                        longitude={targetLngLat?.lng || 116.397428}
                        latitude={targetLngLat?.lat || 39.90923}
                        scale={14}
                        markers={targetLngLat ? [{
                            id: 1,
                            longitude: targetLngLat.lng,
                            latitude: targetLngLat.lat,
                            title: '终点',
                            width: 30,
                            height: 30
                        }] : []}
                        style={{ width: '100%', height: '100%' }}
                   />
               )}
               {mapError && (
                   <View className='map-error' style={{
                       position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                       background: 'rgba(15, 23, 42, 0.96)', color: '#e5e7eb', zIndex: 10,
                       display: 'flex', alignItems: 'center', justifyContent: 'center'
                   }}>
                       <Text>{mapError}</Text>
                   </View>
               )}
           </View>
       )}
       
       <View className='content-body' style={info.status !== 1 ? { paddingTop: `${54 + statusBarHeight}px` } : {}}>
         {/* Status Card */}
         <View className='card status-card'>
             <View className='header'>
                <View>
                    <Text className='label'>状态</Text>
                    <Text className='status'>
                        {info.status === 0 ? '待接单' : info.status === 1 ? '配送中' : '已完成'}
                    </Text>
                </View>
                <View className='price-box'>
                    <Text className='currency'>¥</Text>
                    <Text className='amount'>{info.deliveryFee}</Text>
                </View>
             </View>
             <View className='meta-info'>
                {info.isUrgent === 1 && <Text className='tag'>加急</Text>}
                <Text className='tag'>#{info.orderId}</Text>
             </View>
         </View>

         {/* Route Card */}
         <View className='card route-card'>
            <View className='address-section'>
                <View className='location-item pickup'>
                    <View className='icon-box'><Text>取</Text></View>
                    <View className='info'>
                        <Text className='name'>{info.shopName}</Text>
                        <Text className='address'>{info.shopAddress}</Text>
                    </View>
                    {info.status === 1 && (
                        <View className='action-btn' onClick={() => handleNavigate('shop')}>
                            <Text>🧭</Text>
                        </View>
                    )}
                </View>
                
                <View className='location-item deliver'>
                    <View className='icon-box'><Text>送</Text></View>
                    <View className='info'>
                        <Text className='name'>{info.receiverName}</Text>
                        <Text className='address'>{info.receiverAddress}</Text>
                    </View>
                    {info.status === 1 && (
                        <View className='actions' style={{display:'flex'}}>
                             <View className='action-btn' onClick={() => Taro.makePhoneCall({ phoneNumber: info.receiverPhone })}>
                                <Text>📞</Text>
                             </View>
                             <View className='action-btn' onClick={() => handleNavigate('receiver')}>
                                <Text>🧭</Text>
                             </View>
                        </View>
                    )}
                </View>
            </View>
         </View>

         {/* Proof Card */}
         {info.status === 1 && (
             <View className='card proof-card'>
                <Text className='section-title'>送达凭证</Text>
                <View className='upload-area' onClick={handleUpload}>
                    {proofImage ? (
                        <Image src={proofImage} mode='aspectFill' className='preview' />
                    ) : (
                        <View className='placeholder'>
                            <Text className='icon'>📷</Text>
                            <Text className='text'>点击上传</Text>
                        </View>
                    )}
                </View>
             </View>
         )}
       </View>

       {/* Footer Action */}
       <View className='footer-action'>
            {info.status === 1 ? (
                 <>
                    <Button className='btn-main secondary' onClick={handleReportException}>异常上报</Button>
                    <Button className={`btn-main ${proofImage ? 'success' : 'disabled'}`} onClick={handleAction}>
                        确认送达
                    </Button>
                 </>
            ) : info.status === 0 ? (
                 <Button className='btn-main' onClick={handleAction}>
                    立即抢单
                 </Button>
            ) : (
                 <Button className='btn-main disabled'>已完成</Button>
            )}
       </View>
    </View>
  )
}

export default OrderDetail