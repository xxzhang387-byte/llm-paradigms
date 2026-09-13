import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Spinner } from '../components.jsx'
import { byId } from '../paradigms.js'
import { GUIDE } from '../knowledge.js'
import { loadProducts, getProduct, upsertProduct, saveArtifact } from '../productStore.js'
import { getFit, advise, analyzeCompetitor, genMonetize, streamPrd, streamProposal, genSlides } from '../api.js'
import FitChart from '../components/FitChart.jsx'
import Monetization from '../components/Monetization.jsx'
import RoiBlock from '../components/RoiBlock.jsx'
import RedTeam from '../components/RedTeam.jsx'
import ExportAll from '../components/ExportAll.jsx'
import DemoSandbox from '../DemoSandbox.jsx'

const STEPS = [
  { n: 1, icon: '📝', title: '背景与目标' },
  { n: 2, icon: '🧩', title: '范式与竞品' },
  { n: 3, icon: '🛠️', title: 'Demo' },
  { n: 4, icon: '📄', title: 'PRD' },
  { n: 5, icon: '💰', title: '商业化 & ROI' },
  { n: 6, icon: '📑', title: '汇报' },
  { n: 7, icon: '📊', title: 'PPT' },
]
const mapPrd = (p) => ({ name: p.name, users: p.audience, capability: p.features, painpoint: p.positioning, extra: p.ui ? `界面/形态：${p.ui}` : '' })
const bestParadigm = (p) => {
  const a = p.artifacts || {}
  if (a.diagnosis?.recommended) return byId(a.diagnosis.recommended)
  if (a.fit?.scores?.length) return byId([...a.fit.scores].sort((x, y) => y.score - x.score)[0].id)
  return null
}

function FlowHome({ nav }) {
  const [lib, setLib] = useState([])
  const [name, setName] = useState('')
  useEffect(() => setLib(loadProducts()), [])
  const create = () => { if (!name.trim()) return; const r = upsertProduct({ name }); nav(`/flow/${r.id}`) }
  return (
    <div className="flow"><div className="flow-wrap">
      <div className="flow-hero">
        <h1>🚀 产品改造主线</h1>
        <p>一条龙走完：背景目标 → 范式与竞品 → Demo → PRD → 商业化/ROI → 汇报 → PPT。每步产出自动保存、数字贯通。</p>
      </div>
      <div className="flow-start">
        <label className="field-label">新建一个产品开始</label>
        <div className="flow-start-row">
          <input value={name} placeholder="产品名称，例如：星屿 · AI 情感陪伴" onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && create()} />
          <button className="primary" onClick={create} disabled={!name.trim()}>开始 →</button>
        </div>
      </div>
      {lib.length > 0 && (
        <div className="flow-resume">
          <label className="field-label">或继续已有产品</label>
          <div className="flow-resume-grid">
            {lib.map((p) => <button key={p.id} className="flow-resume-card" onClick={() => nav(`/flow/${p.id}`)}><strong>{p.name || '未命名'}</strong><span>{p.positioning || '—'}</span></button>)}
          </div>
        </div>
      )}
    </div></div>
  )
}

function CompetitorMini({ data }) {
  const r = data.report
  return (
    <div className="flow-cmp">
      <p className="flow-cmp-ov">{r.overview}</p>
      <div className="cmp-chips-cell">
        {r.paradigms.map((pp, i) => { const pa = byId(pp.id); return pa ? <Link key={i} to={`/guide/${pa.id}`} className="cmp-mini" style={{ '--accent': pa.accent }}><span>{pa.icon} {pa.title}</span><em className={pp.role === '主要' ? 'main' : ''}>{pp.role}</em></Link> : null })}
      </div>
      <div className="flow-cmp-pc">
        <div><h5>✅ 优点</h5><ul>{r.pros.slice(0, 4).map((x, i) => <li key={i}>{x}</li>)}</ul></div>
        <div><h5>⚠️ 缺点</h5><ul>{r.cons.slice(0, 4).map((x, i) => <li key={i}>{x}</li>)}</ul></div>
      </div>
    </div>
  )
}

