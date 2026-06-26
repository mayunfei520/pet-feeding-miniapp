const petApi = require('../../../utils/api').petApi

Page({
  data: {
    editId: null,
    form: { name: '', species: 'CAT', breed: '', age: '', weight: '', medicalNotes: '' },
    speciesOptions: [
      { value: 'CAT', label: '猫咪', emoji: '🐱' },
      { value: 'DOG', label: '狗狗', emoji: '🐶' },
      { value: 'OTHER', label: '其他', emoji: '🐹' }
    ]
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ editId: options.id })
      this.loadPet(options.id)
    }
  },

  async loadPet(id) {
    try {
      const res = await petApi.list()
      const pets = res.data || []
      const pet = pets.find(p => p.id == id)
      if (pet) {
        this.setData({
          form: {
            name: pet.name || '',
            species: pet.species || 'CAT',
            breed: pet.breed || '',
            age: pet.age != null ? String(pet.age) : '',
            weight: pet.weight != null ? String(pet.weight) : '',
            medicalNotes: pet.medicalNotes || ''
          }
        })
      }
    } catch (e) {}
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ ['form.' + field]: e.detail.value })
  },

  selectSpecies(e) {
    this.setData({ 'form.species': e.currentTarget.dataset.value })
  },

  doSave() {
    if (!this.data.form.name || !this.data.form.name.trim()) {
      wx.showToast({ title: '请输入宠物名字', icon: 'none' })
      return
    }
    const data = { ...this.data.form }
    data.name = data.name.trim()
    const ageVal = parseInt(data.age)
    data.age = isNaN(ageVal) ? null : ageVal
    const weightVal = parseFloat(data.weight)
    data.weight = isNaN(weightVal) ? null : weightVal

    const promise = this.data.editId
      ? petApi.update(this.data.editId, data)
      : petApi.add(data)

    promise.then(() => {
      wx.showToast({ title: '保存成功', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 1200)
    }).catch(() => {
      wx.showToast({ title: '保存失败，请重试', icon: 'none' })
    })
  }
})