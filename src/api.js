// 纯静态部署：浏览器直连 OpenRouter（支持 CORS，无需后端代理）。
// 用户的 OpenRouter API Key 来自 localStorage，仅在本次请求中作为 Authorization 头发送。
import { withConfig } from './modelConfig.js'
import { parseLenient } from './jsonutil.js'
import {
  PRD_SYS, PROPOSAL_SYS, SLIDES_SYS, SLIDES_SCHEMA, DEMO_SYS, OUTLINE_SCHEMA,
  ADVISE_SCHEMA, COMPETE_SCHEMA, COMPARE_SCHEMA, FIT_SCHEMA, REVIEW_SCHEMA,
  BMC_SCHEMA, MONETIZE_SCHEMA, ROI_SCHEMA, ANSWER_SYS_NOWEB, RESEARCH_SYS_NOWEB,
  PARADIGM_BRIEF, productRecap, productBrief,
} from './prompts.js'

const DEFAULT_BASE = 'https://openrouter.ai/api/v1'

function baseURL() {
  return withConfig().baseURL || DEFAULT_BASE
}

function headers(apiKey) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
    'HTTP-Referer': window.location.origin,
    'X-Title': 'LLM 范式工作台',
  }
}

function buildMessages({ system, messages }) {
  const msgs = []
  if (system) msgs.push({ role: 'system', content: system })
  for (const m of messages || []) {
    if (m.role === 'user' || m.role === 'assistant') msgs.push(m)
    else if (m.role === 'system') msgs.push({ role: 'system', content: m.content })
  }
  return msgs
}

function errMsg(data, status) {
  if (data?.error) {
    const e = data.error
    return `${e.code || status} ${e.message || JSON.stringify(e).slice(0, 200)}`
  }
  return `HTTP ${status}`
}

// ---- Streaming (SSE) ----
async function streamCall({ system, messages, model, max_tokens, format, onText, signal }) {
  const { apiKey } = withConfig({})
  const payload = {
    model: model || withConfig({}).model,
    messages: buildMessages({ system, messages }),
    max_tokens: max_tokens || 4096,
    stream: true,
  }
  if (format?.schema) payload.response_format = { type: 'json_object' }
  const res = await fetch(`${baseURL()}/chat/completions`, {
    method: 'POST',
    headers: headers(apiKey),
    body: JSON.stringify(payload),
    signal,
  })
  if (!res.ok || !res.body) {
    let data = null
    try { data = await res.json() } catch {}
    throw new Error(errMsg(data, res.status))
  }
  const reader = res.body.getReader()
  const dec = new TextDecoder()
  let full = '', buf = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buf += dec.decode(value, { stream: true })
    const lines = buf.split('\n')
    buf = lines.pop() || ''
    for (const line of lines) {
      const s = line.trim()
      if (!s.startsWith('data:')) continue
      const json = s.slice(5).trim()
      if (!json || json === '[DONE]') continue
      try {
        const d = JSON.parse(json)
        const t = d.choices?.[0]?.delta?.content
        if (t) { full += t; onText?.(full, t) }
      } catch {}
    }
  }
  return full
}

// ---- Non-streaming completion ----
async function completeCall({ system, messages, model, max_tokens, format }) {
  const { apiKey } = withConfig({})
  let sys = system
  const payload = {
    model: model || withConfig({}).model,
    messages: buildMessages({ system, messages }),
    max_tokens: max_tokens || 2048,
  }
  if (format?.schema) {
    payload.response_format = { type: 'json_object' }
    sys = (system || '') +
      `\n\n只输出一个 JSON 对象，严格符合以下 JSON Schema（不要 markdown 代码块、不要任何多余文字）：\n${JSON.stringify(format.schema)}`
    payload.messages = buildMessages({ system: sys, messages })
  }
  const res = await fetch(`${baseURL()}/chat/completions`, {
    method: 'POST',
    headers: headers(apiKey),
    body: JSON.stringify(payload),
  })
  let data = null
  try { data = await res.json() } catch {}
  if (!res.ok) throw new Error(errMsg(data, res.status))
  return data.choices?.[0]?.message?.content || ''
}

// ==================== Public API ====================

export async function streamChat({ system, messages, model, max_tokens, onText, signal }) {
  return streamCall({ system, messages, model, max_tokens, onText, signal })
}

