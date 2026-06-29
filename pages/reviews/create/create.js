Page({
  data: {
    orderId: null,
    rating: 5,
    content: '',
    stars: []
  },

  onLoad(options) {
    this.setData({ orderId: options.orderId })
    this.syncStars()
  },

  syncStars() {
    const stars = [1, 2, 3, 4, 5].map(value => ({
      value,
      text: value <= this.data.rating ? '★' : '☆',
      className: value <= this.data.rating ? 'star on' : 'star'
    }))
    this.setData({ stars })
  },

  setRating(e) {
    this.setData({ rating: parseInt(e.currentTarget.dataset.v, 10) })
    this.syncStars()
  },

  onContent(e) { this.setData({ content: e.detail.value }) },

  doSubmit() {
    if (!this.data.content) { wx.showToast({ title: '请输入评价', icon: 'none' }); return }
    const { reviewApi } = require('../../../utils/api')
    reviewApi.create({
      orderId: this.data.orderId,
      rating: this.data.rating,
      content: this.data.content
    }).then(() => {
      wx.showToast({ title: '评价成功' })
      setTimeout(() => wx.navigateBack(), 1500)
    }).catch(() => {})
  }
})
