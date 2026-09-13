import { useState } from 'react'
import { DemoShell, Rich, Spinner } from '../../components.jsx'
import { streamChat } from '../../api.js'

const SAMPLE = `客户：A 制造集团 ｜ 行业：装备制造 ｜ 规模：2000 人
商机阶段：方案验证 ｜ 金额：约 80 万
最近沟通：客户关注实施周期与数据安全，担心与现有 ERP 集成成本
竞品：对手 X 报价更低但交付口碑一般`

const ACTIONS = [
  { key: 'mail', label: '✉️ 写跟进邮件', task: '写一封跟进邮件，打消客户对集成成本的顾虑，并推动安排一次技术对接会。' },
  { key: 'summary', label: '📋 总结商机', task: '总结这个商机的关键信息、当前卡点与赢单概率判断。' },
  { key: 'next', label: '➡️ 下一步建议', task: '给出推进这个商机的 3-5 个具体下一步动作，按优先级排序。' },
  { key: 'risk', label: '⚠️ 风险提示', task: '指出这个商机的主要风险点，以及应对话术。' },
]

export default function CopilotBizDemo() {
  const [ctx, setCtx] = useState(SAMPLE)
  const [out, setOut] = useState('')
  const [busy, setBusy] = useState(false)
  const [active, setActive] = useState('')

  const run = async (action) => {
    if (busy) return
    setBusy(true); setOut(''); setActive(action.label)
    try {
      await streamChat({
        system: '你是嵌入 CRM 的销售副驾。基于业务上下文完成任务，输出专业、可直接使用、结构清晰。涉及发送/写入动作时标注"需人工确认后执行"。中文。',
        messages: [{ role: 'user', content: `【业务上下文(CRM)】\n${ctx}\n\n【任务】${action.task}` }],
        max_tokens: 1600,
        onText: setOut,
      })
    } catch (e) { setOut(`⚠️ ${e.message || e}`) } finally { setBusy(false) }
  }

  return (
    <DemoShell id="bizcopilot" intro="行业 SaaS 副驾：读取 CRM 业务上下文，一键完成跟进邮件 / 商机总结 / 下一步建议等任务。">
      <div className="bizcopilot">
        <div className="bc-left">
          <div className="bc-crm">
            <div className="bc-crm-head">🗂️ CRM 记录</div>
            <textarea value={ctx} onChange={(e) => setCtx(e.target.value)} />
          </div>
          <div className="bc-actions">
            {ACTIONS.map((a) => (
              <button key={a.key} className={`bc-act ${active === a.label ? 'on' : ''}`} disabled={busy} onClick={() => run(a)}>{a.label}</button>
            ))}
          </div>
        </div>
        <div className="bc-out">
          <div className="bc-out-head">✦ 副驾输出 {active && <em>{active}</em>}</div>
          <div className="bc-out-body md-doc">
            {out ? <Rich text={out} /> : busy ? <Spinner label="副驾处理中" /> : <div className="placeholder">选一个动作，让副驾基于 CRM 记录帮你做 ✦</div>}
            {busy && out && <span className="cursor-blink">▍</span>}
          </div>
        </div>
      </div>
    </DemoShell>
  )
}
