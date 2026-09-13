import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Rich, Spinner } from '../components.jsx'
import { byId } from '../paradigms.js'
import { advise } from '../api.js'
import DemoSandbox from '../DemoSandbox.jsx'
import { loadProducts, upsertProduct, deleteProduct } from '../productStore.js'

const BLANK = { name: '', positioning: '', audience: '', ui: '', features: '', stage: '' }

const FIELDS = [
  { key: 'name', label: '产品名称', ph: '例如：菌子火锅 App', short: true },
  { key: 'positioning', label: '产品定位', ph: '一句话定位：我们是给谁解决什么问题的什么产品' },
  { key: 'audience', label: '目标人群', ph: '谁在用？年龄/场景/付费意愿/核心诉求' },
  { key: 'ui', label: '界面 / 形态', ph: 'App / 小程序 / 网页 / 浏览器插件？主界面长什么样' },
  { key: 'features', label: '主要功能', ph: '现在的核心功能有哪些（尽量详细列举）' },
  { key: 'stage', label: '阶段（选填）', ph: '0→1 / 增长期 / 成熟期', short: true },
]

const GOAL_PRESETS = ['提升用户增长', '增加用户粘性 / 留存', '提高付费转化', '当前增长遇到瓶颈', '功能同质化、缺乏差异']

export default function Advisor() {
  const nav = useNavigate()
  const [form, setForm] = useState(BLANK)
  const [goal, setGoal] = useState('')
  const [lib, setLib] = useState([])
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const [err, setErr] = useState('')

  useEffect(() => setLib(loadProducts()), [])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const saveToLib = () => {
    if (!form.name.trim()) return
    const rec = upsertProduct(form)
    setForm(rec)
    setLib(loadProducts())
  }
  const loadFromLib = (p) => {
    setForm(p)
    setResult(null)
    setErr('')
  }
  const removeFromLib = (id, e) => {
    e.stopPropagation()
    deleteProduct(id)
    setLib(loadProducts())
    if (form.id === id) setForm({ ...form, id: undefined })
  }

  const consult = async () => {
    if (busy) return
    if (!form.positioning.trim() && !form.features.trim()) {
      setErr('请至少填写产品定位或主要功能')
      return
    }
    setBusy(true)
    setErr('')
    setResult(null)
    // 顺手存一份到产品库
    if (form.name.trim()) {
      const rec = upsertProduct(form)
      setForm(rec)
      setLib(loadProducts())
    }
    try {
      const data = await advise(form, goal)
      setResult(data)
    } catch (e) {
      setErr(e.message || String(e))
    } finally {
      setBusy(false)
    }
  }

  const rec = result && byId(result.recommended)
  const runner = result?.runnerUp && byId(result.runnerUp)

  return (
    <div className="advisor">
      <div className="advisor-wrap">
        <header className="shell-top">
          <button className="back" onClick={() => nav('/')}>← 全部范式</button>
          <div className="shell-id"><span className="dot" /> AI 产品顾问 Agent</div>
        </header>

        <div className="adv-head">
          <div className="adv-emoji">🧭</div>
          <div>
            <h1>AI 产品顾问</h1>
            <p>填入你的产品，给出目标或问题 —— 顾问会做专家诊断、推荐最合适的范式，并给出落地方案与 demo 设想。</p>
          </div>
        </div>

        <div className="adv-body">
          {/* 左：产品信息 + 产品库 */}
          <div className="adv-form">
            <div className="adv-section-title">① 你的产品</div>
            {FIELDS.map((f) =>
              f.short ? (
                <div className="adv-field" key={f.key}>
                  <label>{f.label}</label>
                  <input value={form[f.key] || ''} placeholder={f.ph} onChange={(e) => set(f.key, e.target.value)} />
                </div>
              ) : (
                <div className="adv-field" key={f.key}>
                  <label>{f.label}</label>
                  <textarea value={form[f.key] || ''} placeholder={f.ph} onChange={(e) => set(f.key, e.target.value)} />
                </div>
              )
            )}
            <button className="save-btn" onClick={saveToLib} disabled={!form.name.trim()}>
              💾 保存到产品库
            </button>

            {lib.length > 0 && (
              <div className="lib">
                <div className="adv-section-title">📦 产品库（{lib.length}）</div>
                {lib.map((p) => (
                  <div
                    key={p.id}
                    className={`lib-item ${form.id === p.id ? 'on' : ''}`}
                    onClick={() => loadFromLib(p)}
                  >
                    <div>
                      <strong>{p.name || '未命名'}</strong>
                      <small>{p.positioning || '—'}</small>
                    </div>
                    <button className="lib-del" onClick={(e) => removeFromLib(p.id, e)}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 右：目标 + 咨询结果 */}
          <div className="adv-main">
            <div className="adv-section-title">② 你的目标 / 当前问题</div>
            <textarea
              className="goal-input"
              value={goal}
              placeholder="例如：上线半年，新增还行但留存差，想提升粘性；或：增长卡住了，不知道往哪走"
              onChange={(e) => setGoal(e.target.value)}
            />
            <div className="chips">
              {GOAL_PRESETS.map((g) => (
                <button key={g} onClick={() => setGoal((v) => (v ? v + '；' + g : g))}>{g}</button>
              ))}
            </div>
            <button className="primary consult-btn" onClick={consult} disabled={busy}>
              {busy ? '专家诊断中…' : '🧠 咨询专家'}
            </button>

            {err && <div className="error-box">⚠️ {err}</div>}
            {busy && <div className="consult-loading"><Spinner label="顾问正在分析你的产品" /></div>}

            {result && (
              <div className="advice">
                {/* 专家诊断 */}
                <div className="advice-block">
                  <h3>🩺 专家诊断</h3>
                  <ol className="diagnosis">
                    {result.diagnosis.map((d, i) => (
                      <li key={i}>
                        <div className="diag-num">{i + 1}</div>
                        <div>
                          <strong>{d.title}</strong>
                          <p>{d.insight}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* 推荐范式 */}
                {rec && (
                  <div className="advice-block rec-block" style={{ '--accent': rec.accent }}>
                    <div className="rec-tag">推荐范式</div>
                    <div className="rec-main">
                      <span className="rec-emoji">{rec.icon}</span>
                      <div>
                        <h3>
                          {result.paradigmName || rec.title} <span className="rec-en">{rec.en}</span>
                        </h3>
                        <p className="rec-why">{result.why}</p>
                      </div>
                    </div>
                    <div className="rec-links">
                      <Link className="primary" to={`/p/${rec.id}`}>▶ 体验 {rec.title} demo</Link>
                      <Link className="ghost" to={`/guide/${rec.id}`}>📖 该范式方法论</Link>
                    </div>
                  </div>
                )}

                {runner && (
                  <div className="advice-inline">
                    <span className="runner-tag">次选</span>
                    <strong>{runner.title}</strong> —— {result.runnerUpWhy}
                    <Link className="mini-link" to={`/guide/${runner.id}`}>了解 →</Link>
                  </div>
                )}

                {/* 落地方案 */}
                <div className="advice-block">
                  <h3>🧩 落地方案：把这个范式用到「{form.name || '你的产品'}」</h3>
                  <Rich text={result.productProposal} />
                </div>

                <div className="advice-block">
                  <h3>🎛️ Demo 设想</h3>
                  <Rich text={result.demoIdea} />
                  <DemoSandbox spec={result.demoIdea} paradigm={result.paradigmName} productName={form.name} />
                </div>

                {/* 注意要点 */}
                <div className="advice-block cautions">
                  <h3>⚠️ 落地注意要点</h3>
                  <ul>
                    {result.cautions.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
