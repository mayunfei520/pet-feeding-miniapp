function normalizeFeeder(item) {
  const safeText = (value, fallback) => {
    const text = value == null ? '' : String(value).trim()
    if (!text || /^\?+$/.test(text) || text.indexOf('???') >= 0) {
      return fallback
    }
    return text
  }

  const realName = safeText(item.realName, '待完善喂养员')
  return {
    ...item,
    realName,
    serviceArea: safeText(item.serviceArea, '服务区域待完善'),
    experience: safeText(item.experience, ''),
    description: safeText(item.description, ''),
    avatarText: realName.slice(0, 1) || '👤',
    ratingText: item.rating ? String(item.rating) : '5.0'
  }
}

Page({
  data: {
    feeder: {},
    reviews: [],
    role: 'OWNER',
    pageTheme: 'feeder-detail-owner',
    heroClass: 'card hero-card hero-owner',
    roleBadgeText: '宠物主人查看喂养员',
    actionText: '📋 选择该喂养员去预约',
    actionHint: '适合宠物主人直接发起预约',
    showPrimaryAction: true,
    showBottomAction: true,
    bottomActionText: '📋 选择该喂养员去预约'
  },

  onLoad(options) {
    const id = options.id
    const user = wx.getStorageSync('userInfo') || {}
    const role = user.role || 'OWNER'
    this.setData({ role })
    this.syncRoleTheme(role)
    try {
      const { feederApi } = require('../../../utils/api')
      feederApi.reviews(id).then(res => {
        const reviews = (res.data || []).map(item => ({
          ...item,
          starText: this.toStarText(item.rating),
          dateText: item.createdAt ? String(item.createdAt).slice(0, 10) : ''
        }))
        this.setData({ reviews })
      }).catch(() => {})

      feederApi.list().then(res => {
        const found = (res.data || []).find(f => f.id == id)
        if (found) {
          this.setData({ feeder: normalizeFeeder(found) })
        }
      }).catch(() => {})
    } catch (e) {}
  },

  syncRoleTheme(role) {
    if (role === 'FEEDER') {
      this.setData({
        pageTheme: 'feeder-detail-feeder',
        heroClass: 'card hero-card hero-feeder',
        roleBadgeText: '喂养员同行展示',
        actionText: '👀 查看预约入口样式',
        actionHint: '当前用于浏览同行资料和服务展示',
        showPrimaryAction: false,
        showBottomAction: false,
        bottomActionText: '📋 选择该喂养员去预约'
      })
      return
    }

    if (role === 'ADMIN') {
      this.setData({
        pageTheme: 'feeder-detail-admin',
        heroClass: 'card hero-card hero-admin',
        roleBadgeText: '管理员浏览视图',
        actionText: '🛠 后台审核请前往管理端',
        actionHint: '小程序端仅展示公开资料',
        showPrimaryAction: false,
        showBottomAction: false,
        bottomActionText: '🛠 后台审核请前往管理端'
      })
      return
    }

    this.setData({
      pageTheme: 'feeder-detail-owner',
      heroClass: 'card hero-card hero-owner',
      roleBadgeText: '宠物主人查看喂养员',
      actionText: '📋 选择该喂养员去预约',
      actionHint: '适合宠物主人直接发起预约',
      showPrimaryAction: true,
      showBottomAction: true,
      bottomActionText: '📋 选择该喂养员去预约'
    })
  },

  toStarText(n) {
    const stars = ['', '★', '★★', '★★★', '★★★★', '★★★★★']
    return stars[n] || '★★★★★'
  },

  goOrder() {
    if (this.data.role === 'ADMIN') {
      wx.showToast({ title: '管理员请前往后台处理', icon: 'none' })
      return
    }
    wx.navigateTo({ url: '/pages/orders/create/create' })
  }
})
