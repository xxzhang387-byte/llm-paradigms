import { useState } from 'react'
import { DemoShell, Spinner } from '../../components.jsx'
import { completeJSON } from '../../api.js'

const SAMPLE = `技术服务合同（节选）
甲方：某科技有限公司  乙方：某信息技术公司
服务费：人民币 60 万元，签订后 7 日内支付 100%。
服务期：2026年1月1日至2026年12月31日。
违约金：任一方违约按合同总额 30% 支付。
知识产权：服务成果归甲方所有。`

const SCHEMA = {
  type: 'json_schema',
  schema: {
    type: 'object',
    properties: {
      fields: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, value: { type: 'string' }, evidence: { type: 'string' } }, required: ['name', 'value', 'evidence'], additionalProperties: false } },
      risks: { type: 'array', items: { type: 'object', properties: { level: { type: 'string', enum: ['高', '中', '低'] }, desc: { type: 'string' } }, required: ['level', 'desc'], additionalProperties: false } },
      summary: { type: 'string' },
    },
    required: ['fields', 'risks', 'summary'],
    additionalProperties: false,
  },
}

export default function DocIntelDemo() {
  const [doc, setDoc] = useState(SAMPLE)
  const [task, setTask] = useState('审阅这份合同，重点看付款与违约条款的风险')
  const [res, setRes] = useState(null)
  const [busy, setBusy] = useState(false)

  const run = async () => {
    if (busy || !doc.trim()) return
    setBusy(true); setRes(null)
    try {
      const r = await completeJSON({
        system: '你是文档智能助手。对给定文档抽取关键要素(fields: name/value/evidence，evidence 为原文依据)、标注风险(risks: level 高/中/低 + desc)、给出摘要(summary 3-5 句)。不确定的值在 value 标注"待人工核对"。中文。',
        messages: [{ role: 'user', content: `【文档】\n${doc}\n\n【任务】${task || '抽取要素并风险审阅'}` }],
        format: SCHEMA,
        max_tokens: 1800,
      })
      setRes(r)
    } catch (e) {
      setRes({ fields: [], risks: [], summary: `⚠️ ${e.message || e}` })
    } finally {
      setBusy(false)
    }
  }

  return (
    <DemoShell id="docintel" intro="文档智能：贴一份合同/单据 → 抽取关键要素（带原文依据）、标注风险等级、生成摘要。">
      <div className="docintel">
        <div className="di-left">
          <label className="field-label">文档内容</label>
          <textarea className="di-doc" value={doc} onChange={(e) => setDoc(e.target.value)} />
          <label className="field-label">任务</label>
          <input value={task} onChange={(e) => setTask(e.target.value)} />
          <button className="primary di-run" onClick={run} disabled={busy}>{busy ? '解析中…' : '📑 抽取 + 审阅'}</button>
        </div>
        <div className="di-right">
          {busy ? <Spinner label="抽取要素与风险审阅" /> : res ? (
            <>
              {res.summary && <div className="di-summary">📝 {res.summary}</div>}
              {res.fields?.length > 0 && (
                <div className="di-block">
                  <h4>🔖 关键要素</h4>
                  <table className="prd-table"><thead><tr><th>字段</th><th>值</th><th>原文依据</th></tr></thead>
                    <tbody>{res.fields.map((f, i) => <tr key={i}><td>{f.name}</td><td>{f.value}</td><td className="di-ev">{f.evidence}</td></tr>)}</tbody>
                  </table>
                </div>
              )}
              {res.risks?.length > 0 && (
                <div className="di-block">
                  <h4>⚠️ 风险</h4>
                  {res.risks.map((r, i) => <div className={`di-risk lv-${r.level}`} key={i}><span className="di-lv">{r.level}</span>{r.desc}</div>)}
                </div>
              )}
            </>
          ) : <div className="placeholder">贴一份文档，点抽取 + 审阅 ✦</div>}
        </div>
      </div>
    </DemoShell>
  )
}
