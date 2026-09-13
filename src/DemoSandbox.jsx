import { useState } from 'react'
import { streamDemo } from './api.js'
import { Spinner } from './components.jsx'

const BASE_CSS =
  "*{box-sizing:border-box}body{margin:0;background:#0c0e14;color:#e8ebf2;" +
  "font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft Yahei',sans-serif;line-height:1.6}"

// Injected into the iframe: a real bridge to our proxy, config-aware, streaming.
const BOOT = `<script>
window.AI = async function(prompt, opts){
  opts = opts || {};
  var cfg = {}; try{ cfg = JSON.parse(localStorage.getItem('llm_model_config_v1')||'{}') }catch(e){}
  var base = '';
  try{ base = (window.parent && window.parent.location && window.parent.location.origin) || ''; }catch(e){}
  var body = { messages:[{role:'user',content:String(prompt)}], system: opts.system||'',
    provider: cfg.provider, model: cfg.model, apiKey: cfg.apiKey, baseURL: cfg.baseURL,
    max_tokens: opts.max_tokens||800 };
  var res = await fetch(base + '/api/chat', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  if(!res.ok || !res.body){ throw new Error('AI 请求失败 ('+res.status+')'); }
  var reader = res.body.getReader(), dec = new TextDecoder(), full = '';
  while(true){ var r = await reader.read(); if(r.done) break; full += dec.decode(r.value,{stream:true}); if(opts.onToken){ try{ opts.onToken(full) }catch(e){} } }
  return full;
};
<\/script>`

function clean(html) {
  let h = (html || '').trim()
  const m = h.match(/```(?:html)?\s*([\s\S]*?)```\s*$/)
  if (m) h = m[1].trim()
  // drop any stray prose before the first tag
  const lt = h.indexOf('<')
  if (lt > 0) h = h.slice(lt)
  return h
}

function buildDoc(html) {
  return (
    '<!doctype html><html><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<style>' + BASE_CSS + '</style></head><body>' + BOOT + clean(html) + '</body></html>'
  )
}

export default function DemoSandbox({ spec, paradigm, productName }) {
  const [html, setHtml] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [chars, setChars] = useState(0)
  const [showCode, setShowCode] = useState(false)

  const gen = async () => {
    if (busy) return
    setBusy(true); setErr(''); setHtml(''); setChars(0); setShowCode(false)
    try {
      const full = await streamDemo({ spec, paradigm, productName, onText: (f) => setChars(f.length) })
      setHtml(full)
    } catch (e) {
      setErr(e.message || String(e))
    } finally {
      setBusy(false)
    }
  }

  const openNew = () => {
    const blob = new Blob([buildDoc(html)], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 60000)
  }

  return (
    <div className="demo-sandbox">
      {!html && !busy && (
        <button className="primary demo-build-btn" onClick={gen}>🛠️ 把这个 Demo 做出来（真实可交互）</button>
      )}
      {busy && <div className="demo-gen"><Spinner label={`正在生成可交互 Demo${chars ? `（已 ${chars} 字）` : ''}`} /></div>}
      {err && <div className="error-box">⚠️ {err}</div>}
      {html && !busy && (
        <div className="demo-live">
          <div className="demo-bar">
            <span className="demo-bar-title">▶ 可交互原型 · 内部 AI 真实调用当前模型</span>
            <div className="demo-bar-actions">
              <button onClick={() => setShowCode((s) => !s)}>{showCode ? '看预览' : '</> 代码'}</button>
              <button onClick={openNew}>⤢ 新窗口</button>
              <button onClick={gen}>🔄 重做</button>
            </div>
          </div>
          {showCode ? (
            <pre className="demo-code">{clean(html)}</pre>
          ) : (
            <iframe
              className="demo-frame"
              title="生成的 Demo"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
              srcDoc={buildDoc(html)}
            />
          )}
        </div>
      )}
    </div>
  )
}
