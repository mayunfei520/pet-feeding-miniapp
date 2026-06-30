Page({
  data: {
    isRegister: false,
    phone: '',
    password: '',
    registerNotice: '注册的是平台统一账号，默认身份为宠物主人。若你想接单，请登录后提交喂养员认证申请。',
    loginTabClass: 'tab active',
    registerTabClass: 'tab'
  },

  onLoad() {
    wx.removeStorageSync('token')
    wx.removeStorageSync('userInfo')
    if (wx.getStorageSync('token')) {
      wx.reLaunch({ url: '/pages/index/index' })
    }
  },

  syncTabClass() {
    this.setData({
      loginTabClass: this.data.isRegister ? 'tab' : 'tab active',
      registerTabClass: this.data.isRegister ? 'tab active' : 'tab'
    })
  },

  switchTab() {
    this.setData({ isRegister: !this.data.isRegister })
    this.syncTabClass()
  },

  onPhoneInput(e) { this.setData({ phone: e.detail.value }) },
  onPasswordInput(e) { this.setData({ password: e.detail.value }) },

  isValidPhone(phone) {
    return /^1\d{10}$/.test((phone || '').trim())
  },

  doLogin() {
    const p = this.data
    if (!p.phone || !p.password) return wx.showToast({ title: '请填完整信息', icon: 'none' })
    if (!this.isValidPhone(p.phone)) return wx.showToast({ title: '请输入正确手机号', icon: 'none' })
    console.log('[login] doLogin input', {
      phone: p.phone,
      passwordLength: p.password.length
    })
    wx.showLoading({ title: '登录中...', mask: true })
    require('../../utils/api').authApi.passwordLogin({ phone: p.phone, password: p.password })
      .then(r => { wx.hideLoading(); wx.setStorageSync('token', r.data.token); wx.setStorageSync('userInfo', r.data); wx.reLaunch({ url: '/pages/index/index' }) })
      .catch(e => {
        const message = e.message || e.data?.message || '登录失败'
        wx.hideLoading()
        wx.showToast({ title: message, icon: 'none' })
      })
  },

  doRegister() {
    const p = this.data
    if (!p.phone || !p.password) return wx.showToast({ title: '请填完整信息', icon: 'none' })
    if (!this.isValidPhone(p.phone)) return wx.showToast({ title: '请输入正确手机号', icon: 'none' })
    if (p.password.length < 6) return wx.showToast({ title: '密码至少6位', icon: 'none' })
    const registerPayload = {
      phone: p.phone,
      password: p.password
    }
    console.log('[login] doRegister input', {
      phone: p.phone,
      passwordLength: p.password.length,
      payload: registerPayload
    })
    wx.showLoading({ title: '注册中...', mask: true })
    require('../../utils/api').authApi.register(registerPayload)
      .then(r => {
        wx.hideLoading()
        wx.setStorageSync('token', r.data.token)
        wx.setStorageSync('userInfo', r.data)
        wx.showToast({ title: '注册成功，已进入宠物主人模式', icon: 'none' })
        setTimeout(() => wx.reLaunch({ url: '/pages/index/index' }), 1200)
      })
      .catch(e => {
        const message = e.message || e.data?.message || '注册失败'
        wx.hideLoading()
        wx.showToast({ title: message, icon: 'none' })
      })
  }
})
