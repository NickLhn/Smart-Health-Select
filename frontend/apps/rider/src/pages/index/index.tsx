import React, { useState } from 'react'
import { View, Text, ScrollView, Button } from '@tarojs/components'
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro'
import request from '../../services/request'
import './index.scss'

interface DeliveryOrder {
  id: number
  orderId: number
  shopName: string
  shopAddress: string
  receiverName: string
  receiverPhone: string
  receiverAddress: string
  deliveryFee: number
  distance?: number
  isUrgent?: number
}

const Index: React.FC = () => {
  const [list, setList] = useState<DeliveryOrder[]>([])
  const [loading, setLoading] = useState(false)

  useDidShow(() => {
    const token = Taro.getStorageSync('token')
    if (!token) {
      Taro.reLaunch({ url: '/pages/login/index' })
      return
    }
    fetchList()
  })

  usePullDownRefresh(() => {
    fetchList()
  })

  const fetchList = async () => {
    setLoading(true)
    const res = await request.get('/delivery/pending/list', { page: 1, size: 20 })
    if (res.code === 200) {
      setList(res.data.records || [])
    }
    setLoading(false)
    Taro.stopPullDownRefresh()
  }

  const handleAccept = async (id: number) => {
    const res = await request.post(`/delivery/${id}/accept`)
    if (res.code === 200) {
      Taro.showToast({ title: '抢单成功', icon: 'success' })
      fetchList()
    } else {
      Taro.showToast({ title: res.msg || '抢单失败', icon: 'none' })
    }
  }

  const handleCardClick = (id: number) => {
    Taro.navigateTo({ url: `/pages/order-detail/index?id=${id}` })
  }

  // Handle scroll for glassmorphism effect
  const [scrollTop, setScrollTop] = useState(0)
  const onScroll = (e) => setScrollTop(e.detail.scrollTop)

  const [isOnline, setIsOnline] = useState(true)
  const toggleOnline = () => {
    setIsOnline(!isOnline)
    Taro.showToast({ title: !isOnline ? '开始听单' : '已休息', icon: 'none' })
  }

  return (
    <View className='index-container'>
      {/* 顶部仪表盘 */}
      <View className={`header ${scrollTop > 10 ? 'scrolled' : ''}`}>
        <View className='dashboard-card'>
          <View className='row'>
            <View className='col'>
              <Text className='label'>今日收入</Text>
              <View className='value-group'>
                <Text className='symbol'>¥</Text>
                <Text className='value'>128.50</Text>
              </View>
            </View>
            <View className='col'>
              <Text className='label'>待抢订单</Text>
              <View className='value-group'>
                <Text className='value'>{list.length}</Text>
                <Text className='unit'>单</Text>
              </View>
            </View>
          </View>
          <View className='divider' />
          <View className='row'>
            <View className='col'>
              <Text className='label'>在线时长</Text>
              <Text className='sub-value'>4h 12m</Text>
            </View>
            <View className='col'>
              <View className={`status-badge ${isOnline ? 'online' : 'offline'}`} onClick={toggleOnline}>
                <Text>{isOnline ? '听单中' : '休息中'}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* 订单列表 */}
      <View className='section-header'>
        <Text className='title'>附近新订单</Text>
        <View className='filter-tags'>
           <Text className='tag active'>全部</Text>
           <Text className='tag'>附近</Text>
           <Text className='tag'>加急</Text>
        </View>
      </View>

      <ScrollView className='list' scrollY onScroll={onScroll}>
        {list.length === 0 ? (
          <View className='empty'>
            <Text>暂无新订单</Text>
          </View>
        ) : (
          list.map((item) => (
            <View className='card' key={item.id} onClick={() => handleCardClick(item.id)}>
              <View className='status-bar'></View>
              <View className='card-content'>
                <View className='card-header'>
                  <View className='shop-info'>
                     <Text className='shop-name'>{item.shopName}</Text>
                     <View className='tags'>
                       <Text className='tag'>帮送</Text>
                       {item.isUrgent === 1 && <Text className='tag urgent'>加急</Text>}
                       <Text className='tag distance'>距离 {item.distance || '0.8'}km</Text>
                     </View>
                  </View>
                  <View className='price'>
                    <Text className='currency'>¥</Text>
                    <Text className='amount'>{item.deliveryFee}</Text>
                  </View>
                </View>
                
                <View className='route-info'>
                  <View className='timeline-item pickup'>
                    <View className='dot' />
                    <View className='info'>
                      <Text className='address'>{item.shopAddress}</Text>
                      <Text className='detail'>取货点</Text>
                    </View>
                  </View>
                  
                  <View className='timeline-item deliver'>
                    <View className='dot' />
                    <View className='info'>
                      <Text className='address'>{item.receiverAddress}</Text>
                      <Text className='detail'>送货点</Text>
                    </View>
                  </View>
                </View>

                <View className='card-footer'>
                  <Button className='btn-accept' onClick={(e) => { e.stopPropagation(); handleAccept(item.id) }}>立即抢单</Button>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  )
}

export default Index
