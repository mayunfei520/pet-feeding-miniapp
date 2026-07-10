const PROD_BASE_URL = 'https://mayunfei.asia'
const DEV_BASE_URL = 'https://mayunfei.asia'  // 开发者工具也走已备案的 https 域名，避免 http+IP 被小程序拦截

function isDevtoolsRuntime() {
  try {
    const systemInfo = wx.getSystemInfoSync()
    return systemInfo.platform === 'devtools'
  } catch (e) {
    return false
  }
}

function resolveBaseUrl() {
  return isDevtoolsRuntime() ? DEV_BASE_URL : PROD_BASE_URL
}
function getBaseUrl() {
  return resolveBaseUrl()
}
function clearAuth() {
  wx.removeStorageSync('token')
  wx.removeStorageSync('userInfo')
}
function redirectToLogin() {
  const pages = getCurrentPages()
  const current = pages.length ? pages[pages.length - 1].route : ''
  if (current !== 'pages/login/login') {
    wx.reLaunch({ url: '/pages/login/login' })
  }
}
function request(options) {
  const baseUrl = resolveBaseUrl()
  const token = wx.getStorageSync('token')
  const method = options.method || 'GET'
  const payload = options.data || {}
  const headers = {
    'Content-Type': 'application/json; charset=UTF-8',
    'Authorization': token ? 'Bearer ' + token : ''
  }
  console.log('[miniapp request] sending', {
    url: baseUrl + options.url,
    method,
    rawData: options.data || {},
    payload,
    header: headers
  })
  return new Promise((resolve, reject) => {
    wx.request({
      url: baseUrl + options.url,
      method,
      data: payload,
      header: headers,
      success(res) {
        console.log('[miniapp request] success', {
          url: baseUrl + options.url,
          method,
          statusCode: res.statusCode,
          data: res.data,
          header: res.header
        })
        const ok = res.statusCode >= 200 && res.statusCode < 300
        const body = res.data || {}
        const businessOk = body.code === undefined || body.code === 200
        if (ok && businessOk) {
          resolve(body)
          return
        }
        const message = body.message || '\u8bf7\u6c42\u5931\u8d25'
        wx.showToast({ title: message, icon: 'none' })
        if (res.statusCode === 401 || res.statusCode === 403) {
          clearAuth()
          setTimeout(() => redirectToLogin(), 300)
        }
        reject(body)
      },
      fail(err) {
        console.log('[miniapp request] fail', {
          url: baseUrl + options.url,
          method,
          payload,
          error: err
        })
        wx.showToast({ title: '\u7f51\u7edc\u5f02\u5e38', icon: 'none' })
        reject(err)
      }
    })
  })
}
module.exports = {
  getBaseUrl,
  get: (url, data) => request({ url, method: 'GET', data }),
  post: (url, data) => request({ url, method: 'POST', data }),
  put: (url, data) => request({ url, method: 'PUT', data }),
  del: (url) => request({ url, method: 'DELETE' })
}
