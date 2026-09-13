import { downloadMd, downloadDoc, printReport } from '../reportExport.js'
import { buildMasterReport, reportSections } from '../masterReport.js'

export default function ExportAll({ product }) {
  const name = `${product.name || '产品'}-总报告`
  const md = () => buildMasterReport(product)
  const sections = reportSections(product)
  const ready = sections.filter(([, ok]) => ok).length

  return (
    <div className="export-all">
      <div className="export-all-row">
        <span className="export-all-label">📦 导出整份报告</span>
        <button onClick={() => downloadMd(name, md())}>⬇ .md</button>
        <button onClick={() => downloadDoc(name, md())}>⬇ Word</button>
        <button onClick={() => printReport(name, md())}>🖨️ PDF</button>
      </div>
      <div className="export-all-secs">
        {sections.map(([label, ok]) => <span key={label} className={ok ? 'on' : ''}>{ok ? '✓' : '·'} {label}</span>)}
        <em>已含 {ready}/{sections.length} 部分</em>
      </div>
    </div>
  )
}
