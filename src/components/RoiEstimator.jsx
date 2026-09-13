import { useEffect, useState } from 'react'

const fmt = (n) => {
  if (!isFinite(n)) return '∞'
  const a = Math.abs(n)
  if (a >= 1e8) return (n / 1e8).toFixed(2) + '亿'
  if (a >= 1e4) return (n / 1e4).toFixed(1) + '万'
  return Math.round(n).toLocaleString()
}
const pct = (n) => (isFinite(n) ? Math.round(n * 100) + '%' : '∞')

function calc(s, horizon) {
  const users = +s.users || 0, payRate = +s.payRate || 0, arpu = +s.arpuMonthly || 0
  const gm = +s.grossMargin || 0, cac = +s.cac || 0, fc = +s.fixedCostMonthly || 0
  const paying = users * payRate / 100
  const mrr = paying * arpu
  const revenue = mrr * horizon
  const grossProfit = revenue * gm / 100
  const acq = paying * cac
  const fixed = fc * horizon
  const invest = acq + fixed
  const net = grossProfit - acq - fixed
  const roi = invest > 0 ? net / invest : net > 0 ? Infinity : 0
  const monthlyNet = mrr * gm / 100 - fc
  const payback = net <= 0 ? Infinity : monthlyNet > 0 ? invest / monthlyNet : Infinity
  return { paying, mrr, revenue, net, invest, roi, payback }
}

const NAMES = ['保守', '中性', '乐观']
const FIELDS = [
  ['users', '可获取用户数'], ['payRate', '付费转化率(%)'], ['arpuMonthly', '人均月付费'],
  ['grossMargin', '毛利率(%)'], ['cac', '获客成本/付费用户'], ['fixedCostMonthly', '月固定成本'],
]

export default function RoiEstimator({ data }) {
  const horizon = data.horizonMonths || 12
  const cur = data.currency || '元'
  const scen = data.scenarios || []
  const [idx, setIdx] = useState(Math.min(1, scen.length - 1))
  const [s, setS] = useState(scen[Math.min(1, scen.length - 1)] || {})
  useEffect(() => { setS(scen[idx] || {}) }, [idx, data])

  const k = calc(s, horizon)
  const set = (key, v) => setS((o) => ({ ...o, [key]: v }))
  const netByScen = scen.map((x) => calc(x, horizon).net)
  const maxAbs = Math.max(1, ...netByScen.map((n) => Math.abs(n)))

  return (
    <div className="roi">
      <div className="roi-scen-tabs">
        {scen.map((x, i) => <button key={i} className={i === idx ? 'on' : ''} onClick={() => setIdx(i)}>{x.name || NAMES[i]}</button>)}
        <span className="roi-horizon">评估期 {horizon} 个月</span>
      </div>

      <div className="roi-kpis">
        <div className="roi-kpi"><span>付费用户</span><b>{fmt(k.paying)}</b></div>
        <div className="roi-kpi"><span>MRR</span><b>{cur}{fmt(k.mrr)}</b></div>
        <div className="roi-kpi"><span>期内收入</span><b>{cur}{fmt(k.revenue)}</b></div>
        <div className={`roi-kpi ${k.net >= 0 ? 'pos' : 'neg'}`}><span>净利润</span><b>{cur}{fmt(k.net)}</b></div>
        <div className={`roi-kpi ${k.roi >= 0 ? 'pos' : 'neg'}`}><span>ROI</span><b>{pct(k.roi)}</b></div>
        <div className="roi-kpi"><span>回本周期</span><b>{isFinite(k.payback) ? Math.ceil(k.payback) + '月' : '—'}</b></div>
      </div>

      <div className="roi-edit">
        <div className="roi-edit-h">关键假设（可调，实时重算 · {cur}）</div>
        <div className="roi-grid">
          {FIELDS.map(([key, label]) => (
            <label className="roi-field" key={key}>
              <span>{label}</span>
              <input type="number" value={s[key] ?? ''} onChange={(e) => set(key, e.target.value)} />
            </label>
          ))}
        </div>
      </div>

      <div className="roi-compare">
        <div className="roi-compare-h">三情景净利润对比（按各自原始假设）</div>
        <div className="roi-bars">
          {scen.map((x, i) => {
            const n = netByScen[i]
            return (
              <div className="roi-barwrap" key={i}>
                <div className="roi-bar-track"><span className={n >= 0 ? 'pos' : 'neg'} style={{ height: `${Math.max(3, Math.abs(n) / maxAbs * 100)}%` }} /></div>
                <div className="roi-bar-label">{x.name || NAMES[i]}<em>{cur}{fmt(n)}</em></div>
              </div>
            )
          })}
        </div>
      </div>

      {[['📌 假设依据', data.assumptionNotes], ['🎚️ 关键驱动', data.drivers], ['⚠️ 风险', data.risks]].map(([h, arr], i) =>
        arr?.length > 0 ? <div className="roi-notes" key={i}><h4>{h}</h4><ul>{arr.map((x, j) => <li key={j}>{x}</li>)}</ul></div> : null
      )}
    </div>
  )
}
