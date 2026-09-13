export default function Monetization({ data }) {
  if (!data) return null
  return (
    <div className="mon">
      <div className="mon-model">
        <span className="mon-model-badge">商业化模式</span>
        <strong>{data.model}</strong>
        <p>{data.modelReason}</p>
      </div>

      <h4 className="mon-h">🔻 转化漏斗</h4>
      <div className="mon-funnel">
        {(data.funnel || []).map((f, i, arr) => (
          <div className="mon-stage" key={i} style={{ width: `${100 - i * (40 / Math.max(1, arr.length))}%` }}>
            <div className="mon-stage-h"><span className="mon-stage-n">{i + 1}</span><strong>{f.stage}</strong><em>{f.metric}</em></div>
            <p className="mon-goal">{f.goal}</p>
            <div className="mon-levers">{(f.levers || []).map((l, j) => <span key={j}>{l}</span>)}</div>
          </div>
        ))}
      </div>

      <h4 className="mon-h">🏷️ 定价档位</h4>
      <div className="mon-pricing">
        {(data.pricing || []).map((t, i) => (
          <div className={`mon-tier ${i === 1 ? 'feat' : ''}`} key={i}>
            <div className="mon-tier-name">{t.tier}</div>
            <div className="mon-tier-price">{t.price}</div>
            <div className="mon-tier-who">{t.forWho}</div>
            <ul>{(t.includes || []).map((x, j) => <li key={j}>{x}</li>)}</ul>
          </div>
        ))}
      </div>

      {(data.pricing || []).every((t) => typeof t.value === 'number') && data.pricing.length > 1 && (
        <>
          <h4 className="mon-h">📈 价值阶梯（定价梯度）</h4>
          <div className="ladder">
            {data.pricing.map((t, i) => (
              <div className="ladder-step" key={i}>
                <div className="ladder-col">
                  <div className="ladder-tier">{t.tier}</div>
                  <div className="ladder-bar" style={{ height: `${Math.max(14, Math.min(100, t.value))}%` }}>
                    <span className="ladder-price">{t.price}</span>
                  </div>
                </div>
                <div className="ladder-trigger"><span>{i === 0 ? '🚪' : '⬆'}</span>{t.upgradeTrigger}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {data.pricingLogic?.length > 0 && (
        <div className="mon-pricelogic">
          <h4 className="mon-h">🧮 定价逻辑</h4>
          <ul>{data.pricingLogic.map((x, i) => <li key={i}>{x}</li>)}</ul>
        </div>
      )}

      <div className="mon-cols">
        <div className="mon-block">
          <h4>🪝 转化逻辑（免费 → 付费）</h4>
          <ul>{(data.conversionLogic || []).map((x, i) => <li key={i}>{x}</li>)}</ul>
        </div>
        <div className="mon-block">
          <h4>⚠️ 商业化风险</h4>
          <ul>{(data.risks || []).map((x, i) => <li key={i}>{x}</li>)}</ul>
        </div>
      </div>

      <h4 className="mon-h">📊 关键指标</h4>
      <div className="mon-metrics">{(data.metrics || []).map((m, i) => <span key={i}>{m}</span>)}</div>
    </div>
  )
}
