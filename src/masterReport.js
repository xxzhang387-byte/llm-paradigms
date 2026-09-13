import { byId } from './paradigms.js'

function roiCalc(s, h) {
  const users = +s.users || 0, payRate = +s.payRate || 0, arpu = +s.arpuMonthly || 0, gm = +s.grossMargin || 0, cac = +s.cac || 0, fc = +s.fixedCostMonthly || 0
  const paying = users * payRate / 100, mrr = paying * arpu, revenue = mrr * h
  const gp = revenue * gm / 100, acq = paying * cac, fixed = fc * h, invest = acq + fixed
  const net = gp - acq - fixed
  const roi = invest > 0 ? net / invest : net > 0 ? Infinity : 0
  const mn = mrr * gm / 100 - fc
  const payback = net <= 0 ? Infinity : mn > 0 ? invest / mn : Infinity
  return { revenue, net, roi, payback }
}
const fmtNum = (n) => { if (!isFinite(n)) return '∞'; const a = Math.abs(n); if (a >= 1e8) return (n / 1e8).toFixed(2) + '亿'; if (a >= 1e4) return (n / 1e4).toFixed(1) + '万'; return Math.round(n).toString() }
const esc = (s) => (s || '').replace(/\|/g, '/').replace(/\n+/g, ' ')

// Assemble a product's artifacts into one master-report Markdown string.
export function buildMasterReport(p) {
  const a = p.artifacts || {}
  const L = []
  L.push(`# ${p.name || '产品'} · 产品改造总报告`)
  if (p.positioning) L.push(`\n> ${p.positioning}`)

  L.push(`\n## 一、产品概览`)
  L.push(`- **定位**：${p.positioning || '—'}`)
  L.push(`- **目标人群**：${p.audience || '—'}`)
  L.push(`- **界面 / 形态**：${p.ui || '—'}`)
  L.push(`- **主要功能**：${p.features || '—'}`)
  if (p.goal) L.push(`- **改造目标**：${p.goal}`)

  if (a.fit?.scores?.length) {
    L.push(`\n## 二、范式契合度`)
    if (a.fit.summary) L.push(`> ${a.fit.summary}\n`)
    L.push(`| 范式 | 契合分 | 理由 |`)
    L.push(`| --- | --- | --- |`)
    ;[...a.fit.scores].sort((x, y) => y.score - x.score).forEach((s) => { const pa = byId(s.id); L.push(`| ${pa ? pa.title : s.id} | ${s.score} | ${esc(s.reason)} |`) })
  }

  if (a.diagnosis) {
    const d = a.diagnosis, pa = byId(d.recommended)
    L.push(`\n## 三、专家诊断`)
    L.push(`**推荐范式：${d.paradigmName || (pa ? pa.title : d.recommended)}**`)
    if (d.why) L.push(`\n${d.why}`)
    if (d.diagnosis?.length) { L.push(`\n**诊断要点：**`); d.diagnosis.forEach((x) => L.push(`- **${x.title}**：${x.insight}`)) }
    if (d.cautions?.length) { L.push(`\n**注意要点：**`); d.cautions.forEach((c) => L.push(`- ${c}`)) }
  }

  if (a.bmc) {
    L.push(`\n## 四、商业模式画布`)
    const cells = [['valuePropositions', '价值主张'], ['customerSegments', '客户细分'], ['channels', '渠道通路'], ['customerRelationships', '客户关系'], ['revenueStreams', '收入来源'], ['keyResources', '核心资源'], ['keyActivities', '关键业务'], ['keyPartners', '重要伙伴'], ['costStructure', '成本结构']]
    cells.forEach(([k, label]) => { if (a.bmc[k]?.length) { L.push(`\n**${label}**`); a.bmc[k].forEach((x) => L.push(`- ${x}`)) } })
  }

  if (a.monetization) {
    const m = a.monetization
    L.push(`\n## 五、商业化策略`)
    L.push(`**商业化模式：${m.model}** —— ${m.modelReason}`)
    if (m.pricing?.length) {
      L.push(`\n**定价档位：**`)
      L.push(`| 档位 | 价格 | 面向 | 包含 |`)
      L.push(`| --- | --- | --- | --- |`)
      m.pricing.forEach((t) => L.push(`| ${t.tier} | ${t.price} | ${esc(t.forWho)} | ${esc((t.includes || []).join('、'))} |`))
    }
    if (m.pricingLogic?.length) { L.push(`\n**定价逻辑：**`); m.pricingLogic.forEach((x) => L.push(`- ${x}`)) }
    if (m.conversionLogic?.length) { L.push(`\n**转化逻辑（免费→付费）：**`); m.conversionLogic.forEach((x) => L.push(`- ${x}`)) }
    if (m.metrics?.length) L.push(`\n**关键指标：** ${m.metrics.join('、')}`)
    if (m.risks?.length) { L.push(`\n**商业化风险：**`); m.risks.forEach((x) => L.push(`- ${x}`)) }
  }

  if (a.roi?.scenarios?.length) {
    const r = a.roi, cur = r.currency || '元', h = r.horizonMonths || 12
    L.push(`\n## 六、ROI / 收入预估（评估期 ${h} 个月）`)
    L.push(`| 情景 | 期内收入 | 净利润 | ROI | 回本周期 |`)
    L.push(`| --- | --- | --- | --- | --- |`)
    r.scenarios.forEach((s) => { const k = roiCalc(s, h); L.push(`| ${s.name} | ${cur}${fmtNum(k.revenue)} | ${cur}${fmtNum(k.net)} | ${isFinite(k.roi) ? Math.round(k.roi * 100) + '%' : '∞'} | ${isFinite(k.payback) ? Math.ceil(k.payback) + '月' : '—'} |`) })
    if (r.assumptionNotes?.length) { L.push(`\n**假设依据：**`); r.assumptionNotes.forEach((x) => L.push(`- ${x}`)) }
  }

  if (a.prd) { L.push(`\n## 七、产品需求文档（PRD）\n`); L.push(a.prd) }
  if (a.proposal) { L.push(`\n## 八、汇报 / 提案方案\n`); L.push(a.proposal) }

  return L.join('\n')
}

// Which sections are present — for showing what's included.
export function reportSections(p) {
  const a = p.artifacts || {}
  return [['概览', true], ['契合度', !!a.fit], ['诊断', !!a.diagnosis], ['画布', !!a.bmc], ['商业化', !!a.monetization], ['ROI', !!a.roi], ['PRD', !!a.prd], ['汇报', !!a.proposal]]
}
