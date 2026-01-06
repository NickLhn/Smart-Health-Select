import React, { useState } from 'react'
import { View, Input, Button, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import request from '../../services/request'
import './index.scss'

const Login: React.FC = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async () => {
    if (!username || !password) {
      Taro.showToast({ title: '请输入账号密码', icon: 'none' })
      return
    }

    const res = await request.post('/auth/login', {
      username,
      password
    })

    if (res.code === 200) {
      Taro.setStorageSync('token', res.data.token)
      Taro.setStorageSync('userInfo', res.data.userInfo)
      Taro.showToast({ title: '登录成功', icon: 'success' })
      setTimeout(() => {
        Taro.switchTab({ url: '/pages/index/index' })
      }, 1000)
    } else {
      Taro.showToast({ title: res.msg || '登录失败', icon: 'none' })
    }
  }

  const goToRegister = () => {
    Taro.navigateTo({ url: '/pages/register/index' })
  }

  return (
    <View className='login-container'>
      <View className='header'>
        <View className='title'>欢迎回来</View>
        <View className='subtitle'>请登录您的骑手账号</View>
      </View>
      
      <View className='form'>
        <View className='input-group'>
          <Text className='label'>账号</Text>
          <Input
            className='input'
            placeholder='请输入用户名'
            value={username}
            onInput={(e) => setUsername(e.detail.value)}
          />
        </View>
        
        <View className='input-group'>
          <Text className='label'>密码</Text>
          <Input
            className='input'
            placeholder='请输入密码'
            password
            value={password}
            onInput={(e) => setPassword(e.detail.value)}
          />
        </View>

        <Button className='btn-login' onClick={handleLogin}>登录</Button>
      </View>

      <View className='footer'>
        <View className='link' onClick={goToRegister}>没有账号？立即注册</View>
      </View>
    </View>
  )
}

export default Login
