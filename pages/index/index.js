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
    avatarText: realName.slice(0, 1) || '👤'
  }
}

Page({
  data: {
    banners: [
      { id: 1, title: '上门喂养', sub: '安心出行，宠物无忧', emoji: '🐾', bg: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' },
      { id: 2, title: '专业喂养员', sub: '严格审核，值得信赖', emoji: '🏠', bg: 'linear-gradient(135deg, #10b981, #06b6d4)' },
      { id: 3, title: '全程跟踪', sub: '一键预约，实时查看', emoji: '📱', bg: 'linear-gradient(135deg, #f59e0b, #ef4444)' }
    ],
    feeders: [],
    stats: { totalOrders: 0, pendingOrders: 0, myPets: 0 },
    loading: true,
    token: '',
    role: 'OWNER',
    roleTheme: 'theme-owner',
    heroCardClass: 'hero-card hero-owner',
    roleBadgeText: '宠物主人模式',
    roleHomeTitle: '快捷服务',
    roleHomeDesc: '为你的宠物安排一次安心喂养',
    quickActions: [],
    showStats: true,
    feederApplied: false,
    showFeederCta: false,
    showFeederReviewing: false,
    chatEntry: null
  },

  onShow() {
    const token = wx.getStorageSync('token') || ''
    const userInfo = wx.getStorageSync('userInfo') || {}
    const role = userInfo.role || 'OWNER'
    const feederApplied = wx.getStorageSync('feederApplied') || false
    this.setData({ token, role, feederApplied })
    this.syncRoleView()
    if (token && role !== 'ADMIN') {
      this.loadAll()
    } else {
      this.setData({ loading: false, feeders: [], stats: { totalOrders: 0, pendingOrders: 0, myPets: 0 } })
    }
  },

  syncRoleView() {
    const role = this.data.role || 'OWNER'
    if (role === 'FEEDER') {
      this.setData({
        roleTheme: 'theme-feeder',
        heroCardClass: 'hero-card hero-feeder',
        roleBadgeText: '喂养员模式',
        roleHomeTitle: '喂养员工作台',
        roleHomeDesc: '查看待接单、管理服务流程',
        showStats: false,
        quickActions: [
          { id: 'orders', text: '接单列表', icon: '单', bg: '#3b82f6', path: '/pages/orders/list' },
          { id: 'certified', text: '已认证', icon: '✓', bg: '#16a34a' },
          { id: 'feeders', text: '喂养员广场', icon: '员', bg: '#22c55e', path: '/pages/feeders/list' },
          { id: 'mine', text: '个人中心', icon: '我', bg: '#ec4899', path: '/pages/mine/index' },
      ],
        showFeederCta: false,
        showFeederReviewing: false,
        chatEntry: { text: '联系客户', path: '/pages/chat/list' }
      })
      return
    }

    if (role === 'ADMIN') {
      this.setData({
        roleTheme: 'theme-admin',
        heroCardClass: 'hero-card hero-admin',
        roleBadgeText: '管理员模式',
        roleHomeTitle: '管理员入口',
        roleHomeDesc: '管理员请使用管理后台处理审核、订单和运营',
        showStats: false,
        quickActions: [
          { id: 'mine', text: '个人中心', icon: '管', bg: '#22c55e', path: '/pages/mine/index' }
        ],
        showFeederCta: false,
        showFeederReviewing: false
      })
      return
    }

    this.setData({
      roleTheme: 'theme-owner',
      heroCardClass: 'hero-card hero-owner',
      roleBadgeText: '宠物主人模式',
      roleHomeTitle: '快捷服务',
      roleHomeDesc: '为你的宠物安排一次安心喂养',
      showStats: true,
      quickActions: [
        { id: 'pets', text: '我的宠物', icon: '宠', bg: '#3b82f6', path: '/pages/pets/list' },
        { id: 'feeders', text: '找喂养员', icon: '找', bg: '#f59e0b', path: '/pages/feeders/list' },
        { id: 'create', text: '预约喂养', icon: '约', bg: '#22c55e', path: '/pages/orders/create/create' },
          { id: 'orders', text: '我的订单', icon: '单', bg: '#ec4899', path: '/pages/orders/list' },
      ],
      showFeederCta: !this.data.feederApplied,
      showFeederReviewing: this.data.feederApplied,
      chatEntry: { text: '联系喂养员', path: '/pages/chat/list' }
    })
  },

  async loadAll() {
    this.setData({ loading: true })
    await Promise.allSettled([this.loadFeeders(), this.loadStats()])
    this.setData({ loading: false })
  },

  loadFeeders() {
    try {
      const { feederApi } = require('../../utils/api')
      return feederApi.list().then(res => {
        const feeders = (res.data || []).slice(0, 6).map(normalizeFeeder)
        this.setData({ feeders })
      }).catch(() => {
        this.setData({ feeders: [] })
      })
    } catch (e) {
      this.setData({ feeders: [] })
      return Promise.resolve()
    }
  },

  loadStats() {
    try {
      const { orderApi, petApi } = require('../../utils/api')
      return Promise.allSettled([
        orderApi.list().then(res => {
          const orders = res.data || []
          this.setData({
            'stats.totalOrders': orders.length,
            'stats.pendingOrders': orders.filter(o => o.status === 'PENDING').length
          })
        }),
        petApi.list().then(res => {
          const pets = res.data || []
          this.setData({ 'stats.myPets': pets.length })
        })
      ])
    } catch (e) {
      return Promise.resolve()
    }
  },

  goTo(e) {
    const path = e.currentTarget.dataset.path
    if (!path) return  // 状态类瓷砖（如「已认证」）不跳转
    wx.navigateTo({
      url: path,
      fail: () => wx.switchTab({ url: path })
    })
  },

  goFeeder(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    wx.navigateTo({ url: '/pages/feeders/detail/detail?id=' + id })
  }
})
