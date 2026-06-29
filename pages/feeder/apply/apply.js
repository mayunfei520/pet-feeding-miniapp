Page({
  data: {
    applyNotice: '当前注册的是平台统一账号。提交申请并通过审核后，系统会为你开通喂养员接单能力。',
    form: { realName: '', idCard: '', serviceArea: '', experience: '', description: '' }
  },

  onInput(e) {
    this.setData({ ['form.' + e.currentTarget.dataset.field]: e.detail.value })
  },

  doSubmit() {
    if (!this.data.form.realName) { wx.showToast({ title: '请输入姓名', icon: 'none' }); return }
    if (!this.data.form.idCard) { wx.showToast({ title: '请输入身份证号', icon: 'none' }); return }
    if (!this.data.form.serviceArea) { wx.showToast({ title: '请输入服务区域', icon: 'none' }); return }

    const { feederApi } = require('../../../utils/api')
    feederApi.apply(this.data.form).then(() => {
      wx.showToast({ title: '已提交，审核通过后可接单', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
    }).catch(() => {})
  }
})
