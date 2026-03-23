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

    // 注册时固定把角色指定为 RIDER。
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
        <View className='subtitle'>注册成为智健骑手</View>
      </View>

      <View className='form'>
        <View className='input-group'>
          <Text className='label'>账号设置</Text>
          <Input
            className='input'
            placeholder='设置用户名'
            placeholderClass='input-placeholder'
            value={username}
            onInput={(e) => setUsername(e.detail.value)}
          />
        </View>

        <View className='input-group'>
          <Text className='label'>手机号码</Text>
          <Input
            className='input'
            placeholder='请输入手机号'
            placeholderClass='input-placeholder'
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
            placeholderClass='input-placeholder'
            password
            value={password}
            onInput={(e) => setPassword(e.detail.value)}
          />
        </View>

        <Button className='btn-register' onClick={handleRegister}>
          确认注册
          <Text className='btn-icon'>+</Text>
        </Button>
      </View>
    </View>
  )
}

export default Register
