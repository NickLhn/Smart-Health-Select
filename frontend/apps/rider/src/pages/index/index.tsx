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

  return (
    <View className='index-container'>
      <View className='header'>接单大厅</View>
      <ScrollView scrollY className='list'>
        {list.length === 0 ? (
          <View className='empty'>暂无待接订单</View>
        ) : (
          list.map(item => (
            <View key={item.id} className='card' onClick={() => handleCardClick(item.id)}>
              <View className='card-header'>
                <View className='flex items-center'>
                  {item.isUrgent === 1 && <Text className='tag urgent'>急</Text>}
                  <Text className='shop-name'>{item.shopName || '智健合作商家'}</Text>
                </View>
                <Text className='distance'>500m内</Text>
              </View>
              
              <View className='info-row'>
                <Text className='tag pickup'>取</Text>
                <Text className='address'>{item.shopAddress}</Text>
              </View>
              
              <View className='info-row'>
                <Text className='tag deliver'>送</Text>
                <Text className='address'>{item.receiverAddress}</Text>
              </View>

              <View className='footer'>
                <View className='price-box'>
                  <Text className='label'>本单收入 </Text>
                  <Text className='price'><Text className='currency'>¥</Text>{item.deliveryFee || 0}</Text>
                </View>
                <Button className='btn-accept' onClick={(e) => { e.stopPropagation(); handleAccept(item.id) }}>立即抢单</Button>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  )
}

export default Index
