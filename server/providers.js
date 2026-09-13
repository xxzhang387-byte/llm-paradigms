// Provider abstraction: route a request to Claude (Anthropic) or DeepSeek (OpenAI-compatible).
// Every request body may carry { provider, model, apiKey, baseURL } to override defaults.
import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'

const DEFAULT_MODEL = { anthropic: 'claude-opus-4-8', deepseek: 'deepseek-chat' }
const DEEPSEEK_BASE = 'https://api.deepseek.com'

export function resolve(b = {}) {
  const provider = b.provider === 'deepseek' ? 'deepseek' : 'anthropic'
  const model = b.model || DEFAULT_MODEL[provider]
  return { provider, model }
}

export function anthropicClient(b = {}) {
  // Pass apiKey only when present, so the SDK can fall back to ANTHROPIC_API_KEY env.
  return new Anthropic(b.apiKey ? { apiKey: b.apiKey } : {})
}

function deepseekClient(b = {}) {
  const apiKey = b.apiKey || process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    throw new Error('未配置 DeepSeek API Key —— 点右下角 ⚙️ 模型设置填入，或设置环境变量 DEEPSEEK_API_KEY')
  }
  return new OpenAI({ apiKey, baseURL: b.baseURL || DEEPSEEK_BASE })
}

function anthropicOutputConfig(b, model) {
  const oc = {}
  if (!/haiku/.test(model) && b.effort !== null) oc.effort = b.effort || 'low'
  if (b.format) oc.format = b.format
  return Object.keys(oc).length ? oc : undefined
}

// --- streaming: async-generator of text chunks ---
export async function* streamText(b) {
  const { provider, model } = resolve(b)
  const max_tokens = b.max_tokens || 4096
  if (provider === 'deepseek') {
    const client = deepseekClient(b)
    const messages = b.system ? [{ role: 'system', content: b.system }, ...b.messages] : b.messages
    const stream = await client.chat.completions.create({ model, messages, max_tokens, stream: true })
    for await (const chunk of stream) {
      const t = chunk.choices?.[0]?.delta?.content
      if (t) yield t
    }
  } else {
    const client = anthropicClient(b)
    const params = { model, max_tokens, messages: b.messages }
    if (b.system) params.system = b.system
    const oc = anthropicOutputConfig(b, model)
    if (oc) params.output_config = oc
    const stream = client.messages.stream(params)
    for await (const ev of stream) {
      if (ev.type === 'content_block_delta' && ev.delta.type === 'text_delta') yield ev.delta.text
    }
  }
}

// --- non-streaming completion; supports structured output via b.format (json_schema) ---
export async function completeText(b) {
  let { provider, model } = resolve(b)
  const max_tokens = b.max_tokens || 2048
  if (provider === 'deepseek') {
    // deepseek-reasoner does not support JSON mode — fall back to chat for structured calls.
    if (b.format && /reasoner/.test(model)) model = 'deepseek-chat'
    const client = deepseekClient(b)
    let system = b.system || ''
    if (b.format?.schema) {
      system +=
        '\n\n只输出一个 JSON 对象，严格符合以下 JSON Schema（不要 markdown 代码块、不要任何多余文字）：\n' +
        JSON.stringify(b.format.schema)
    }
    const messages = system ? [{ role: 'system', content: system }, ...b.messages] : b.messages
    const body = { model, messages, max_tokens }
    if (b.format) body.response_format = { type: 'json_object' }
    const resp = await client.chat.completions.create(body)
    return resp.choices?.[0]?.message?.content || ''
  } else {
    const client = anthropicClient(b)
    const params = { model, max_tokens, messages: b.messages }
    if (b.system) params.system = b.system
    const oc = anthropicOutputConfig(b, model)
    if (oc) params.output_config = oc
    const msg = await client.messages.create(params)
    return msg.content.filter((x) => x.type === 'text').map((x) => x.text).join('')
  }
}
