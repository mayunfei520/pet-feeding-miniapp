Page({
  data: {
    banners: [
      { id: 1, text: '🐾 上门喂养，安心出行', bg: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' },
      { id: 2, text: '🏠 专业喂养员，值得信赖', bg: 'linear-gradient(135deg, #10b981, #06b6d4)' },
      { id: 3, text: '📱 一键预约，全程跟踪', bg: 'linear-gradient(135deg, #f59e0b, #ef4444)' }
    ],
    feeders: []
  },

  onShow() {
    this.checkLogin()
  },

  checkLogin() {
    const token = wx.getStorageSync('token')
    if (token) {
      // token 已存在，直接加载数据
      this.loadFeeders()
      return
    }
    // 没 token，先登录，再加载
    this.doLogin()
  },

  doLogin() {
    wx.login({
      success: (res) => {
        const { authApi } = require('../../utils/api')
        authApi.login({ code: res.code, role: 'OWNER' }).then(result => {
          wx.setStorageSync('token', result.data.token)
          wx.setStorageSync('userInfo', result.data)
          // 登录成功后加载数据
          this.loadFeeders()
        }).catch(() => {
          // 演示模式
          wx.setStorageSync('token', 'demo-token')
          wx.setStorageSync('userInfo', { nickname: '演示用户', role: 'OWNER' })
          wx.showToast({ title: '演示模式', icon: 'none' })
          this.loadFeeders()
        })
      }
    })
  },

  loadFeeders() {
    try {
      const { feederApi } = require('../../utils/api')
      feederApi.list().then(res => {
        this.setData({ feeders: (res.data || []).slice(0, 5) })
      }).catch(() => {})
    } catch (e) {}
  },

  goTo(e) {
    const path = e.currentTarget.dataset.path
    wx.navigateTo({
      url: path,
      fail: (err) => {
        console.error('navigateTo failed:', path, err)
        wx.switchTab({ url: path.replace('/create', '/list') })
      }
    })
  },

  goFeeder(e) {
    wx.navigateTo({ url: '/pages/feeders/detail/detail?id=' + e.currentTarget.dataset.id })
  }
})
