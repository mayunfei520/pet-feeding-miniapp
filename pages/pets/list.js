Page({
  data: {
    pets: [], loading: true, error: '',
    speciesLabel: { CAT: '猫咪', DOG: '狗狗', '猫': '猫咪', '狗': '狗狗' },
    speciesEmoji: { CAT: '🐱', DOG: '🐶', '猫': '🐱', '狗': '🐶' },
    speciesColor: { CAT: 'linear-gradient(135deg, #a78bfa, #7c3aed)', DOG: 'linear-gradient(135deg, #fbbf24, #f59e0b)', '猫': 'linear-gradient(135deg, #a78bfa, #7c3aed)', '狗': 'linear-gradient(135deg, #fbbf24, #f59e0b)' }
  },

  onShow() {
    this.loadPets()
  },

  loadPets() {
    this.setData({ loading: true, error: '' })
    try {
      const { petApi } = require('../../utils/api')
      petApi.list().then(res => {
        this.setData({ pets: res.data || [], loading: false })
      }).catch(() => {
        this.setData({ loading: false, error: '加载失败，下拉刷新重试' })
      })
    } catch (e) {
      this.setData({ loading: false, error: '加载失败' })
    }
  },

  onPullDownRefresh() {
    this.loadPets()
    setTimeout(() => wx.stopPullDownRefresh(), 1000)
  },

  goAdd() {
    wx.navigateTo({ url: '/pages/pets/add/add' })
  },

  goEdit(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/pets/add/add?id=' + id })
  },

  doRemove(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认删除',
      content: '确定删除这只宠物吗？',
      success: (res) => {
        if (res.confirm) {
          const { petApi } = require('../../utils/api')
          petApi.remove(id).then(() => this.loadPets()).catch(() => {})
        }
      }
    })
  }
})
