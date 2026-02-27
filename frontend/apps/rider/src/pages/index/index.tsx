import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, Button, Switch } from '@tarojs/components'
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
  const [todayIncome, setTodayIncome] = useState<number>(0)
  const [onlineMs, setOnlineMs] = useState<number>(0)
  const [isOnline, setIsOnline] = useState(true)

  function updateOnlineMs(online: boolean) {
    const acc = Number(Taro.getStorageSync('rider_online_acc_ms') || 0)
    const startedAt = Number(Taro.getStorageSync('rider_online_started_at') || 0)
    const live = online && startedAt > 0 ? Math.max(0, Date.now() - startedAt) : 0
    setOnlineMs(Math.max(0, acc + live))
  }

  function formatDuration(ms: number) {
    const totalMinutes = Math.floor(ms / 60000)
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    return `${hours}h ${minutes}m`
  }

  useEffect(() => {
    updateOnlineMs(isOnline)
    if (!isOnline) return
    const timer = setInterval(() => updateOnlineMs(true), 30000)
    return () => clearInterval(timer)
  }, [isOnline])

  useDidShow(() => {
    const token = Taro.getStorageSync('token')
    if (!token) {
      Taro.reLaunch({ url: '/pages/login/index' })
      return
    }
    const storedOnlineValue = Taro.getStorageSync('rider_online')
    const storedIsOnline =
      storedOnlineValue === '' || storedOnlineValue === null || typeof storedOnlineValue === 'undefined'
        ? true
        : Boolean(storedOnlineValue)
    if (storedIsOnline && Number(Taro.getStorageSync('rider_online_started_at') || 0) <= 0) {
      Taro.setStorageSync('rider_online_started_at', Date.now())
    }
    setIsOnline(storedIsOnline)
    updateOnlineMs(storedIsOnline)
    fetchAll()
  })

  usePullDownRefresh(() => {
    fetchAll()
  })

  const fetchAll = async () => {
    await Promise.all([fetchList(), fetchStats()])
    Taro.stopPullDownRefresh()
  }

  const fetchList = async () => {
    setLoading(true)
    const res = await request.get('/delivery/pending/list', { page: 1, size: 20 })
    if (res.code === 200) {
      setList(res.data.records || [])
    }
    setLoading(false)
  }

  const fetchStats = async () => {
    const res = await request.get('/delivery/stats')
    if (res.code === 200) {
      const data = res.data || {}
      const income = Number(data.todayIncome ?? 0)
      setTodayIncome(Number.isFinite(income) ? income : 0)
    }
  }

  const handleAccept = async (id: number) => {
    if (!isOnline) {
      Taro.showToast({ title: '当前休息中，切换到听单后才能接单', icon: 'none' })
      return
    }
    const res = await request.post(`/delivery/${id}/accept`)
    if (res.code === 200) {
      Taro.showToast({ title: '抢单成功', icon: 'success' })
      fetchAll()
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

  const setOnline = (next: boolean) => {
    if (next === isOnline) return
    const now = Date.now()
    const acc = Number(Taro.getStorageSync('rider_online_acc_ms') || 0)
    const startedAt = Number(Taro.getStorageSync('rider_online_started_at') || 0)

    if (next) {
      Taro.setStorageSync('rider_online', true)
      Taro.setStorageSync('rider_online_started_at', now)
      setIsOnline(true)
      updateOnlineMs(true)
      Taro.showToast({ title: '开始听单', icon: 'none' })
      return
    }

    const newAcc = acc + (startedAt > 0 ? Math.max(0, now - startedAt) : 0)
    Taro.setStorageSync('rider_online', false)
    Taro.setStorageSync('rider_online_started_at', 0)
    Taro.setStorageSync('rider_online_acc_ms', newAcc)
    setIsOnline(false)
    setOnlineMs(newAcc)
    Taro.showToast({ title: '已休息', icon: 'none' })
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
                <Text className='value'>{todayIncome.toFixed(2)}</Text>
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
              <Text className='sub-value'>{formatDuration(onlineMs)}</Text>
            </View>
            <View className='col'>
              <View className='online-switch'>
                <Text className={`online-text ${isOnline ? 'online' : 'offline'}`}>{isOnline ? '听单中' : '休息中'}</Text>
                <Switch checked={isOnline} color='#2563EB' onChange={(e) => setOnline(e.detail.value)} />
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
            <View className={`card ${isOnline ? '' : 'offline'}`} key={item.id} onClick={() => handleCardClick(item.id)}>
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
                  <Button disabled={!isOnline} className='btn-accept' onClick={(e) => { e.stopPropagation(); handleAccept(item.id) }}>
                    {isOnline ? '立即抢单' : '休息中'}
                  </Button>
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
