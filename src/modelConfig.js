// 模型配置：存在 localStorage，全站生效。
// 纯静态部署：所有请求由浏览器直连 OpenRouter（支持 CORS），
// 用户填入自己的 OpenRouter API Key，Key 永不离开浏览器。
const KEY = 'llm_model_config_v2'

export const PROVIDERS = {
  openrouter: {
    label: 'OpenRouter（多模型聚合）',
    baseURLPlaceholder: '默认 https://openrouter.ai/api/v1',
    keyHint: '在 openrouter.ai 获取 API Key',
    models: [
      { id: 'anthropic/claude-sonnet-4-6', name: 'Claude Sonnet 4.6 · 均衡' },
      { id: 'anthropic/claude-opus-4-8', name: 'Claude Opus 4.8 · 最强' },
      { id: 'anthropic/claude-haiku-4-5', name: 'Claude Haiku 4.5 · 最快' },
      { id: 'deepseek/deepseek-chat', name: 'DeepSeek-V3 · chat' },
      { id: 'deepseek/deepseek-r1', name: 'DeepSeek-R1 · reasoner' },
    ],
  },
}

const DEFAULT = { provider: 'openrouter', model: 'anthropic/claude-sonnet-4-6', apiKey: '', baseURL: '' }

export function getConfig() {
  try {
    return { ...DEFAULT, ...JSON.parse(localStorage.getItem(KEY) || '{}') }
  } catch {
    return { ...DEFAULT }
  }
}

export function setConfig(c) {
  localStorage.setItem(KEY, JSON.stringify(c))
}

export function clearConfig() {
  localStorage.removeItem(KEY)
}

// Gate: the app is only usable after the user entered their own API key.
export function isConfigured() {
  return !!getConfig().apiKey
}

// Merge the active config into an outgoing request body.
// Everything routes through OpenRouter, so apiKey/baseURL always apply.
export function withConfig(body = {}) {
  const c = getConfig()
  const out = { ...body, model: body.model || c.model }
  if (c.apiKey) out.apiKey = c.apiKey
  if (c.baseURL) out.baseURL = c.baseURL
  return out
}
