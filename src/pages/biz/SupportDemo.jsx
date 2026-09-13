import { useState } from 'react'
import { DemoShell, Spinner } from '../../components.jsx'
import { completeJSON } from '../../api.js'

const SCHEMA = {
  type: 'json_schema',
  schema: {
    type: 'object',
    properties: {
      reply: { type: 'string' },
      agentHints: { type: 'array', items: { type: 'string' } },
      category: { type: 'string' },
      priority: { type: 'string', enum: ['高', '中', '低'] },
      escalate: { type: 'boolean' },
    },
    required: ['reply', 'agentHints', 'category', 'priority', 'escalate'],
    additionalProperties: false,
  },
}

export default function SupportDemo() {
  const [kb, setKb] = useState('退货政策：商品签收 7 天内无理由退货，需保持完好；定制类商品不支持无理由退货。退款 1-3 个工作日原路返回。')
  const [ticket, setTicket] = useState('我三天前买的定制刻字保温杯想退货，你们怎么不给退？！要求今天必须解决，否则投诉！')
  const [res, setRes] = useState(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  const run = async () => {
    if (busy || !ticket.trim()) return
    setBusy(true); setRes(null)
    try {
      const r = await completeJSON({
        system: '你是企业智能客服。基于知识(如有)处理客户工单：reply 是给客户的回复(礼貌专业、可直接发送、尽量有依据)；agentHints 是给坐席的内部提示(需核实点/风险/话术)；category 工单分类；priority 优先级(高/中/低)；escalate 是否建议转人工。中文。',
        messages: [{ role: 'user', content: `【知识】\n${kb || '（无）'}\n\n【客户工单】\n${ticket}` }],
        format: SCHEMA,
        max_tokens: 1400,
      })
      setRes(r)
    } catch (e) {
      setRes({ reply: `⚠️ ${e.message || e}`, agentHints: [], category: '-', priority: '中', escalate: false })
    } finally {
      setBusy(false)
    }
  }

  const copy = async () => { try { await navigator.clipboard.writeText(res?.reply || ''); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch {} }

  return (
    <DemoShell id="support" intro="智能客服：一条工单进来，自动产出「给客户的回复 + 坐席内部提示 + 工单分类/优先级/是否转人工」。">
      <div className="support">
        <div className="sup-left">
          <label className="field-label">产品 / 政策知识（可选）</label>
          <textarea className="sup-kb" value={kb} onChange={(e) => setKb(e.target.value)} />
          <label className="field-label">客户工单</label>
          <div className="sup-ticket">
            <span className="sup-avatar">🙍</span>
            <textarea value={ticket} onChange={(e) => setTicket(e.target.value)} />
          </div>
          <button className="primary sup-run" onClick={run} disabled={busy}>{busy ? '处理中…' : '🎧 生成处理方案'}</button>
        </div>
        <div className="sup-right">
          {busy ? <Spinner label="客服大脑处理中" /> : res ? (
            <>
              <div className="sup-card reply">
                <div className="sup-card-head"><h4>💬 给客户的回复</h4><button onClick={copy}>{copied ? '✓ 已复制' : '复制'}</button></div>
                <p className="sup-reply">{res.reply}</p>
              </div>
              <div className="sup-card">
                <h4>🧑‍💻 坐席提示</h4>
                <ul className="sup-hints">{res.agentHints.map((h, i) => <li key={i}>{h}</li>)}</ul>
              </div>
              <div className="sup-card">
                <h4>🏷️ 工单处理</h4>
                <div className="sup-tags">
                  <span className="sup-tag">分类：{res.category}</span>
                  <span className={`sup-tag pri-${res.priority}`}>优先级：{res.priority}</span>
                  <span className={`sup-tag ${res.escalate ? 'esc' : 'ok'}`}>{res.escalate ? '⤴ 建议转人工' : '✓ 可自动处理'}</span>
                </div>
              </div>
            </>
          ) : <div className="placeholder">填好工单，点生成处理方案 ✦</div>}
        </div>
      </div>
    </DemoShell>
  )
}
