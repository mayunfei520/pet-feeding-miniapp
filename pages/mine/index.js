Page({
  data: {
    userInfo: {},
    roleText: '宠物主人',
    roleDesc: '管理宠物、预约服务、跟踪订单',
    menuGroups: [],
    canSwitchRole: false,
    pageTheme: 'mine-owner',
    profileAccent: 'accent-owner',
    roleBadge: '宠物主人'
  },

  onShow() {
    const info = wx.getStorageSync('userInfo') || { nickname: '微信用户', role: 'OWNER' }
    this.setData({ userInfo: info })
    this.syncRoleView(info.role || 'OWNER')
  },

  syncRoleView(role) {
    if (role === 'FEEDER') {
      this.setData({
        roleText: '喂养员',
        roleDesc: '接单、履约、维护个人服务能力',
        canSwitchRole: false,
        pageTheme: 'mine-feeder',
        profileAccent: 'accent-feeder',
        roleBadge: '喂养员',
        menuGroups: [
          {
            id: 'feeder-main',
            title: '喂养员功能',
            items: [
              { id: 'orders', text: '📦 接单列表', path: '/pages/orders/list' },
              { id: 'apply', text: '✏️ 喂养员认证', path: '/pages/feeder/apply/apply' }
            ]
          }
        ]
      })
      return
    }

    if (role === 'ADMIN') {
      this.setData({
        roleText: '管理员',
        roleDesc: '管理员请在后台系统中查看全量数据和处理审核',
        canSwitchRole: false,
        pageTheme: 'mine-admin',
        profileAccent: 'accent-admin',
        roleBadge: '管理员',
        menuGroups: [
          {
            id: 'admin',
            title: '管理员说明',
            items: [
              { id: 'console', text: '🛠 请前往管理后台处理业务', action: 'adminNotice' }
            ]
          }
        ]
      })
      return
    }

    this.setData({
      roleText: '宠物主人',
      roleDesc: '管理宠物、预约服务、跟踪订单',
      canSwitchRole: false,
      pageTheme: 'mine-owner',
      profileAccent: 'accent-owner',
      roleBadge: '宠物主人',
      menuGroups: [
        {
          id: 'owner-main',
          title: '宠物主人功能',
          items: [
            { id: 'pets', text: '🐱 我的宠物', path: '/pages/pets/list' },
            { id: 'feeders', text: '👤 找喂养员', path: '/pages/feeders/list' },
            { id: 'create', text: '📝 预约喂养', path: '/pages/orders/create/create' },
            { id: 'orders', text: '📋 我的订单', path: '/pages/orders/list' }
          ]
        }
      ]
    })
  },

  goTo(e) {
    const path = e.currentTarget.dataset.path
    wx.navigateTo({
      url: path,
      fail: () => wx.switchTab({ url: path })
    })
  },

  onMenuTap(e) {
    const action = e.currentTarget.dataset.action
    const path = e.currentTarget.dataset.path
    if (action === 'adminNotice') {
      wx.showToast({ title: '管理员请在后台系统处理', icon: 'none' })
      return
    }
    if (path) {
      this.goTo({ currentTarget: { dataset: { path } } })
    }
  },

  doLogout() {
    wx.clearStorageSync()
    wx.showToast({ title: '已退出' })
    setTimeout(() => wx.reLaunch({ url: '/pages/login/login' }), 1000)
  }
})
