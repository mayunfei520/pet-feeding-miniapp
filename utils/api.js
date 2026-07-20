const http = require('./request')

// 认证
const authApi = {
  login: (data) => http.post('/api/miniapp/auth/login', data),
  register: (data) => http.post('/api/miniapp/auth/register', data),
  passwordLogin: (data) => http.post('/api/miniapp/auth/password-login', data),
  sendCode: (data) => http.post('/api/miniapp/auth/send-code', data),
  phoneLogin: (data) => http.post('/api/miniapp/auth/phone-login', data)
}

// 宠物
const petApi = {
  list: () => http.get('/api/miniapp/pets'),
  add: (data) => http.post('/api/miniapp/pets', data),
  update: (id, data) => http.put('/api/miniapp/pets/' + id, data),
  remove: (id) => http.del('/api/miniapp/pets/' + id)
}

// 喂养员
const feederApi = {
  list: () => http.get('/api/miniapp/feeders'),
  reviews: (id) => http.get('/api/miniapp/feeders/' + id + '/reviews'),
  apply: (data) => http.post('/api/miniapp/feeders', data)
}

// 订单
const orderApi = {
  list: () => http.get('/api/miniapp/orders'),
  pending: () => http.get('/api/miniapp/orders/pending'),
  create: (data) => http.post('/api/miniapp/orders', data),
  // 喂养员报价（PENDING -> QUOTED）
  quote: (id, data) => http.put('/api/miniapp/orders/' + id + '/quote', data),
  // 客户同意报价（QUOTED -> ACCEPTED）
  confirm: (id) => http.put('/api/miniapp/orders/' + id + '/confirm'),
  // 客户拒绝报价（QUOTED -> PENDING，喂养员可重报）
  reject: (id) => http.put('/api/miniapp/orders/' + id + '/reject'),
  // 旧接口：喂养员接单（向后兼容保留，新流程不再调用）
  accept: (id) => http.put('/api/miniapp/orders/' + id + '/accept'),
  start: (id) => http.put('/api/miniapp/orders/' + id + '/start'),
  complete: (id) => http.put('/api/miniapp/orders/' + id + '/complete'),
  cancel: (id) => http.put('/api/miniapp/orders/' + id + '/cancel')
}

// 评价
const reviewApi = {
  create: (data) => http.post('/api/miniapp/reviews', data),
  byFeeder: (id) => http.get('/api/miniapp/reviews/feeder/' + id)
}

module.exports = { authApi, petApi, feederApi, orderApi, reviewApi }
