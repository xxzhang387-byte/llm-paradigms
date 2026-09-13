import { marked } from 'marked'

export function safeName(s) {
  return (s || 'report').replace(/[\\/:*?"<>|\s]+/g, '_').slice(0, 60)
}

function download(filename, content, mime) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename
  document.body.appendChild(a); a.click(); a.remove()
  URL.revokeObjectURL(url)
}

export function downloadMd(name, md) {
  download(`${safeName(name)}.md`, md, 'text/markdown;charset=utf-8')
}

export function downloadDoc(name, md) {
  const html = marked.parse(md)
  const full =
    `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">` +
    `<head><meta charset="utf-8"><title>${name}</title><style>` +
    `body{font-family:"微软雅黑","Microsoft YaHei",sans-serif;font-size:11pt;line-height:1.6;color:#222}` +
    `h1{font-size:20pt}h2{font-size:15pt;border-bottom:1px solid #ccc;padding-bottom:4px}` +
    `table{border-collapse:collapse;width:100%}th,td{border:1px solid #888;padding:5px 9px;font-size:10.5pt}th{background:#f2f2f2}` +
    `blockquote{border-left:3px solid #888;margin:8px 0;padding:4px 12px;color:#555;background:#f7f7f7}` +
    `</style></head><body>${html}</body></html>`
  download(`${safeName(name)}.doc`, full, 'application/msword')
}

export function printReport(name, md) {
  const html = marked.parse(md)
  const w = window.open('', '_blank')
  if (!w) return
  w.document.write(
    `<html><head><meta charset="utf-8"><title>${name}</title><style>` +
    `body{font-family:-apple-system,"Microsoft YaHei",sans-serif;max-width:820px;margin:24px auto;padding:0 20px;color:#1a1a1a;line-height:1.65}` +
    `h1{font-size:24px}h2{font-size:18px;border-bottom:1px solid #ddd;padding-bottom:5px;margin-top:30px}h3{font-size:15px}` +
    `table{border-collapse:collapse;width:100%;margin:10px 0}th,td{border:1px solid #999;padding:5px 9px;font-size:12.5px;text-align:left}th{background:#f2f2f2}` +
    `blockquote{border-left:3px solid #999;margin:8px 0;padding:4px 12px;color:#555;background:#f7f7f7}code{background:#eee;padding:1px 4px}` +
    `@media print{a{color:#000;text-decoration:none}}` +
    `</style></head><body>${html}</body></html>`
  )
  w.document.close()
  setTimeout(() => { w.focus(); w.print() }, 350)
}

export async function downloadPng(node, name) {
  if (!node) return
  const { toPng } = await import('html-to-image')
  const url = await toPng(node, { backgroundColor: '#0c0e14', pixelRatio: 2, cacheBust: true })
  const a = document.createElement('a')
  a.href = url; a.download = `${safeName(name)}.png`
  document.body.appendChild(a); a.click(); a.remove()
}
