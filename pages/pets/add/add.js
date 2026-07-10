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

    // 名字：必填，1-20 字
    const name = (form.name || '').trim()
    if (!name) {
      wx.showToast({ title: '请输入宠物名字', icon: 'none' })
      return
    }
    if (name.length > 20) {
      wx.showToast({ title: '名字不能超过20个字', icon: 'none' })
      return
    }

    // 种类：必须是合法枚举
    const validSpecies = ['CAT', 'DOG', 'OTHER']
    if (!validSpecies.includes(form.species)) {
      wx.showToast({ title: '请选择宠物种类', icon: 'none' })
      return
    }

    // 品种：选填，限长 20
    const breed = (form.breed || '').trim()
    if (breed.length > 20) {
      wx.showToast({ title: '品种名称不能超过20个字', icon: 'none' })
      return
    }

    // 年龄：选填，0-50 岁
    let age = null
    if (form.age !== '' && form.age != null) {
      const ageVal = Number(form.age)
      if (Number.isNaN(ageVal) || ageVal < 0 || ageVal > 50) {
        wx.showToast({ title: '年龄需在 0-50 岁之间', icon: 'none' })
        return
      }
      age = Math.floor(ageVal)
    }

    // 体重：选填，0-200 kg
    let weight = null
    if (form.weight !== '' && form.weight != null) {
      const weightVal = Number(form.weight)
      if (Number.isNaN(weightVal) || weightVal < 0 || weightVal > 200) {
        wx.showToast({ title: '体重需在 0-200 kg 之间', icon: 'none' })
        return
      }
      weight = weightVal
    }

    // 医疗备注：选填，限长 200
    const medicalNotes = (form.medicalNotes || '').trim()
    if (medicalNotes.length > 200) {
      wx.showToast({ title: '医疗备注不能超过200个字', icon: 'none' })
      return
    }

    const data = {
      ...form,
      name,
      breed,
      medicalNotes,
      age,
      weight
    }

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
