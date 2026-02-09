import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, Button } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import request from '../../services/request'
import './index.scss'

const Orders: React.FC = () => {
  const [activeTab, setActiveTab] = useState(1) // 1: 配送中, 2: 已送达
  const [list, setList] = useState<any[]>([])

  useDidShow(() => {
    fetchList()
  })

  useEffect(() => {
    fetchList()
  }, [activeTab])

  const fetchList = async () => {
    const res = await request.get('/delivery/my/list', { 
      status: activeTab,
      page: 1, 
      size: 20 
    })
    if (res.code === 200) {
      setList(res.data.records || [])
    }
  }

  const handleCall = (phone: string) => {
    if (phone) {
      Taro.makePhoneCall({ phoneNumber: phone })
    }
  }

  const handleCardClick = (id: number) => {
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
                  <Text className='time'>预计 14:30 送达</Text>
                  {activeTab === 1 && (
                    <Button className='btn-action' onClick={(e) => { e.stopPropagation(); handleCardClick(item.id) }}>
                      查看详情
                    </Button>
                  )}
                  {activeTab === 2 && (
                    <Button className='btn-action outline'>查看评价</Button>
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
