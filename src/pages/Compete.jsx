import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Spinner } from '../components.jsx'
import { byId } from '../paradigms.js'
import { analyzeCompetitor, compareCompetitors } from '../api.js'
import { downloadMd, downloadDoc, downloadPng } from '../reportExport.js'
import { loadAnalyses, saveAnalysis, deleteAnalysis } from '../competeStore.js'

const SAMPLES = ['Perplexity', 'Cursor', 'Character.AI', 'Glean', 'Notion AI', '多邻国 Duolingo']
const VS_PRESETS = [
  ['Perplexity', '夸克 AI 搜索', 'Google AI Overview'],
  ['Cursor', 'GitHub Copilot'],
  ['Character.AI', '星野', 'Replika'],
]
const paraName = (id) => byId(id)?.title || id

function singleMd(name, data) {
  const r = data.report
  const L = (arr) => (arr || []).map((x) => `- ${x}`).join('\n')
  const para = r.paradigms.map((pp) => `- **${paraName(pp.id)}**（${pp.role}）：${pp.reason}`).join('\n')
  const src = data.sources?.length ? `\n\n## 来源\n${data.sources.map((s) => `- [${s.title}](${s.url})`).join('\n')}` : ''
  return `# 竞品分析：${name}\n\n> ${r.overview}（${r.category}）\n\n## 采用的范式\n${para}\n\n## 优点\n${L(r.pros)}\n\n## 缺点 / 风险\n${L(r.cons)}\n\n## 关键观察\n${L(r.highlights)}\n\n## 对你的启发\n${L(r.insights)}${src}`
}
function compareMd(c, sources) {
  const cell = (s) => (s || '—').replace(/\|/g, '/').replace(/\n+/g, ' ')
  const head = `| 对比维度 | ${c.products.join(' | ')} |`
  const sep = `| --- |${' --- |'.repeat(c.products.length)}`
  const paraRow = `| 采用范式 | ${c.paradigms.map((list) => (list || []).map((pp) => `${paraName(pp.id)}(${pp.role})`).join('、')).join(' | ')} |`
  const rows = c.rows.map((r) => `| ${r.aspect} | ${c.products.map((_, ci) => cell(r.cells?.[ci])).join(' | ')} |`).join('\n')
  const take = c.takeaways?.length ? `\n\n## 关键差异与启发\n${c.takeaways.map((t) => `- ${t}`).join('\n')}` : ''
  const src = sources?.length ? `\n\n## 来源\n${sources.map((s) => `- [${s.title}](${s.url})`).join('\n')}` : ''
  return `# 竞品横向对比：${c.products.join(' vs ')}\n\n${head}\n${sep}\n${paraRow}\n${rows}${take}${src}`
}

function ExportBar({ md, name, node, extra }) {
  return (
    <div className="cmp-export">
      <span>导出：</span>
      <button onClick={() => downloadMd(name, md)}>⬇ .md</button>
      <button onClick={() => downloadDoc(name, md)}>⬇ Word</button>
      <button onClick={() => downloadPng(node.current, name)}>🖼️ 图片</button>
      {extra}
    </div>
  )
}

function ParadigmChip({ id, role }) {
  const p = byId(id)
  if (!p) return null
  return (
    <Link to={`/guide/${p.id}`} className="cmp-mini" style={{ '--accent': p.accent }}>
      <span>{p.icon} {p.title}</span>
      <em className={role === '主要' ? 'main' : ''}>{role}</em>
    </Link>
  )
}

