import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { marked } from 'marked'
import { byId } from '../paradigms.js'
import { PRD } from '../prd.js'
import { PRD_SEED } from '../prdSeeds.js'
import { streamPrd, prdOutline, prdSection } from '../api.js'
import { loadProducts } from '../productStore.js'
import { Spinner } from '../components.jsx'
import RedTeam from '../components/RedTeam.jsx'

const cacheKey = (id) => `llm_prd_cache_v1:${id}`
const loadCache = (id) => { try { return JSON.parse(localStorage.getItem(cacheKey(id)) || 'null') } catch { return null } }
const saveCache = (id, data) => localStorage.setItem(cacheKey(id), JSON.stringify(data))

const FIELDS = [
  { key: 'name', label: '产品名称', short: true },
  { key: 'users', label: '目标用户' },
  { key: 'capability', label: '核心大模型能力' },
  { key: 'painpoint', label: '核心痛点' },
  { key: 'extra', label: '补充说明（选填）' },
]

const CHAPTERS = [
  { id: 1, title: '文档基本信息', brief: '用表格给出产品名称、版本号(V1.0.0)、撰写人、发布日期、审批状态。', maxTokens: 900 },
  { id: 2, title: '产品概述与核心价值', brief: '分三块：核心痛点(没有产品前如何痛苦地完成任务)、解决方案(如何用大模型能力重构工作流)、核心价值(量化：提升X%效率/降低X%成本)。', maxTokens: 1800 },
  { id: 3, title: '用户角色与典型场景', brief: '用表格呈现至少3个角色，列：用户角色、核心痛点、典型应用场景。', maxTokens: 1600 },
  { id: 4, title: '核心功能需求', brief: '深度拆解3-4个核心模块。每个模块含：①需求描述②详细交互逻辑(用户怎么用、系统怎么响应)③LLM特有逻辑(调用什么模型、Prompt表单化、RAG召回机制、引用溯源交互)。这是最重要的一章，请最详尽。', maxTokens: 4000 },
  { id: 5, title: '非功能需求', brief: '性能与体验(首字响应TTFT、并发、流式打字机、自动保存)；LLM专属质量指标(上下文窗口Context Window处理策略、输入输出合规过滤、内容幻觉抑制方案)。', maxTokens: 2200 },
  { id: 6, title: '埋点与数据看板需求', brief: '运营指标 + 大模型专用监控(Input/Output Tokens消耗统计、Prompt热度、用户点赞/点踩反馈闭环)，用表格列出关键埋点。', maxTokens: 2000 },
  { id: 7, title: '风险与应对策略', brief: '必须含：API宕机/超时的降级与熔断机制；Token成本超支的限制策略。用表格呈现(风险/影响/应对)。', maxTokens: 2000 },
]

async function runPool(items, limit, worker) {
  let idx = 0
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (idx < items.length) { const cur = idx++; await worker(items[cur], cur) }
  })
  await Promise.all(runners)
}

function download(filename, content, mime) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function Baseline({ doc }) {
  const R = (s) => {
    if (s.kind === 'paras') return s.body.map((p, i) => <p key={i} className="prd-p">{p}</p>)
    if (s.kind === 'bullets') return <ul className="prd-ul">{s.items.map((it, i) => <li key={i}>{it}</li>)}</ul>
    if (s.kind === 'twocol') return (
      <div className="prd-twocol">
        <div className="prd-col goals"><h4>{s.leftTitle}</h4><ul>{s.left.map((it, i) => <li key={i}>{it}</li>)}</ul></div>
        <div className="prd-col nongoals"><h4>{s.rightTitle}</h4><ul>{s.right.map((it, i) => <li key={i}>{it}</li>)}</ul></div>
      </div>
    )
    if (s.kind === 'cards') return <div className="prd-cards">{s.cards.map((c, i) => <div className="prd-card" key={i}><h4>{c.title}</h4><ul>{c.lines.map((l, j) => <li key={j}>{l}</li>)}</ul></div>)}</div>
    if (s.kind === 'steps') return <ol className="prd-steps">{s.steps.map((st, i) => <li key={i}><span className="prd-step-n">{i + 1}</span><div><strong>{st.name}</strong><span>{st.detail}</span></div></li>)}</ol>
    if (s.kind === 'table') return (
      <div className="prd-table-wrap"><table className="prd-table">
        <thead><tr>{s.columns.map((c, i) => <th key={i}>{c}</th>)}</tr></thead>
        <tbody>{s.rows.map((r, i) => <tr key={i}>{r.map((cell, j) => <td key={j} className={s.columns[j] === '优先级' ? `pri pri-${cell}` : ''}>{cell}</td>)}</tr>)}</tbody>
      </table></div>
    )
    return null
  }
  return <div className="baseline">{doc.sections.map((s) => <section className="prd-section" key={s.id}><h2>{s.title}</h2>{R(s)}</section>)}</div>
}

