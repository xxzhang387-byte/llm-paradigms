import { useRef, useState } from 'react'
import { DemoShell, Rich, Spinner } from '../components.jsx'
import { streamChat } from '../api.js'

const SYSTEM =
  '你是一个通用助手。简洁、直接、有用地用中文回答。不要复述问题，不要不必要的客套。'

export default function ChatNative() {
  const [msgs, setMsgs] = useState([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const scroller = useRef(null)

  const send = async () => {
    const text = input.trim()
    if (!text || busy) return
    const history = [...msgs, { role: 'user', content: text }]
    setMsgs([...history, { role: 'assistant', content: '' }])
    setInput('')
    setBusy(true)
    try {
      await streamChat({
        system: SYSTEM,
        messages: history,
        onText: (full) => {
          setMsgs((m) => {
            const copy = m.slice()
            copy[copy.length - 1] = { role: 'assistant', content: full }
            return copy
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
      id="chat"
      intro="最纯粹的形态：LLM 就是界面。一个空白输入框，用户自带任务。护城河在模型能力、记忆与分发。"
    >
      <div className="chat-window">
        <div className="chat-scroll" ref={scroller}>
          {msgs.length === 0 && (
            <div className="empty">
              <p>问点什么试试 ——</p>
              <div className="chips">
                {['用三句话解释 Transformer', '帮我写一封请假邮件', '周末适合做什么菜？'].map((q) => (
                  <button key={q} onClick={() => setInput(q)}>{q}</button>
                ))}
              </div>
            </div>
          )}
          {msgs.map((m, i) => (
            <div key={i} className={`bubble ${m.role}`}>
              {m.role === 'assistant' ? (
                m.content ? <Rich text={m.content} /> : <Spinner />
              ) : (
                m.content
              )}
            </div>
          ))}
        </div>
        <div className="composer">
          <textarea
            value={input}
            placeholder="给 Claude 发消息…（Enter 发送）"
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
    </DemoShell>
  )
}
