import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, Button } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import request from '../../services/request'
import './index.scss'

const Orders: React.FC = () => {
  // 1 表示配送中，2 表示已送达。
  const [activeTab, setActiveTab] = useState(1)
  const [list, setList] = useState<any[]>([])

  const parseToMs = (value: any): number | null => {
    if (value === null || typeof value === 'undefined' || value === '') return null
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) return null
      return value > 10_000_000_000 ? value : value * 1000
    }
    if (typeof value === 'string') {
      const s = value.trim()
      if (!s) return null
      if (/^\d+$/.test(s)) {
        const n = Number(s)
        if (!Number.isFinite(n)) return null
        return n > 10_000_000_000 ? n : n * 1000
      }
      const iso = s.includes(' ') && !s.includes('T') ? s.replace(' ', 'T') : s
      const ms = Date.parse(iso)
      return Number.isFinite(ms) ? ms : null
    }
    return null
  }

  const formatHHmm = (ms: number | null): string => {
    if (ms === null || !Number.isFinite(ms)) return '--:--'
    const d = new Date(ms)
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    return `${hh}:${mm}`
  }

  const getTimeLabel = () => (activeTab === 1 ? '预计送达' : '送达时间')

  const getTimeValue = (item: any) => {
    const baseMs =
      activeTab === 1
        ? parseToMs(item.updateTime) ?? parseToMs(item.createTime)
        : parseToMs(item.updateTime) ?? parseToMs(item.createTime)

    if (activeTab === 1) {
      const etaMs = baseMs === null ? null : baseMs + 30 * 60 * 1000
      return formatHHmm(etaMs)
    }
    return formatHHmm(baseMs)
  }

  useDidShow(() => {
    // 页面每次可见时都重新拉一次，避免切后台回来看到旧状态。
    fetchList()
  })

  useEffect(() => {
    // 切换标签页时按状态重新查询。
    fetchList()
  }, [activeTab])

  const fetchList = async () => {
    const res = await request.get('/delivery/my/list', { 
      status: activeTab,
      page: 1, 
      size: 20 
    })
    if (res.code === 200) {
      // 订单页按当前标签只展示配送中或已完成列表。
      setList(res.data.records || [])
    }
  }

  const handleCall = (phone: string) => {
    if (phone) {
      Taro.makePhoneCall({ phoneNumber: phone })
    }
  }

  const handleCardClick = (id: number) => {
    // 订单详情页统一承接配送轨迹和送达操作。
    Taro.navigateTo({ url: `/pages/order-detail/index?id=${id}` })
  }

  return (
    <View className='orders-container'>
      <View className='tabs'>
        <View className={`tab ${activeTab === 1 ? 'active' : ''}`} onClick={() => setActiveTab(1)}>进行中</View>
        <View className={`tab ${activeTab === 2 ? 'active' : ''}`} onClick={() => setActiveTab(2)}>历史订单</View>
      </View>
      
      <ScrollView scrollY className='list'>
        {list.length === 0 ? (
          <View className='empty'>
            <Text>暂无订单</Text>
          </View>
        ) : (
          list.map(item => (
            <View key={item.id} className={`card ${activeTab === 1 ? 'active-card' : ''}`} onClick={() => handleCardClick(item.id)}>
              <View className='status-bar'></View>
              <View className='card-content'>
                <View className='card-header'>
                  <Text className='order-no'>#{item.orderId}</Text>
                  <Text className={`status ${activeTab === 1 ? 'delivering' : 'completed'}`}>
                    {activeTab === 1 ? '配送中' : '已完成'}
                  </Text>
                </View>

                <View className='info-group'>
                  <View className='row'>
                    <View className='icon-box pickup'>
                      <Text>取</Text>
                    </View>
                    <View className='content'>
                      <Text className='name'>{item.shopName}</Text>
                      <Text className='address'>{item.shopAddress}</Text>
                    </View>
                  </View>

                  <View className='row'>
                    <View className='icon-box deliver'>
                      <Text>送</Text>
                    </View>
                    <View className='content'>
                      <Text className='name'>{item.receiverName}</Text>
                      <Text className='address'>{item.receiverAddress}</Text>
                    </View>
                    <View className='action-btn' onClick={(e) => { e.stopPropagation(); handleCall(item.receiverPhone) }}>
                      <Text className='phone-icon'>📞</Text>
                    </View>
                  </View>
                </View>

                <View className='card-footer'>
                  <View className='time'>
                    <Text className='time-prefix'>{getTimeLabel()}</Text>
                    <Text className='time-value'>{getTimeValue(item)}</Text>
                  </View>
                  {activeTab === 1 && (
                    <Button className='btn-action' onClick={(e) => { e.stopPropagation(); handleCardClick(item.id) }}>
                      <Text className='btn-text'>查看详情</Text>
                      <Text className='btn-arrow'>›</Text>
                    </Button>
                  )}
                  {activeTab === 2 && (
                    <Button className='btn-action outline'>
                      <Text className='btn-text'>查看评价</Text>
                      <Text className='btn-arrow'>›</Text>
                    </Button>
                  )}
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  )
}

export default Orders
