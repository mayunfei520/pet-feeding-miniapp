Page({
  data: {
    pets: [], feeders: [],
    petIndex: -1, feederIndex: -1,
    petLabels: [], feederLabels: [],
    form: { serviceDate: '', servicePeriod: 'AM', address: '', price: '', notes: '' }
  },

  onShow() {
    const { petApi, feederApi } = require('../../utils/api')
    petApi.list().then(res => {
      const pets = res.data || []
      this.setData({
        pets,
        petLabels: pets.map(p => p.name + '（' + (p.breed || '未知') + '）')
      })
    }).catch(() => {})
    feederApi.list().then(res => {
      const feeders = res.data || []
      this.setData({
        feeders,
        feederLabels: feeders.map(f => f.realName + ' - ' + f.serviceArea)
      })
    }).catch(() => {})
  },

  onPetChange(e) { this.setData({ petIndex: parseInt(e.detail.value) }) },
  onFeederChange(e) { this.setData({ feederIndex: parseInt(e.detail.value) }) },
  onDateChange(e) { this.setData({ 'form.serviceDate': e.detail.value }) },
  onPeriod(e) { this.setData({ 'form.servicePeriod': e.currentTarget.dataset.v }) },
  onInput(e) { this.setData({ ['form.' + e.currentTarget.dataset.field]: e.detail.value }) },

  doSubmit() {
    if (this.data.petIndex < 0) { wx.showToast({ title: '请选择宠物', icon: 'none' }); return }
    if (this.data.feederIndex < 0) { wx.showToast({ title: '请选择喂养员', icon: 'none' }); return }
    if (!this.data.form.serviceDate) { wx.showToast({ title: '请选择日期', icon: 'none' }); return }
    if (!this.data.form.address) { wx.showToast({ title: '请输入地址', icon: 'none' }); return }

    const { orderApi } = require('../../utils/api')
    const data = {
      petId: this.data.pets[this.data.petIndex].id,
      feederId: this.data.feeders[this.data.feederIndex].id,
      ...this.data.form,
      price: parseFloat(this.data.form.price) || 0
    }
    orderApi.create(data).then(() => {
      wx.showToast({ title: '创建成功' })
      setTimeout(() => wx.switchTab({ url: '/pages/orders/list' }), 1500)
    }).catch(() => {})
  }
})
