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
    statusMap: { PENDING: '待报价', QUOTED: '已报价待确认', ACCEPTED: '已确认待服务', IN_PROGRESS: '进行中', COMPLETED: '已完成', CANCELLED: '已取消' },
    statusDescMap: { PENDING: '需求已提交，等待喂养员报价', QUOTED: '喂养员已报价，请确认是否接受', ACCEPTED: '您已确认报价，等待喂养员服务', IN_PROGRESS: '服务进行中', COMPLETED: '服务已完成', CANCELLED: '订单已取消' },
    canCancel: false,
    canAccept: false,
    canStart: false,
    canReview: false,
    canComplete: false,
    canQuote: false,
    canConfirm: false,
    canReject: false,
    statusLower: ''
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
      canCancel: (order.status === 'PENDING' || order.status === 'QUOTED') && this.data.role === 'OWNER',
      canAccept: order.status === 'PENDING' && this.data.role === 'FEEDER',
      canQuote: order.status === 'PENDING' && this.data.role === 'FEEDER',
      canConfirm: order.status === 'QUOTED' && this.data.role === 'OWNER',
      canReject: order.status === 'QUOTED' && this.data.role === 'OWNER',
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
          this.setData({ order: found, statusLower: (found.status || '').toLowerCase() })
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

  doQuote() {
    wx.showModal({
      title: '填报价金额',
      editable: true,
      placeholderText: '请输入服务费用（元）',
      success: (res) => {
        if (!res.confirm) return
        const price = parseFloat(res.content)
        if (!(price > 0)) {
          wx.showToast({ title: '请输入大于0的金额', icon: 'none' })
          return
        }
        const { orderApi } = require('../../../utils/api')
        orderApi.quote(this.data.order.id, { price }).then(() => {
          const order = { ...this.data.order, status: 'QUOTED', price }
          this.setData({ order })
          this.syncActions(order)
          wx.showToast({ title: '报价已提交', icon: 'success' })
        }).catch((e) => {
          wx.showToast({ title: e.message || '报价失败', icon: 'none' })
        })
      }
    })
  },

  doConfirm() {
    wx.showModal({
      title: '确认报价',
      content: '确认接受该喂养员的报价并开始服务？',
      success: (res) => {
        if (!res.confirm) return
        const { orderApi } = require('../../../utils/api')
        orderApi.confirm(this.data.order.id).then(() => {
          const order = { ...this.data.order, status: 'ACCEPTED' }
          this.setData({ order })
          this.syncActions(order)
          wx.showToast({ title: '已确认，等待服务', icon: 'success' })
        }).catch((e) => {
          wx.showToast({ title: e.message || '操作失败', icon: 'none' })
        })
      }
    })
  },

  doReject() {
    wx.showModal({
      title: '拒绝报价',
      content: '拒绝后喂养员可重新报价，确定吗？',
      success: (res) => {
        if (!res.confirm) return
        const { orderApi } = require('../../../utils/api')
        orderApi.reject(this.data.order.id).then(() => {
          const order = { ...this.data.order, status: 'PENDING' }
          this.setData({ order })
          this.syncActions(order)
          wx.showToast({ title: '已拒绝，等待重报', icon: 'none' })
        }).catch((e) => {
          wx.showToast({ title: e.message || '操作失败', icon: 'none' })
        })
      }
    })
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
