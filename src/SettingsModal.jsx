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
        effort: 'low',
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
        <p className="modal-sub">选择服务商与模型，填入你自己的 API Key。Key 仅保存在浏览器本地，请求经本站服务端代理转发。</p>

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
          placeholder={cfg.provider === 'deepseek' ? 'sk-...（platform.deepseek.com）' : 'sk-ant-...（console.anthropic.com）'}
          onChange={(e) => set({ apiKey: e.target.value })}
        />

        <label className="cfg-label">Base URL（可选）</label>
        <input
          className="cfg-input"
          value={cfg.baseURL}
          placeholder={prov.baseURLPlaceholder}
          onChange={(e) => set({ baseURL: e.target.value })}
        />

        {cfg.provider === 'deepseek' && (
          <div className="cfg-note">
            DeepSeek 走 OpenAI 兼容协议。注意：<strong>答案引擎</strong>（联网检索）目前仅 Claude 支持，
            DeepSeek 会自动降级为模型内置知识回答。
          </div>
        )}

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
