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
    color: '#999',
    selectedColor: '#00B96B',
    backgroundColor: '#fff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '接单大厅',
        iconPath: './assets/tab-home.png',
        selectedIconPath: './assets/tab-home-active.png'
      },
      {
        pagePath: 'pages/orders/index',
        text: '我的订单',
        iconPath: './assets/tab-home.png', // Temporary reuse
        selectedIconPath: './assets/tab-home-active.png'
      },
      {
        pagePath: 'pages/profile/index',
        text: '个人中心',
        iconPath: './assets/tab-profile.png',
        selectedIconPath: './assets/tab-profile-active.png'
      }
    ]
  },
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
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
