const petApi = require('../../../utils/api').petApi

Page({
  data: {
    editId: null,
    form: {
      name: '',
      species: 'CAT',
      breed: '',
      age: '',
      weight: '',
      vaccinated: false,
      medicalNotes: ''
    },
    speciesOptions: [],
    previewAvatarStyle: 'background: linear-gradient(135deg, #a78bfa, #7c3aed)',
    previewEmoji: '🐱',
    previewName: '宠物名字',
    previewMeta: '品种 · ?岁 · ?kg'
  },

  onLoad(options) {
    this.syncPreview()
    this.syncSpeciesOptions()
    if (options.id) {
      this.setData({ editId: options.id })
      this.loadPet(options.id)
    }
  },

  getSpeciesOptions(selected) {
    return [
      { value: 'CAT', label: '猫咪', emoji: '🐱', className: selected === 'CAT' ? 'species-card active' : 'species-card' },
      { value: 'DOG', label: '狗狗', emoji: '🐶', className: selected === 'DOG' ? 'species-card active' : 'species-card' },
      { value: 'OTHER', label: '其他', emoji: '🐹', className: selected === 'OTHER' ? 'species-card active' : 'species-card' }
    ]
  },

  syncSpeciesOptions() {
    this.setData({ speciesOptions: this.getSpeciesOptions(this.data.form.species) })
  },

  syncPreview() {
    const species = this.data.form.species
    let previewAvatarStyle = 'background: linear-gradient(135deg, #34d399, #059669)'
    let previewEmoji = '🐾'
    if (species === 'DOG') {
      previewAvatarStyle = 'background: linear-gradient(135deg, #fbbf24, #f59e0b)'
      previewEmoji = '🐶'
    } else if (species === 'CAT') {
      previewAvatarStyle = 'background: linear-gradient(135deg, #a78bfa, #7c3aed)'
      previewEmoji = '🐱'
    } else if (species === 'OTHER') {
      previewAvatarStyle = 'background: linear-gradient(135deg, #34d399, #059669)'
      previewEmoji = '🐹'
    }

    this.setData({
      previewAvatarStyle,
      previewEmoji,
      previewName: this.data.form.name || '宠物名字',
      previewMeta: (this.data.form.breed || '品种') + ' · ' + (this.data.form.age || '?') + '岁 · ' + (this.data.form.weight || '?') + 'kg'
    })
  },

  async loadPet(id) {
    try {
      const res = await petApi.list()
      const pet = (res.data || []).find(item => String(item.id) === String(id))
      if (!pet) {
        wx.showToast({ title: '未找到宠物信息', icon: 'none' })
        return
      }

      this.setData({
        form: {
          name: pet.name || '',
          species: pet.species || 'CAT',
          breed: pet.breed || '',
          age: pet.age != null ? String(pet.age) : '',
          weight: pet.weight != null ? String(pet.weight) : '',
          vaccinated: !!pet.vaccinated,
          medicalNotes: pet.medicalNotes || ''
        }
      })
      this.syncSpeciesOptions()
      this.syncPreview()
    } catch (e) {
      wx.showToast({ title: '加载宠物失败', icon: 'none' })
    }
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ ['form.' + field]: e.detail.value })
    this.syncPreview()
  },

  selectSpecies(e) {
    this.setData({ 'form.species': e.currentTarget.dataset.value })
    this.syncSpeciesOptions()
    this.syncPreview()
  },

  toggleVaccinated(e) {
    this.setData({ 'form.vaccinated': !!e.detail.value })
  },

  doSave() {
    const form = this.data.form
    if (!form.name || !form.name.trim()) {
      wx.showToast({ title: '请输入宠物名字', icon: 'none' })
      return
    }

    const data = {
      ...form,
      name: form.name.trim(),
      breed: (form.breed || '').trim(),
      medicalNotes: (form.medicalNotes || '').trim()
    }

    const ageVal = parseInt(data.age, 10)
    data.age = Number.isNaN(ageVal) ? null : ageVal

    const weightVal = parseFloat(data.weight)
    data.weight = Number.isNaN(weightVal) ? null : weightVal

    const request = this.data.editId
      ? petApi.update(this.data.editId, data)
      : petApi.add(data)

    request.then(() => {
      wx.showToast({ title: '保存成功', icon: 'success' })
      setTimeout(() => {
        if (this.data.editId) {
          wx.navigateBack()
          return
        }
        wx.switchTab({ url: '/pages/index/index' })
      }, 1200)
    }).catch(() => {
      wx.showToast({ title: '保存失败，请重试', icon: 'none' })
    })
  }
})
