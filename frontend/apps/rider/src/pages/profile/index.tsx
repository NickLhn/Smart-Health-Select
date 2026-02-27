import React, { useState } from 'react'
import { View, Image, Text, Button } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import request from '../../services/request'
import './index.scss'

const Profile: React.FC = () => {
  const [userInfo, setUserInfo] = useState<any>(null)
  const [totalIncome, setTotalIncome] = useState(0)
  const [orderCount, setOrderCount] = useState(0)

  useDidShow(() => {
    const info = Taro.getStorageSync('userInfo')
    if (info) {
      setUserInfo(info)
    }
    fetchIncome()
  })

  const fetchIncome = async () => {
    const res = await request.get('/delivery/stats')
    if (res.code === 200) {
      setTotalIncome(res.data.totalIncome || 0)
      setOrderCount(res.data.monthCount || 0)
    }
  }

  const handleLogout = () => {
    Taro.removeStorageSync('token')
    Taro.removeStorageSync('userInfo')
    Taro.reLaunch({ url: '/pages/login/index' })
  }

  return (
    <View className='profile-container'>
      <View className='header'>
        <View className='avatar'>
          {userInfo?.username ? userInfo.username[0].toUpperCase() : '未'}
        </View>
        <View className='info'>
          <Text className='name'>{userInfo?.username || '未登录'}</Text>
          <Text className='role'>{userInfo?.role === 'RIDER' ? '认证骑手' : '普通用户'}</Text>
        </View>
      </View>

      <View className='stats-card'>
        <View className='stat-item'>
          <Text className='num'>{totalIncome.toFixed(2)}</Text>
          <Text className='label'>总收入(元)</Text>
        </View>
        <View className='stat-item'>
          <Text className='num'>{orderCount}</Text>
          <Text className='label'>本月单量</Text>
        </View>
        <View className='stat-item'>
          <Text className='num'>100%</Text>
          <Text className='label'>好评率</Text>
        </View>
      </View>

      <View className='menu'>
        <View className='item' onClick={() => Taro.navigateTo({ url: '/pages/wallet/index' })}>
          <View className='item-left'>
            <View className='item-icon wallet'>
              <Text className='item-icon-text'>￥</Text>
            </View>
            <Text className='item-text'>我的钱包</Text>
          </View>
          <Text className='arrow'>›</Text>
        </View>
        <View className='item' onClick={() => Taro.makePhoneCall({ phoneNumber: '13796323223' })}>
          <View className='item-left'>
            <View className='item-icon service'>
              <Text className='item-icon-text'>客</Text>
            </View>
            <Text className='item-text'>联系客服</Text>
          </View>
          <Text className='arrow'>›</Text>
        </View>
      </View>

      <Button className='btn-logout' onClick={handleLogout}>退出登录</Button>
    </View>
  )
}

export default Profile
