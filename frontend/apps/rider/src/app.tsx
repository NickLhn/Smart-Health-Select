import React, { PropsWithChildren } from 'react'
import './app.scss'

const App: React.FC<PropsWithChildren> = (props) => {
  return <>{props.children}</>
}

export default App
