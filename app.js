// 全局 App 入口
App({
  globalData: {
    userInfo: null,
    token: null,
    baseUrl: 'https://mayunfei.asia',
    devBaseUrl: 'http://101.42.24.114'
  },

  onLaunch() {
    const token = wx.getStorageSync('token')
    if (token) {
      this.globalData.token = token
      this.globalData.userInfo = wx.getStorageSync('userInfo')
    }
  }
})
