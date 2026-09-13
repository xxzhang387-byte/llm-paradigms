import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadProducts, upsertProduct, deleteProduct } from '../productStore.js'

const FIELDS = [
  { key: 'name', label: '产品名称', short: true },
  { key: 'positioning', label: '定位' },
  { key: 'audience', label: '目标人群' },
  { key: 'ui', label: '界面 / 形态' },
  { key: 'features', label: '主要功能' },
]
const ART = [['fit', '契合度'], ['diagnosis', '诊断'], ['bmc', '画布'], ['monetization', '商业化'], ['roi', 'ROI'], ['prd', 'PRD'], ['proposal', '提案']]

export default function Workspace() {
  const nav = useNavigate()
  const [lib, setLib] = useState([])
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({})

  useEffect(() => setLib(loadProducts()), [])

  const create = () => {
    if (!form.name?.trim()) return
    const rec = upsertProduct(form)
    nav(`/workspace/${rec.id}`)
  }
  const del = (id, e) => { e.stopPropagation(); deleteProduct(id); setLib(loadProducts()) }

  return (
    <div className="ws">
      <div className="ws-wrap">
        <div className="ws-head">
          <div>
            <h1>🗂️ 产品工作台</h1>
            <p>每个产品一个工作空间：契合度、诊断、商业画布、PRD、提案、可交互 Demo 都挂在它名下。</p>
          </div>
          <button className="primary" onClick={() => setCreating((v) => !v)}>{creating ? '取消' : '+ 新建产品'}</button>
        </div>

        {creating && (
          <div className="ws-new">
            {FIELDS.map((f) => (
              <div className={`adv-field ${f.short ? 'ws-new-short' : ''}`} key={f.key}>
                <label>{f.label}</label>
                {f.short ? <input value={form[f.key] || ''} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
                  : <textarea value={form[f.key] || ''} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />}
              </div>
            ))}
            <button className="primary" onClick={create} disabled={!form.name?.trim()}>创建并进入</button>
          </div>
        )}

        {lib.length === 0 && !creating && <div className="ws-empty">还没有产品。点「+ 新建产品」开始，或从 🧭 顾问 / 🔬 竞品里保存产品到这里。</div>}

        <div className="ws-grid">
          {lib.map((p) => {
            const a = p.artifacts || {}
            return (
              <div className="ws-card" key={p.id} onClick={() => nav(`/workspace/${p.id}`)}>
                <div className="ws-card-top"><h3>{p.name || '未命名'}</h3><button className="ws-del" onClick={(e) => del(p.id, e)}>✕</button></div>
                <p className="ws-card-pos">{p.positioning || '—'}</p>
                <div className="ws-badges">
                  {ART.map(([k, label]) => <span key={k} className={`ws-badge ${a[k] ? 'on' : ''}`}>{a[k] ? '✓' : '·'} {label}</span>)}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
