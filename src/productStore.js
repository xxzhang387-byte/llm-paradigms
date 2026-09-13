// 产品库 —— 用 localStorage 持久化，作为简单的本地数据库。
const KEY = 'llm_product_library_v1'

export function loadProducts() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

function save(list) {
  localStorage.setItem(KEY, JSON.stringify(list))
}

export function upsertProduct(p) {
  const list = loadProducts()
  const id = p.id || `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`
  const record = { ...p, id, updatedAt: new Date().toISOString() }
  const idx = list.findIndex((x) => x.id === id)
  if (idx >= 0) list[idx] = record
  else list.unshift(record)
  save(list)
  return record
}

export function deleteProduct(id) {
  save(loadProducts().filter((x) => x.id !== id))
}

export function getProduct(id) {
  return loadProducts().find((x) => x.id === id) || null
}

// Store a generated artifact (fit / diagnosis / bmc / prd / proposal / prdReview…) under a product.
export function saveArtifact(id, key, value) {
  const list = loadProducts()
  const idx = list.findIndex((x) => x.id === id)
  if (idx < 0) return null
  list[idx] = { ...list[idx], artifacts: { ...(list[idx].artifacts || {}), [key]: value }, updatedAt: new Date().toISOString() }
  save(list)
  return list[idx]
}
