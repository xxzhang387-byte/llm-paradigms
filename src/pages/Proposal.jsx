import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { marked } from 'marked'
import { byId } from '../paradigms.js'
import { PRD_SEED } from '../prdSeeds.js'
import { streamProposal, genSlides } from '../api.js'
import { loadProducts } from '../productStore.js'
import { Spinner } from '../components.jsx'
import DemoSandbox from '../DemoSandbox.jsx'

// 从提案 Markdown 里抽出标题含关键词的那一节（到下一个 ## 为止）
function extractSection(md, re) {
  if (!md) return ''
  const lines = md.split('\n')
  let start = -1
  for (let i = 0; i < lines.length; i++) {
    if (/^#{1,3}\s/.test(lines[i]) && re.test(lines[i])) { start = i; break }
  }
  if (start < 0) return ''
  let end = lines.length
  for (let j = start + 1; j < lines.length; j++) {
    if (/^##\s/.test(lines[j])) { end = j; break }
  }
  return lines.slice(start, end).join('\n').trim()
}

const cacheKey = (id) => `llm_proposal_cache_v1:${id}`
const loadCache = (id) => { try { return JSON.parse(localStorage.getItem(cacheKey(id)) || 'null') } catch { return null } }
const saveCache = (id, data) => localStorage.setItem(cacheKey(id), JSON.stringify(data))

const FIELDS = [
  { key: 'name', label: '产品名称', short: true },
  { key: 'users', label: '目标用户' },
  { key: 'capability', label: '核心大模型能力' },
  { key: 'painpoint', label: '核心痛点' },
  { key: 'extra', label: '补充说明（选填）' },
]

const FRAMEWORK = ['背景', '目标', '数据', '升级策略', 'Demo', '需求分析', '市场分析', '预期计划']

function download(filename, content, mime) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename
  document.body.appendChild(a); a.click(); a.remove()
  URL.revokeObjectURL(url)
}

export default function Proposal() {
  const { id } = useParams()
  const nav = useNavigate()
  const p = byId(id)
  const [product, setProduct] = useState(PRD_SEED[id] || {})
  const [md, setMd] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [editing, setEditing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [pptBusy, setPptBusy] = useState(false)
  const [pptDone, setPptDone] = useState(0)
  const [lib, setLib] = useState([])
  const [linked, setLinked] = useState(null) // 关联产品的商业化/ROI

  useEffect(() => {
    const c = loadCache(id)
    if (c) { setMd(c.markdown || ''); if (c.product) setProduct(c.product) }
    else { setProduct(PRD_SEED[id] || {}); setMd('') }
    setLib(loadProducts()); setErr(''); setEditing(false); setLinked(null)
  }, [id])

  if (!p) return <div className="prd-page"><button className="back" onClick={() => nav('/')}>← 返回</button><p style={{ marginTop: 24 }}>未找到该范式。</p></div>

  const set = (k, v) => setProduct((pr) => ({ ...pr, [k]: v }))
  const safeName = (product.name || '提案').replace(/[\\/:*?"<>|\s]+/g, '_').slice(0, 40)

  const importFromLib = (pid) => {
    const it = lib.find((x) => x.id === pid)
    if (!it) return
    setProduct({ name: it.name || '', users: it.audience || '', capability: it.features || '', painpoint: it.positioning || '', extra: it.ui ? `界面/形态：${it.ui}` : '' })
    const art = it.artifacts || {}
    setLinked(art.monetization || art.roi ? { name: it.name, monetization: art.monetization, roi: art.roi } : null)
  }

  const generate = async () => {
    if (busy) return
    setBusy(true); setErr(''); setMd(''); setEditing(false); setPptDone(0)
    try {
      const full = await streamProposal({ product, paradigm: p.title, paradigmDesc: p.blurb, monetization: linked?.monetization, roi: linked?.roi, onText: setMd })
      saveCache(id, { product, markdown: full })
    } catch (e) { setErr(e.message || String(e)) }
    finally { setBusy(false) }
  }

  const onEditMd = (v) => { setMd(v); saveCache(id, { product, markdown: v }) }
  const copyMd = async () => { try { await navigator.clipboard.writeText(md); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch {} }
  const exportMd = () => download(`${safeName}-提案.md`, md, 'text/markdown;charset=utf-8')
  const exportDoc = () => {
    const html = marked.parse(md)
    const full = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>${product.name || '提案'}</title><style>body{font-family:"微软雅黑","Microsoft YaHei",sans-serif;font-size:11pt;line-height:1.6;color:#222}h1{font-size:20pt}h2{font-size:15pt;border-bottom:1px solid #ccc;padding-bottom:4px}h3{font-size:13pt}table{border-collapse:collapse;width:100%}th,td{border:1px solid #888;padding:5px 9px;font-size:10.5pt}th{background:#f2f2f2}blockquote{border-left:3px solid #888;margin:8px 0;padding:4px 12px;color:#555;background:#f7f7f7}</style></head><body>${html}</body></html>`
    download(`${safeName}-提案.doc`, full, 'application/msword')
  }
  const exportPpt = async () => {
    if (pptBusy) return
    setPptBusy(true); setErr('')
    try {
      const deck = await genSlides(md)
      const { buildPptx } = await import('../pptx.js')
      await buildPptx(deck, `${safeName}-提案.pptx`)
      setPptDone((deck.slides?.length || 0) + 1)
    } catch (e) {
      setErr('PPT 生成失败：' + (e.message || e))
    } finally {
      setPptBusy(false)
    }
  }

  return (
    <div className="prd-page" style={{ '--accent': p.accent }}>
      <div className="prd-topbar no-print">
        <button className="back" onClick={() => nav(`/guide/${id}`)}>← 返回方法论</button>
        <div className="prd-top-actions">
          <Link className="guide-link" to={`/p/${id}`}>▶ 体验 demo</Link>
          {md && !busy && <button className={`guide-link ${editing ? 'on' : ''}`} onClick={() => setEditing((e) => !e)}>{editing ? '✓ 完成编辑' : '✏️ 编辑'}</button>}
          {md && !busy && <button className="guide-link" onClick={copyMd}>{copied ? '✓ 已复制' : '⧉ 复制 MD'}</button>}
          {md && !busy && <button className="guide-link" onClick={exportMd}>⬇ .md</button>}
          {md && !busy && <button className="guide-link" onClick={exportDoc}>⬇ Word</button>}
          {md && !busy && <button className="guide-link ppt-hot" onClick={exportPpt} disabled={pptBusy}>{pptBusy ? '⏳ PPT…' : '🎞️ 一键 PPT'}</button>}
          {md && !busy && <button className="guide-link" onClick={() => window.print()}>🖨️ PDF</button>}
        </div>
      </div>

      <div className="prd-input no-print">
        <div className="prd-input-head">
          <h2>{p.icon} {p.title} · 提案方案生成</h2>
          <p>生成一份"把该产品按【{p.title}】范式升级落地"的提案：先给整体框架逻辑，再展开背景 / 目标 / 数据 / 升级策略 / Demo / 需求分析 / 市场分析 / 预期计划。字段可编辑，也能从产品库导入。</p>
        </div>
        <div className="framework-chips">
          <span className="fw-label">提案框架：</span>
          <span className="fw-pill lead">0 · 整体框架逻辑</span>
          {FRAMEWORK.map((f, i) => <span key={f} className="fw-pill">{i + 1} · {f}</span>)}
        </div>
        {lib.length > 0 && (
          <div className="prd-import">
            <label>从产品库导入：</label>
            <select defaultValue="" onChange={(e) => importFromLib(e.target.value)}>
              <option value="" disabled>选择一个已保存的产品…</option>
              {lib.map((it) => <option key={it.id} value={it.id}>{it.name || '未命名'}{(it.artifacts?.monetization || it.artifacts?.roi) ? ' 📊' : ''}</option>)}
            </select>
          </div>
        )}
        {linked && (linked.monetization || linked.roi) && (
          <div className="prop-linked">
            📊 已关联「{linked.name}」的{linked.monetization ? ' 商业化' : ''}{linked.roi ? ' ROI' : ''} —— 预期计划将引用收入预测
            <button onClick={() => setLinked(null)} title="取消关联">✕</button>
          </div>
        )}
        <div className="prd-fields">
          {FIELDS.map((f) => (
            <div className={`prd-field ${f.short ? 'short' : ''}`} key={f.key}>
              <label>{f.label}</label>
              {f.short ? <input value={product[f.key] || ''} onChange={(e) => set(f.key, e.target.value)} />
                : <textarea value={product[f.key] || ''} onChange={(e) => set(f.key, e.target.value)} />}
            </div>
          ))}
        </div>
        <div className="prd-gen-actions">
          <button className="primary" onClick={generate} disabled={busy}>{busy ? '生成中…' : md ? '🔄 重新生成' : '📑 生成提案方案'}</button>
        </div>
        {err && <div className="error-box">⚠️ {err}</div>}
      </div>

      {editing && !busy ? (
        <div className="prd-edit-wrap">
          <div className="edit-pane">
            <div className="edit-bar no-print">✏️ Markdown 源码 · 改动自动保存</div>
            <textarea className="md-editor" value={md} onChange={(e) => onEditMd(e.target.value)} spellCheck={false} />
          </div>
          <article className="prd-doc md-doc edit-preview">
            <div className="edit-bar no-print">实时预览</div>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{md}</ReactMarkdown>
          </article>
        </div>
      ) : (md || busy) ? (
        <article className="prd-doc md-doc">
          {busy && !md && <div className="gen-loading"><Spinner label="正在撰写提案方案" /></div>}
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{md}</ReactMarkdown>
          {busy && md && <span className="cursor-blink">▍</span>}
        </article>
      ) : (
        <div className="prd-empty no-print">
          ✦ 点击「生成提案方案」，AI 会先给出<strong>整体框架逻辑</strong>，再依次展开 <strong>背景 · 目标 · 数据 · 升级策略 · Demo · 需求分析 · 市场分析 · 预期计划</strong>，可编辑并导出 .md / Word / PDF。
        </div>
      )}

      {md && !busy && !editing && (
        <div className="ppt-cta no-print">
          <div className="ppt-cta-left">
            <span className="ppt-ico">🎞️</span>
            <div>
              <strong>一键生成路演 PPT</strong>
              <p>把这份提案浓缩成「封面 + 10～14 页」幻灯：要点提炼、计划/市场/数据自动转表格，深色主题，导出 .pptx 直接用。</p>
              {pptDone > 0 && <span className="ppt-done">✓ 已生成 {pptDone} 页并下载到本地</span>}
            </div>
          </div>
          <button className="ppt-cta-btn" onClick={exportPpt} disabled={pptBusy}>
            {pptBusy ? '⏳ 正在生成…' : pptDone > 0 ? '🔄 重新生成 PPT' : '🎞️ 生成 PPT'}
          </button>
        </div>
      )}

      {md && !busy && !editing && (
        <div className="proposal-demo no-print">
          <h3>🛠️ 把提案里的 Demo 做出来</h3>
          <p className="proposal-demo-sub">基于提案「Demo」一节，直接生成可交互原型（内部 AI 真实调用当前模型）。</p>
          <DemoSandbox
            spec={extractSection(md, /demo/i) || md}
            paradigm={p.title}
            productName={product.name}
          />
        </div>
      )}
    </div>
  )
}
