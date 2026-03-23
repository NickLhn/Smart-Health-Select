import React, { PropsWithChildren } from 'react'
import './app.scss'

// 骑手端 App 仅作为 Taro 根容器，实际页面渲染由 pages 目录接管。
const App: React.FC<PropsWithChildren> = (props) => {
  return <>{props.children}</>
}

export default App
