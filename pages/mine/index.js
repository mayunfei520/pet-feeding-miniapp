Page({
  data: {
    userInfo: {}
  },

  onShow() {
    const info = wx.getStorageSync('userInfo') || { nickname: '微信用户', role: 'OWNER' }
    this.setData({ userInfo: info })
  },

  goTo(e) {
    const path = e.currentTarget.dataset.path
    wx.navigateTo({
      url: path,
      fail: () => wx.switchTab({ url: path })
    })
  },

  switchRole() {
    const roles = ['OWNER', 'FEEDER']
    const current = this.data.userInfo.role || 'OWNER'
    const next = roles.find(r => r !== current) || 'OWNER'
    const info = { ...this.data.userInfo, role: next }
    wx.setStorageSync('userInfo', info)
    this.setData({ userInfo: info })
    wx.showToast({ title: '已切换为：' + (next === 'FEEDER' ? '喂养员' : '宠物主人'), icon: 'none' })
  },

  doLogout() {
    wx.clearStorageSync()
    wx.showToast({ title: '已退出' })
    setTimeout(() => wx.reLaunch({ url: '/pages/index/index' }), 1000)
  }
})
