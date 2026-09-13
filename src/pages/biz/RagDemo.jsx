import { useState } from 'react'
import { DemoShell, Rich, Spinner } from '../../components.jsx'
import { completeJSON } from '../../api.js'

const SAMPLE_DOCS = [
  { title: '差旅报销制度', body: '1. 出差需提前在 OA 提交申请并获主管审批。\n2. 市内交通凭票实报，单次上限 100 元。\n3. 住宿：一线城市 ≤500 元/晚，其他 ≤350 元/晚。\n4. 报销需在出差结束后 15 个工作日内提交，逾期不予受理。' },
  { title: '加班与调休规定', body: '工作日加班按 1.5 倍计，周末 2 倍，法定节假日 3 倍。加班需事前申请，调休须在 60 天内使用。' },
]

const SCHEMA = {
  type: 'json_schema',
  schema: {
    type: 'object',
    properties: {
      found: { type: 'boolean' },
      answer: { type: 'string' },
      citations: {
        type: 'array',
        items: { type: 'object', properties: { source: { type: 'string' }, quote: { type: 'string' } }, required: ['source', 'quote'], additionalProperties: false },
      },
    },
    required: ['found', 'answer', 'citations'],
    additionalProperties: false,
  },
}

export default function RagDemo() {
  const [docs, setDocs] = useState(SAMPLE_DOCS)
  const [q, setQ] = useState('我上周去上海出差，住了一晚 480 的酒店，过了 20 天还能报销吗？')
  const [res, setRes] = useState(null)
  const [busy, setBusy] = useState(false)
  const [hl, setHl] = useState(-1)

  const setDoc = (i, k, v) => setDocs((d) => d.map((x, j) => (j === i ? { ...x, [k]: v } : x)))
  const addDoc = () => setDocs((d) => [...d, { title: `文档${d.length + 1}`, body: '' }])
  const delDoc = (i) => setDocs((d) => d.filter((_, j) => j !== i))

  const ask = async () => {
    if (busy || !q.trim()) return
    setBusy(true); setRes(null); setHl(-1)
    const kb = docs.map((d, i) => `【文档${i + 1}：${d.title}】\n${d.body}`).join('\n\n')
    try {
      const r = await completeJSON({
        system: '你是企业知识库助手。严格只依据提供的知识库回答，不得使用外部知识或编造。found 表示知识库是否包含答案；若不包含，found=false 且 answer 说明"知识库中未找到"并建议补充哪类文档。citations 引用支撑结论的原文片段，source 用"文档N：标题"。中文。',
        messages: [{ role: 'user', content: `【知识库】\n${kb}\n\n【问题】${q}` }],
        format: SCHEMA,
        max_tokens: 1500,
      })
      setRes(r)
    } catch (e) {
      setRes({ found: false, answer: `⚠️ ${e.message || e}`, citations: [] })
    } finally {
      setBusy(false)
    }
  }

  const locate = (quote) => {
    const idx = docs.findIndex((d) => quote && d.body.includes(quote.slice(0, 8)))
    setHl(idx)
    if (idx >= 0) document.getElementById(`ragdoc-${idx}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <DemoShell id="rag" intro="企业知识库问答（RAG）：只依据左侧知识库回答，答案附可点击的「依据」引用；知识库没有就明确拒答，不编造。">
      <div className="rag">
        <div className="rag-kb">
          <div className="rag-kb-head"><span>📚 知识库（{docs.length} 篇）</span><button onClick={addDoc}>+ 加文档</button></div>
          {docs.map((d, i) => (
            <div className={`rag-doc ${hl === i ? 'hl' : ''}`} id={`ragdoc-${i}`} key={i}>
              <div className="rag-doc-bar">
                <input className="rag-doc-title" value={d.title} onChange={(e) => setDoc(i, 'title', e.target.value)} />
                <button className="rag-doc-del" onClick={() => delDoc(i)}>✕</button>
              </div>
              <textarea value={d.body} onChange={(e) => setDoc(i, 'body', e.target.value)} placeholder="粘贴文档内容…" />
            </div>
          ))}
        </div>

        <div className="rag-qa">
          <div className="rag-ask">
            <textarea value={q} onChange={(e) => setQ(e.target.value)} placeholder="基于知识库提问…" />
            <button className="primary" onClick={ask} disabled={busy}>{busy ? '检索中…' : '🔍 提问'}</button>
          </div>
          <div className="rag-answer">
            {busy ? <Spinner label="检索知识库并作答" /> : res ? (
              <>
                {!res.found && <div className="rag-notfound">⚠️ 知识库中未找到</div>}
                <Rich text={res.answer} />
                {res.citations?.length > 0 && (
                  <div className="rag-cites">
                    <div className="rag-cites-title">📎 依据（点击定位原文）</div>
                    {res.citations.map((c, i) => (
                      <button className="rag-cite" key={i} onClick={() => locate(c.quote)}>
                        <span className="rag-cite-src">{c.source}</span>
                        <span className="rag-cite-quote">“{c.quote}”</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : <div className="placeholder">左侧是知识库，提个问题试试 ✦</div>}
          </div>
        </div>
      </div>
    </DemoShell>
  )
}
