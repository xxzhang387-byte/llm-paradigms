import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Spinner } from '../components.jsx'
import { byId } from '../paradigms.js'
import { getProduct, upsertProduct, saveArtifact } from '../productStore.js'
import { getFit, genBmc, genMonetize, advise, streamPrd, streamProposal } from '../api.js'
import FitChart from '../components/FitChart.jsx'
import BmcGrid from '../components/BmcGrid.jsx'
import Monetization from '../components/Monetization.jsx'
import RoiBlock from '../components/RoiBlock.jsx'
import RedTeam from '../components/RedTeam.jsx'
import ExportAll from '../components/ExportAll.jsx'
import DemoSandbox from '../DemoSandbox.jsx'

const mapPrd = (p) => ({ name: p.name, users: p.audience, capability: p.features, painpoint: p.positioning, extra: p.ui ? `界面/形态：${p.ui}` : '' })
const bestParadigm = (p) => {
  const a = p.artifacts || {}
  if (a.diagnosis?.recommended) return byId(a.diagnosis.recommended)
  if (a.fit?.scores?.length) return byId([...a.fit.scores].sort((x, y) => y.score - x.score)[0].id)
  return null
}

function Card({ icon, title, sub, children, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen ?? true)
  return (
    <section className="pw-card">
      <button className="pw-card-head" onClick={() => setOpen((v) => !v)}>
        <span className="pw-card-title">{icon} {title}</span>
        {sub && <span className="pw-card-sub">{sub}</span>}
        <span className="pw-chev">{open ? '▾' : '▸'}</span>
      </button>
      {open && <div className="pw-card-body">{children}</div>}
    </section>
  )
}

