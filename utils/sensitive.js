// 前端敏感词过滤（第一道防线）
// 注意：前端过滤可被绕过（直接调接口即可），真正的拦截应在后端统一做。
// 此词库需根据平台合规要求持续维护扩充。

const SENSITIVE_WORDS = [
  // 辱骂 / 脏话
  '傻逼', '去死', '滚蛋', '垃圾', '废物', '贱人', '畜生',
  // 色情 / 低俗（常见露骨表述，按合规要求维护）
  '色情', '约炮', '裸聊', '性交', '做爱', '黄片', '嫖', '援交', '性爱',
  // 违法 / 违规（示例占位，按业务需要扩充）
  '赌博', '赌球', '毒品', '诈骗', '代开发票', '私彩',
  // 英文常见
  'porn', 'porno', 'sex', 'fuck', 'shit', 'bitch', 'nude', 'xxx', 'slut'
]

function normalize(text) {
  return String(text == null ? '' : text).toLowerCase()
}

// 是否包含敏感词
function containsSensitive(text) {
  const t = normalize(text)
  if (!t) return false
  return SENSITIVE_WORDS.some(w => t.includes(w.toLowerCase()))
}

// 返回命中的敏感词列表（用于提示）
function findSensitive(text) {
  const t = normalize(text)
  if (!t) return []
  return SENSITIVE_WORDS.filter(w => t.includes(w.toLowerCase()))
}

module.exports = { SENSITIVE_WORDS, containsSensitive, findSensitive }
