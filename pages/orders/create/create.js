function normalizeFeeder(item, active) {
  const safeText = (value, fallback) => {
    const text = value == null ? '' : String(value).trim()
    if (!text || /^\?+$/.test(text) || text.indexOf('???') >= 0) {
      return fallback
    }
    return text
  }

  const realName = safeText(item.realName, '待完善喂养员')
  return {
    ...item,
    realName,
    serviceArea: safeText(item.serviceArea, '服务区域待完善'),
    experience: safeText(item.experience, ''),
    description: safeText(item.description, ''),
    avatarText: realName.slice(0, 1) || '👤',
    cardClass: active ? 'feeder-opt active' : 'feeder-opt'
  }
}

Page({
  data: {
    pets: [], feeders: [],
    petIndex: -1, feederIndex: -1,
    petLabels: [], today: '',
    form: { serviceDate: '', servicePeriod: 'AM', address: '', price: '', notes: '' },
    periodOptions: [
      { value: 'AM', label: '上午', icon: '🌅', className: 'period active' },
      { value: 'PM', label: '下午', icon: '☀️', className: 'period' },
      { value: 'EVENING', label: '晚上', icon: '🌙', className: 'period' }
    ]
  },

  onShow() {
    const today = new Date()
    const ds = today.getFullYear() + '-' +
      String(today.getMonth() + 1).padStart(2, '0') + '-' +
      String(today.getDate()).padStart(2, '0')
    this.setData({ today: ds })

    const { petApi, feederApi } = require('../../../utils/api')
    petApi.list().then(res => {
      const pets = res.data || []
      this.setData({
        pets,
        petLabels: pets.map(p => p.name + '（' + (p.breed || '未知品种') + '）')
      })
    }).catch(() => {})

    feederApi.list().then(res => {
      const feeders = (res.data || []).map((item, index) => normalizeFeeder(item, this.data.feederIndex === index))
      this.setData({ feeders })
    }).catch(() => {})
  },

  syncFeederCards() {
    this.setData({
      feeders: this.data.feeders.map((item, index) => normalizeFeeder(item, this.data.feederIndex === index))
    })
  },

  syncPeriods() {
    this.setData({
      periodOptions: this.data.periodOptions.map(item => ({
        ...item,
        className: this.data.form.servicePeriod === item.value ? 'period active' : 'period'
      }))
    })
  },

  onPetChange(e) {
    this.setData({ petIndex: parseInt(e.detail.value, 10) })
  },

  pickFeeder(e) {
    const idx = parseInt(e.currentTarget.dataset.index, 10)
    this.setData({ feederIndex: idx === this.data.feederIndex ? -1 : idx })
    this.syncFeederCards()
  },

  onDateChange(e) {
    this.setData({ 'form.serviceDate': e.detail.value })
  },

  onPeriod(e) {
    this.setData({ 'form.servicePeriod': e.currentTarget.dataset.v })
    this.syncPeriods()
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

    const { orderApi } = require('../../../utils/api')
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
