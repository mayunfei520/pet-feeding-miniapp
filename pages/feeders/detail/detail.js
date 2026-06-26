Page({
  data: { feeder: {}, reviews: [] },

  onLoad(options) {
    const id = options.id
    try {
      const { feederApi } = require('../../utils/api')
      feederApi.reviews(id).then(res => {
        this.setData({ reviews: res.data || [] })
      }).catch(() => {})
      // 获取喂养员列表中的详情
      feederApi.list().then(res => {
        const found = (res.data || []).find(f => f.id == id)
        if (found) this.setData({ feeder: found })
      }).catch(() => {})
    } catch (e) {}
  },

  starStr(n) {
    const stars = ['','★','★★','★★★','★★★★','★★★★★']
    return stars[n] || '★★★★★'
  }
})
