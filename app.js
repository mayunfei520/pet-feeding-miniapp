// 全局 App 入口
App({
  globalData: {
    userInfo: null,
    token: null,
    baseUrl: 'http://localhost:8080'  // 管理后台地址
  },

  onLaunch() {
    // 检查登录状态
    const token = wx.getStorageSync('token')
    if (token) {
      this.globalData.token = token
    }
  }
})