function SingleReport({ name, data }) {
  const r = data.report
  return (
    <>
      <div className="cmp-block cmp-overview">
        <div className="cmp-cat">{r.category === 'toB' ? '🏢 toB' : r.category === 'both' ? '🏢👤 toB+toC' : '👤 toC'}</div>
        <h2>{name}</h2><p>{r.overview}</p>
        {data.note && <div className="answer-note">ℹ️ {data.note}</div>}
      </div>
      <div className="cmp-block">
        <h3>🧩 采用的范式</h3>
        <div className="cmp-paradigms">
          {r.paradigms.map((pp, i) => {
            const p = byId(pp.id); if (!p) return null
            return (
              <div className="cmp-para" key={i} style={{ '--accent': p.accent }}>
                <div className="cmp-para-head"><span className="cmp-para-ico">{p.icon}</span><div><strong>{p.title}</strong><span className={`cmp-role ${pp.role === '主要' ? 'main' : ''}`}>{pp.role}</span></div></div>
                <p className="cmp-para-reason">{pp.reason}</p>
                <div className="cmp-para-links"><Link to={`/guide/${p.id}`}>方法论</Link><Link to={`/p/${p.id}`}>demo</Link></div>
              </div>
            )
          })}
        </div>
      </div>
      <div className="cmp-proscons">
        <div className="cmp-block pros"><h3>✅ 优点</h3><ul>{r.pros.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
        <div className="cmp-block cons"><h3>⚠️ 缺点 / 风险</h3><ul>{r.cons.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
      </div>
      {r.highlights?.length > 0 && <div className="cmp-block"><h3>🔎 关键观察</h3><ul className="cmp-list">{r.highlights.map((x, i) => <li key={i}>{x}</li>)}</ul></div>}
      <div className="cmp-block cmp-insights"><h3>💡 对你的启发</h3><ul>{r.insights.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
      {data.sources?.length > 0 && <div className="cmp-block"><div className="sources-title">来源</div><ol className="cmp-sources">{data.sources.map((s, i) => <li key={i}><a href={s.url} target="_blank" rel="noreferrer">{s.title}</a></li>)}</ol></div>}
    </>
  )
}

function CompareReport({ data }) {
  const c = data.report
  return (
    <>
      {data.note && <div className="answer-note">ℹ️ {data.note}</div>}
      <div className="cmp-table-wrap">
        <table className="cmp-table">
          <thead><tr><th className="cmp-corner">对比维度</th>{c.products.map((n, i) => <th key={i}>{n}</th>)}</tr></thead>
          <tbody>
            <tr>
              <td className="cmp-aspect">采用范式</td>
              {c.paradigms.map((list, ci) => <td key={ci}><div className="cmp-chips-cell">{(list || []).map((pp, i) => <ParadigmChip key={i} id={pp.id} role={pp.role} />)}</div></td>)}
            </tr>
            {c.rows.map((r, ri) => <tr key={ri}><td className="cmp-aspect">{r.aspect}</td>{c.products.map((_, ci) => <td key={ci}>{r.cells?.[ci] || '—'}</td>)}</tr>)}
          </tbody>
        </table>
      </div>
      {c.takeaways?.length > 0 && <div className="cmp-block cmp-insights"><h3>💡 关键差异与启发</h3><ul>{c.takeaways.map((x, i) => <li key={i}>{x}</li>)}</ul></div>}
      {data.sources?.length > 0 && <div className="cmp-block"><div className="sources-title">来源</div><ol className="cmp-sources">{data.sources.map((s, i) => <li key={i}><a href={s.url} target="_blank" rel="noreferrer">{s.title}</a></li>)}</ol></div>}
    </>
  )
}

export default function Compete() {
  const nav = useNavigate()
  const [mode, setMode] = useState('single')

  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [data, setData] = useState(null)
  const [savedS, setSavedS] = useState(false)

  const [prods, setProds] = useState([{ name: '', url: '' }, { name: '', url: '' }])
  const [cmp, setCmp] = useState(null)
  const [savedM, setSavedM] = useState(false)

  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [lib, setLib] = useState([])
  const [view, setView] = useState(null) // 库里查看的记录
  const singleRef = useRef(null)
  const multiRef = useRef(null)
  const viewRef = useRef(null)

  useEffect(() => setLib(loadAnalyses()), [])

  const runSingle = async (n) => {
    const nm = (n ?? name).trim()
    if (!nm || busy) return
    setName(nm); setBusy(true); setErr(''); setData(null); setSavedS(false)
    try { setData(await analyzeCompetitor({ name: nm, url, notes })) }
    catch (e) { setErr(e.message || String(e)) } finally { setBusy(false) }
  }
  const setProd = (i, k, v) => setProds((ps) => ps.map((p, j) => (j === i ? { ...p, [k]: v } : p)))
  const addProd = () => setProds((ps) => (ps.length < 4 ? [...ps, { name: '', url: '' }] : ps))
  const delProd = (i) => setProds((ps) => (ps.length > 2 ? ps.filter((_, j) => j !== i) : ps))
  const runMulti = async () => {
    const list = prods.filter((p) => p.name.trim())
    if (list.length < 2 || busy) { if (list.length < 2) setErr('请至少填写 2 个产品'); return }
    setBusy(true); setErr(''); setCmp(null); setSavedM(false)
    try { setCmp(await compareCompetitors(list)) }
    catch (e) { setErr(e.message || String(e)) } finally { setBusy(false) }
  }

  const addSingle = () => { saveAnalysis({ type: 'single', name, report: data.report, sources: data.sources, note: data.note }); setLib(loadAnalyses()); setSavedS(true) }
  const addMulti = () => { saveAnalysis({ type: 'multi', name: cmp.report.products.join(' vs '), report: cmp.report, sources: cmp.sources, note: cmp.note }); setLib(loadAnalyses()); setSavedM(true) }
  const removeFromLib = (id) => { deleteAnalysis(id); setLib(loadAnalyses()); if (view?.id === id) setView(null) }

  return (
    <div className="advisor">
      <div className="advisor-wrap">
        <header className="shell-top">
          <button className="back" onClick={() => nav('/')}>← 全部范式</button>
          <div className="shell-id"><span className="dot" /> 竞品分析 · Competitor Analysis</div>
        </header>
        <div className="adv-head">
          <div className="adv-emoji">🔬</div>
          <div><h1>竞品分析</h1><p>联网检索后，把对手拆解回这套范式体系：用了哪种范式、优缺点、关键观察与启发。</p></div>
        </div>

        <div className="cmp-tabs">
          <button className={mode === 'single' ? 'on' : ''} onClick={() => setMode('single')}>单品分析</button>
          <button className={mode === 'multi' ? 'on' : ''} onClick={() => setMode('multi')}>横向对比</button>
          <button className={mode === 'lib' ? 'on' : ''} onClick={() => { setMode('lib'); setView(null) }}>📚 分析库（{lib.length}）</button>
        </div>

        {mode === 'single' && (
          <div className="cmp-form">
            <div className="cmp-row">
              <div className="cmp-field grow"><label>产品名称 *</label><input value={name} placeholder="例如：Perplexity" onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && runSingle()} /></div>
              <div className="cmp-field grow"><label>官网 / 链接（选填）</label><input value={url} placeholder="https://…" onChange={(e) => setUrl(e.target.value)} /></div>
            </div>
            <div className="cmp-field"><label>补充说明（选填）</label><input value={notes} placeholder="你已知的信息、想重点分析的角度…" onChange={(e) => setNotes(e.target.value)} /></div>
            <div className="cmp-actions">
              <button className="primary" onClick={() => runSingle()} disabled={busy}>{busy ? '分析中…' : '🔬 生成分析报告'}</button>
              <div className="chips cmp-chips">{SAMPLES.map((s) => <button key={s} onClick={() => runSingle(s)} disabled={busy}>{s}</button>)}</div>
            </div>
          </div>
        )}
        {mode === 'multi' && (
          <div className="cmp-form">
            <div className="cmp-multi-inputs">
              {prods.map((p, i) => (
                <div className="cmp-multi-row" key={i}>
                  <span className="cmp-idx">{i + 1}</span>
                  <input className="cmp-multi-name" value={p.name} placeholder={`产品 ${i + 1} 名称`} onChange={(e) => setProd(i, 'name', e.target.value)} />
                  <input className="cmp-multi-url" value={p.url} placeholder="链接（选填）" onChange={(e) => setProd(i, 'url', e.target.value)} />
                  {prods.length > 2 && <button className="cmp-del" onClick={() => delProd(i)}>✕</button>}
                </div>
              ))}
              {prods.length < 4 && <button className="cmp-add" onClick={addProd}>+ 加一个产品</button>}
            </div>
            <div className="cmp-actions">
              <button className="primary" onClick={runMulti} disabled={busy}>{busy ? '对比中…' : '⚖️ 横向对比'}</button>
              <div className="chips cmp-chips">{VS_PRESETS.map((names, i) => <button key={i} onClick={() => setProds(names.map((n) => ({ name: n, url: '' })))} disabled={busy}>{names.join(' vs ')}</button>)}</div>
            </div>
          </div>
        )}

        {mode !== 'lib' && err && <div className="error-box">⚠️ {err}</div>}
        {mode !== 'lib' && busy && <div className="cmp-loading"><Spinner label={mode === 'multi' ? '逐个联网检索并对比中（约 20-40 秒）' : '联网检索并分析中（约 10-30 秒）'} /></div>}

        {/* 单品结果 */}
        {mode === 'single' && data?.report && (
          <>
            <ExportBar md={singleMd(name, data)} name={`竞品分析-${name}`} node={singleRef}
              extra={<button className="cmp-savebtn" onClick={addSingle} disabled={savedS}>{savedS ? '✓ 已加入分析库' : '➕ 加入竞品分析库'}</button>} />
            <div className="cmp-report" ref={singleRef}><SingleReport name={name} data={data} /></div>
          </>
        )}

        {/* 横向对比结果 */}
        {mode === 'multi' && cmp?.report && (
          <>
            <ExportBar md={compareMd(cmp.report, cmp.sources)} name={`竞品对比-${cmp.report.products.join('_vs_')}`} node={multiRef}
              extra={<button className="cmp-savebtn" onClick={addMulti} disabled={savedM}>{savedM ? '✓ 已加入分析库' : '➕ 加入竞品分析库'}</button>} />
            <div className="cmp-report" ref={multiRef}><CompareReport data={cmp} /></div>
          </>
        )}

        {/* 分析库 */}
        {mode === 'lib' && (
          view ? (
            <>
              <div className="cmp-lib-back"><button className="back" onClick={() => setView(null)}>← 返回列表</button></div>
              <ExportBar
                md={view.type === 'single' ? singleMd(view.name, view) : compareMd(view.report, view.sources)}
                name={`${view.type === 'single' ? '竞品分析' : '竞品对比'}-${view.name}`} node={viewRef} />
              <div className="cmp-report" ref={viewRef}>
                {view.type === 'single' ? <SingleReport name={view.name} data={view} /> : <CompareReport data={view} />}
              </div>
            </>
          ) : lib.length === 0 ? (
            <div className="ws-empty">分析库还是空的。去「单品分析」或「横向对比」生成结果后，点「➕ 加入竞品分析库」保存。</div>
          ) : (
            <div className="cmp-lib-grid">
              {lib.map((rec) => (
                <div className="cmp-lib-card" key={rec.id} onClick={() => setView(rec)}>
                  <div className="cmp-lib-top">
                    <span className={`cmp-lib-type ${rec.type}`}>{rec.type === 'single' ? '单品' : '对比'}</span>
                    <button className="ws-del" onClick={(e) => { e.stopPropagation(); removeFromLib(rec.id) }}>✕</button>
                  </div>
                  <h3>{rec.name}</h3>
                  <div className="cmp-lib-paras">
                    {(rec.type === 'single' ? rec.report.paradigms : (rec.report.paradigms?.flat() || []))
                      .slice(0, 4).map((pp, i) => { const p = byId(pp.id); return p ? <span key={i} title={p.title}>{p.icon}</span> : null })}
                  </div>
                  <div className="cmp-lib-date">{(rec.createdAt || '').slice(0, 10)}</div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}
