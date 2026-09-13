import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { byId } from '../paradigms.js'
import { GUIDE, SECTIONS } from '../knowledge.js'
import { PRD_SEED } from '../prdSeeds.js'
import { genMonetize } from '../api.js'
import { Spinner } from '../components.jsx'
import Monetization from '../components/Monetization.jsx'
import RoiBlock from '../components/RoiBlock.jsx'
import DemoSandbox from '../DemoSandbox.jsx'

function GuideMonetize({ p }) {
  const [data, setData] = useState(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const seed = PRD_SEED[p.id] || {}
  const product = { name: seed.name || p.title, audience: seed.users || '', features: seed.capability || '', positioning: seed.painpoint || p.blurb }

  const run = async () => {
    if (busy) return
    setBusy(true); setErr('')
    try { setData(await genMonetize(product, p.title, p.blurb)) }
    catch (e) { setErr(e.message || String(e)) } finally { setBusy(false) }
  }

  return (
    <div className="guide-mon" id="sec-mon">
      <h3>💰 这个范式的商业化转化逻辑</h3>
      <p>以「{seed.name || p.title}」为例，设计「{p.title}」范式典型的变现模式、转化漏斗、定价与关键指标。</p>
      {err && <div className="error-box">⚠️ {err}</div>}
      {busy && <div className="gmon-loading"><Spinner label="设计商业化转化逻辑" /></div>}
      {data && <Monetization data={data} />}
      <button className="ghost gmon-btn" onClick={run} disabled={busy}>{busy ? '设计中…' : data ? '🔄 重新设计' : '💰 设计商业化策略'}</button>
      {data && (
        <div className="gmon-roi">
          <h4 className="mon-h">📊 基于这套定价的 ROI / 收入预估</h4>
          <RoiBlock product={product} paradigm={p.title} paradigmDesc={p.blurb} monetization={data} />
        </div>
      )}
    </div>
  )
}

export default function Knowledge() {
  const { id } = useParams()
  const p = byId(id)
  const g = GUIDE[id]
  const nav = useNavigate()
  if (!p || !g) {
    return (
      <div className="shell">
        <button className="back" onClick={() => nav('/')}>← 返回</button>
        <p style={{ marginTop: 24 }}>未找到该范式。</p>
      </div>
    )
  }

  return (
    <div className="shell guide" style={{ '--accent': p.accent }}>
      <header className="shell-top">
        <button className="back" onClick={() => nav('/')}>← 全部范式</button>
        <div className="shell-id">
          <span className="dot" /> 范式 {p.n} · {p.en} · 方法论
        </div>
      </header>

      <div className="shell-head">
        <div className="shell-emoji">{p.icon}</div>
        <div>
          <h1>{p.title} · 产品方法论</h1>
          <p className="shell-tag">{p.tag}</p>
        </div>
      </div>

      <div className="guide-nav">
        <Link className="primary guide-cta" to={`/p/${id}`}>▶ 体验这个范式的 demo</Link>
        <Link className="ghost guide-cta" to={`/proposal/${id}`}>📑 生成提案方案</Link>
        <span className="guide-blurb">{p.blurb}</span>
      </div>

      <nav className="guide-toc">
        {SECTIONS.map((s) => <a key={s.key} href={`#sec-${s.key}`}>{s.icon} {s.title}</a>)}
        <a href="#sec-mon">💰 商业化</a>
        <a href="#sec-demo">🛠️ 即时 Demo</a>
      </nav>

      <div className="guide-grid">
        {SECTIONS.map((s) => {
          const data = g[s.key]
          return (
            <section className="guide-card" id={`sec-${s.key}`} key={s.key}>
              <h3>
                <span className="g-icon">{s.icon}</span> {s.title}
              </h3>
              {s.mono ? (
                <div className="prd-preview">
                  <pre className="prd">{data}</pre>
                  <Link className="prd-open" to={`/prd/${id}`}>
                    ✨ 生成完整 PRD（AI 撰写 · 用户角色表 / 功能深拆 / 埋点 / 风险熔断）→
                  </Link>
                </div>
              ) : s.cases ? (
                <ul className="case-list">
                  {data.map((c, i) => (
                    <li key={i}>
                      <strong>{c.name}</strong>
                      <span>{c.note}</span>
                    </li>
                  ))}
                </ul>
              ) : Array.isArray(data) ? (
                <ul className="g-list">
                  {data.map((it, i) => (
                    <li key={i}>{it}</li>
                  ))}
                </ul>
              ) : (
                <p>{data}</p>
              )}
            </section>
          )
        })}
      </div>

      <GuideMonetize p={p} />

      <div className="guide-demo" id="sec-demo">
        <h3>🛠️ 即时造一个「{p.title}」变体 Demo</h3>
        <p>用这个范式现场生成一个可交互原型（内部 AI 真实调用当前模型）。</p>
        <DemoSandbox
          spec={`范式：${p.title}（${p.tag}）—— ${p.blurb}\n请做一个体现「${p.title}」这个范式的、可交互的最小可玩 demo 变体。`}
          paradigm={p.title}
          productName={p.title}
        />
      </div>
    </div>
  )
}
