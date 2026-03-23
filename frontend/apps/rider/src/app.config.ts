export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/orders/index',
    'pages/profile/index',
    'pages/login/index',
    'pages/register/index',
    'pages/order-detail/index',
    'pages/wallet/index'
  ],
  tabBar: {
    color: '#9CA3AF',
    selectedColor: '#8B5CF6',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '接单',
        iconPath: './assets/tab-home.png',
        selectedIconPath: './assets/tab-home-active.png'
      },
      {
        pagePath: 'pages/orders/index',
        text: '订单',
        // 订单 tab 目前复用接单图标，后续可以再单独补资源。
        iconPath: './assets/tab-home.png',
        selectedIconPath: './assets/tab-home-active.png'
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的',
        iconPath: './assets/tab-profile.png',
        selectedIconPath: './assets/tab-profile-active.png'
      }
    ]
  },
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#FAFAFA',
    navigationBarTitleText: '智健配送',
    navigationBarTextStyle: 'black'
  },
  permission: {
    "scope.userLocation": {
      "desc": "您的位置信息将用于显示配送路线和导航"
    }
  },
  requiredPrivateInfos: [
    "getLocation"
  ],
  lazyCodeLoading: "requiredComponents"
})
