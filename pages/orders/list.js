Page({
  data: {
    orders: [],
    filteredOrders: [],
    activeTab: 'all',
    loading: true,
    error: '',
    role: 'OWNER',
    periodMap: { AM: '上午', PM: '下午', EVENING: '晚上' },
    statusMap: { PENDING: '待接单', ACCEPTED: '进行中', COMPLETED: '已完成', CANCELLED: '已取消' }
  },

  onShow() {
    const user = wx.getStorageSync('userInfo') || {}
    this.setData({ role: user.role || 'OWNER' })
    this.loadOrders()
  },

  loadOrders() {
    this.setData({ loading: true, error: '' })
    try {
      const { orderApi } = require('../../utils/api')
      orderApi.list().then(res => {
        const orders = res.data || []
        this.setData({ orders, loading: false })
        this.applyFilter()
      }).catch(() => {
        this.setData({ loading: false, error: '加载失败' })
      })
    } catch (e) {
      this.setData({ loading: false, error: '加载失败' })
    }
  },

  applyFilter() {
    const { orders, activeTab } = this.data
    let filtered
    if (activeTab === 'pending') {
      filtered = orders.filter(o => ['PENDING', 'ACCEPTED'].includes(o.status))
    } else if (activeTab === 'done') {
      filtered = orders.filter(o => ['COMPLETED', 'CANCELLED'].includes(o.status))
    } else {
      filtered = orders
    }
    this.setData({ filteredOrders: filtered })
  },

  switchTab(e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab })
    this.applyFilter()
  },

  goDetail(e) {
    wx.navigateTo({ url: '/pages/orders/detail/detail?id=' + e.currentTarget.dataset.id })
  },

  goReview(e) {
    wx.navigateTo({ url: '/pages/reviews/create/create?orderId=' + e.currentTarget.dataset.id })
  },

  doComplete(e) {
    const id = e.currentTarget.dataset.id
    const { orderApi } = require('../../utils/api')
    orderApi.complete(id).then(() => this.loadOrders()).catch(() => {})
  },

  doCancel(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '取消订单',
      content: '确定要取消吗？',
      success: (res) => {
        if (res.confirm) {
          const { orderApi } = require('../../utils/api')
          orderApi.cancel(id).then(() => this.loadOrders()).catch(() => {})
        }
      }
    })
  }
})
