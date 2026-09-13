import { Link } from 'react-router-dom'
import { PARADIGMS } from '../paradigms.js'

function Card({ p }) {
  return (
    <div className="card" style={{ '--accent': p.accent }}>
      <div className="card-top">
        <span className="card-emoji">{p.icon}</span>
        <span className="card-n">{p.n}</span>
      </div>
      <h3>{p.title}</h3>
      <div className="card-en">{p.en} · {p.tag}</div>
      <p className="card-blurb">{p.blurb}</p>
      <div className="card-actions">
        <Link to={`/p/${p.id}`} className="card-demo">进入 demo →</Link>
        <Link to={`/guide/${p.id}`} className="card-guide">方法论</Link>
      </div>
    </div>
  )
}

export default function Home() {
  const toc = PARADIGMS.filter((p) => p.category === 'toC')
  const tob = PARADIGMS.filter((p) => p.category === 'toB')
  return (
    <div className="home">
      <div className="home-wrap">
        <header className="hero">
          <div className="hero-kicker">LLM × toC · 产品范式地图</div>
          <h1>
            LLM 导向的 toC 产品，
            <br />
            有哪几种范式？
          </h1>
          <p className="hero-sub">
            按「LLM 在产品里扮演什么角色」切分出 <strong>toC 7 种 + toB 7 种</strong> 范式。
            每张卡片背后是一个<strong>真实调用大模型</strong>的可玩 demo + 一页产品方法论（含 PRD / 提案 / PPT 生成）。
          </p>
        </header>

        <Link to="/flow" className="flow-banner">
          <div className="fb-left">
            <span className="fb-emoji">🚀</span>
            <div>
              <strong>产品改造主线 · 一条龙</strong>
              <p>背景目标 → 范式与竞品 → Demo → PRD → 商业化/ROI → 汇报 → PPT，7 步走完，数字贯通、产出自动保存。</p>
            </div>
          </div>
          <span className="fb-steps">📝→🧩→🛠️→📄→💰→📑→📊</span>
        </Link>

        <div className="banner-row">
          <Link to="/advisor" className="advisor-banner">
            <div className="ab-left">
              <span className="ab-emoji">🧭</span>
              <div>
                <strong>AI 产品顾问</strong>
                <p>填入你的产品 → 专家诊断 → 推荐范式 + 落地方案 + demo 设想。还能建产品库。</p>
              </div>
            </div>
            <span className="ab-go">咨询 →</span>
          </Link>
          <Link to="/compete" className="advisor-banner compete-banner">
            <div className="ab-left">
              <span className="ab-emoji">🔬</span>
              <div>
                <strong>竞品分析</strong>
                <p>给一个产品（可附链接）→ 联网检索 → 用了哪种范式、优缺点、对你的启发。</p>
              </div>
            </div>
            <span className="ab-go">分析 →</span>
          </Link>
        </div>

        <div className="cat-head">
          <h2>面向消费者 · toC</h2>
          <span>模型在产品里扮演什么角色 —— 从「模型即界面」到「模型是隐形引擎」</span>
        </div>
        <div className="grid">
          {toc.map((p) => <Card p={p} key={p.id} />)}
        </div>

        <div className="cat-head tob">
          <h2>面向企业 · toB</h2>
          <span>把大模型能力嵌入企业工作流 —— 知识、副驾、客服、流程、分析、文档、平台</span>
        </div>
        <div className="grid">
          {tob.map((p) => <Card p={p} key={p.id} />)}
        </div>

        <footer className="home-foot">
          <div className="axis">
            <span>模型可见度：</span>
            <em>LLM 即界面</em>
            <span className="line" />
            <em>LLM 是隐形管道</em>
          </div>
          <div className="axis">
            <span>人的参与度：</span>
            <em>人主导每一步</em>
            <span className="line" />
            <em>机器主导 · 人只验收</em>
          </div>
          <p className="note">
            首次进入需在登录页选择服务商与模型并填入你自己的 API Key（仅保存在浏览器本地，经服务端代理转发，不经过任何第三方）。
            随时可点右下角 ⚙️ 更换模型或退出登录。
          </p>
        </footer>
      </div>
    </div>
  )
}
