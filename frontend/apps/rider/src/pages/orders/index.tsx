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
        <View className={`tab ${activeTab === 1 ? 'active' : ''}`} onClick={() => setActiveTab(1)}>配送中</View>
        <View className={`tab ${activeTab === 2 ? 'active' : ''}`} onClick={() => setActiveTab(2)}>已完成</View>
      </View>
      
      <ScrollView scrollY className='list'>
        {list.length === 0 ? (
          <View className='empty'>暂无订单</View>
        ) : (
          list.map(item => (
            <View key={item.id} className='card' onClick={() => handleCardClick(item.id)}>
              <View className='card-header'>
                <View className='flex items-center'>
                    <Text className='order-no'>订单号：{item.orderId}</Text>
                    {item.isUrgent === 1 && <Text className='tag urgent' style={{marginLeft: 10, color: 'red', fontWeight: 'bold'}}>急</Text>}
                </View>
                <Text className='status'>{activeTab === 1 ? '配送中' : '已完成'}</Text>
              </View>

              <View className='info-row'>
                <Text className='label'>送至：</Text>
                <Text className='val'>{item.receiverAddress}</Text>
              </View>
              
              <View className='info-row'>
                <Text className='label'>客户：</Text>
                <Text className='val'>{item.receiverName} 
                  <Text className='phone-btn' onClick={(e) => { e.stopPropagation(); handleCall(item.receiverPhone) }}>拨号</Text>
                </Text>
              </View>

              {activeTab === 1 && (
                <View className='footer'>
                  <Button className='btn-complete' size='mini' onClick={(e) => { e.stopPropagation(); handleCardClick(item.id) }}>去送达</Button>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  )
}

export default Orders