export default function Prd() {
  const { id } = useParams()
  const nav = useNavigate()
  const p = byId(id)
  const baseline = PRD[id]
  const [product, setProduct] = useState(PRD_SEED[id] || {})
  const [md, setMd] = useState('')
  const [busy, setBusy] = useState(false)
  const [phase, setPhase] = useState('') // outline | sections
  const [chState, setChState] = useState([]) // [{status}]
  const [err, setErr] = useState('')
  const [showBaseline, setShowBaseline] = useState(false)
  const [editing, setEditing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [lib, setLib] = useState([])
  const results = useRef([])

  useEffect(() => {
    const c = loadCache(id)
    if (c) { setMd(c.markdown || ''); if (c.product) setProduct(c.product) }
    else { setProduct(PRD_SEED[id] || {}); setMd('') }
    setLib(loadProducts())
    setErr(''); setChState([]); setEditing(false)
  }, [id])

  if (!p) {
    return <div className="prd-page"><button className="back" onClick={() => nav('/')}>← 返回</button><p style={{ marginTop: 24 }}>未找到该范式。</p></div>
  }

  const set = (k, v) => setProduct((pr) => ({ ...pr, [k]: v }))
  const safeName = (product.name || 'PRD').replace(/[\\/:*?"<>|\s]+/g, '_').slice(0, 40)

  const importFromLib = (pid) => {
    const it = lib.find((x) => x.id === pid)
    if (!it) return
    setProduct({ name: it.name || '', users: it.audience || '', capability: it.features || '', painpoint: it.positioning || '', extra: it.ui ? `界面/形态：${it.ui}` : '' })
  }

  const assemble = () => {
    const body = results.current.map((r) => r || '').filter(Boolean).join('\n\n')
    return `# ${product.name || '产品'} · 产品需求文档（PRD）\n\n${body}`
  }

  // 分章并行深度生成
  const generateDeep = async () => {
    if (busy) return
    setBusy(true); setErr(''); setMd(''); setPhase('outline')
    results.current = new Array(CHAPTERS.length).fill('')
    setChState(CHAPTERS.map(() => ({ status: 'pending' })))
    let outline = { tagline: '', version: 'V1.0.0', personas: [], modules: [] }
    try {
      outline = await prdOutline(product)
    } catch (e) {
      // 骨架失败不致命，继续用空骨架
    }
    setPhase('sections')
    try {
      await runPool(CHAPTERS, 3, async (ch, i) => {
        setChState((s) => s.map((x, j) => (j === i ? { status: 'gen' } : x)))
        try {
          const text = await prdSection({ product, outline, chapter: ch })
          results.current[i] = text
          setChState((s) => s.map((x, j) => (j === i ? { status: 'done' } : x)))
        } catch (e) {
          results.current[i] = `## ${ch.id}. ${ch.title}\n\n> ⚠️ 本章生成失败：${e.message || e}`
          setChState((s) => s.map((x, j) => (j === i ? { status: 'error' } : x)))
        }
        setMd(assemble())
      })
      const full = assemble()
      setMd(full)
      saveCache(id, { product, markdown: full })
    } catch (e) {
      setErr(e.message || String(e))
    } finally {
      setBusy(false); setPhase('')
    }
  }

  // 快速单次生成
  const generateQuick = async () => {
    if (busy) return
    setBusy(true); setErr(''); setMd(''); setPhase('quick'); setChState([])
    try {
      const full = await streamPrd({ product, onText: setMd })
      saveCache(id, { product, markdown: full })
    } catch (e) {
      setErr(e.message || String(e))
    } finally {
      setBusy(false); setPhase('')
    }
  }

  const onEditMd = (v) => { setMd(v); saveCache(id, { product, markdown: v }) }
  const copyMd = async () => { try { await navigator.clipboard.writeText(md); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch {} }
  const exportMd = () => download(`${safeName}-PRD.md`, md, 'text/markdown;charset=utf-8')
  const exportDoc = () => {
    const html = marked.parse(md)
    const full =
      `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">` +
      `<head><meta charset="utf-8"><title>${product.name || 'PRD'}</title><style>` +
      `body{font-family:"微软雅黑","Microsoft YaHei",sans-serif;font-size:11pt;line-height:1.6;color:#222}` +
      `h1{font-size:20pt}h2{font-size:15pt;border-bottom:1px solid #ccc;padding-bottom:4px}h3{font-size:13pt}` +
      `table{border-collapse:collapse;width:100%}th,td{border:1px solid #888;padding:5px 9px;font-size:10.5pt}th{background:#f2f2f2}` +
      `blockquote{border-left:3px solid #888;margin:8px 0;padding:4px 12px;color:#555;background:#f7f7f7}code{background:#eee;padding:1px 4px}` +
      `</style></head><body>${html}</body></html>`
    download(`${safeName}-PRD.doc`, full, 'application/msword')
  }

  const doneCount = chState.filter((c) => c.status === 'done').length

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
          {md && !busy && <button className="guide-link" onClick={() => window.print()}>🖨️ PDF</button>}
        </div>
      </div>

      <div className="prd-input no-print">
        <div className="prd-input-head">
          <h2>{p.icon} {p.title} · 完整 PRD 生成</h2>
          <p>资深 LLM 产品专家视角。「分章深度生成」会先定共享骨架，再并行生成 7 章后拼接（更长更深）；「快速生成」单次流式产出。字段可编辑，也能给你自己的产品生成。</p>
        </div>
        {lib.length > 0 && (
          <div className="prd-import">
            <label>从产品库导入：</label>
            <select defaultValue="" onChange={(e) => importFromLib(e.target.value)}>
              <option value="" disabled>选择一个已保存的产品…</option>
              {lib.map((it) => <option key={it.id} value={it.id}>{it.name || '未命名'}</option>)}
            </select>
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
          <button className="primary" onClick={generateDeep} disabled={busy}>
            {busy && phase !== 'quick' ? '深度生成中…' : md ? '🔄 重新深度生成' : '✨ 分章深度生成'}
          </button>
          <button className="ghost" onClick={generateQuick} disabled={busy}>⚡ 快速生成（单次）</button>
          {baseline && <button className="ghost" onClick={() => setShowBaseline((v) => !v)}>{showBaseline ? '收起基线' : '结构化基线'}</button>}
        </div>
        {err && <div className="error-box">⚠️ {err}</div>}

        {chState.length > 0 && (
          <div className="ch-progress">
            <div className="ch-progress-bar">
              <span style={{ width: `${(doneCount / CHAPTERS.length) * 100}%` }} />
            </div>
            <div className="ch-list">
              {CHAPTERS.map((ch, i) => {
                const st = chState[i]?.status || 'pending'
                return (
                  <span key={ch.id} className={`ch-pill ${st}`}>
                    {st === 'done' ? '✓' : st === 'gen' ? '◌' : st === 'error' ? '✕' : '·'} {ch.id}.{ch.title}
                  </span>
                )
              })}
            </div>
            {phase === 'outline' && <div className="ch-phase"><Spinner label="正在确定共享骨架（产品定义 / 角色 / 模块）" /></div>}
          </div>
        )}
      </div>

      {showBaseline && baseline && (
        <div className="prd-doc baseline-doc no-print">
          <div className="baseline-tag">结构化基线 · 离线模板（无需 API key）</div>
          <Baseline doc={baseline} />
        </div>
      )}

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
          {busy && !md && <div className="gen-loading"><Spinner label="正在撰写 PRD" /></div>}
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{md}</ReactMarkdown>
          {busy && md && <span className="cursor-blink">▍</span>}
        </article>
      ) : null}

      {md && !busy && !editing && (
        <div className="prd-redteam no-print">
          <RedTeam
            doc={md}
            kind="PRD"
            onRevise={(full) => { setMd(full); saveCache(id, { product, markdown: full }) }}
          />
        </div>
      )}

      {!md && !busy && (
        <div className="prd-empty no-print">
          ✦ 选择生成方式：<strong>分章深度生成</strong>（7 章并行、内容更长更深，推荐）或<strong>快速生成</strong>（单次流式）。
          产出含 <strong>产品概述 · 用户角色表 · 核心功能深拆（交互 + LLM 逻辑）· 非功能需求 · 埋点看板 · 风险熔断</strong>，并可导出 .md / Word / PDF。
        </div>
      )}
    </div>
  )
}
