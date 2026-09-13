import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { DemoShell, Spinner } from '../components.jsx'
import { BIZ_DEMOS } from '../bizDemos.js'
import { streamChat } from '../api.js'

export default function BizDemo() {
  const { id } = useParams()
  const nav = useNavigate()
  const cfg = BIZ_DEMOS[id]
  const [vals, setVals] = useState({})
  const [out, setOut] = useState('')
  const [busy, setBusy] = useState(false)

  if (!cfg) {
    return <div className="shell"><button className="back" onClick={() => nav('/')}>← 返回</button><p style={{ marginTop: 24 }}>未找到该 demo。</p></div>
  }

  const set = (k, v) => setVals((s) => ({ ...s, [k]: v }))
  const fillSample = () => {
    const s = {}
    cfg.fields.forEach((f) => { if (f.sample) s[f.key] = f.sample })
    setVals(s)
  }
  const ready = cfg.fields.every((f) => f.optional || (vals[f.key] || '').trim())

  const run = async () => {
    if (busy || !ready) return
    setBusy(true)
    setOut('')
    try {
      await streamChat({
        system: cfg.system,
        messages: [{ role: 'user', content: cfg.buildPrompt(vals) }],
        max_tokens: 3000,
        onText: setOut,
      })
    } catch (e) {
      setOut(`⚠️ ${e.message || e}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <DemoShell id={id} intro={cfg.intro}>
      <div className="biz-demo">
        <div className="biz-form">
          <div className="biz-form-head">
            <span className="biz-form-title">输入</span>
            <button className="biz-sample" onClick={fillSample}>↺ 填入示例</button>
          </div>
          {cfg.fields.map((f) => (
            <div className="biz-field" key={f.key}>
              <label>{f.label}</label>
              {f.type === 'input' ? (
                <input value={vals[f.key] || ''} placeholder={f.placeholder || ''} onChange={(e) => set(f.key, e.target.value)} />
              ) : (
                <textarea value={vals[f.key] || ''} placeholder={f.placeholder || ''} onChange={(e) => set(f.key, e.target.value)} />
              )}
            </div>
          ))}
          <button className="primary biz-run" onClick={run} disabled={busy || !ready}>
            {busy ? '运行中…' : `▶ ${cfg.runLabel || '运行'}`}
          </button>
        </div>

        <div className="biz-out">
          <div className="biz-out-head">输出</div>
          <div className="biz-out-body md-doc">
            {out ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{out}</ReactMarkdown>
              : busy ? <Spinner label="模型处理中" />
              : <div className="placeholder">填好左侧输入，点运行看结果 ✦</div>}
            {busy && out && <span className="cursor-blink">▍</span>}
          </div>
        </div>
      </div>
    </DemoShell>
  )
}
