import { useState } from 'react'
import { DemoShell, Spinner } from '../../components.jsx'
import { completeJSON } from '../../api.js'

const SCHEMA = {
  type: 'json_schema',
  schema: {
    type: 'object',
    properties: {
      steps: {
        type: 'array',
        items: { type: 'object', properties: { title: { type: 'string' }, system: { type: 'string' }, action: { type: 'string' }, approval: { type: 'boolean' } }, required: ['title', 'system', 'action', 'approval'], additionalProperties: false },
      },
      fallback: {
        type: 'array',
        items: { type: 'object', properties: { risk: { type: 'string' }, handling: { type: 'string' } }, required: ['risk', 'handling'], additionalProperties: false },
      },
    },
    required: ['steps', 'fallback'],
    additionalProperties: false,
  },
}

export default function AgentBizDemo() {
  const [systems, setSystems] = useState('CRM、ERP、企业邮箱、电子签、财务系统')
  const [goal, setGoal] = useState('客户合同已谈妥，请走完从合同生成到首款确认的全流程，并通知相关同事。')
  const [res, setRes] = useState(null)
  const [busy, setBusy] = useState(false)

  const run = async () => {
    if (busy || !goal.trim()) return
    setBusy(true); setRes(null)
    try {
      const r = await completeJSON({
        system: '你是企业流程自动化 Agent。把目标拆解为跨系统执行计划。每步：title 简述、system 调用的系统/工具、action 输入→输出、approval 是否需人工审批(付款/发送/删除/对外等不可逆动作必须为 true)。fallback 给异常处理与回滚(risk/handling)。中文。',
        messages: [{ role: 'user', content: `【可用系统/工具】${systems}\n\n【目标】${goal}` }],
        format: SCHEMA,
        max_tokens: 1800,
      })
      setRes(r)
    } catch (e) {
      setRes({ steps: [], fallback: [], error: e.message || String(e) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <DemoShell id="bizagent" intro="流程自动化 Agent：给目标 → 拆成跨系统执行计划，每步标注调用的系统与「⛔ 需人工审批」的不可逆动作。">
      <div className="bizagent">
        <div className="ba-input">
          <label className="field-label">可用系统 / 工具</label>
          <input value={systems} onChange={(e) => setSystems(e.target.value)} />
          <label className="field-label">业务目标</label>
          <textarea value={goal} onChange={(e) => setGoal(e.target.value)} />
          <button className="primary" onClick={run} disabled={busy}>{busy ? '编排中…' : '⚙️ 生成执行计划'}</button>
        </div>

        {busy && <Spinner label="拆解跨系统流程" />}
        {res?.error && <div className="error-box">⚠️ {res.error}</div>}
        {res?.steps?.length > 0 && (
          <>
            <ol className="ba-steps">
              {res.steps.map((s, i) => (
                <li key={i} className={`ba-step ${s.approval ? 'gate' : ''}`}>
                  <span className="ba-num">{i + 1}</span>
                  <div className="ba-body">
                    <div className="ba-title">
                      <strong>{s.title}</strong>
                      <span className="ba-sys">{s.system}</span>
                      {s.approval && <span className="ba-gate">⛔ 需人工审批</span>}
                    </div>
                    <p className="ba-action">{s.action}</p>
                  </div>
                </li>
              ))}
            </ol>
            {res.fallback?.length > 0 && (
              <div className="ba-fallback">
                <h4>🛟 异常处理与回滚</h4>
                <table className="prd-table"><thead><tr><th>风险</th><th>应对</th></tr></thead>
                  <tbody>{res.fallback.map((f, i) => <tr key={i}><td>{f.risk}</td><td>{f.handling}</td></tr>)}</tbody>
                </table>
              </div>
            )}
          </>
        )}
        {!busy && !res && <div className="placeholder">给个业务目标，看 Agent 怎么跨系统编排 ✦</div>}
      </div>
    </DemoShell>
  )
}
