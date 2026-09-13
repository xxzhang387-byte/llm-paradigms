import { jsonrepair } from 'jsonrepair'

// Tolerant parse for model-produced JSON: strip fences/prose, repair bad commas & truncation.
export function parseLenient(text) {
  let t = (text || '').trim()
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fence) t = fence[1].trim()
  const s = t.indexOf('{')
  const e = t.lastIndexOf('}')
  if (s >= 0 && e > s) t = t.slice(s, e + 1)
  const cleaned = t.replace(/,\s*,/g, ',').replace(/,\s*([}\]])/g, '$1').replace(/([{[])\s*,/g, '$1')
  for (const c of [t, cleaned]) {
    try { return JSON.parse(c) } catch {}
    try { return JSON.parse(jsonrepair(c)) } catch {}
  }
  throw new Error('无法解析模型返回的 JSON')
}
