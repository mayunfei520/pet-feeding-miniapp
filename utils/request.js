// 封装 wx.request，自动带 token
const BASE_URL = 'http://101.42.24.114'

function request(options) {
  const token = wx.getStorageSync('token')
  return new Promise((resolve, reject) => {
    wx.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? 'Bearer ' + token : ''
      },
      success(res) {
        const ok = res.statusCode >= 200 && res.statusCode < 300
        const body = res.data || {}
        const businessOk = body.code === undefined || body.code === 200

        if (ok && businessOk) {
          resolve(body)
          return
        }

        const message = body.message || '请求失败'
        wx.showToast({ title: message, icon: 'none' })

        if (res.statusCode === 401) {
          wx.removeStorageSync('token')
          wx.removeStorageSync('userInfo')
        }

        reject(body)
      },
      fail(err) {
        wx.showToast({ title: '网络异常', icon: 'none' })
        reject(err)
      }
    })
  })
}

module.exports = {
  get: (url, data) => request({ url, method: 'GET', data }),
  post: (url, data) => request({ url, method: 'POST', data }),
  put: (url, data) => request({ url, method: 'PUT', data }),
  del: (url) => request({ url, method: 'DELETE' })
}