function Wizard({ pid, nav }) {
  const [p, setP] = useState(() => getProduct(pid))
  const [step, setStep] = useState(1)
  const [edit, setEdit] = useState(() => getProduct(pid) || {})
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')
  const [prdMd, setPrdMd] = useState(() => getProduct(pid)?.artifacts?.prd || '')
  const [propMd, setPropMd] = useState(() => getProduct(pid)?.artifacts?.proposal || '')
  const [cName, setCName] = useState('')
  const [cRes, setCRes] = useState(null)
  const [pptMsg, setPptMsg] = useState('')

  useEffect(() => {
    const prod = getProduct(pid)
    setP(prod); setEdit(prod || {}); setPrdMd(prod?.artifacts?.prd || ''); setPropMd(prod?.artifacts?.proposal || '')
    setStep(1); setErr(''); setCRes(null); setPptMsg('')
  }, [pid])

  if (!p) return <div className="flow"><div className="flow-wrap"><button className="back" onClick={() => nav('/flow')}>← 主线</button><p style={{ marginTop: 24 }}>未找到产品。</p></div></div>

  const reload = () => setP(getProduct(pid))
  const saveArt = (k, v) => { saveArtifact(pid, k, v); reload() }
  const a = p.artifacts || {}
  const best = bestParadigm(p)
  const recId = a.diagnosis?.recommended || (a.fit?.scores?.length ? [...a.fit.scores].sort((x, y) => y.score - x.score)[0].id : null)
  const guide = recId ? GUIDE[recId] : null
  const done = { 1: !!(p.name && p.features), 2: !!(a.fit || a.diagnosis), 3: !!a.flowDemo, 4: !!prdMd, 5: !!(a.monetization && a.roi), 6: !!propMd, 7: !!a.flowPpt }

  const saveBrief = () => { upsertProduct({ ...p, ...edit }); reload() }
  const runFit = async () => { setBusy('fit'); setErr(''); try { const [f, d] = await Promise.all([getFit(p), advise(p, p.goal || edit.goal || '评估最适合的范式与落地方向')]); saveArtifact(pid, 'fit', f); saveArtifact(pid, 'diagnosis', d); reload() } catch (e) { setErr(e.message || String(e)) } finally { setBusy('') } }
  const runCmp = async () => { if (!cName.trim()) return; setBusy('cmp'); setErr(''); try { setCRes(await analyzeCompetitor({ name: cName })) } catch (e) { setErr(e.message || String(e)) } finally { setBusy('') } }
  const genPrd = async () => { setBusy('prd'); setErr(''); setPrdMd(''); try { const full = await streamPrd({ product: mapPrd(p), onText: setPrdMd }); saveArt('prd', full) } catch (e) { setErr(e.message || String(e)) } finally { setBusy('') } }
  const genMon = async () => { setBusy('mon'); setErr(''); try { saveArt('monetization', await genMonetize(p, best?.title || '', best?.blurb || '')) } catch (e) { setErr(e.message || String(e)) } finally { setBusy('') } }
  const genProp = async () => { setBusy('prop'); setErr(''); setPropMd(''); try { const full = await streamProposal({ product: mapPrd(p), paradigm: best?.title || '最契合范式', paradigmDesc: best?.blurb || '', monetization: a.monetization, roi: a.roi, onText: setPropMd }); saveArt('proposal', full) } catch (e) { setErr(e.message || String(e)) } finally { setBusy('') } }
  const genPpt = async () => { setBusy('ppt'); setErr(''); setPptMsg(''); try { const deck = await genSlides(propMd || prdMd); const { buildPptx } = await import('../pptx.js'); await buildPptx(deck, `${(p.name || '汇报').replace(/\s+/g, '_')}-汇报.pptx`); saveArt('flowPpt', true); setPptMsg(`✓ 已生成 ${(deck.slides?.length || 0) + 1} 页并下载`) } catch (e) { setErr(e.message || String(e)) } finally { setBusy('') } }

  const F = [['name', '产品名称', true], ['positioning', '定位'], ['audience', '目标人群'], ['ui', '界面 / 形态'], ['features', '主要功能'], ['goal', '本次改造目标']]

  const renderStep = () => {
    switch (step) {
      case 1: return (
        <div className="flow-step">
          <h2>📝 第一步 · 产品背景与改造目标</h2>
          <p className="flow-sub">把产品说清楚，并明确这次想达成什么（增长 / 粘性 / 商业化 / 差异化…）。</p>
          <div className="flow-fields">
            {F.map(([k, label, short]) => (
              <div className={`adv-field ${short ? 'short' : ''}`} key={k}>
                <label>{label}</label>
                {short ? <input value={edit[k] || ''} onChange={(e) => setEdit({ ...edit, [k]: e.target.value })} />
                  : <textarea value={edit[k] || ''} onChange={(e) => setEdit({ ...edit, [k]: e.target.value })} />}
              </div>
            ))}
          </div>
          <button className="primary" onClick={() => { saveBrief(); setStep(2) }}>保存并进入下一步 →</button>
        </div>
      )
      case 2: return (
        <div className="flow-step">
          <h2>🧩 第二步 · 范式、设计要素与竞品</h2>
          <p className="flow-sub">基于产品给出最契合的范式与依据、该范式的产品设计要点，并分析一个竞品。</p>
          <button className="primary" onClick={runFit} disabled={busy === 'fit'}>{busy === 'fit' ? '分析中…' : a.fit ? '🔄 重新分析范式' : '🎯 分析范式契合 & 诊断'}</button>
          {a.fit && <div className="flow-mt"><FitChart data={a.fit} /></div>}
          {recId && byId(recId) && (
            <div className="flow-rec" style={{ '--accent': byId(recId).accent }}>
              <span className="flow-rec-ico">{byId(recId).icon}</span>
              <div>
                <strong>推荐范式：{byId(recId).title}</strong>
                {a.diagnosis?.why && <p>{a.diagnosis.why}</p>}
                <Link to={`/guide/${recId}`}>查看方法论 →</Link>
              </div>
            </div>
          )}
          {guide?.design && (
            <div className="flow-design">
              <h4>🎯 「{byId(recId).title}」产品设计要点</h4>
              <ul>{guide.design.map((x, i) => <li key={i}>{x}</li>)}</ul>
            </div>
          )}
          <div className="flow-cmp-box">
            <h4>🔬 竞品分析</h4>
            <div className="flow-cmp-input">
              <input value={cName} placeholder="输入一个竞品名（如 Replika）" onChange={(e) => setCName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && runCmp()} />
              <button className="ghost" onClick={runCmp} disabled={busy === 'cmp'}>{busy === 'cmp' ? '分析中…' : '分析竞品'}</button>
            </div>
            {busy === 'cmp' && <Spinner label="联网检索竞品" />}
            {cRes && <CompetitorMini data={cRes} />}
          </div>
        </div>
      )
      case 3: return (
        <div className="flow-step">
          <h2>🛠️ 第三步 · 可交互 Demo</h2>
          <p className="flow-sub">为这个产品现场生成一个可玩的原型（内部 AI 真实调用）。</p>
          <DemoSandbox spec={`产品：${p.name}\n定位：${p.positioning}\n主要功能：${p.features}\n请据此做一个该产品核心功能的可交互原型。`} paradigm={best?.title || ''} productName={p.name} />
          <button className="ghost flow-mark" onClick={() => saveArt('flowDemo', true)}>{a.flowDemo ? '✓ 已标记完成' : '标记这步完成'}</button>
        </div>
      )
      case 4: return (
        <div className="flow-step">
          <h2>📄 第四步 · PRD</h2>
          <p className="flow-sub">生成完整 PRD，并可红队评审、按评审一键修订。</p>
          <button className="primary" onClick={genPrd} disabled={busy === 'prd'}>{busy === 'prd' ? '生成中…' : prdMd ? '🔄 重新生成 PRD' : '📄 生成 PRD'}</button>
          {(prdMd || busy === 'prd') && <article className="md-doc flow-doc">{busy === 'prd' && !prdMd && <Spinner label="撰写 PRD" />}<ReactMarkdown remarkPlugins={[remarkGfm]}>{prdMd}</ReactMarkdown></article>}
          {prdMd && busy !== 'prd' && <RedTeam doc={prdMd} kind="PRD" cached={a.prdReview} onResult={(r) => saveArt('prdReview', r)} onRevise={(full) => { setPrdMd(full); saveArt('prd', full) }} />}
        </div>
      )
      case 5: return (
        <div className="flow-step">
          <h2>💰 第五步 · 商业化策略 & ROI</h2>
          <p className="flow-sub">设计变现模式、价值阶梯与定价逻辑，再测算 ROI 与预期收入（可调）。</p>
          <button className="primary" onClick={genMon} disabled={busy === 'mon'}>{busy === 'mon' ? '设计中…' : a.monetization ? '🔄 重新设计商业化' : '💰 设计商业化策略'}</button>
          {a.monetization && <div className="flow-mt"><Monetization data={a.monetization} /></div>}
          {a.monetization && (
            <div className="flow-roi">
              <h4 className="mon-h">📊 ROI / 收入预估</h4>
              <RoiBlock product={p} paradigm={best?.title || ''} paradigmDesc={best?.blurb || ''} monetization={a.monetization} cached={a.roi} onResult={(r) => saveArt('roi', r)} />
            </div>
          )}
        </div>
      )
      case 6: return (
        <div className="flow-step">
          <h2>📑 第六步 · 汇报（提案方案）</h2>
          <p className="flow-sub">生成一份完整汇报：背景/目标/数据/升级策略/Demo/需求/市场/预期计划{a.roi ? '（预期计划自动带入 ROI 收入预测）' : ''}。</p>
          <button className="primary" onClick={genProp} disabled={busy === 'prop'}>{busy === 'prop' ? '撰写中…' : propMd ? '🔄 重新生成汇报' : '📑 生成汇报'}</button>
          {(propMd || busy === 'prop') && <article className="md-doc flow-doc">{busy === 'prop' && !propMd && <Spinner label="撰写汇报" />}<ReactMarkdown remarkPlugins={[remarkGfm]}>{propMd}</ReactMarkdown></article>}
        </div>
      )
      case 7: return (
        <div className="flow-step">
          <h2>📊 第七步 · 路演 PPT</h2>
          <p className="flow-sub">把汇报浓缩成一套可下载的 .pptx（封面 + 要点 + 表格）。</p>
          <button className="primary" onClick={genPpt} disabled={busy === 'ppt' || (!propMd && !prdMd)}>{busy === 'ppt' ? '生成中…' : '📊 生成并下载 PPT'}</button>
          {!propMd && !prdMd && <div className="flow-hint">先在第 4 或第 6 步生成 PRD / 汇报，再导出 PPT。</div>}
          {pptMsg && <div className="flow-ok">{pptMsg}</div>}
          <div className="flow-finish">
            <p>🎉 主线走完！把这个产品的全部产出导出成一份总报告：</p>
            <ExportAll product={p} />
            <Link className="ghost flow-mt" to={`/workspace/${pid}`}>在工作台查看全部产出 →</Link>
          </div>
        </div>
      )
      default: return null
    }
  }

  return (
    <div className="flow"><div className="flow-wrap">
      <div className="flow-top">
        <button className="back" onClick={() => nav('/flow')}>← 主线</button>
        <span className="flow-prod">{p.name}{best && <em>· 最契合：{best.title}</em>}</span>
      </div>

      <div className="flow-stepper">
        {STEPS.map((s) => (
          <button key={s.n} className={`flow-pip ${step === s.n ? 'on' : ''} ${done[s.n] ? 'done' : ''}`} onClick={() => setStep(s.n)}>
            <span className="flow-pip-n">{done[s.n] && step !== s.n ? '✓' : s.icon}</span>
            <span className="flow-pip-t">{s.title}</span>
          </button>
        ))}
      </div>

      {err && <div className="error-box flow-mt">⚠️ {err}</div>}
      <div className="flow-body">{renderStep()}</div>

      <div className="flow-nav">
        <button className="ghost" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1}>← 上一步</button>
        {step < 7
          ? <button className="primary" onClick={() => setStep((s) => Math.min(7, s + 1))}>下一步 →</button>
          : <button className="primary" onClick={() => nav(`/workspace/${pid}`)}>🎉 完成，去工作台</button>}
      </div>
    </div></div>
  )
}

export default function Flow() {
  const { pid } = useParams()
  const nav = useNavigate()
  return pid ? <Wizard pid={pid} nav={nav} /> : <FlowHome nav={nav} />
}
