import React, { useState } from 'react'
import { View, Input, Button, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import request from '../../services/request'
import './index.scss'

const Register: React.FC = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [mobile, setMobile] = useState('')

  const handleRegister = async () => {
    if (!username || !password || !mobile) {
      Taro.showToast({ title: '请填写完整信息', icon: 'none' })
      return
    }

    const res = await request.post('/auth/register', {
      username,
      password,
      mobile,
      role: 'RIDER'
    })

    if (res.code === 200) {
      Taro.showToast({ title: '注册成功', icon: 'success' })
      setTimeout(() => {
        const pages = Taro.getCurrentPages()
        if (pages.length > 1) {
          Taro.navigateBack()
        } else {
          Taro.redirectTo({ url: '/pages/login/index' })
        }
      }, 1500)
    } else {
      Taro.showToast({ title: res.msg || '注册失败', icon: 'none' })
    }
  }

  return (
    <View className='register-container'>
      <View className='header'>
        <View className='title'>加入我们</View>
        <View className='subtitle'>成为智健配送骑手，开始接单赚钱</View>
      </View>

      <View className='form'>
        <View className='input-group'>
          <Text className='label'>账号</Text>
          <Input
            className='input'
            placeholder='设置用户名'
            value={username}
            onInput={(e) => setUsername(e.detail.value)}
          />
        </View>

        <View className='input-group'>
          <Text className='label'>手机号</Text>
          <Input
            className='input'
            placeholder='请输入手机号'
            type='number'
            maxLength={11}
            value={mobile}
            onInput={(e) => setMobile(e.detail.value)}
          />
        </View>
        
        <View className='input-group'>
          <Text className='label'>密码</Text>
          <Input
            className='input'
            placeholder='设置登录密码'
            password
            value={password}
            onInput={(e) => setPassword(e.detail.value)}
          />
        </View>

        <Button className='btn-register' onClick={handleRegister}>立即注册</Button>
      </View>
    </View>
  )
}

export default Register
