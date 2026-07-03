Page({
  data: {
    isRegister: false,
    phone: '',
    password: '',
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
    if (p.password.length < 6) return wx.showToast({ title: '\u5bc6\u7801\u81f3\u5c116\u4f4d', icon: 'none' })
    const registerPayload = {
      phone: p.phone,
      password: p.password
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
  },

  // 微信手机号一键授权登录/注册
  onGetPhoneNumber(e) {
    const { code, errMsg } = e.detail
    if (!code) {
      // 用户拒绝授权或授权失败
      console.log('[login] getPhoneNumber failed:', errMsg)
      return
    }
    console.log('[login] getPhoneNumber success, code:', code)
    wx.showLoading({ title: '\u6388\u6743\u767b\u5f55\u4e2d...', mask: true })
    const { authApi } = require('../../utils/api')
    authApi.phoneLogin({ code })
      .then(r => {
        wx.hideLoading()
        const data = r.data || {}
        if (data.token) {
          wx.setStorageSync('token', data.token)
          wx.setStorageSync('userInfo', data)
          wx.showToast({ title: '\u767b\u5f55\u6210\u529f', icon: 'success', duration: 800 })
          setTimeout(() => {
            wx.switchTab({ url: '/pages/index/index' })
          }, 300)
        } else {
          wx.showToast({ title: data.message || '\u767b\u5f55\u5931\u8d25', icon: 'none' })
        }
      })
      .catch(e => {
        wx.hideLoading()
        const msg = e.message || e.data?.message || '\u6388\u6743\u5931\u8d25\uff0c\u8bf7\u624b\u52a8\u767b\u5f55'
        console.log('[login] phoneLogin failed:', e)
        wx.showToast({ title: msg, icon: 'none' })
      })
  }
})
