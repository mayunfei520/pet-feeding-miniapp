const petApi = require('../../../utils/api').petApi

Page({
  data: {
    editId: null,
    form: { name: '', species: 'CAT', breed: '', age: '', weight: '', medicalNotes: '' },
    speciesMap: { CAT: '猫', DOG: '狗', OTHER: '其他' },
    speciesOptions: [
      { value: 'CAT', label: '🐱 猫' },
      { value: 'DOG', label: '🐶 狗' },
      { value: 'OTHER', label: '🐹 其他' }
    ],
    showPicker: false
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

  showSpecies() { this.setData({ showPicker: true }) },
  hidePicker() { this.setData({ showPicker: false }) },

  selectSpecies(e) {
    this.setData({ 'form.species': e.currentTarget.dataset.value, showPicker: false })
  },

  doSave() {
    if (!this.data.form.name) {
      wx.showToast({ title: '请输入名字', icon: 'none' })
      return
    }
    const data = { ...this.data.form }
    // 用 isNaN 判断避免 0 值被误判为 null
    const ageVal = parseInt(data.age)
    data.age = isNaN(ageVal) ? null : ageVal
    const weightVal = parseFloat(data.weight)
    data.weight = isNaN(weightVal) ? null : weightVal

    const promise = this.data.editId
      ? petApi.update(this.data.editId, data)
      : petApi.add(data)

    promise.then(() => {
      wx.showToast({ title: '保存成功' })
      setTimeout(() => wx.navigateBack(), 1500)
    }).catch(() => {})
  }
})
