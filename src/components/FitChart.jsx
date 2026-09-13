import { Link } from 'react-router-dom'
import { byId } from '../paradigms.js'

const tier = (s) => (s >= 75 ? 'hi' : s >= 50 ? 'mid' : 'lo')

export default function FitChart({ data }) {
  if (!data?.scores) return null
  const scores = [...data.scores].sort((a, b) => b.score - a.score)
  return (
    <div className="fit">
      {data.summary && <div className="fit-summary">🎯 {data.summary}</div>}
      <div className="fit-bars">
        {scores.map((s, i) => {
          const p = byId(s.id)
          if (!p) return null
          return (
            <div className={`fit-row ${tier(s.score)}`} key={i}>
              <Link to={`/guide/${p.id}`} className="fit-name" title={s.reason}>{p.icon} {p.title}</Link>
              <div className="fit-track"><span style={{ width: `${Math.max(3, Math.min(100, s.score))}%` }} /></div>
              <span className="fit-score">{s.score}</span>
            </div>
          )
        })}
      </div>
      <div className="fit-legend"><span className="dot hi" />高契合 ≥75　<span className="dot mid" />中 50-74　<span className="dot lo" />低 &lt;50</div>
    </div>
  )
}