export default function ProductWorkspace() {
  const { pid } = useParams()
  const nav = useNavigate()
  const [p, setP] = useState(null)
  const [edit, setEdit] = useState({})
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')
  const [prdMd, setPrdMd] = useState('')
  const [propMd, setPropMd] = useState('')
  const live = useRef({})

  useEffect(() => {
    const prod = getProduct(pid)
    setP(prod)
    setEdit(prod || {})
    setPrdMd(prod?.artifacts?.prd || '')
    setPropMd(prod?.artifacts?.proposal || '')
  }, [pid])

  if (!p) return <div className="pw"><div className="pw-wrap"><button className="back" onClick={() => nav('/workspace')}>← 工作台</button><p style={{ marginTop: 24 }}>未找到该产品。</p></div></div>

  const refresh = () => setP(getProduct(pid))
  const saveArt = (k, v) => { saveArtifact(pid, k, v); refresh() }
  const a = p.artifacts || {}
  const best = bestParadigm(p)

  const saveOverview = () => { upsertProduct({ ...p, ...edit }); refresh() }

  const run = async (key, fn) => {
    setBusy(key); setErr('')
    try { const r = await fn(); if (r !== undefined) saveArt(key, r) }
    catch (e) { setErr(e.message || String(e)) } finally { setBusy('') }
  }

  const genPrd = async () => {
    setBusy('prd'); setErr(''); setPrdMd('')
    try { const full = await streamPrd({ product: mapPrd(p), onText: setPrdMd }); saveArt('prd', full) }
    catch (e) { setErr(e.message || String(e)) } finally { setBusy('') }
  }
  const genProposal = async () => {
    setBusy('proposal'); setErr(''); setPropMd('')
    try { const full = await streamProposal({ product: mapPrd(p), paradigm: best?.title || '最契合范式', paradigmDesc: best?.blurb || '', monetization: a.monetization, roi: a.roi, onText: setPropMd }); saveArt('proposal', full) }
    catch (e) { setErr(e.message || String(e)) } finally { setBusy('') }
  }

  const FIELDS = [['name', '产品名称'], ['positioning', '定位'], ['audience', '目标人群'], ['ui', '界面/形态'], ['features', '主要功能'], ['stage', '阶段']]

  return (
    <div className="pw">
      <div className="pw-wrap">
        <div className="pw-top">
          <button className="back" onClick={() => nav('/workspace')}>← 工作台</button>
          {best && <span className="pw-best">最契合：<Link to={`/guide/${best.id}`}>{best.icon} {best.title}</Link></span>}
        </div>
        <h1 className="pw-name">{p.name || '未命名产品'}</h1>
        <ExportAll product={p} />
        {err && <div className="error-box">⚠️ {err}</div>}

        <Card icon="📝" title="产品概览" defaultOpen={false}>
          <div className="pw-fields">
            {FIELDS.map(([k, label]) => (
              <div className="adv-field" key={k}>
                <label>{label}</label>
                {k === 'name' || k === 'stage' ? <input value={edit[k] || ''} onChange={(e) => setEdit({ ...edit, [k]: e.target.value })} />
                  : <textarea value={edit[k] || ''} onChange={(e) => setEdit({ ...edit, [k]: e.target.value })} />}
              </div>
            ))}
          </div>
          <button className="primary" onClick={saveOverview}>💾 保存</button>
        </Card>

        <Card icon="🎯" title="范式契合度" sub="14 个范式的适配打分">
          {a.fit ? <FitChart data={a.fit} /> : busy !== 'fit' && <div className="placeholder">看看这个产品最适合哪些范式</div>}
          {busy === 'fit' && <Spinner label="为 14 个范式打分" />}
          <button className="ghost pw-gen" onClick={() => run('fit', () => getFit(p))} disabled={busy === 'fit'}>{a.fit ? '🔄 重新评估' : '🎯 评估契合度'}</button>
        </Card>

        <Card icon="🩺" title="专家诊断" sub="推荐范式 + 落地方向">
          {a.diagnosis ? (
            <div className="pw-diag">
              {byId(a.diagnosis.recommended) && (
                <div className="pw-diag-rec" style={{ '--accent': byId(a.diagnosis.recommended).accent }}>
                  <span>{byId(a.diagnosis.recommended).icon}</span>
                  <div><strong>{a.diagnosis.paradigmName || byId(a.diagnosis.recommended).title}</strong><p>{a.diagnosis.why}</p></div>
                  <Link className="ghost" to={`/guide/${a.diagnosis.recommended}`}>方法论</Link>
                </div>
              )}
              {a.diagnosis.cautions?.length > 0 && <ul className="pw-diag-cau">{a.diagnosis.cautions.map((c, i) => <li key={i}>{c}</li>)}</ul>}
            </div>
          ) : busy !== 'diagnosis' && <div className="placeholder">让顾问诊断该产品并推荐范式</div>}
          {busy === 'diagnosis' && <Spinner label="专家诊断中" />}
          <button className="ghost pw-gen" onClick={() => run('diagnosis', () => advise(p, '评估这个产品最适合的范式与落地方向'))} disabled={busy === 'diagnosis'}>{a.diagnosis ? '🔄 重新诊断' : '🩺 专家诊断'}</button>
        </Card>

        <Card icon="🧩" title="商业模式画布" sub="九要素 BMC">
          {a.bmc ? <BmcGrid data={a.bmc} /> : busy !== 'bmc' && <div className="placeholder">一键生成商业模式画布</div>}
          {busy === 'bmc' && <Spinner label="填写九要素画布" />}
          <button className="ghost pw-gen" onClick={() => run('bmc', () => genBmc(p))} disabled={busy === 'bmc'}>{a.bmc ? '🔄 重新生成' : '🧩 生成画布'}</button>
        </Card>

        <Card icon="💰" title="商业化策略" sub={best ? `围绕【${best.title}】范式的转化逻辑` : '变现模式 + 转化漏斗 + 定价'}>
          {a.monetization ? <Monetization data={a.monetization} /> : busy !== 'monetization' && <div className="placeholder">设计这个产品的商业化模式与转化漏斗</div>}
          {busy === 'monetization' && <Spinner label="设计商业化转化逻辑" />}
          <button className="ghost pw-gen" onClick={() => run('monetization', () => genMonetize(p, best?.title || '', best?.blurb || ''))} disabled={busy === 'monetization'}>{a.monetization ? '🔄 重新设计' : '💰 设计商业化策略'}</button>
        </Card>

        <Card icon="📊" title="ROI / 收入预估" sub="基于定价与商业逻辑测算">
          <RoiBlock product={p} paradigm={best?.title || ''} paradigmDesc={best?.blurb || ''} monetization={a.monetization} cached={a.roi} onResult={(r) => saveArt('roi', r)} />
        </Card>

        <Card icon="📄" title="PRD" sub="完整需求文档 + 红队评审">
          {(prdMd || busy === 'prd') ? (
            <article className="md-doc pw-doc">
              {busy === 'prd' && !prdMd && <Spinner label="撰写 PRD" />}
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{prdMd}</ReactMarkdown>
            </article>
          ) : <div className="placeholder">为该产品生成完整 PRD</div>}
          <button className="ghost pw-gen" onClick={genPrd} disabled={busy === 'prd'}>{prdMd ? '🔄 重新生成' : '📄 生成 PRD'}</button>
          {prdMd && busy !== 'prd' && (
            <RedTeam
              doc={prdMd}
              kind="PRD"
              cached={a.prdReview}
              onResult={(r) => saveArt('prdReview', r)}
              onRevise={(full) => { setPrdMd(full); saveArt('prd', full) }}
            />
          )}
        </Card>

        <Card icon="📑" title="提案方案" defaultOpen={false} sub={(best ? `按【${best.title}】升级` : '') + (a.roi ? ' · 含 ROI 收入预测' : '')}>
          {(propMd || busy === 'proposal') ? (
            <article className="md-doc pw-doc">
              {busy === 'proposal' && !propMd && <Spinner label="撰写提案" />}
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{propMd}</ReactMarkdown>
            </article>
          ) : <div className="placeholder">生成"把产品按最契合范式升级"的提案{a.roi ? '（预期计划会自动带入 ROI 收入预测）' : '（先做商业化/ROI 会自动带入收入预测）'}</div>}
          <button className="ghost pw-gen" onClick={genProposal} disabled={busy === 'proposal'}>{propMd ? '🔄 重新生成' : '📑 生成提案'}</button>
        </Card>

        <Card icon="🛠️" title="可交互 Demo" defaultOpen={false} sub="为这个产品造一个原型">
          <DemoSandbox
            spec={`产品：${p.name}\n定位：${p.positioning}\n主要功能：${p.features}\n请据此做一个该产品核心功能的可交互原型。`}
            paradigm={best?.title || ''}
            productName={p.name}
          />
        </Card>
      </div>
    </div>
  )
}
