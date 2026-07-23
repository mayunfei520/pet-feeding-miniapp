Page({
  data: {
    loading: true,
    conversations: [],
    role: 'OWNER'
  },

  onShow() {
    const user = wx.getStorageSync('userInfo') || {}
    this.setData({ role: user.role || 'OWNER' })
    this.loadList()
  },

  loadList() {
    this.setData({ loading: true })
    const { chatApi } = require('../../utils/api')
    chatApi.conversations().then(res => {
      const list = (res.data || []).map(c => this.normalize(c))
      this.setData({ conversations: list, loading: false })
      this.updateTabBadge(list)
    }).catch(() => {
      // 后端 IM 未接入（#9 未合）时降级读本地 demo 会话，让「消息」tab 也能回显
      this.setData({ conversations: this.readLocalConvs(), loading: false })
    })
  },

  // 同步「消息」TabBar 红点：汇总所有会话未读数
  updateTabBadge(list) {
    const arr = list || this.data.conversations
    const total = (arr || []).reduce((s, c) => s + (c.unread || 0), 0)
    try {
      if (total > 0) {
        wx.setTabBarBadge({ index: 1, text: total > 99 ? '99+' : String(total) })
      } else {
        wx.removeTabBarBadge({ index: 1 })
      }
    } catch (e) { /* 非 tabBar 上下文忽略 */ }
  },

  normalize(c) {
    const isOwner = this.data.role === 'OWNER'
    const peer = isOwner ? (c.feeder || c.feederInfo || {}) : (c.owner || c.ownerInfo || {})
    const name = peer.nickname || peer.realName || peer.name || (isOwner ? '喂养员' : '宠物主人')
    const avatar = peer.avatarUrl || peer.avatar || ''
    const certified = !!(peer.certified || peer.certificated)
    return {
      id: c.id,
      orderId: c.orderId,
      peerName: name,
      peerInitial: (name || '?').charAt(0),
      peerAvatar: avatar,
      peerCertified: certified,
      lastMessage: c.lastMessage || '',
      lastTime: this.fmtTime(c.lastMessageTime),
      unread: c.unreadCount || 0
    }
  },

  fmtTime(t) {
    if (!t) return ''
    const d = new Date(typeof t === 'string' ? t.replace(/-/g, '/') : t)
    if (isNaN(d.getTime())) return ''
    const now = new Date()
    const sameDay = d.toDateString() === now.toDateString()
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    if (sameDay) return hh + ':' + mm
    const mo = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return mo + '/' + dd
  },

  goChat(e) {
    const id = e.currentTarget.dataset.id
    const orderId = e.currentTarget.dataset.order
    const name = e.currentTarget.dataset.name || ''
    // demo_ 前缀项为本地降级会话，改传 feederId 让详情页回到对应本地会话
    const url = (id && String(id).indexOf('demo_') === 0)
      ? '/pages/chat/detail?feederId=' + (orderId || '') + '&peerName=' + encodeURIComponent(name)
      : '/pages/chat/detail?conversationId=' + id + '&orderId=' + orderId + '&peerName=' + encodeURIComponent(name)
    wx.navigateTo({ url })
  },

  goFeeders() {
    wx.navigateTo({ url: '/pages/feeders/list' })
  },

  // 后端 IM 未接入（#9 未合）时，从本地读取 demo 会话，让「消息」tab 也能回显
  readLocalConvs() {
    try {
      const all = wx.getStorageSync('wf_demo_conversations') || {}
      return Object.keys(all).map(k => {
        const c = all[k]
        const msgs = c.messages || []
        const last = msgs[msgs.length - 1]
        return {
          id: 'demo_' + k,
          orderId: c.peerId || '',
          peerName: c.peerName || '喂养员',
          peerInitial: (c.peerName || '喂').charAt(0),
          peerAvatar: '',
          peerCertified: false,
          lastMessage: last ? last.content : '',
          lastTime: last ? last.time : '',
          unread: 0,
          demo: true
        }
      })
    } catch (e) { return [] }
  },

  onPullDownRefresh() {
    this.loadList()
    wx.stopPullDownRefresh()
  }
})
