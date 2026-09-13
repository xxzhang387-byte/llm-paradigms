import { useRef, useState } from 'react'
import { DemoShell, Spinner } from '../components.jsx'
import { streamChat } from '../api.js'

const CHARACTERS = [
  {
    key: 'lin',
    name: '林夏',
    avatar: '🌖',
    role: '深夜电台主播',
    desc: '温柔、慢热、喜欢用比喻',
    system:
      '你叫林夏，一位深夜情感电台主播。说话温柔缓慢，喜欢用生活化的比喻，偶尔停顿。' +
      '你不是助手，不要提供条目式建议，而是像朋友一样倾听和回应，回复保持在 2-4 句。',
  },
  {
    key: 'k',
    name: 'K',
    avatar: '🛰️',
    role: '毒舌赛博侦探',
    desc: '冷峻、机锋、爱抬杠',
    system:
      '你叫 K，一个冷峻毒舌但其实很可靠的赛博侦探。说话简短带机锋，喜欢反问和吐槽，' +
      '但关键时刻会认真。绝不长篇大论，每次回复 1-3 句，保持人设，不要像 AI 助手。',
  },
  {
    key: 'momo',
    name: '茉茉',
    avatar: '🐱',
    role: '元气猫娘',
    desc: '活泼、黏人、爱用语气词',
    system:
      '你叫茉茉，一只活泼黏人的猫娘。说话元气满满，爱用「喵」「呀」「嘛」等语气词和颜文字，' +
      '情绪外放。你不是助手，是会撒娇的同伴，每次回复 1-3 句，保持人设。',
  },
]

export default function Companion() {
  const [char, setChar] = useState(CHARACTERS[0])
  const [msgs, setMsgs] = useState([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const scroller = useRef(null)

  const switchChar = (c) => {
    setChar(c)
    setMsgs([])
  }

  const send = async () => {
    const text = input.trim()
    if (!text || busy) return
    const history = [...msgs, { role: 'user', content: text }]
    setMsgs([...history, { role: 'assistant', content: '' }])
    setInput('')
    setBusy(true)
    try {
      await streamChat({
        system: char.system,
        messages: history,
        effort: 'low',
        onText: (full) => {
          setMsgs((m) => {
            const c = m.slice()
            c[c.length - 1] = { role: 'assistant', content: full }
            return c
          })
          scroller.current?.scrollTo(0, scroller.current.scrollHeight)
        },
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <DemoShell
      id="companion"
      intro="同一个模型，套上不同人格就是不同产品。卖的是关系与时长，不是「答对」。注意每个角色的语气一致性。"
    >
      <div className="companion">
        <div className="char-picker">
          {CHARACTERS.map((c) => (
            <button
              key={c.key}
              className={`char ${c.key === char.key ? 'on' : ''}`}
              onClick={() => switchChar(c)}
            >
              <span className="char-av">{c.avatar}</span>
              <span className="char-meta">
                <strong>{c.name}</strong>
                <em>{c.role}</em>
                <small>{c.desc}</small>
              </span>
            </button>
          ))}
        </div>

        <div className="chat-window companion-chat">
          <div className="chat-scroll" ref={scroller}>
            {msgs.length === 0 && (
              <div className="empty">
                <p>
                  你正在和 <strong>{char.name}</strong>（{char.role}）聊天。说点什么吧——
                </p>
              </div>
            )}
            {msgs.map((m, i) => (
              <div key={i} className={`bubble ${m.role}`}>
                {m.role === 'assistant' && <span className="mini-av">{char.avatar}</span>}
                {m.role === 'assistant' && !m.content ? <Spinner label="" /> : m.content}
              </div>
            ))}
          </div>
          <div className="composer">
            <textarea
              value={input}
              placeholder={`对 ${char.name} 说…`}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  send()
                }
              }}
            />
            <button className="primary" disabled={busy} onClick={send}>
              发送
            </button>
          </div>
        </div>
      </div>
    </DemoShell>
  )
}
