Page({
  data: {
    applyNotice: '当前注册的是平台统一账号。提交申请并通过审核后，系统会为你开通喂养员接单能力。',
    form: { realName: '', idCard: '', serviceArea: '', experience: '', description: '' },
    steps: [
      { id: 'fill', title: '填写资料', desc: '实名和服务区域' },
      { id: 'review', title: '等待审核', desc: '后台人工审核' },
      { id: 'open', title: '开通接单', desc: '审核通过后可接单' }
    ],
    submitting: false
  },

  onLoad() {
    if (wx.getStorageSync('feederApplied')) {
      this.setData({
        applyNotice: '你已提交申请，当前资料审核中。审核通过后，用本号登录将自动切换为喂养员模式。（如后台确实无记录，可再次提交）'
      })
    }
  },

  onInput(e) {
    this.setData({ ['form.' + e.currentTarget.dataset.field]: e.detail.value })
  },

  isValidIdCard(value) {
    return /(^\d{15}$)|(^\d{17}[\dXx]$)/.test((value || '').trim())
  },

  doSubmit() {
    if (!this.data.form.realName) { wx.showToast({ title: '请输入姓名', icon: 'none' }); return }
    if (!this.data.form.idCard) { wx.showToast({ title: '请输入身份证号', icon: 'none' }); return }
    if (!this.isValidIdCard(this.data.form.idCard)) { wx.showToast({ title: '请输入正确身份证号', icon: 'none' }); return }
    if (!this.data.form.serviceArea) { wx.showToast({ title: '请输入服务区域', icon: 'none' }); return }

    const { feederApi } = require('../../../utils/api')
    this.setData({ submitting: true })
    feederApi.apply(this.data.form).then(() => {
      this.setData({ submitting: false })
      wx.setStorageSync('feederApplied', true)
      wx.showToast({ title: '已提交，用本号登录即自动成为喂养员', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
    }).catch((err) => {
      this.setData({ submitting: false })
      // request.js 已在业务错误时 toast 了 err.message，这里补充日志和本地降级提示
      console.error('[apply] 提交失败', err)
      // 如果后端返回的是"已提交"，同步本地标记保持一致性
      if (err && (err.message || '').includes('已提交')) {
        wx.setStorageSync('feederApplied', true)
        this.setData({ applyNotice: '你已提交申请，当前资料审核中。如需修改资料请联系管理员，或等审核结果。' })
      }
    })
  }
})