export async function streamPrd({ product, onText, signal }) {
  const userMsg =
    `# 以下是我的产品基本信息：\n\n` +
    `* 产品名称：${product.name || '(未填)'}\n` +
    `* 目标用户：${product.users || '(未填)'}\n` +
    `* 核心大模型能力：${product.capability || '(未填)'}\n` +
    `* 核心痛点：${product.painpoint || '(未填)'}\n` +
    (product.extra ? `* 补充说明：${product.extra}\n` : '') +
    `\n请据此生成完整 PRD。`
  return streamCall({ system: PRD_SYS, messages: [{ role: 'user', content: userMsg }], max_tokens: 8000, onText, signal })
}

export async function streamRevise({ doc, review, kind, onText, signal }) {
  const r = review || {}
  const issues = (r.issues || []).map((it) => `- [${it.severity}] ${it.point}`).join('\n')
  const improvements = (r.improvements || []).map((x) => `- ${x}`).join('\n')
  const reviewText = `总分：${r.overall ?? '-'}\n\n问题：\n${issues || '（无）'}\n\n改进建议：\n${improvements || '（无）'}`
  const sys =
    `你是资深产品经理。根据红队评审意见，对这份「${kind || '文档'}」做**实质性修订**：逐条回应评审中的问题与改进建议，补强薄弱环节，` +
    '保持并优化 Markdown 结构（标题、表格、列表、块引用）。输出**完整修订后的文档**（不是 diff、不要只列改动）。' +
    '开头加一行 `> 本次修订要点：…` 简述改了什么，然后给完整文档。中文，具体落地。'
  return streamCall({
    system: sys,
    messages: [{ role: 'user', content: `【原文】\n${doc}\n\n【红队评审意见】\n${reviewText}` }],
    max_tokens: 8000, onText, signal,
  })
}

function financialContext(mon, roi) {
  let out = ''
  if (mon?.model) out += `\n\n【商业化方案】模式：${mon.model}；定价：${(mon.pricing || []).map((t) => `${t.tier} ${t.price}(${t.forWho})`).join('；')}`
  if (roi?.scenarios?.length) {
    out += `\n\n【ROI/收入预估】已提供，详见用户输入。`
  }
  return out
}

export async function streamProposal({ product, paradigm, paradigmDesc, monetization, roi, onText, signal }) {
  const userMsg =
    `【目标范式】${paradigm || ''}（${paradigmDesc || ''}）\n\n` +
    `【产品基本信息】\n${productRecap(product)}${financialContext(monetization, roi)}\n\n请据此生成完整提案方案。`
  return streamCall({ system: PROPOSAL_SYS, messages: [{ role: 'user', content: userMsg }], max_tokens: 8000, onText, signal })
}

export async function streamDemo({ spec, paradigm, productName, onText, signal }) {
  const userMsg =
    `【范式】${paradigm || ''}\n【产品】${productName || ''}\n\n【Demo 设想】\n${spec || ''}\n\n` +
    '请据此生成可交互 HTML 原型。'
  return streamCall({ system: DEMO_SYS, messages: [{ role: 'user', content: userMsg }], max_tokens: 8000, onText, signal })
}

export async function complete({ system, messages, model, max_tokens, format }) {
  return completeCall({ system, messages, model, max_tokens, format })
}

export async function completeJSON({ system, messages, format, model, max_tokens }) {
  const text = await completeCall({ system, messages, model, max_tokens, format })
  return parseLenient(text)
}

// ---- Structured endpoints ----
export const getFit = (product) =>
  completeJSON({
    system: `你是 LLM 产品策略专家，熟悉下面 14 种范式：\n${PARADIGM_BRIEF}\n` +
      '基于产品信息，为**每一个**范式打契合度分数(0-100)，并给一句话理由(reason)。必须覆盖全部 14 个 id。summary 用一两句话点出最契合的方向。中文，判断有依据。',
    messages: [{ role: 'user', content: productBrief(product) }],
    format: { schema: FIT_SCHEMA },
    max_tokens: 3000,
  })

