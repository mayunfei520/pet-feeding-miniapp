Page({
  data: {
    pets: [], feeders: [],
    petIndex: -1, feederIndex: -1,
    petLabels: [], today: '',
    form: { serviceDate: '', servicePeriod: 'AM', address: '', price: '', notes: '' }
  },

  onShow() {
    const today = new Date()
    const ds = today.getFullYear() + '-' +
      String(today.getMonth() + 1).padStart(2, '0') + '-' +
      String(today.getDate()).padStart(2, '0')
    this.setData({ today: ds })

    const { petApi, feederApi } = require('../../utils/api')
    // 只加载我的宠物
    petApi.list().then(res => {
      const pets = res.data || []
      this.setData({
        pets,
        petLabels: pets.map(p => p.name + '（' + (p.breed || '未知品种') + '）')
      })
    }).catch(() => {})

    feederApi.list().then(res => {
      this.setData({ feeders: res.data || [] })
    }).catch(() => {})
  },

  // 宠物选择
  onPetChange(e) {
    this.setData({ petIndex: parseInt(e.detail.value) })
  },

  // 喂养员选择（卡片点击）
  pickFeeder(e) {
    const idx = parseInt(e.currentTarget.dataset.index)
    this.setData({ feederIndex: idx === this.data.feederIndex ? -1 : idx })
  },

  onDateChange(e) {
    this.setData({ 'form.serviceDate': e.detail.value })
  },

  onPeriod(e) {
    this.setData({ 'form.servicePeriod': e.currentTarget.dataset.v })
  },

  onInput(e) {
    this.setData({ ['form.' + e.currentTarget.dataset.field]: e.detail.value })
  },

  goAddPet() {
    wx.navigateTo({ url: '/pages/pets/add/add' })
  },

  doSubmit() {
    if (this.data.petIndex < 0) { wx.showToast({ title: '请选择你的宠物', icon: 'none' }); return }
    if (this.data.feederIndex < 0) { wx.showToast({ title: '请选择喂养员', icon: 'none' }); return }
    if (!this.data.form.serviceDate) { wx.showToast({ title: '请选择日期', icon: 'none' }); return }
    if (!this.data.form.address.trim()) { wx.showToast({ title: '请输入地址', icon: 'none' }); return }

    const { orderApi } = require('../../utils/api')
    const data = {
      petId: this.data.pets[this.data.petIndex].id,
      feederId: this.data.feeders[this.data.feederIndex].id,
      ...this.data.form,
      price: parseFloat(this.data.form.price) || 0,
      address: this.data.form.address.trim()
    }
    orderApi.create(data).then(() => {
      wx.showToast({ title: '预约成功', icon: 'success' })
      setTimeout(() => wx.switchTab({ url: '/pages/orders/list' }), 1200)
    }).catch(() => {
      wx.showToast({ title: '预约失败，请重试', icon: 'none' })
    })
  }
})