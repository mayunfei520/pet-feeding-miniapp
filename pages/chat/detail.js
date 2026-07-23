const { chatApi } = require('../../utils/api')

Page({
  data: {
    conversationId: '',
    orderId: '',
    peerName: '',
    peerCertified: false,
    convError: '',
    loading: true,
    messages: [],
    inputText: '',
    sending: false,
    myRole: 'OWNER',
    pollTimer: null,
    demoMode: false
  },

  onLoad(options) {
    const user = wx.getStorageSync('userInfo') || {}
    const myRole = user.role || 'OWNER'
    const conversationId = options.conversationId || ''
    const orderId = options.orderId || ''
    const feederId = options.feederId || ''
    const peerName = decodeURIComponent(options.peerName || '')
    const convKey = conversationId ? ('conv_' + conversationId)
      : orderId ? ('order_' + orderId)
      : feederId ? ('feeder_' + feederId) : ''
    this.setData({ myRole, conversationId, orderId, feederId, peerName, convKey })
    if (peerName) wx.setNavigationBarTitle({ title: peerName })
    if (!orderId && !conversationId && !feederId) {
      wx.showToast({ title: '缺少会话参数', icon: 'none' })
      return
    }
    this.loadPeerThenMessages()
  },

  onShow() { this.startPoll() },
  onHide() { this.stopPoll() },
  onUnload() { this.stopPoll() },

  startPoll() {
    this.stopPoll()
    this.data.pollTimer = setInterval(() => this.pollNew(), 8000)
  },
  stopPoll() {
    if (this.data.pollTimer) {
      clearInterval(this.data.pollTimer)
      this.setData({ pollTimer: null })
    }
  },

  loadPeerThenMessages() {
    const needConv = !this.data.conversationId && (this.data.orderId || this.data.feederId)
    const step = needConv
      ? (this.data.orderId
          ? chatApi.byOrder(this.data.orderId)
          : chatApi.byFeeder(this.data.feederId))
      : Promise.resolve({ data: { id: this.data.conversationId } })
    step.then(res => {
      const c = res.data || {}
      if (!this.data.conversationId && c.id) this.setData({ conversationId: c.id })
      this.applyPeer(c)
      this.loadMessages()
      this.markRead()
    }).catch(() => {
      // 后端 IM 未接入（#9 未合）时 by-feeder/by-order 返回 404：进入本地演示模式，
      // 让用户在后端就绪前即可完整体验聊天 UI（消息仅本地预览，不会真正发送）
      this.enterDemo()
    })
  },

  enterDemo() {
    const peerName = this.data.peerName || (this.data.myRole === 'OWNER' ? '喂养员' : '宠物主人')
    if (!this.data.peerName) {
      this.setData({ peerName })
      wx.setNavigationBarTitle({ title: peerName })
    }
    // 读本地已有 demo 会话（按会话 key 分桶），使「选择不同喂养员」各自保留历史
    const local = this.readLocalConv()
    const messages = (local && local.messages && local.messages.length)
      ? local.messages
      : this.seedDemoMessages()
    this.setData({ demoMode: true, loading: false, convError: '', messages })
    this.saveLocalConv(messages)
    this.stopPoll()
    this.scrollBottom()
  },

  seedDemoMessages() {
    const t = this.fmtTime(new Date())
    return [
      { id: 'demo_1', isMine: false, type: 'TEXT', content: '您好，我是您的专属喂养员～有什么可以帮您？', time: t, status: 'sent', demo: true },
      { id: 'demo_2', isMine: true, type: 'TEXT', content: '请问这次上门喂养80元能优惠一点吗？', time: t, status: 'sent', demo: true },
      { id: 'demo_3', isMine: false, type: 'TEXT', content: '70元含猫砂清理哦～确认报价后就能约时间啦', time: t, status: 'sent', demo: true }
    ]
  },

  readLocalConv() {
    const key = this.data.convKey
    if (!key) return null
    try {
      const all = wx.getStorageSync('wf_demo_conversations') || {}
      return all[key] || null
    } catch (e) { return null }
  },

  saveLocalConv(messages) {
    const key = this.data.convKey
    if (!key) return
    try {
      const all = wx.getStorageSync('wf_demo_conversations') || {}
      all[key] = {
        key: key,
        peerId: this.data.feederId || this.data.orderId || '',
        peerName: this.data.peerName || '',
        messages: messages || [],
        updatedAt: Date.now()
      }
      wx.setStorageSync('wf_demo_conversations', all)
    } catch (e) {}
  },

  applyPeer(c) {
    const isOwner = this.data.myRole === 'OWNER'
    const peer = isOwner ? (c.feeder || c.feederInfo || {}) : (c.owner || c.ownerInfo || {})
    const name = peer.nickname || peer.realName || peer.name || (isOwner ? '喂养员' : '宠物主人')
    this.setData({
      peerName: name,
      peerCertified: !!(peer.certified || peer.certificated)
    })
    wx.setNavigationBarTitle({ title: name })
  },

  loadMessages() {
    if (!this.data.conversationId) {
      this.setData({ loading: false })
      return
    }
    this.setData({ loading: true })
    chatApi.messages(this.data.conversationId, '').then(res => {
      const list = (res.data && res.data.messages) || []
      this.setData({
        messages: list.map(m => this.normalize(m)),
        loading: false
      })
      this.scrollBottom()
    }).catch(() => {
      this.setData({ loading: false })
    })
  },

  pollNew() {
    if (!this.data.conversationId) return
    const msgs = this.data.messages
    const last = msgs.length ? msgs[msgs.length - 1] : null
    chatApi.messages(this.data.conversationId, '').then(res => {
      const list = (res.data && res.data.messages) || []
      const incoming = last ? list.filter(m => this.msgTime(m) > this.msgTime(last)) : []
      if (incoming.length) {
        this.setData({ messages: list.map(m => this.normalize(m)) })
        this.scrollBottom()
      }
    }).catch(() => {})
  },

  markRead() {
    if (!this.data.conversationId) return
    chatApi.read(this.data.conversationId).catch(() => {})
  },

  normalize(m) {
    const isMine = (m.senderRole || '') === this.data.myRole
    return {
      id: m.id,
      isMine,
      type: m.type || 'TEXT',
      content: m.content || '',
      time: this.fmtTime(m.createTime),
      status: 'sent'
    }
  },

  msgTime(m) {
    const t = m.createTime
    const d = new Date(typeof t === 'string' ? t.replace(/-/g, '/') : t)
    return isNaN(d.getTime()) ? 0 : d.getTime()
  },

  fmtTime(t) {
    if (!t) return ''
    const d = new Date(typeof t === 'string' ? t.replace(/-/g, '/') : t)
    if (isNaN(d.getTime())) return ''
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')
  },

  onInput(e) {
    this.setData({ inputText: e.detail.value })
  },

  send() {
    const text = this.data.inputText.trim()
    if (!text || this.data.sending || !this.data.conversationId) return
    if (this.data.demoMode) {
      const msg = {
        id: 'demo_' + Date.now(),
        isMine: true,
        type: 'TEXT',
        content: text,
        time: this.fmtTime(new Date()),
        status: 'sent',
        demo: true
      }
      const messages = this.data.messages.concat([msg])
      this.setData({ messages, inputText: '' })
      this.saveLocalConv(messages)
      this.scrollBottom()
      return
    }
    const temp = {
      id: 'temp_' + Date.now(),
      isMine: true,
      type: 'TEXT',
      content: text,
      time: this.fmtTime(new Date()),
      status: 'sending'
    }
    const messages = this.data.messages.concat([temp])
    this.setData({ messages, inputText: '', sending: true })
    this.scrollBottom()
    this.doSend(temp.id, text, messages)
  },

  retry(e) {
    const id = e.currentTarget.dataset.id
    const target = this.data.messages.find(m => m.id === id)
    if (!target || this.data.sending) return
    const messages = this.data.messages.map(m => m.id === id ? Object.assign({}, m, { status: 'sending' }) : m)
    this.setData({ messages, sending: true })
    this.doSend(id, target.content, messages)
  },

  doSend(tempId, text, messages) {
    chatApi.send({
      conversationId: this.data.conversationId,
      type: 'TEXT',
      content: text
    }).then(res => {
      const saved = res.data || {}
      const updated = messages.map(m => m.id === tempId
        ? this.normalize(Object.assign({}, saved, { senderRole: this.data.myRole }))
        : m)
      this.setData({ messages: updated, sending: false })
      this.scrollBottom()
    }).catch(() => {
      const failed = messages.map(m => m.id === tempId ? Object.assign({}, m, { status: 'failed' }) : m)
      this.setData({ messages: failed, sending: false })
      wx.showToast({ title: '发送失败', icon: 'none' })
    })
  },

  scrollBottom() {
    wx.pageScrollTo({ selector: '.msg-end', duration: 200 })
  }
})
