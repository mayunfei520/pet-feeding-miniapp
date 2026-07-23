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
    pollTimer: null
  },

  onLoad(options) {
    const user = wx.getStorageSync('userInfo') || {}
    const myRole = user.role || 'OWNER'
    const conversationId = options.conversationId || ''
    const orderId = options.orderId || ''
    const feederId = options.feederId || ''
    const peerName = decodeURIComponent(options.peerName || '')
    this.setData({ myRole, conversationId, orderId, feederId, peerName })
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
      // 后端 IM 未接入时 by-feeder/by-order 返回 404，给出友好提示而非白屏
      this.setData({
        loading: false,
        convError: '沟通功能待后端接入，暂不可用'
      })
      this.stopPoll()
    })
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
