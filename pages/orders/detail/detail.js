Page({
  data: {
    order: {},
    role: 'OWNER',
    periodMap: { AM: '上午', PM: '下午', EVENING: '晚上' },
    statusMap: { PENDING: '待接单', ACCEPTED: '进行中', COMPLETED: '已完成', CANCELLED: '已取消' }
  },

  onLoad(options) {
    const user = wx.getStorageSync('userInfo') || {}
    this.setData({ role: user.role || 'OWNER' })

    try {
      const { orderApi } = require('../../utils/api')
      orderApi.list().then(res => {
        const found = (res.data || []).find(o => o.id == options.id)
        if (found) this.setData({ order: found })
      }).catch(() => {})
    } catch (e) {}
  },

  doCancel() {
    wx.showModal({
      title: '取消订单',
      content: '确定取消吗？',
      success: (res) => {
        if (res.confirm) {
          const { orderApi } = require('../../utils/api')
          orderApi.cancel(this.data.order.id).then(() => {
            this.setData({ 'order.status': 'CANCELLED' })
          }).catch(() => {})
        }
      }
    })
  },

  goReview() {
    wx.navigateTo({ url: '/pages/reviews/create/create?orderId=' + this.data.order.id })
  }
})
