import React, { useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import request from '../../services/request'
import './index.scss'

const Wallet: React.FC = () => {
  const [totalIncome, setTotalIncome] = useState(0)
  const [todayIncome, setTodayIncome] = useState(0)
  const [list, setList] = useState<any[]>([])

  useDidShow(() => {
    fetchData()
  })

  const fetchData = async () => {
    // 钱包页当前直接基于已完成配送单汇总收益。
    const res = await request.get('/delivery/my/list', { 
      status: 2,
      page: 1, 
      // 一次多拉一点，够覆盖大部分骑手近期收益明细。
      size: 100
    })

    if (res.code === 200) {
      const records = res.data.records || []
      setList(records)
      
      // 汇总总收益。
      const total = records.reduce((sum: number, item: any) => {
        return sum + (item.deliveryFee || 0)
      }, 0)
      setTotalIncome(total)

      // 再从同一批记录里筛出今日收益。
      const todayStr = new Date().toISOString().split('T')[0]
      const todayTotal = records.reduce((sum: number, item: any) => {
        const itemDate = item.updateTime ? item.updateTime.split(' ')[0] : ''
        const itemDateIso = item.updateTime ? item.updateTime.split('T')[0] : ''
        
        if (itemDate === todayStr || itemDateIso === todayStr) {
          return sum + (item.deliveryFee || 0)
        }
        return sum
      }, 0)
      setTodayIncome(todayTotal)
    }
  }

  return (
    <View className='wallet-container'>
      <View className='header-card'>
        <Text className='label'>总收入 (元)</Text>
        <Text className='amount'>{totalIncome.toFixed(2)}</Text>
        <View className='sub-info'>
          <Text>今日收益: {todayIncome.toFixed(2)}</Text>
          <Text>本月收益: {totalIncome.toFixed(2)}</Text>
        </View>
      </View>

      <View className='list-title'>收益明细</View>
      <ScrollView scrollY className='list'>
        {list.length === 0 ? (
          <View className='empty'>暂无收益记录</View>
        ) : (
          list.map(item => (
            <View key={item.id} className='item'>
              {/* 目前收益明细直接按配送单展示。 */}
              <View className='left'>
                <Text className='title'>配送收入 - 订单 {item.orderId}</Text>
                <Text className='time'>{item.updateTime || item.createTime}</Text>
              </View>
              <View className='right'>
                <Text className='add'>+{item.deliveryFee || 0}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  )
}

export default Wallet
