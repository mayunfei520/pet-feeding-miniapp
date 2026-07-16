Page({
  data: {
    isRegister: false,
    phone: '',
    password: '',
    code: '',
    gender: '',
    codeCountown: 0,
    codeBtnText: '获取验证码',
    passwordHint: '',
    passwordValid: false,
    pwdStrength: 0,
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
    this.setData({ isRegister: !this.data.isRegister, passwordHint: '', passwordValid: false })
    this.syncTabClass()
  },
  onPhoneInput(e) { this.setData({ phone: e.detail.value }) },
  onPasswordInput(e) {
    const password = e.detail.value
    this.setData({ password })
    this.checkPassword(password)
  },
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
  // 密码复杂度：8-20 位，必须同时包含大写字母、小写字母、数字
  // 同时计算强度等级(1弱/2中/3强)，供强度进度条展示
  checkPassword(pwd) {
    pwd = pwd || ''
    if (pwd.length === 0) {
      this.setData({ passwordHint: '', passwordValid: false, pwdStrength: 0 })
      return false
    }
    const lenOK = pwd.length >= 8 && pwd.length <= 20
    const hasUpper = /[A-Z]/.test(pwd)
    const hasLower = /[a-z]/.test(pwd)
    const hasDigit = /\d/.test(pwd)
    const score = (lenOK ? 1 : 0) + (hasUpper ? 1 : 0) + (hasLower ? 1 : 0) + (hasDigit ? 1 : 0)
    const strength = score <= 2 ? 1 : (score === 3 ? 2 : 3)
    let hint = ''
    if (!lenOK) hint = pwd.length < 8 ? '密码至少 8 位' : '密码最多 20 位'
    else if (!hasUpper) hint = '需包含大写字母'
    else if (!hasLower) hint = '需包含小写字母'
    else if (!hasDigit) hint = '需包含数字'
    const valid = lenOK && hasUpper && hasLower && hasDigit
    if (valid) hint = '密码强度合格'
    this.setData({ passwordHint: hint, passwordValid: valid, pwdStrength: strength })
    return valid
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
    if (!this.checkPassword(p.password)) {
      return wx.showToast({ title: this.data.passwordHint || '密码不符合要求', icon: 'none' })
    }
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
            password: '',
            code: '',
            passwordHint: '',
            passwordValid: false,
            pwdStrength: 0
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
        // 验证码为一次性消费，注册失败后已在后端失效，必须清空输入框并引导用户重新获取
        this.setData({ code: '' })
        if (message.indexOf('\u9a8c\u8bc1\u7801') >= 0) {
          wx.showToast({ title: '\u9a8c\u8bc1\u7801\u5df2\u5931\u6548\uff0c\u8bf7\u91cd\u65b0\u83b7\u53d6', icon: 'none' })
        } else {
          wx.showToast({ title: message, icon: 'none' })
        }
      })
  }
})
