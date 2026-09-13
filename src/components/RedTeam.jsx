import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { reviewDoc, streamRevise } from '../api.js'
import { Spinner } from '../components.jsx'

// Red-team review of a markdown doc + "revise per review" action.
// `onRevise(fullMd)` lets the parent replace the source doc with the revision.
export default function RedTeam({ doc, kind = '文档', cached, onResult, onRevise }) {
  const [data, setData] = useState(cached || null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [revMd, setRevMd] = useState('')
  const [revBusy, setRevBusy] = useState(false)

  const run = async () => {
    if (busy || !doc) return
    setBusy(true); setErr(''); setRevMd('')
    try {
      const r = await reviewDoc(doc, kind)
      setData(r); onResult?.(r)
    } catch (e) { setErr(e.message || String(e)) } finally { setBusy(false) }
  }

  const revise = async () => {
    if (revBusy || !data) return
    setRevBusy(true); setErr(''); setRevMd('')
    try {
      const full = await streamRevise({ doc, review: data, kind, onText: setRevMd })
      onRevise?.(full)
    } catch (e) { setErr(e.message || String(e)) } finally { setRevBusy(false) }
  }

  const grade = (s) => (s >= 80 ? 'a' : s >= 60 ? 'b' : 'c')

  return (
    <div className="redteam">
      <div className="rt-actions">
        <button className="ghost rt-btn" onClick={run} disabled={busy || revBusy || !doc}>
          {busy ? '评审中…' : data ? '🔄 重新红队评审' : '🔴 红队评审这份文档'}
        </button>
        {data && onRevise && (
          <button className="primary rt-revise" onClick={revise} disabled={revBusy || busy}>
            {revBusy ? '修订中…' : '✍️ 按评审修订'}
          </button>
        )}
      </div>
      {err && <div className="error-box">⚠️ {err}</div>}
      {busy && <div className="rt-loading"><Spinner label="多视角挑刺中" /></div>}

      {data && !busy && (
        <div className="rt-result">
          <div className="rt-top">
            <div className={`rt-overall g-${grade(data.overall)}`}>{data.overall}<small>总分</small></div>
            <div className="rt-dims">
              {data.dimensions.map((d, i) => (
                <div className="rt-dim" key={i}>
                  <div className="rt-dim-h"><span>{d.name}</span><b className={`g-${grade(d.score)}`}>{d.score}</b></div>
                  <div className="rt-dim-track"><span className={`g-${grade(d.score)}`} style={{ width: `${d.score}%` }} /></div>
                  <p>{d.comment}</p>
                </div>
              ))}
            </div>
          </div>
          {data.issues?.length > 0 && (
            <div className="rt-block">
              <h4>🚩 问题</h4>
              {data.issues.map((it, i) => <div className={`rt-issue sev-${it.severity}`} key={i}><span>{it.severity}</span>{it.point}</div>)}
            </div>
          )}
          {data.improvements?.length > 0 && (
            <div className="rt-block">
              <h4>🛠️ 改进建议</h4>
              <ul className="rt-improve">{data.improvements.map((x, i) => <li key={i}>{x}</li>)}</ul>
            </div>
          )}
        </div>
      )}

      {(revBusy || revMd) && (
        <div className="rt-revision">
          <div className="rt-revision-head">✍️ 修订版预览{revBusy ? '（生成中…）' : '（已应用到上方文档）'}</div>
          <div className="md-doc rt-revision-body">
            {revBusy && !revMd && <Spinner label="按评审意见修订中" />}
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{revMd}</ReactMarkdown>
            {revBusy && revMd && <span className="cursor-blink">▍</span>}
          </div>
        </div>
      )}
    </div>
  )
}
