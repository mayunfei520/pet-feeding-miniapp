Page({
  data: {
    order: {},
    role: 'OWNER',
    pageTheme: 'detail-owner',
    headerCardClass: 'detail-hero hero-owner',
    roleBadgeText: '宠物主人订单详情',
    pageTitle: '服务进度',
    pageDesc: '查看当前订单状态与服务信息',
    periodMap: { AM: '上午', PM: '下午', EVENING: '晚上' },
    statusMap: { PENDING: '待接单', ACCEPTED: '已接单', IN_PROGRESS: '进行中', COMPLETED: '已完成', CANCELLED: '已取消' },
    canCancel: false,
    canAccept: false,
    canStart: false,
    canReview: false,
    canComplete: false
  },

  onLoad(options) {
    const user = wx.getStorageSync('userInfo') || {}
    const role = user.role || 'OWNER'
    this.setData({ role })
    this.syncRoleTheme(role)
    if (role === 'ADMIN') {
      wx.showToast({ title: '管理员请在后台查看订单', icon: 'none' })
      setTimeout(() => wx.navigateBack({ delta: 1 }), 800)
      return
    }
    this.loadOrder(options.id)
  },

  syncRoleTheme(role) {
    if (role === 'FEEDER') {
      this.setData({
        pageTheme: 'detail-feeder',
        headerCardClass: 'detail-hero hero-feeder',
        roleBadgeText: '喂养员订单详情',
        pageTitle: '履约任务',
        pageDesc: '确认接单信息并跟进服务履约'
      })
      return
    }

    this.setData({
      pageTheme: 'detail-owner',
      headerCardClass: 'detail-hero hero-owner',
      roleBadgeText: '宠物主人订单详情',
      pageTitle: '服务进度',
      pageDesc: '查看当前订单状态与服务信息'
    })
  },

  syncActions(order) {
    this.setData({
      canCancel: order.status === 'PENDING' && this.data.role === 'OWNER',
      canAccept: order.status === 'PENDING' && this.data.role === 'FEEDER',
      canStart: order.status === 'ACCEPTED' && this.data.role === 'FEEDER',
      canComplete: order.status === 'ACCEPTED' && this.data.role === 'OWNER',
      canReview: order.status === 'COMPLETED' && this.data.role === 'OWNER'
    })
  },

  loadOrder(id) {
    try {
      const { orderApi } = require('../../../utils/api')
      orderApi.list().then(res => {
        const found = (res.data || []).find(o => o.id == id)
        if (found) {
          this.setData({ order: found })
          this.syncActions(found)
        }
      }).catch(() => {})
    } catch (e) {}
  },

  doAccept() {
    const { orderApi } = require('../../../utils/api')
    orderApi.accept(this.data.order.id).then(() => {
      const order = { ...this.data.order, status: 'ACCEPTED' }
      this.setData({ order })
      this.syncActions(order)
      wx.showToast({ title: '接单成功', icon: 'success' })
    }).catch(() => {})
  },

  doCancel() {
    wx.showModal({
      title: '取消订单',
      content: '确定取消吗？',
      success: (res) => {
        if (res.confirm) {
          const { orderApi } = require('../../../utils/api')
          orderApi.cancel(this.data.order.id).then(() => {
            const order = { ...this.data.order, status: 'CANCELLED' }
            this.setData({ order })
            this.syncActions(order)
          }).catch(() => {})
        }
      }
    })
  },

  doStart() {
    const { orderApi } = require('../../../utils/api')
    orderApi.start(this.data.order.id).then(() => {
      const order = { ...this.data.order, status: 'IN_PROGRESS' }
      this.setData({ order })
      this.syncActions(order)
      wx.showToast({ title: '服务已开始', icon: 'success' })
    }).catch(() => {})
  },

  doComplete() {
    const { orderApi } = require('../../../utils/api')
    orderApi.complete(this.data.order.id).then(() => {
      const order = { ...this.data.order, status: 'COMPLETED' }
      this.setData({ order })
      this.syncActions(order)
      wx.showToast({ title: '订单已完成', icon: 'success' })
    }).catch(() => {})
  },

  goReview() {
    wx.navigateTo({ url: '/pages/reviews/create/create?orderId=' + this.data.order.id })
  }
})
