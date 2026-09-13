// 竞品分析库 —— localStorage 持久化（单品分析 + 横向对比）。
const KEY = 'llm_compete_library_v1'

export function loadAnalyses() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}
function save(list) { localStorage.setItem(KEY, JSON.stringify(list)) }

export function saveAnalysis(rec) {
  const list = loadAnalyses()
  const record = { ...rec, id: `cmp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`, createdAt: new Date().toISOString() }
  list.unshift(record)
  save(list)
  return record
}

export function deleteAnalysis(id) {
  save(loadAnalyses().filter((x) => x.id !== id))
}
