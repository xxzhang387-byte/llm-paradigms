import app from './app.js'

const PORT = process.env.PORT || 8787

if (!process.env.ANTHROPIC_API_KEY && !process.env.DEEPSEEK_API_KEY) {
  console.warn(
    '\n[!] 未检测到 ANTHROPIC_API_KEY 或 DEEPSEEK_API_KEY。\n' +
      '    可以 export 其一，或在网页登录时填入自己的 key。\n'
  )
}

const server = app.listen(PORT, () => console.log(`[server] proxy listening on http://localhost:${PORT}`))
server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(
      `\n[FATAL] 端口 ${PORT} 已被占用 —— 很可能有一个旧的后端仍在运行（它不含最新的 /api 路由，` +
        `会导致前端收到 HTML、报 "Unexpected token '<'"）。\n` +
        `  请先结束旧进程，再重启：\n    lsof -ti tcp:${PORT} | xargs kill -9\n`
    )
    process.exit(1)
  }
  throw e
})
