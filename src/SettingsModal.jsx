import { useState } from 'react'
import { PROVIDERS, getConfig, setConfig, clearConfig } from './modelConfig.js'
import { complete } from './api.js'

export default function SettingsModal({ onClose, onLoggedOut }) {
  const [cfg, setCfg] = useState(getConfig())
  const [test, setTest] = useState(null) // {ok, msg}
  const [testing, setTesting] = useState(false)

  const prov = PROVIDERS[cfg.provider]
  const set = (patch) => setCfg((c) => ({ ...c, ...patch }))

  const onProvider = (provider) => {
    const first = PROVIDERS[provider].models[0].id
    set({ provider, model: first })
    setTest(null)
  }

  const save = () => {
    if (!cfg.apiKey.trim()) return
    setConfig(cfg)
    onClose()
  }

  const logout = () => {
    clearConfig()
    onClose()
    onLoggedOut?.()
  }

  const runTest = async () => {
    if (!cfg.apiKey.trim()) return
    setConfig(cfg) // persist so the test uses current values
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>⚙️ 模型设置</h2>
          <button className="modal-x" onClick={onClose}>✕</button>
        </div>
        <p className="modal-sub">选择模型，填入你自己的 OpenRouter API Key。Key 仅保存在浏览器本地，请求由浏览器直连 OpenRouter。</p>

        <label className="cfg-label">服务商</label>
        <div className="provider-seg">
          {Object.entries(PROVIDERS).map(([id, p]) => (
            <button key={id} className={cfg.provider === id ? 'on' : ''} onClick={() => onProvider(id)}>
              {p.label}
            </button>
          ))}
        </div>

        <label className="cfg-label">模型</label>
        <select className="cfg-input" value={cfg.model} onChange={(e) => set({ model: e.target.value })}>
          {prov.models.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>

        <label className="cfg-label">API Key</label>
        <input
          className="cfg-input"
          type="password"
          value={cfg.apiKey}
          placeholder="sk-or-...（在 openrouter.ai 获取）"
          onChange={(e) => set({ apiKey: e.target.value })}
        />

        <label className="cfg-label">Base URL（可选）</label>
        <input
          className="cfg-input"
          value={cfg.baseURL}
          placeholder={prov.baseURLPlaceholder}
          onChange={(e) => set({ baseURL: e.target.value })}
        />

        <div className="cfg-note">
          OpenRouter 聚合了 Claude、DeepSeek 等多种模型。<strong>答案引擎 / 竞品分析</strong>的联网检索在纯静态版不可用，会自动降级为模型内置知识。
        </div>

        {test && <div className={`test-result ${test.ok ? 'ok' : 'bad'}`}>{test.ok ? '✓ ' : '✕ '}{test.msg}</div>}

        <div className="modal-actions">
          <button className="login-logout" onClick={logout}>退出登录</button>
          <span style={{ flex: 1 }} />
          <button className="ghost" onClick={runTest} disabled={testing || !cfg.apiKey.trim()}>
            {testing ? '测试中…' : '测试连接'}
          </button>
          <button className="primary" onClick={save} disabled={!cfg.apiKey.trim()}>保存</button>
        </div>
      </div>
    </div>
  )
}