export const reviewDoc = (doc, kind) =>
  completeJSON({
    system:
      `你是资深产品评审 + 红队，对一份「${kind || '文档'}」严格挑刺。从这些维度逐一评分(0-100)并点评：` +
      '可行性、商业逻辑、技术合理性(尤其 LLM 特有：幻觉/成本/降级/安全)、需求清晰度、风险与遗漏、完整性。' +
      'overall 给总分；issues 列出具体问题(标严重度 高/中/低)；improvements 给可执行的改进建议。中文，犀利、具体、对事不对人。',
    messages: [{ role: 'user', content: doc }],
    format: { schema: REVIEW_SCHEMA },
    max_tokens: 2500,
  })

export const genBmc = (product) =>
  completeJSON({
    system:
      '你是商业模式专家。基于产品信息填写商业模式画布的九个要素，每个 3-5 条要点，具体不空泛：' +
      'customerSegments(客户细分)、valuePropositions(价值主张)、channels(渠道)、customerRelationships(客户关系)、' +
      'revenueStreams(收入来源)、keyResources(核心资源)、keyActivities(关键业务)、keyPartners(重要伙伴)、costStructure(成本结构)。中文。',
    messages: [{ role: 'user', content: productBrief(product) }],
    format: { schema: BMC_SCHEMA },
    max_tokens: 2500,
  })

export const genMonetize = (product, paradigm, paradigmDesc) =>
  completeJSON({
    system:
      `你是商业化策略专家。基于产品及其最契合的 LLM 范式「${paradigm}」（${paradigmDesc}），设计**商业化转化逻辑**：\n` +
      '- model：最适合该范式的商业化模式，modelReason 说明为何适配；\n' +
      '- funnel：转化漏斗 4-6 个阶段，每阶段给 goal、levers、metric；\n' +
      '- pricing：2-4 个定价档位（tier/price/forWho/includes/value/upgradeTrigger）；\n' +
      '- pricingLogic、conversionLogic、metrics、risks。\n' +
      '务必结合该范式的变现特性。中文，具体可落地。',
    messages: [{ role: 'user', content: productBrief(product) }],
    format: { schema: MONETIZE_SCHEMA },
    max_tokens: 3000,
  })

export const genRoi = (product, paradigm, paradigmDesc, monetization) => {
  const mon = monetization
  const monText = mon ? `\n【商业化方案】模式：${mon.model || ''}；定价：${(mon.pricing || []).map((t) => `${t.tier} ${t.price}(${t.forWho})`).join('；')}` : ''
  return completeJSON({
    system:
      `你是商业财务分析师。基于产品、其范式「${paradigm}」与定价方案，给出 ROI 与预期收入评估的**可计算假设**（给数字）。\n` +
      'currency、horizonMonths、scenarios(保守/中性/乐观 三情景：users/payRate/arpuMonthly/grossMargin/cac/fixedCostMonthly)、' +
      'assumptionNotes、drivers、risks。中文，数字务实。',
    messages: [{ role: 'user', content: productBrief(product) + monText }],
    format: { schema: ROI_SCHEMA },
    max_tokens: 2500,
  })
}

export async function advise(product, goal) {
  const sys =
    `你是资深 AI 产品顾问，熟悉 LLM toC 产品的 7 种范式：\n${PARADIGM_BRIEF}\n` +
    '用户会给出他们的产品信息和目标/问题。请输出 diagnosis(3-4步专家诊断)、recommended(范式id)、paradigmName、why、' +
    'runnerUp、runnerUpWhy、productProposal、demoIdea、cautions。全部中文，具体、不空泛。'
  const userMsg =
    `【产品信息】\n名称：${product.name || '(未填)'}\n定位：${product.positioning || '(未填)'}\n` +
    `目标人群：${product.audience || '(未填)'}\n界面/形态：${product.ui || '(未填)'}\n` +
    `主要功能：${product.features || '(未填)'}\n${product.stage ? `阶段：${product.stage}\n` : ''}` +
    `\n【目标 / 当前问题】\n${goal || '(未填)'}`
  return completeJSON({ system: sys, messages: [{ role: 'user', content: userMsg }], format: { schema: ADVISE_SCHEMA }, max_tokens: 6000 })
}

