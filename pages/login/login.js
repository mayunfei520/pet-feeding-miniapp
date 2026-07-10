Page({
  data: {
    isRegister: false,
    phone: '',
    password: '',
    code: '',
    gender: '',
    codeCountown: 0,
    codeBtnText: '获取验证码',
    registerNotice: '\u6ce8\u518c\u7684\u662f\u5e73\u53f0\u7edf\u4e00\u8d26\u53f7\uff0c\u9ed8\u8ba4\u8eab\u4efd\u4e3a\u5ba0\u7269\u4e3b\u4eba\u3002\u82e5\u4f60\u60f3\u63a5\u5355\uff0c\u8bf7\u767b\u5f55\u540e\u63d0\u4ea4\u5582\u517b\u5458\u8ba4\u8bc1\u7533\u8bf7\u3002',
    loginTabClass: 'tab active',
    registerTabClass: 'tab'
  },
  onLoad() {
    const token = wx.getStorageSync('token')
    if (token) {
      wx.switchTab({ url: '/pages/index/index' })
    }
  },
  onUnload() {
    if (this._timer) { clearInterval(this._timer); this._timer = null }
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
  onCodeInput(e) { this.setData({ code: e.detail.value }) },
  onGenderTap(e) { this.setData({ gender: e.currentTarget.dataset.g }) },
  sendCode() {
    const phone = this.data.phone
    if (!this.isValidPhone(phone)) {
      return wx.showToast({ title: '\u8bf7\u5148\u8f93\u5165\u6b63\u786e\u624b\u673a\u53f7', icon: 'none' })
    }
    const { authApi } = require('../../utils/api')
    wx.showLoading({ title: '\u53d1\u9001\u4e2d...', mask: true })
    authApi.sendCode({ phone })
      .then(r => {
        wx.hideLoading()
        const code = r.data
        if (code) {
          // mock 模式：后端把验证码直接返回，自动填入输入框（真实短信模式下 r.data 为空，不会自动填）
          this.setData({ code })
          wx.showToast({
            title: '\u9a8c\u8bc1\u7801\u5df2\u81ea\u52a8\u586b\u5165',
            icon: 'none',
            duration: 2000
          })
        } else {
          wx.showToast({ title: '\u9a8c\u8bc1\u7801\u5df2\u53d1\u9001', icon: 'none' })
        }
        this.startCodeCountown()
      })
      .catch(e => {
        wx.hideLoading()
        wx.showToast({ title: e.message || e.data?.message || '\u53d1\u9001\u5931\u8d25', icon: 'none' })
      })
  },
  startCodeCountown() {
    this.setData({ codeCountown: 60, codeBtnText: '60s' })
    this._timer = setInterval(() => {
      const left = this.data.codeCountown - 1
      if (left <= 0) {
        clearInterval(this._timer)
        this._timer = null
        this.setData({ codeCountown: 0, codeBtnText: '\u91cd\u65b0\u83b7\u53d6' })
      } else {
        this.setData({ codeCountown: left, codeBtnText: left + 's' })
      }
    }, 1000)
  },
  isValidPhone(phone) {
    return /^1\d{10}$/.test((phone || '').trim())
  },
  doLogin() {
    const p = this.data
    if (!p.phone || !p.password) return wx.showToast({ title: '\u8bf7\u586b\u5b8c\u6574\u4fe1\u606f', icon: 'none' })
    if (!this.isValidPhone(p.phone)) return wx.showToast({ title: '\u8bf7\u8f93\u5165\u6b63\u786e\u624b\u673a\u53f7', icon: 'none' })
    console.log('[login] doLogin input', {
      phone: p.phone,
      passwordLength: p.password.length
    })
    wx.showLoading({ title: '\u767b\u5f55\u4e2d...', mask: true })
    require('../../utils/api').authApi.passwordLogin({ phone: p.phone, password: p.password })
      .then(r => {
        wx.hideLoading()
        wx.setStorageSync('token', r.data.token)
        wx.setStorageSync('userInfo', r.data)
        wx.switchTab({ url: '/pages/index/index' })
      })
      .catch(e => {
        const message = e.message || e.data?.message || '\u767b\u5f55\u5931\u8d25'
        wx.hideLoading()
        console.log('[login] login failed', e)
        wx.showToast({ title: message, icon: 'none' })
      })
  },
  doRegister() {
    const p = this.data
    if (!p.phone || !p.password) return wx.showToast({ title: '\u8bf7\u586b\u5b8c\u6574\u4fe1\u606f', icon: 'none' })
    if (!this.isValidPhone(p.phone)) return wx.showToast({ title: '\u8bf7\u8f93\u5165\u6b63\u786e\u624b\u673a\u53f7', icon: 'none' })
    if (!p.code || p.code.length !== 6) return wx.showToast({ title: '\u8bf7\u586b\u5199\u9a8c\u8bc1\u7801', icon: 'none' })
    if (p.password.length < 6) return wx.showToast({ title: '\u5bc6\u7801\u81f3\u5c116\u4f4d', icon: 'none' })
    const registerPayload = {
      phone: p.phone,
      password: p.password,
      code: p.code,
      gender: p.gender || null
    }
    console.log('[login] doRegister input', {
      phone: p.phone,
      passwordLength: p.password.length,
      payload: registerPayload
    })
    wx.showLoading({ title: '\u6ce8\u518c\u4e2d...', mask: true })
    require('../../utils/api').authApi.register(registerPayload)
      .then(r => {
        const data = r && r.data ? r.data : {}
        if (!data.token) {
          wx.hideLoading()
          wx.showToast({ title: '\u6ce8\u518c\u6210\u529f\uff0c\u8bf7\u76f4\u63a5\u767b\u5f55', icon: 'success', duration: 1200 })
          this.setData({
            isRegister: false,
            password: ''
          })
          this.syncTabClass()
          return
        }
        wx.setStorageSync('token', data.token)
        wx.setStorageSync('userInfo', data)
        wx.hideLoading()
        wx.showToast({ title: '\u6ce8\u518c\u6210\u529f', icon: 'success', duration: 800 })
        setTimeout(() => {
          wx.switchTab({ url: '/pages/index/index' })
        }, 300)
      })
      .catch(e => {
        const message = e.message || e.data?.message || '\u6ce8\u518c\u5931\u8d25'
        wx.hideLoading()
        console.log('[login] register failed', e)
        wx.showToast({ title: message, icon: 'none' })
      })
  }
})
