import { useState } from 'react'
import { DemoShell, Rich, Spinner } from '../../components.jsx'
import { completeJSON } from '../../api.js'

const SAMPLE_SCHEMA = `orders(order_id, user_id, amount, status, created_at)  -- 订单, status: paid/refunded
users(user_id, city, register_at, channel)  -- 用户`

const SCHEMA = {
  type: 'json_schema',
  schema: {
    type: 'object',
    properties: {
      sql: { type: 'string' },
      dialect: { type: 'string' },
      explanation: { type: 'string' },
      chart: { type: 'object', properties: { type: { type: 'string' }, note: { type: 'string' } }, required: ['type', 'note'], additionalProperties: false },
      needMore: { type: 'string' },
    },
    required: ['sql', 'explanation', 'chart'],
    additionalProperties: false,
  },
}

const KW = /\b(SELECT|FROM|WHERE|GROUP BY|ORDER BY|LIMIT|JOIN|LEFT|RIGHT|INNER|ON|AND|OR|AS|COUNT|SUM|AVG|MAX|MIN|DESC|ASC|HAVING|DISTINCT|CASE|WHEN|THEN|ELSE|END|BETWEEN|IN|NOT|NULL|DATE|INTERVAL)\b/gi

function HiSql({ sql }) {
  const parts = []
  let last = 0, m
  KW.lastIndex = 0
  while ((m = KW.exec(sql))) {
    if (m.index > last) parts.push(sql.slice(last, m.index))
    parts.push(<span className="kw" key={parts.length}>{m[0]}</span>)
    last = m.index + m[0].length
  }
  parts.push(sql.slice(last))
  return <pre className="sql-block"><code>{parts}</code></pre>
}

export default function BiDemo() {
  const [schema, setSchema] = useState(SAMPLE_SCHEMA)
  const [q, setQ] = useState('近 30 天各城市的已支付订单金额 Top 5，以及对应的新用户占比')
  const [res, setRes] = useState(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  const run = async () => {
    if (busy || !q.trim()) return
    setBusy(true); setRes(null)
    try {
      const r = await completeJSON({
        system: '你是对话式数据分析助手。基于给定表结构把业务问题转成 SQL(标准语法)。explanation 说明口径(字段含义/过滤/可能歧义)；chart 给可视化建议(type 如 bar/line/pie，note 说明 x/y 与理由)；若表结构不足以回答，用 needMore 指出还缺什么。中文。',
        messages: [{ role: 'user', content: `【表结构】\n${schema}\n\n【业务问题】${q}` }],
        format: SCHEMA,
        max_tokens: 1500,
      })
      setRes(r)
    } catch (e) {
      setRes({ sql: '', explanation: `⚠️ ${e.message || e}`, chart: null })
    } finally {
      setBusy(false)
    }
  }

  const copy = async () => { try { await navigator.clipboard.writeText(res?.sql || ''); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch {} }

  return (
    <DemoShell id="bi" intro="对话式数据分析：贴上表结构，用自然语言提问 → 生成 SQL、口径说明与可视化建议。">
      <div className="bi">
        <div className="bi-left">
          <label className="field-label">数据表结构（DDL / 字段说明）</label>
          <textarea className="bi-schema" value={schema} onChange={(e) => setSchema(e.target.value)} />
          <label className="field-label">业务问题</label>
          <input className="bi-q" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && run()} />
          <button className="primary bi-run" onClick={run} disabled={busy}>{busy ? '生成中…' : '📈 生成 SQL 与分析'}</button>
        </div>
        <div className="bi-right">
          {busy ? <Spinner label="解析口径并生成 SQL" /> : res ? (
            <>
              {res.needMore && <div className="bi-need">ℹ️ 表结构不足：{res.needMore}</div>}
              {res.sql && (
                <div className="bi-sql">
                  <div className="bi-sql-bar"><span>SQL{res.dialect ? ` · ${res.dialect}` : ''}</span><button onClick={copy}>{copied ? '✓ 已复制' : '复制'}</button></div>
                  <HiSql sql={res.sql} />
                </div>
              )}
              <div className="bi-card"><h4>📐 口径说明</h4><Rich text={res.explanation} /></div>
              {res.chart && (
                <div className="bi-card bi-chart">
                  <h4>📊 可视化建议</h4>
                  <span className="chart-type">{res.chart.type}</span>
                  <div className="chart-mock">{['62%', '48%', '80%', '35%', '55%'].map((h, i) => <span key={i} style={{ height: h }} />)}</div>
                  <p className="chart-note">{res.chart.note}</p>
                </div>
              )}
            </>
          ) : <div className="placeholder">填好表结构与问题，点生成 ✦</div>}
        </div>
      </div>
    </DemoShell>
  )
}
