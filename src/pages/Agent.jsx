import { useState } from 'react'
import { DemoShell, Rich, Spinner } from '../components.jsx'
import { complete, streamChat } from '../api.js'
import { parseLenient } from '../jsonutil.js'

const PLAN_SCHEMA = {
  type: 'json_schema',
  schema: {
    type: 'object',
    properties: {
      steps: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            action: { type: 'string' },
          },
          required: ['title', 'action'],
          additionalProperties: false,
        },
      },
    },
    required: ['steps'],
    additionalProperties: false,
  },
}

const SAMPLES = [
  '帮我策划一场 30 人的公司团建',
  '调研「中年人 AI 陪伴」赛道，给一页结论',
  '为一款手冲咖啡新品做上市方案',
]

export default function Agent() {
  const [goal, setGoal] = useState('')
  const [steps, setSteps] = useState([]) // {title, action, status, result}
  const [phase, setPhase] = useState('idle') // idle|planning|running|done

  const run = async () => {
    const g = goal.trim()
    if (!g || phase === 'planning' || phase === 'running') return
    setSteps([])
    setPhase('planning')
    let plan
    try {
      const raw = await complete({
        system:
          '你是一个任务规划代理。把用户目标拆解成 4-6 个有序、具体、可执行的步骤。' +
          '每步给一个简短 title 和一句话 action。用中文。',
        messages: [{ role: 'user', content: g }],
        format: PLAN_SCHEMA,
        effort: 'low',
      })
      plan = parseLenient(raw).steps
    } catch (e) {
      setPhase('idle')
      setSteps([{ title: '规划失败', action: String(e.message || e), status: 'error', result: '' }])
      return
    }

    const init = plan.map((s) => ({ ...s, status: 'pending', result: '' }))
    setSteps(init)
    setPhase('running')

    const done = []
    for (let i = 0; i < init.length; i++) {
      setSteps((cur) => cur.map((s, j) => (j === i ? { ...s, status: 'active' } : s)))
      const context = done.length
        ? `已完成步骤的产出（供参考）：\n${done.map((d, k) => `${k + 1}. ${d.title}: ${d.result}`).join('\n')}\n\n`
        : ''
      let acc = ''
      await streamChat({
        system:
          '你是任务执行代理。只针对「当前步骤」产出实际结果（不是描述你会怎么做，而是直接给成果），' +
          '简洁、可用、中文。不要重复总目标。',
        messages: [
          {
            role: 'user',
            content: `总目标：${g}\n\n${context}当前步骤：${init[i].title} —— ${init[i].action}\n\n请直接给出这一步的成果。`,
          },
        ],
        effort: 'low',
        onText: (full) => {
          acc = full
          setSteps((cur) => cur.map((s, j) => (j === i ? { ...s, result: full } : s)))
        },
      })
      done.push({ title: init[i].title, result: acc })
      setSteps((cur) => cur.map((s, j) => (j === i ? { ...s, status: 'done' } : s)))
    }
    setPhase('done')
  }

  const running = phase === 'planning' || phase === 'running'

  return (
    <DemoShell
      id="agent"
      intro="给目标，不给步骤。代理自己拆解计划 → 逐步执行 → 交付成果。人退到验收位。可靠性是这一范式最大的瓶颈。"
    >
      <div className="agent">
        <div className="agent-input">
          <input
            value={goal}
            placeholder="给一个目标，比如：帮我策划一场 30 人的公司团建"
            onChange={(e) => setGoal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && run()}
          />
          <button className="primary" disabled={running} onClick={run}>
            {phase === 'planning' ? '规划中…' : phase === 'running' ? '执行中…' : '交给 Agent'}
          </button>
        </div>
        {steps.length === 0 && phase === 'idle' && (
          <div className="chips agent-chips">
            {SAMPLES.map((s) => (
              <button key={s} onClick={() => setGoal(s)}>{s}</button>
            ))}
          </div>
        )}
        {phase === 'planning' && <Spinner label="拆解任务计划" />}

        <ol className="steps">
          {steps.map((s, i) => (
            <li key={i} className={`step ${s.status}`}>
              <div className="step-head">
                <span className="step-badge">
                  {s.status === 'done' ? '✓' : s.status === 'active' ? '▸' : s.status === 'error' ? '✕' : i + 1}
                </span>
                <div>
                  <strong>{s.title}</strong>
                  <em>{s.action}</em>
                </div>
              </div>
              {(s.result || s.status === 'active') && (
                <div className="step-result">
                  {s.result ? <Rich text={s.result} /> : <Spinner label="" />}
                </div>
              )}
            </li>
          ))}
        </ol>
        {phase === 'done' && <div className="agent-done">✓ 任务完成 —— 你只需要验收</div>}
      </div>
    </DemoShell>
  )
}
