import { NavLink } from 'react-router-dom'

const LINKS = [
  { to: '/', label: '范式地图', end: true },
  { to: '/flow', label: '🚀 产品主线' },
  { to: '/workspace', label: '产品工作台' },
  { to: '/advisor', label: '顾问' },
  { to: '/compete', label: '竞品分析' },
]

export default function TopNav() {
  return (
    <header className="topnav">
      <NavLink to="/" end className="tn-brand">⬡ LLM 范式工作台</NavLink>
      <nav className="tn-links">
        {LINKS.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => `tn-link ${isActive ? 'on' : ''}`}>
            {l.label}
          </NavLink>
        ))}
      </nav>
    </header>
  )
}
