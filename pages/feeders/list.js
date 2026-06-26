Page({
  data: { feeders: [], loading: true, error: '' },
  onShow() {
    this.setData({ loading: true, error: '' })
    try {
      const { feederApi } = require('../../utils/api')
      feederApi.list().then(res => {
        this.setData({ feeders: res.data || [], loading: false })
      }).catch(() => {
        this.setData({ loading: false, error: '加载失败' })
      })
    } catch (e) {
      this.setData({ loading: false, error: '加载失败' })
    }
  },
  goDetail(e) {
    wx.navigateTo({ url: '/pages/feeders/detail/detail?id=' + e.currentTarget.dataset.id })
  }
})
