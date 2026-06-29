Page({
  data: {
    isRegister: false,
    phone: '',
    password: '',
    nickname: '',
    registerNotice: '注册的是平台统一账号，默认身份为宠物主人。若你想接单，请登录后提交喂养员认证申请。',
    loginTabClass: 'tab active',
    registerTabClass: 'tab'
  },

  onLoad() {
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
  onNicknameInput(e) { this.setData({ nickname: e.detail.value }) },

  doLogin() {
    const p = this.data
    if (!p.phone || !p.password) return wx.showToast({ title: '请填完整信息', icon: 'none' })
    wx.showLoading({ title: '登录中...', mask: true })
    require('../../utils/api').authApi.passwordLogin({ phone: p.phone, password: p.password })
      .then(r => { wx.hideLoading(); wx.setStorageSync('token', r.data.token); wx.setStorageSync('userInfo', r.data); wx.reLaunch({ url: '/pages/index/index' }) })
      .catch(e => { wx.hideLoading(); wx.showToast({ title: e.data?.message || '登录失败', icon: 'none' }) })
  },

  doRegister() {
    const p = this.data
    if (!p.phone || !p.password) return wx.showToast({ title: '请填完整信息', icon: 'none' })
    if (p.password.length < 6) return wx.showToast({ title: '密码至少6位', icon: 'none' })
    wx.showLoading({ title: '注册中...', mask: true })
    require('../../utils/api').authApi.register({ phone: p.phone, password: p.password, nickname: p.nickname || p.phone })
      .then(r => {
        wx.hideLoading()
        wx.setStorageSync('token', r.data.token)
        wx.setStorageSync('userInfo', r.data)
        wx.showToast({ title: '注册成功，已进入宠物主人模式', icon: 'none' })
        setTimeout(() => wx.reLaunch({ url: '/pages/index/index' }), 1200)
      })
      .catch(e => { wx.hideLoading(); wx.showToast({ title: e.data?.message || '注册失败', icon: 'none' }) })
  }
})
