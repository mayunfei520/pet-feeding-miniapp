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
    feeders: [],
    loading: true,
    error: '',
    role: 'OWNER',
    pageTheme: 'feeders-owner',
    headerCardClass: 'header-card header-owner',
    roleBadgeText: '宠物主人找喂养员',
    pageTitle: '挑选合适的喂养员',
    pageDesc: '按服务区域和经验选择靠谱的上门伙伴'
  },
  onShow() {
    const user = wx.getStorageSync('userInfo') || {}
    const role = user.role || 'OWNER'
    this.setData({ role })
    this.syncRoleTheme(role)
    this.loadFeeders()
  },

  loadFeeders() {
    this.setData({ loading: true, error: '' })
    try {
      const { feederApi } = require('../../utils/api')
      feederApi.list().then(res => {
        const feeders = (res.data || []).map(normalizeFeeder)
        this.setData({ feeders, loading: false })
      }).catch(() => {
        this.setData({ loading: false, error: '加载失败' })
      })
    } catch (e) {
      this.setData({ loading: false, error: '加载失败' })
    }
  },

  onPullDownRefresh() {
    this.loadFeeders()
    setTimeout(() => wx.stopPullDownRefresh(), 1000)
  },
  syncRoleTheme(role) {
    if (role === 'FEEDER') {
      this.setData({
        pageTheme: 'feeders-feeder',
        headerCardClass: 'header-card header-feeder',
        roleBadgeText: '喂养员广场',
        pageTitle: '查看同行服务能力',
        pageDesc: '了解其他喂养员资料，完善自己的服务展示'
      })
      return
    }

    if (role === 'ADMIN') {
      this.setData({
        pageTheme: 'feeders-admin',
        headerCardClass: 'header-card header-admin',
        roleBadgeText: '管理员视图',
        pageTitle: '喂养员展示池',
        pageDesc: '管理员仅作浏览参考，详细审核请前往后台系统'
      })
      return
    }

    this.setData({
      pageTheme: 'feeders-owner',
      headerCardClass: 'header-card header-owner',
      roleBadgeText: '宠物主人找喂养员',
      pageTitle: '挑选合适的喂养员',
      pageDesc: '按服务区域和经验选择靠谱的上门伙伴'
    })
  },
  goDetail(e) {
    wx.navigateTo({ url: '/pages/feeders/detail/detail?id=' + e.currentTarget.dataset.id })
  }
})
