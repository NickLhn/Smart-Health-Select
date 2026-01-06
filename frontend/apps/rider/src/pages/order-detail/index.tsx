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
  // const [verifyCode, setVerifyCode] = useState('')
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
           // Check if AMap is loaded
           if (!window.AMap) {
               console.warn('AMap not loaded yet, retrying...');
               // If it takes too long, set error
               const timer = setTimeout(() => {
                   if (!window.AMap) {
                       setMapError('地图加载失败，请检查网络或Key配置');
                   }
               }, 3000);
               
               setTimeout(() => setInfo({...info}), 500); // Trigger re-render to retry
               return () => clearTimeout(timer);
           }
    
           // Use a timeout to ensure DOM is rendered
           setTimeout(() => {
               const container = document.getElementById('amap-container');
               if (!container) {
                   console.error('Map container not found');
                   return;
               }
    
               try {
                   const map = new window.AMap.Map('amap-container', {
                      zoom: 14,
                      center: [116.397428, 39.90923], // Default Beijing
                      viewMode: '2D',
                   });
                   
                   map.on('complete', () => {
                       console.log('Map load complete');
                   });
                   
                   map.on('error', (e: any) => {
                       console.error('Map internal error:', e);
                       setMapError('地图加载异常');
                   });
                   
                   // Force resize
                   setTimeout(() => {
                       map.resize();
                   }, 200);
                   
                   setMapInstance(map);
            
                   // Mock geocoding
                   window.AMap.plugin(['AMap.Geocoder', 'AMap.Driving', 'AMap.Marker', 'AMap.ToolBar'], function() {
                      try {
                          map.addControl(new window.AMap.ToolBar());
                          
                          var geocoder = new window.AMap.Geocoder({});
                          
                          if (info.receiverAddress) {
                              geocoder.getLocation(info.receiverAddress, function(status: string, result: any) {
                                  if (status === 'complete' && result.geocodes.length) {
                                      var lnglat = result.geocodes[0].location
                                       setTargetLngLat({ lng: lnglat.lng, lat: lnglat.lat })
                                       
                                       // Add marker
                                      var marker = new window.AMap.Marker({
                                          position: lnglat,
                                          title: '终点'
                                      });
                                      map.add(marker);
                                      map.setFitView();
                                      
                                      // Plan route
                                      var driving = new window.AMap.Driving({
                                          map: map,
                                      }); 
                                      
                                      console.log('Map initialized with address:', info.receiverAddress);
                                  } else {
                                      console.log('Geocoding failed');
                                  }
                              });
                          }
                      } catch(e) {
                          console.error('Plugin init error', e);
                      }
                   });
               } catch (e) {
                   console.error('Map init error:', e);
                   setMapError('地图初始化失败');
               }
           }, 200);
       } else {
           // 小程序端逻辑：解析目标地址
            if (info.receiverAddress && !targetLngLat) {
                // 尝试使用高德地图 Web 服务 API 进行地址解析
                // 注意：需要确保 Key 开通了 "Web 服务" 权限
                // 使用新的 Web 服务 Key (用户提供: 44bb291fa15e965c72a710f23b18c49c)
                const key = '44bb291fa15e965c72a710f23b18c49c';
                
                Taro.request({
                    url: 'https://restapi.amap.com/v3/geocode/geo',
                   data: {
                       address: info.receiverAddress,
                       key: key
                   },
                   success: (res) => {
                       if (res.data.status === '1' && res.data.geocodes && res.data.geocodes.length > 0) {
                           const location = res.data.geocodes[0].location;
                           const [lng, lat] = location.split(',').map(Number);
                           setTargetLngLat({ lng, lat });
                           console.log('Weapp geocode success:', lng, lat);
                       } else {
                           console.warn('Weapp geocode failed:', res.data);
                           // 如果 Key 报错，尝试提示
                           if (res.data.status === '0') {
                               setMapError(`地图解析失败: ${res.data.info}`);
                           }
                       }
                   },
                   fail: (err) => {
                       console.error('Weapp geocode request failed:', err);
                       setMapError('网络请求失败');
                   }
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
      // if (!verifyCode) {
      //   Taro.showToast({ title: '请输入签收码', icon: 'none' })
      //   return
      // }
      
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
          // H5 navigation logic (simplified for now, ideally needs geocoding for shop too)
          if (!destName) {
              Taro.showToast({ title: '无法获取目的地', icon: 'none' })
              return
          }
          const url = `https://uri.amap.com/navigation?to=,,${destName}&mode=ride&policy=1&src=zhijian&callnative=1`
          window.location.href = url
      } else {
          // 小程序端逻辑
          // 尝试解析地址坐标
          // 使用新的 Web 服务 Key (用户提供: e43c92dca357b9d01d0183da81ea9af8)
          const key = 'e43c92dca357b9d01d0183da81ea9af8';
          Taro.showLoading({ title: '准备导航...' });
          
          const performNavigation = (city?: string, isRetry = false) => {
              // 使用 POI 搜索 (place/text) 代替地理编码 (geocode/geo)
              // 解决：地理编码对"小区名"等非结构化地址容易解析到城市中心的问题
              Taro.request({
                  url: 'https://restapi.amap.com/v3/place/text',
                  data: {
                      keywords: destName,
                      key: key,
                      city: city,
                      // 如果是重试（跨城查找），则取消城市限制
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
                               name: poi.name, // 使用搜索到的准确名称
                               address: poi.address // 使用搜索到的详细地址
                           })
                       } else {
                           // 如果是首次搜索失败，且指定了城市，尝试进行一次全局搜索（跨城）
                           if (!isRetry && city) {
                               console.log('Local search failed, retrying globally...');
                               performNavigation(undefined, true);
                               return;
                           }

                           Taro.hideLoading();
                           console.warn('Place Search API response:', res.data);
                           // 搜索失败兜底
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

          // 1. 获取当前定位，确定城市上下文，避免跨城市匹配错误
          Taro.getLocation({
              type: 'gcj02',
              success: (res) => {
                  const { latitude, longitude } = res;
                  // 2. 逆地理编码获取城市
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
                              // city 可能是数组[] (当是直辖市时)，此时取 province
                              city = (typeof addressComponent.city === 'string' && addressComponent.city) ? addressComponent.city : addressComponent.province;
                          }
                          console.log('Current city context:', city);
                          performNavigation(city);
                      },
                      fail: () => {
                          console.warn('Reverse geocoding failed');
                          performNavigation();
                      }
                  });
              },
              fail: (err) => {
                  console.warn('Get location failed:', err);
                  // 定位失败（如未授权），则不带城市上下文尝试导航
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
  
  if (!info) return <View>Loading...</View>

  return (
    <View className='detail-container'>
       {/* Custom Navigation Bar */}
       <View className='nav-header' style={{
           position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
           height: '44px', background: '#fff', display: 'flex', alignItems: 'center', padding: '0 10px',
           paddingTop: `${statusBarHeight}px`,
           boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
           boxSizing: 'content-box'
       }}>
           <View className='back-btn' onClick={() => {
               const pages = Taro.getCurrentPages()
               if (pages.length > 1) {
                   Taro.navigateBack()
               } else {
                   // Fallback to home if no history
                   Taro.reLaunch({ url: '/pages/index/index' })
               }
           }} style={{ padding: '10px' }}>
               <Text style={{ fontSize: '20px', color: '#333' }}>{'<'}</Text>
           </View>
           <Text style={{ fontSize: '16px', fontWeight: 'bold', flex: 1, textAlign: 'center', marginRight: '40px' }}>
               订单详情
           </Text>
       </View>

       <View style={{ paddingTop: `${50 + statusBarHeight}px` }}>
       {info.status === 1 && (
           <View className="map-container" style={{ height: '200px', width: '100%', position: 'relative' }}>
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
                   <View style={{
                       position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
                       display: 'flex', alignItems: 'center', justifyContent: 'center', 
                       background: '#f5f5f5', color: '#999', zIndex: 10
                   }}>
                       <Text>{mapError}</Text>
                   </View>
               )}
           </View>
       )}
       
       <View className='card'>
         <View className='header'>
            <Text className='status'>
                {info.status === 0 ? '待接单' : info.status === 1 ? '配送中' : '已完成'}
            </Text>
            {info.isUrgent === 1 && <Text className='tag urgent' style={{color: 'red', marginLeft: 10, fontWeight: 'bold'}}>急单</Text>}
            <Text className='price'>¥{info.deliveryFee}</Text>
         </View>
         
         <View className='address-box'>
            <View className='row'>
                <Text className='label'>取</Text>
                <View style={{flex: 1}}>
                    <Text className='addr'>{info.shopAddress}</Text>
                    <Text className='name'>{info.shopName}</Text>
                </View>
                {info.status === 1 && (
                   <View className='nav-btn' onClick={() => handleNavigate('shop')}>
                       <Text className='icon'>🧭</Text>
                       <Text>导航</Text>
                   </View>
                )}
            </View>
            <View className='row'>
                <Text className='label deliver'>送</Text>
                <View style={{flex: 1}}>
                    <Text className='addr'>{info.receiverAddress}</Text>
                    <Text className='name'>{info.receiverName} {info.receiverPhone}</Text>
                </View>
                {info.status === 1 && (
                    <View className='nav-btn' onClick={() => handleNavigate('receiver')}>
                        <Text className='icon'>🧭</Text>
                        <Text>导航</Text>
                    </View>
                )}
            </View>
         </View>
       </View>

       {info.status === 1 && (
         <View className='action-area'>
            <View className='upload-box' onClick={handleUpload}>
                {proofImage ? (
                    <Image src={proofImage} mode='aspectFill' className='preview' />
                ) : (
                    <View className='placeholder'>
                        <Text>上传送达凭证</Text>
                    </View>
                )}
            </View>
            
            {/* <View className='input-box' style={{marginTop: 20, marginBottom: 20, padding: '0 10px', background: '#fff'}}>
                <Input 
                    placeholder='请输入签收码'
                    placeholderStyle='font-size: 18px; color: #ccc; text-align: center;'
                    type='number' 
                    maxLength={4}
                    value={verifyCode}
                    onInput={(e) => setVerifyCode(e.detail.value)}
                    style={{
                        border: '2px solid #00B96B', 
                        padding: '10px', 
                        borderRadius: '12px', 
                        fontSize: '48px', 
                        height: '80px', 
                        textAlign: 'center', 
                        fontWeight: 'bold', 
                        letterSpacing: '16px',
                        background: '#f8f8f8',
                        color: '#333'
                    }}
                />
            </View> */}

            <Button className='btn-primary' onClick={handleAction}>确认送达</Button>
            <Button className='btn-secondary' style={{marginTop: 10, background: '#f5f5f5', color: '#666'}} onClick={handleReportException}>异常上报</Button>
         </View>
       )}

       {info.status === 0 && (
         <View className='fixed-bottom'>
            <Button className='btn-primary' onClick={handleAction}>立即抢单</Button>
         </View>
       )}
       </View>
    </View>
  )
}

export default OrderDetail