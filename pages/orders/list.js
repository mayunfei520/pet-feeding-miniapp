Page({
  data: {
    orders: [],
    filteredOrders: [],
    activeTab: 'all',
    loading: true,
    error: '',
    role: 'OWNER',
    pageTheme: 'orders-owner',
    headerCardClass: 'header-card header-owner',
    roleBadgeText: '宠物主人订单',
    pageTitle: '我的订单',
    pageDesc: '查看预约进度，跟进宠物喂养服务',
    periodMap: { AM: '上午', PM: '下午', EVENING: '晚上' },
    statusMap: { PENDING: '待报价', QUOTED: '已报价待确认', ACCEPTED: '已确认待服务', IN_PROGRESS: '进行中', COMPLETED: '已完成', CANCELLED: '已取消' },
    tabAllClass: 'tab active',
    tabPendingClass: 'tab',
    tabDoneClass: 'tab'
  },

  onShow() {
    const user = wx.getStorageSync('userInfo') || {}
    const role = user.role || 'OWNER'
    this.setData({ role })
    this.syncRoleTheme(role)
    if (role === 'ADMIN') {
      this.setData({
        orders: [],
        filteredOrders: [],
        loading: false,
        error: '管理员请在后台系统查看全部订单'
      })
      this.syncTabClass()
      return
    }
    this.loadOrders()
  },

  syncRoleTheme(role) {
    if (role === 'FEEDER') {
      this.setData({
        pageTheme: 'orders-feeder',
        headerCardClass: 'header-card header-feeder',
        roleBadgeText: '喂养员工作台',
        pageTitle: '接单列表',
        pageDesc: '处理待接单与进行中的服务订单'
      })
      return
    }

    if (role === 'ADMIN') {
      this.setData({
        pageTheme: 'orders-admin',
        headerCardClass: 'header-card header-admin',
        roleBadgeText: '管理员入口',
        pageTitle: '订单管理说明',
        pageDesc: '管理员请前往后台系统处理全量订单和运营数据'
      })
      return
    }

    this.setData({
      pageTheme: 'orders-owner',
      headerCardClass: 'header-card header-owner',
      roleBadgeText: '宠物主人订单',
      pageTitle: '我的订单',
      pageDesc: '查看预约进度，跟进宠物喂养服务'
    })
  },

  decorateOrders(list) {
    return (list || []).map(item => ({
      ...item,
      tagClass: item.status === 'PENDING'
        ? 'tag tag-pending'
        : item.status === 'QUOTED'
          ? 'tag tag-quoted'
        : item.status === 'IN_PROGRESS'
          ? 'tag tag-progress'
        : item.status === 'COMPLETED'
          ? 'tag tag-completed'
          : item.status === 'CANCELLED'
            ? 'tag tag-cancelled'
            : 'tag tag-accepted',
      canOwnerComplete: item.status === 'ACCEPTED' && this.data.role === 'OWNER',
      canFeederAccept: item.status === 'PENDING' && this.data.role === 'FEEDER',
      canFeederQuote: item.status === 'PENDING' && this.data.role === 'FEEDER',
      canOwnerConfirm: item.status === 'QUOTED' && this.data.role === 'OWNER',
      canOwnerReject: item.status === 'QUOTED' && this.data.role === 'OWNER',
      canFeederStart: item.status === 'ACCEPTED' && this.data.role === 'FEEDER',
      canCancel: (item.status === 'PENDING' || item.status === 'QUOTED') && this.data.role === 'OWNER',
      canOwnerReview: item.status === 'COMPLETED' && this.data.role === 'OWNER'
    }))
  },

  syncTabClass() {
    this.setData({
      tabAllClass: this.data.activeTab === 'all' ? 'tab active' : 'tab',
      tabPendingClass: this.data.activeTab === 'pending' ? 'tab active' : 'tab',
      tabDoneClass: this.data.activeTab === 'done' ? 'tab active' : 'tab'
    })
  },

  loadOrders() {
    this.setData({ loading: true, error: '' })
    try {
      const { orderApi } = require('../../utils/api')
      orderApi.list().then(res => {
        const orders = this.decorateOrders(res.data || [])
        this.setData({ orders, loading: false })
        this.applyFilter()
      }).catch(() => {
        this.setData({ loading: false, error: '加载失败' })
      })
    } catch (e) {
      this.setData({ loading: false, error: '加载失败' })
    }
  },

  onPullDownRefresh() {
    this.loadOrders()
    setTimeout(() => wx.stopPullDownRefresh(), 1000)
  },

  applyFilter() {
    const { orders, activeTab } = this.data
    let filtered
    if (activeTab === 'pending') {
      filtered = orders.filter(o => ['PENDING', 'ACCEPTED', 'IN_PROGRESS'].includes(o.status))
    } else if (activeTab === 'done') {
      filtered = orders.filter(o => ['COMPLETED', 'CANCELLED'].includes(o.status))
    } else {
      filtered = orders
    }
    this.setData({ filteredOrders: filtered })
  },

  switchTab(e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab })
    this.syncTabClass()
    this.applyFilter()
  },

  goDetail(e) {
    wx.navigateTo({ url: '/pages/orders/detail/detail?id=' + e.currentTarget.dataset.id })
  },

  goReview(e) {
    wx.navigateTo({ url: '/pages/reviews/create/create?orderId=' + e.currentTarget.dataset.id })
  },

  doAccept(e) {
    const id = e.currentTarget.dataset.id
    const { orderApi } = require('../../utils/api')
    orderApi.accept(id).then(() => {
      wx.showToast({ title: '接单成功', icon: 'success' })
      this.loadOrders()
    }).catch(() => {})
  },

  doQuote(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '填报价金额',
      editable: true,
      placeholderText: '请输入服务费用（元）',
      success: (res) => {
        if (!res.confirm) return
        const price = parseFloat(res.content)
        if (!(price > 0)) {
          wx.showToast({ title: '请输入大于0的金额', icon: 'none' })
          return
        }
        const { orderApi } = require('../../utils/api')
        orderApi.quote(id, { price }).then(() => {
          wx.showToast({ title: '报价已提交', icon: 'success' })
          this.loadOrders()
        }).catch((err) => {
          wx.showToast({ title: (err && err.message) || '报价失败', icon: 'none' })
        })
      }
    })
  },

  doConfirm(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认报价',
      content: '确认接受该报价并开始服务？',
      success: (res) => {
        if (!res.confirm) return
        const { orderApi } = require('../../utils/api')
        orderApi.confirm(id).then(() => {
          wx.showToast({ title: '已确认，等待服务', icon: 'success' })
          this.loadOrders()
        }).catch((err) => {
          wx.showToast({ title: (err && err.message) || '操作失败', icon: 'none' })
        })
      }
    })
  },

  doReject(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '拒绝报价',
      content: '拒绝后喂养员可重新报价，确定吗？',
      success: (res) => {
        if (!res.confirm) return
        const { orderApi } = require('../../utils/api')
        orderApi.reject(id).then(() => {
          wx.showToast({ title: '已拒绝，等待重报', icon: 'none' })
          this.loadOrders()
        }).catch((err) => {
          wx.showToast({ title: (err && err.message) || '操作失败', icon: 'none' })
        })
      }
    })
  },

  doComplete(e) {
    const id = e.currentTarget.dataset.id
    const { orderApi } = require('../../utils/api')
    orderApi.complete(id).then(() => {
      wx.showToast({ title: '订单已完成', icon: 'success' })
      this.loadOrders()
    }).catch(() => {})
  },

  doStart(e) {
    const id = e.currentTarget.dataset.id
    const { orderApi } = require('../../utils/api')
    orderApi.start(id).then(() => {
      wx.showToast({ title: '服务已开始', icon: 'success' })
      this.loadOrders()
    }).catch(() => {})
  },

  doCancel(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '取消订单',
      content: '确定要取消吗？',
      success: (res) => {
        if (res.confirm) {
          const { orderApi } = require('../../utils/api')
          orderApi.cancel(id).then(() => this.loadOrders()).catch(() => {})
        }
      }
    })
  }
})
