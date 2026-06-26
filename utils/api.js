const http = require('./request')

// 认证
const authApi = {
  login: (data) => http.post('/api/miniapp/auth/login', data)
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
  accept: (id) => http.put('/api/miniapp/orders/' + id + '/accept'),
  complete: (id) => http.put('/api/miniapp/orders/' + id + '/complete'),
  cancel: (id) => http.put('/api/miniapp/orders/' + id + '/cancel')
}

// 评价
const reviewApi = {
  create: (data) => http.post('/api/miniapp/reviews', data),
  byFeeder: (id) => http.get('/api/miniapp/reviews/feeder/' + id)
}

module.exports = { authApi, petApi, feederApi, orderApi, reviewApi }
