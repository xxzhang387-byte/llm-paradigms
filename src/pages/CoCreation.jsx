import { useState } from 'react'
import { DemoShell, Rich, Spinner } from '../components.jsx'
import { streamChat } from '../api.js'

const FORMATS = [
  { key: 'xhs', label: '小红书文案', sys: '写一篇小红书风格的种草文案，有 emoji、有钩子标题、分段、结尾带话题标签。' },
  { key: 'poem', label: '现代诗', sys: '写一首意象鲜明、有节奏感的现代诗，不超过 16 行。' },
  { key: 'story', label: '微小说', sys: '写一篇 300 字以内、有反转结尾的微小说。' },
  { key: 'slogan', label: '品牌 Slogan', sys: '产出 6 条风格各异的品牌 Slogan，每条一行，附一句话说明调性。' },
]

export default function CoCreation() {
  const [fmt, setFmt] = useState(FORMATS[0])
  const [brief, setBrief] = useState('')
  const [out, setOut] = useState('')
  const [busy, setBusy] = useState(false)

  const gen = async (variant) => {
    const topic = brief.trim()
    if (!topic || busy) return
    setBusy(true)
    setOut('')
    const ask =
      variant === 'longer'
        ? `就主题「${topic}」，在上一版基础上写得更丰富、更长。`
        : variant === 'shorter'
          ? `就主题「${topic}」，写一个更精炼、更短的版本。`
          : `主题：${topic}`
    try {
      await streamChat({
        system: `你是资深中文创作者。${fmt.sys} 只输出作品本身，不要解释。`,
        messages: [{ role: 'user', content: ask }],
        onText: (full) => setOut(full),
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <DemoShell
      id="create"
      intro="模型作为生产力工具，用户要的是产出物 —— 而且产出可被反复打磨。「人在环里」：生成、换一个、更长、更短。"
    >
      <div className="create">
        <div className="create-left">
          <label className="field-label">作品类型</label>
          <div className="seg">
            {FORMATS.map((f) => (
              <button key={f.key} className={f.key === fmt.key ? 'on' : ''} onClick={() => setFmt(f)}>
                {f.label}
              </button>
            ))}
          </div>
          <label className="field-label">写什么</label>
          <textarea
            className="brief"
            placeholder="例如：一家主打云南野生菌的小众火锅店"
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
          />
          <div className="create-actions">
            <button className="primary" disabled={busy} onClick={() => gen('new')}>
              {busy ? '生成中…' : '生成'}
            </button>
            <button disabled={busy || !out} onClick={() => gen('new')}>换一个</button>
            <button disabled={busy || !out} onClick={() => gen('longer')}>更长</button>
            <button disabled={busy || !out} onClick={() => gen('shorter')}>更短</button>
          </div>
        </div>
        <div className="create-out">
          {out ? <Rich text={out} /> : busy ? <Spinner /> : <div className="placeholder">产出会出现在这里 ✦</div>}
        </div>
      </div>
    </DemoShell>
  )
}
