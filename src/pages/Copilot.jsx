import { useRef, useState } from 'react'
import { DemoShell, Rich, Spinner } from '../components.jsx'
import { streamChat } from '../api.js'

const SAMPLE =
  '我们这个产品最近增长遇到瓶颈，团队想了很多办法但是效果一般，老板让我写个东西分析下原因然后给点建议，我也不知道从哪下手。'

const ACTIONS = [
  { key: 'polish', label: '改写得更专业', sys: '把下面这段中文改写得更专业、更有条理，保持原意。只输出改写结果。' },
  { key: 'expand', label: '续写下去', sys: '承接下面这段中文，自然地续写一到两段。只输出续写的新内容。' },
  { key: 'shorten', label: '一句话精简', sys: '把下面这段中文精简成一句话核心表达。只输出结果。' },
  { key: 'en', label: '翻译成英文', sys: '把下面这段中文翻译成地道的英文。只输出译文。' },
]

export default function Copilot() {
  const [doc, setDoc] = useState(SAMPLE)
  const [sel, setSel] = useState('')
  const [panel, setPanel] = useState('')
  const [busy, setBusy] = useState(false)
  const [activeLabel, setActiveLabel] = useState('')
  const ta = useRef(null)

  const captureSel = () => {
    const el = ta.current
    if (!el) return
    setSel(doc.slice(el.selectionStart, el.selectionEnd))
  }

  const run = async (action) => {
    if (busy) return
    const target = (sel || doc).trim()
    if (!target) return
    setBusy(true)
    setPanel('')
    setActiveLabel(action.label)
    try {
      await streamChat({
        system: `你是嵌入在编辑器里的写作 Copilot。${action.sys}`,
        messages: [{ role: 'user', content: target }],
        onText: (full) => setPanel(full),
      })
    } finally {
      setBusy(false)
    }
  }

  const apply = () => {
    const el = ta.current
    if (!el || !panel) return
    if (sel) {
      const s = el.selectionStart
      const e = el.selectionEnd
      setDoc(doc.slice(0, s) + panel + doc.slice(e))
    } else {
      setDoc(doc + '\n\n' + panel)
    }
    setPanel('')
    setSel('')
  }

  return (
    <DemoShell
      id="copilot"
      intro="不新建产品，把 AI 塞进已有的编辑器。选中一段文字 → 触发 AI 动作 → 一键应用回原文。寄生在已有工作流上，0 迁移成本。"
    >
      <div className="copilot">
        <div className="editor-pane">
          <div className="editor-bar">
            <span>📝 文档.md</span>
            <span className="sel-hint">{sel ? `已选中 ${sel.length} 字` : '未选中 · 将对全文操作'}</span>
          </div>
          <textarea
            ref={ta}
            className="editor"
            value={doc}
            onChange={(e) => setDoc(e.target.value)}
            onSelect={captureSel}
            onMouseUp={captureSel}
            onKeyUp={captureSel}
          />
          <div className="toolbar">
            {ACTIONS.map((a) => (
              <button key={a.key} disabled={busy} onClick={() => run(a)}>
                {a.label}
              </button>
            ))}
          </div>
        </div>

        <aside className="ai-panel">
          <div className="ai-panel-head">
            <span>✦ Copilot</span>
            {activeLabel && <em>{activeLabel}</em>}
          </div>
          <div className="ai-panel-body">
            {panel ? <Rich text={panel} /> : busy ? <Spinner /> : (
              <div className="placeholder">选中文字，点上面的动作试试</div>
            )}
          </div>
          {panel && !busy && (
            <button className="primary apply" onClick={apply}>
              {sel ? '替换选中内容' : '追加到文末'}
            </button>
          )}
        </aside>
      </div>
    </DemoShell>
  )
}
