Page({
  data: { feeder: {}, reviews: [] },

  onLoad(options) {
    const id = options.id
    try {
      const { feederApi } = require('../../utils/api')
      feederApi.reviews(id).then(res => {
        this.setData({ reviews: res.data || [] })
      }).catch(() => {})
      feederApi.list().then(res => {
        const found = (res.data || []).find(f => f.id == id)
        if (found) this.setData({ feeder: found })
      }).catch(() => {})
    } catch (e) {}
  },

  starStr(n) {
    const stars = ['','★','★★','★★★','★★★★','★★★★★']
    return stars[n] || '★★★★★'
  },

  goOrder() {
    wx.navigateTo({ url: '/pages/orders/create/create' })
  }
})