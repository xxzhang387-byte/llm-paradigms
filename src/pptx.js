import PptxGenJS from 'pptxgenjs'

const BG = '0C0E14'
const PANEL = '141821'
const LINE = '2A3142'
const ACCENT = '7C9CFF'
const TEXT = 'E8EBF2'
const MUTED = '98A1B4'
const INK = '0B0E16'

// Build a .pptx from a deck { title, subtitle, slides:[{title, bullets[], table?}] } and trigger download.
export async function buildPptx(deck, fileName) {
  const pptx = new PptxGenJS()
  pptx.layout = 'LAYOUT_WIDE' // 13.33 x 7.5 in

  // Cover
  const cover = pptx.addSlide()
  cover.background = { color: BG }
  cover.addShape(pptx.ShapeType.rect, { x: 0, y: 3.5, w: 13.33, h: 0.06, fill: { color: ACCENT } })
  cover.addText(deck.title || '提案', { x: 0.8, y: 2.2, w: 11.7, h: 1.1, fontSize: 40, bold: true, color: TEXT })
  cover.addText(deck.subtitle || '', { x: 0.8, y: 3.7, w: 11.7, h: 0.8, fontSize: 18, color: ACCENT })
  cover.addText('由 AI 生成 · LLM 产品范式提案', { x: 0.8, y: 6.7, w: 11.7, h: 0.4, fontSize: 11, color: MUTED })

  const slides = Array.isArray(deck.slides) ? deck.slides : []
  slides.forEach((sl, i) => {
    const s = pptx.addSlide()
    s.background = { color: BG }
    s.addText(sl.title || `第 ${i + 1} 页`, { x: 0.6, y: 0.45, w: 12.1, h: 0.7, fontSize: 26, bold: true, color: TEXT })
    s.addShape(pptx.ShapeType.line, { x: 0.6, y: 1.25, w: 12.1, h: 0, line: { color: ACCENT, width: 2 } })

    const hasTable = sl.table && Array.isArray(sl.table.headers) && sl.table.headers.length
    const bullets = Array.isArray(sl.bullets) ? sl.bullets.filter(Boolean) : []

    if (bullets.length) {
      s.addText(
        bullets.map((b) => ({ text: String(b), options: { bullet: { code: '2022' }, color: TEXT, fontSize: 16, paraSpaceAfter: 10 } })),
        { x: 0.7, y: 1.5, w: 12, h: hasTable ? 1.7 : 5.3, valign: 'top' }
      )
    }

    if (hasTable) {
      const headerRow = sl.table.headers.map((h) => ({
        text: String(h),
        options: { bold: true, color: INK, fill: { color: ACCENT }, align: 'left', valign: 'middle' },
      }))
      const bodyRows = (sl.table.rows || []).map((r) =>
        (Array.isArray(r) ? r : [r]).map((c) => ({ text: String(c ?? ''), options: { color: TEXT, fill: { color: PANEL }, valign: 'middle' } }))
      )
      s.addTable([headerRow, ...bodyRows], {
        x: 0.7,
        y: bullets.length ? 3.3 : 1.5,
        w: 12,
        border: { type: 'solid', color: LINE, pt: 1 },
        fontSize: 12,
        rowH: 0.4,
        autoPage: false,
      })
    }

    s.addText(String(i + 1), { x: 12.6, y: 6.9, w: 0.6, h: 0.3, fontSize: 10, color: MUTED, align: 'right' })
  })

  await pptx.writeFile({ fileName })
}
