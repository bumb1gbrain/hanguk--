import { memo } from 'react'

// Renders a string-grid sprite as crisp SVG rects.
// layers: [{ grid: string[] | {row: string}, pal }] drawn in order on top of the base.
function compose(base, layers) {
  const h = base.length
  const w = base[0].length
  const cells = base.map((row) => row.split('').map((ch) => ch))
  const colors = cells.map((row) => row.map(() => null))
  return { w, h, cells, colors, layers }
}

function Sprite({ grid, pal, layers = [], scale = 6, outline, className, style, title }) {
  const { w, h, cells } = compose(grid, layers)
  const color = cells.map((row) => row.map((ch) => (ch === '.' ? null : pal[ch] || null)))

  for (const layer of layers) {
    const entries = Array.isArray(layer.grid) ? layer.grid.map((r, i) => [i, r]) : Object.entries(layer.grid)
    for (const [ri, row] of entries) {
      const r = Number(ri) + (layer.dy || 0)
      if (r < 0 || r >= h) continue
      for (let c = 0; c < row.length && c < w; c++) {
        const ch = row[c]
        if (ch !== '.' && layer.pal[ch]) color[r][c + (layer.dx || 0)] = layer.pal[ch]
      }
    }
  }

  // auto-outline (1px) around opaque pixels
  let out = color
  if (outline) {
    out = color.map((row) => [...row])
    for (let r = 0; r < h; r++)
      for (let c = 0; c < w; c++) {
        if (color[r][c]) continue
        const n = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].some(
          ([y, x]) => y >= 0 && y < h && x >= 0 && x < w && color[y][x] && color[y][x] !== outline,
        )
        if (n) out[r][c] = outline
      }
  }

  // merge horizontal runs of same color
  const rects = []
  for (let r = 0; r < h; r++) {
    let c = 0
    while (c < w) {
      const col = out[r][c]
      if (!col) { c++; continue }
      let e = c + 1
      while (e < w && out[r][e] === col) e++
      rects.push(<rect key={`${r}-${c}`} x={c} y={r} width={e - c} height={1} fill={col} />)
      c = e
    }
  }

  return (
    <svg
      className={className}
      style={style}
      width={w * scale}
      height={h * scale}
      viewBox={`0 0 ${w} ${h}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label={title}
    >
      {rects}
    </svg>
  )
}

export default memo(Sprite)
