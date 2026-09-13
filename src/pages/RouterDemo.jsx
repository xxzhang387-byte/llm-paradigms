import { useState } from 'react'
import { DemoShell, Rich, Spinner } from '../components.jsx'
import { streamChat } from '../api.js'

const MODELS = [
  { id: 'claude-opus-4-8', provider: 'anthropic', name: 'Opus 4.8 · 最强' },
  { id: 'claude-sonnet-4-6', provider: 'anthropic', name: 'Sonnet 4.6 · 均衡' },
  { id: 'claude-haiku-4-5', provider: 'anthropic', name: 'Haiku 4.5 · 最快' },
  { id: 'deepseek-chat', provider: 'deepseek', name: 'DeepSeek-V3 · chat' },
  { id: 'deepseek-reasoner', provider: 'deepseek', name: 'DeepSeek-R1 · reasoner' },
]
const provOf = (id) => MODELS.find((m) => m.id === id)?.provider

const SAMPLES = ['用一个比喻解释什么是「机会成本」', '写一句话的科幻小说', '反驳「努力一定有回报」']

export default function RouterDemo() {
  const [left, setLeft] = useState('claude-opus-4-8')
  const [right, setRight] = useState('claude-haiku-4-5')
  const [prompt, setPrompt] = useState('')
  const [outL, setOutL] = useState('')
  const [outR, setOutR] = useState('')
  const [busy, setBusy] = useState(false)

  const run = async (p) => {
    const text = (p ?? prompt).trim()
    if (!text || busy) return
    setPrompt(text)
    setBusy(true)
    setOutL('')
    setOutR('')
    const one = (model, set) =>
      streamChat({
        system: '简洁地用中文回答。',
        messages: [{ role: 'user', content: text }],
        model,
        provider: provOf(model),
        onText: (full) => set(full),
      }).catch((e) => set(`⚠️ ${e.message || e}`))
    await Promise.all([one(left, setOutL), one(right, setOutR)])
    setBusy(false)
  }

  const Picker = ({ value, onChange, side }) => (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={`picker ${side}`}>
      {MODELS.map((m) => (
        <option key={m.id} value={m.id}>{m.name}</option>
      ))}
    </select>
  )

  return (
    <DemoShell
      id="router"
      intro="自己不做模型，卡在用户和模型中间做分发。同一个 prompt 路由到两个模型（可跨 Claude / DeepSeek）并排对比 —— 这就是聚合层的核心价值与软肋。"
    >
      <div className="router">
        <div className="answer-bar">
          <input
            value={prompt}
            placeholder="输入一个 prompt，同时发给两个模型对比…"
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && run()}
          />
          <button className="primary" disabled={busy} onClick={() => run()}>
            {busy ? '生成中…' : '并排对比'}
          </button>
        </div>
        {!outL && !outR && !busy && (
          <div className="chips">
            {SAMPLES.map((s) => (
              <button key={s} onClick={() => run(s)}>{s}</button>
            ))}
          </div>
        )}
        <div className="versus">
          {[
            { v: left, set: setLeft, out: outL, side: 'l' },
            { v: right, set: setRight, out: outR, side: 'r' },
          ].map((c) => (
            <div className="vs-col" key={c.side}>
              <Picker value={c.v} onChange={c.set} side={c.side} />
              <div className="vs-out">
                {c.out ? <Rich text={c.out} /> : busy ? <Spinner label="" /> : <div className="placeholder">等待输出</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </DemoShell>
  )
}