export async function analyzeCompetitor({ name, url, notes }) {
  const query = `产品：${name}\n官网/链接：${url || '(未提供)'}\n补充说明：${notes || '(无)'}`
  // Phase A: research from model knowledge (no web search in static build)
  const dossier = await completeCall({
    system: RESEARCH_SYS_NOWEB,
    messages: [{ role: 'user', content: query }],
    max_tokens: 1500,
  })
  // Phase B: structured report
  const structSys =
    `你是 LLM 产品分析师，精通下面 14 种 LLM 产品范式：\n${PARADIGM_BRIEF}\n` +
    '基于给定资料，对该产品做竞品分析，输出 overview、category(toC/toB/both)、paradigms、pros、cons、highlights、insights。判断要有依据、具体。中文。'
  const report = await completeJSON({
    system: structSys,
    messages: [{ role: 'user', content: `产品名：${name}\n\n【资料 dossier】\n${dossier}` }],
    format: { schema: COMPETE_SCHEMA },
    max_tokens: 3000,
  })
  return { report, sources: [], note: '纯静态部署不支持联网检索，已用模型内置知识分析（可能不含最新信息）。' }
}

export async function compareCompetitors(products) {
  const list = (products || []).filter((p) => p?.name?.trim()).slice(0, 4)
  const researched = await Promise.all(list.map(async (p) => {
    const query = `产品：${p.name}\n官网/链接：${p.url || '(未提供)'}\n补充：${p.notes || '(无)'}`
    return completeCall({ system: RESEARCH_SYS_NOWEB, messages: [{ role: 'user', content: query }], max_tokens: 1200 })
  }))
  const dossiers = list.map((p, i) => `### 产品${i + 1}：${p.name}\n${researched[i]}`).join('\n\n')
  const sys =
    `你是 LLM 产品分析师，精通下面 14 种范式：\n${PARADIGM_BRIEF}\n` +
    '基于多个产品的资料做横向对比，输出 products、paradigms、rows、takeaways。中文，具体不空泛。'
  const report = await completeJSON({
    system: sys,
    messages: [{ role: 'user', content: dossiers }],
    format: { schema: COMPARE_SCHEMA },
    max_tokens: 4000,
  })
  return { report, sources: [], note: '纯静态部署不支持联网检索，已用模型内置知识分析。' }
}

export async function answer(query) {
  const text = await completeCall({
    system: ANSWER_SYS_NOWEB,
    messages: [{ role: 'user', content: query }],
    max_tokens: 2048,
  })
  return { text, sources: [], note: '纯静态部署不支持联网检索，已用模型内置知识回答（可能不含最新信息）。' }
}

export async function genSlides(md) {
  return completeJSON({
    system: SLIDES_SYS,
    messages: [{ role: 'user', content: md }],
    format: { schema: SLIDES_SCHEMA },
    max_tokens: 4000,
  })
}

export async function prdOutline(product) {
  const sys =
    '你是资深 LLM 产品专家。基于产品信息，给出该 PRD 的"共享骨架"：tagline、version、personas(3-4个)、modules(3-4个核心功能模块名)。中文，精炼具体。'
  return completeJSON({
    system: sys,
    messages: [{ role: 'user', content: productRecap(product) }],
    format: { schema: OUTLINE_SCHEMA },
    max_tokens: 1200,
  })
}

export async function prdSection({ product, outline, chapter }) {
  const personas = Array.isArray(outline.personas) ? outline.personas.map((x) => x.role).filter(Boolean).join('、') : ''
  const modules = Array.isArray(outline.modules) ? outline.modules.join('、') : ''
  const sys =
    `你是拥有10年经验的资深 LLM 产品专家，正在撰写产品《${product.name || ''}》的 PRD 中的某一章。\n` +
    `共享骨架：价值主张：${outline.tagline || ''}；版本：${outline.version || 'V1.0.0'}；用户角色：${personas}；核心模块：${modules}\n\n` +
    '写作原则：去 AI 味、拒绝常识堆砌、突出 LLM 独特性、善用 Markdown。' +
    `严格只输出本章内容，以 \`## ${chapter.id}. ${chapter.title}\` 开头。\n本章撰写要求：${chapter.brief || ''}`
  return completeCall({
    system: sys,
    messages: [{ role: 'user', content: '产品基本信息：\n' + productRecap(product) }],
    max_tokens: chapter.maxTokens || 2200,
  })
}
