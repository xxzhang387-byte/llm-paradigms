import { useState } from 'react'
import { DemoShell, Rich, Spinner } from '../components.jsx'
import { answer } from '../api.js'

const SAMPLES = ['Claude 最新的模型是哪个，有什么特点？', '2024 年世界人口达到多少？', 'RISC-V 和 ARM 的核心区别']

export default function AnswerEngine() {
  const [q, setQ] = useState('')
  const [res, setRes] = useState(null) // {text, sources, note}
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const ask = async (query) => {
    const text = (query ?? q).trim()
    if (!text || busy) return
    setQ(text)
    setBusy(true)
    setErr('')
    setRes(null)
    try {
      const data = await answer(text)
      setRes(data)
    } catch (e) {
      setErr(e.message || String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <DemoShell
      id="answer"
      intro="对话被藏起来，对标的是搜索这个老品类。问一个问题，直接给结构化答案 + 来源 —— 而不是十条蓝色链接。AI 是隐形引擎。"
    >
      <div className="answer">
        <div className="answer-bar">
          <input
            value={q}
            placeholder="问一个问题，引擎会联网检索后作答…"
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && ask()}
          />
          <button className="primary" disabled={busy} onClick={() => ask()}>
            {busy ? '检索中…' : '回答'}
          </button>
        </div>
        {!res && !busy && (
          <div className="chips">
            {SAMPLES.map((s) => (
              <button key={s} onClick={() => ask(s)}>{s}</button>
            ))}
          </div>
        )}
        {busy && <Spinner label="联网检索并综合答案" />}
        {err && <div className="error-box">⚠️ {err}</div>}
        {res && (
          <div className="answer-card">
            <Rich text={res.text} />
            {res.note && <div className="answer-note">ℹ️ {res.note}</div>}
            {res.sources?.length > 0 && (
              <div className="sources">
                <div className="sources-title">来源</div>
                <ol>
                  {res.sources.map((s, i) => (
                    <li key={i}>
                      <a href={s.url} target="_blank" rel="noreferrer">{s.title}</a>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}
      </div>
    </DemoShell>
  )
}
