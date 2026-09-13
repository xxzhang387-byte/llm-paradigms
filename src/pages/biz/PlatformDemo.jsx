import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { DemoShell, Spinner } from '../../components.jsx'
import { streamChat } from '../../api.js'

const SAMPLE = '为银行信用卡客服搭一个 AI 助手：能回答用户的账单、分期、额度问题，需要严格合规、可溯源、绝不能给出错误的金额或承诺。'
const SECTIONS = ['架构选型', 'System Prompt', '模型与成本', '护栏与合规', '评测与监控', '上线与迭代']

export default function PlatformDemo() {
  const [usecase, setUsecase] = useState(SAMPLE)
  const [out, setOut] = useState('')
  const [busy, setBusy] = useState(false)

  const run = async () => {
    if (busy || !usecase.trim()) return
    setBusy(true); setOut('')
    try {
      await streamChat({
        system: '你是企业 AI 平台架构师。为给定场景产出可上生产的落地方案，按这些 ## 二级标题分章：架构选型(RAG/Agent/微调取舍与理由)、System Prompt(可直接用的草案)、模型与成本(选型+降级策略)、护栏与合规(输入输出审核/权限/数据安全)、评测与监控(LLMOps 关注点)、上线与迭代。中文，具体可执行，善用表格与代码块。',
        messages: [{ role: 'user', content: `【场景】\n${usecase}` }],
        max_tokens: 4000,
        onText: setOut,
      })
    } catch (e) { setOut(`⚠️ ${e.message || e}`) } finally { setBusy(false) }
  }

  return (
    <DemoShell id="platform" intro="企业 AI 平台：给一个企业场景，生成可上生产的方案 —— 架构选型、System Prompt、模型成本、护栏合规、评测监控、上线迭代。">
      <div className="platform">
        <div className="pf-input">
          <label className="field-label">要为哪个企业场景搭 AI 能力</label>
          <textarea value={usecase} onChange={(e) => setUsecase(e.target.value)} />
          <div className="pf-sections">{SECTIONS.map((s) => <span key={s} className="pf-chip">{s}</span>)}</div>
          <button className="primary" onClick={run} disabled={busy}>{busy ? '生成中…' : '🏗️ 生成平台落地方案'}</button>
        </div>
        <div className="pf-out md-doc">
          {out ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{out}</ReactMarkdown>
            : busy ? <Spinner label="架构师设计方案中" />
            : <div className="placeholder">描述一个企业 AI 场景，生成上生产的落地方案 ✦</div>}
          {busy && out && <span className="cursor-blink">▍</span>}
        </div>
      </div>
    </DemoShell>
  )
}
