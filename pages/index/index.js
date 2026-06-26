Page({
  data: {
    banners: [
      { id: 1, title: '上门喂养', sub: '安心出行，宠物无忧', emoji: '🐾', bg: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' },
      { id: 2, title: '专业喂养员', sub: '严格审核，值得信赖', emoji: '🏠', bg: 'linear-gradient(135deg, #10b981, #06b6d4)' },
      { id: 3, title: '全程跟踪', sub: '一键预约，实时查看', emoji: '📱', bg: 'linear-gradient(135deg, #f59e0b, #ef4444)' }
    ],
    feeders: [],
    stats: { totalOrders: 0, pendingOrders: 0, myPets: 0 },
    loading: true,
    token: ''
  },

  onShow() {
    const token = wx.getStorageSync('token') || ''
    this.setData({ token })
    if (token) {
      this.loadAll()
    } else {
      this.doLogin()
    }
  },

  doLogin() {
    wx.login({
      success: (res) => {
        const { authApi } = require('../../utils/api')
        authApi.login({ code: res.code, role: 'OWNER' }).then(result => {
          const token = result.data.token
          wx.setStorageSync('token', token)
          wx.setStorageSync('userInfo', result.data)
          this.setData({ token })
          this.loadAll()
        }).catch(() => {
          // 演示模式
          wx.setStorageSync('token', 'demo-token')
          wx.setStorageSync('userInfo', { nickname: '演示用户', role: 'OWNER' })
          this.setData({ token: 'demo-token' })
          wx.showToast({ title: '演示模式', icon: 'none' })
          this.loadAll()
        })
      },
      fail: () => {
        wx.setStorageSync('token', 'demo-token')
        wx.setStorageSync('userInfo', { nickname: '演示用户', role: 'OWNER' })
        this.setData({ token: 'demo-token' })
        this.loadAll()
      }
    })
  },

  loadAll() {
    this.setData({ loading: true })
    this.loadFeeders()
    this.loadStats()
    this.setData({ loading: false })
  },

  loadFeeders() {
    try {
      const { feederApi } = require('../../utils/api')
      feederApi.list().then(res => {
        this.setData({ feeders: (res.data || []).slice(0, 6) })
      }).catch(() => {})
    } catch (e) {}
  },

  loadStats() {
    try {
      const { orderApi, petApi } = require('../../utils/api')
      // 获取订单统计
      orderApi.list().then(res => {
        const orders = res.data || []
        this.setData({
          'stats.totalOrders': orders.length,
          'stats.pendingOrders': orders.filter(o => o.status === 'PENDING').length
        })
      }).catch(() => {})
      // 获取我的宠物数
      petApi.list().then(res => {
        const pets = res.data || []
        this.setData({ 'stats.myPets': pets.length })
      }).catch(() => {})
    } catch (e) {}
  },

  goTo(e) {
    const path = e.currentTarget.dataset.path
    wx.navigateTo({
      url: path,
      fail: () => wx.switchTab({ url: path })
    })
  },

  goFeeder(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    wx.navigateTo({ url: '/pages/feeders/detail/detail?id=' + id })
  }
})