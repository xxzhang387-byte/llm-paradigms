import { useMemo, useState } from 'react'
import { PROVIDERS, getConfig, setConfig } from './modelConfig.js'
import { complete } from './api.js'

export default function Onboarding({ onDone }) {
  const [cfg, setCfg] = useState(getConfig())
  const [showKey, setShowKey] = useState(false)
  const [testing, setTesting] = useState(false)
  const [test, setTest] = useState(null) // {ok, msg}

  const prov = PROVIDERS[cfg.provider]
  const set = (patch) => setCfg((c) => ({ ...c, ...patch }))
  const keyReady = !!cfg.apiKey.trim()

  const onProvider = (provider) => {
    set({ provider, model: PROVIDERS[provider].models[0].id })
    setTest(null)
  }

  const persist = (next = cfg) => setConfig(next)

  const runTest = async () => {
    if (!keyReady) return
    persist()
    setTesting(true)
    setTest(null)
    try {
      const t = await complete({
        messages: [{ role: 'user', content: '只回复两个字：在线' }],
        max_tokens: 16,
      })
      setTest({ ok: true, msg: `连接成功 · 返回「${(t || '').trim().slice(0, 20)}」` })
    } catch (e) {
      setTest({ ok: false, msg: e.message || String(e) })
    } finally {
      setTesting(false)
    }
  }

  const enter = () => {
    if (!keyReady) return
    persist()
    onDone()
  }

  const steps = useMemo(() => ['选模型', '填 Key', '进工作台'], [])

  return (
    <div className="login-screen">
      <div className="login-bg-dot login-dot-1" />
      <div className="login-bg-dot login-dot-2" />
      <div className="login-card">
        <div className="login-brand">
          <span className="login-logo">⬡</span>
          <div>
            <strong>LLM 范式工作台</strong>
            <em>LLM × Product Paradigms</em>
          </div>
        </div>

        <h1 className="login-title">欢迎，先连上你的模型</h1>
        <p className="login-sub">
          所有 demo 都会真实调用大模型。请选择模型，并填入你自己的 OpenRouter API Key。
        </p>

        <div className="login-steps">
          {steps.map((s, i) => (
            <span key={s} className="login-step"><i>{i + 1}</i>{s}</span>
          ))}
        </div>

        <label className="cfg-label">① 服务商</label>
        <div className="provider-seg login-provider-seg">
          {Object.entries(PROVIDERS).map(([id, p]) => (
            <button key={id} className={cfg.provider === id ? 'on' : ''} onClick={() => onProvider(id)}>
              <span className="ps-dot" />
              {p.label}
            </button>
          ))}
        </div>

        <label className="cfg-label">② 选择模型</label>
        <div className="login-models">
          {prov.models.map((m) => (
            <button
              key={m.id}
              className={`login-model ${cfg.model === m.id ? 'on' : ''}`}
              onClick={() => set({ model: m.id })}
            >
              <strong>{m.name.split(' · ')[0]}</strong>
              {m.name.includes(' · ') && <em>{m.name.split(' · ')[1]}</em>}
            </button>
          ))}
        </div>

        <label className="cfg-label">③ 填写 OpenRouter API Key</label>
        <div className="login-keyrow">
          <input
            className="cfg-input"
            type={showKey ? 'text' : 'password'}
            value={cfg.apiKey}
            placeholder="sk-or-...（在 openrouter.ai 获取）"
            onChange={(e) => { set({ apiKey: e.target.value }); setTest(null) }}
            onKeyDown={(e) => e.key === 'Enter' && enter()}
            autoFocus
          />
          <button type="button" className="login-eye" onClick={() => setShowKey((v) => !v)} title={showKey ? '隐藏' : '显示'}>
            {showKey ? '🙈' : '👁️'}
          </button>
        </div>

        <label className="cfg-label">Base URL（可选，留空用官方地址）</label>
        <input
          className="cfg-input"
          value={cfg.baseURL}
          placeholder={prov.baseURLPlaceholder}
          onChange={(e) => set({ baseURL: e.target.value })}
        />

        <div className="cfg-note">
          OpenRouter 聚合了 Claude、DeepSeek 等多种模型，支持浏览器直连（CORS）。
          <strong>答案引擎 / 竞品分析</strong>的联网检索在纯静态版不可用，会自动降级为模型内置知识。
        </div>

        {test && <div className={`test-result ${test.ok ? 'ok' : 'bad'}`}>{test.ok ? '✓ ' : '✕ '}{test.msg}</div>}

        <div className="login-actions">
          <button className="ghost" onClick={runTest} disabled={testing || !keyReady}>
            {testing ? '测试中…' : '测试连接'}
          </button>
          <button className="primary login-enter" onClick={enter} disabled={!keyReady}>
            进入工作台 →
          </button>
        </div>

        <p className="login-foot">
          🔒 Key 仅保存在你浏览器的 localStorage，请求由浏览器<strong>直连 OpenRouter</strong>，不经过任何我方服务器；你可以随时在右下角 ⚙️ 中更换或退出。
        </p>
      </div>
    </div>
  )
}
