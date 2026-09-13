// Classic Business Model Canvas 9-block layout.
const CELLS = [
  { key: 'keyPartners', label: '重要伙伴', icon: '🤝', area: 'kp' },
  { key: 'keyActivities', label: '关键业务', icon: '⚙️', area: 'ka' },
  { key: 'keyResources', label: '核心资源', icon: '🧱', area: 'kr' },
  { key: 'valuePropositions', label: '价值主张', icon: '💎', area: 'vp' },
  { key: 'customerRelationships', label: '客户关系', icon: '💞', area: 'cr' },
  { key: 'channels', label: '渠道通路', icon: '🚚', area: 'ch' },
  { key: 'customerSegments', label: '客户细分', icon: '👥', area: 'cs' },
  { key: 'costStructure', label: '成本结构', icon: '💸', area: 'cost' },
  { key: 'revenueStreams', label: '收入来源', icon: '💰', area: 'rev' },
]

export default function BmcGrid({ data }) {
  if (!data) return null
  return (
    <div className="bmc">
      {CELLS.map((c) => (
        <div className={`bmc-cell area-${c.area}`} key={c.key}>
          <div className="bmc-cell-h">{c.icon} {c.label}</div>
          <ul>{(data[c.key] || []).map((x, i) => <li key={i}>{x}</li>)}</ul>
        </div>
      ))}
    </div>
  )
}
