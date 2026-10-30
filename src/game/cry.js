// เสียงร้องของสัตว์เลี้ยงสังเคราะห์ด้วย Web Audio (ไม่ต้องมีไฟล์เสียง/อินเทอร์เน็ต) — แต่ละสายพันธุ์เสียงต่างกัน
let ctx = null
const getCtx = () => {
  if (ctx) return ctx
  const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)
  if (!AC) return null
  try { ctx = new AC() } catch { ctx = null }
  return ctx
}

export const canCry = () => !!getCtx()

function tone(c, { type = 'sine', f0, f1 = f0, f2, at = 0, dur = 0.2, vol = 0.25, vib = 0, lp }) {
  const t0 = c.currentTime + at
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.setValueAtTime(f0, t0)
  if (f2) { o.frequency.linearRampToValueAtTime(f1, t0 + dur * 0.5); o.frequency.linearRampToValueAtTime(f2, t0 + dur) } else o.frequency.linearRampToValueAtTime(f1, t0 + dur)
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(vol, t0 + Math.min(0.03, dur / 4))
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  let node = o
  if (lp) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; o.connect(f); node = f }
  node.connect(g).connect(c.destination)
  if (vib) { const l = c.createOscillator(); const lg = c.createGain(); l.frequency.value = vib; lg.gain.value = f0 * 0.04; l.connect(lg).connect(o.frequency); l.start(t0); l.stop(t0 + dur + 0.05) }
  o.start(t0)
  o.stop(t0 + dur + 0.05)
}

function noise(c, { at = 0, dur = 0.1, vol = 0.2, f = 1200 }) {
  const t0 = c.currentTime + at
  const buf = c.createBuffer(1, Math.max(1, Math.floor(c.sampleRate * dur)), c.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length)
  const s = c.createBufferSource()
  const bp = c.createBiquadFilter()
  const g = c.createGain()
  s.buffer = buf
  bp.type = 'bandpass'
  bp.frequency.value = f
  g.gain.value = vol
  s.connect(bp).connect(g).connect(c.destination)
  s.start(t0)
}

const CRIES = {
  tiger: (c) => { tone(c, { type: 'sawtooth', f0: 170, f1: 70, dur: 0.7, vol: 0.28, lp: 700, vib: 24 }); noise(c, { dur: 0.5, vol: 0.12, f: 400 }) },
  chick: (c) => { [0, 0.14, 0.28].forEach((at, i) => tone(c, { type: 'square', f0: 2300 + i * 150, f1: 3200, at, dur: 0.09, vol: 0.12, lp: 5000 })) },
  cat: (c) => { tone(c, { type: 'sawtooth', f0: 520, f1: 980, f2: 560, dur: 0.75, vol: 0.18, lp: 2200, vib: 6 }) },
  dog: (c) => { [0, 0.25].forEach((at) => { tone(c, { type: 'sawtooth', f0: 430, f1: 210, at, dur: 0.14, vol: 0.28, lp: 1500 }); noise(c, { at, dur: 0.12, vol: 0.14, f: 900 }) }) },
  bunny: (c) => { [0, 0.16].forEach((at) => tone(c, { type: 'triangle', f0: 900, f1: 1350, at, dur: 0.1, vol: 0.18 })) },
  fox: (c) => { tone(c, { type: 'sawtooth', f0: 1000, f1: 1900, f2: 900, dur: 0.45, vol: 0.14, lp: 3200, vib: 9 }) },
  panda: (c) => { [0, 0.16, 0.32].forEach((at) => noise(c, { at, dur: 0.09, vol: 0.22, f: 700 })); tone(c, { type: 'sine', f0: 190, f1: 160, dur: 0.5, vol: 0.12 }) },
}

// เล่นเสียงร้อง · คืน true ถ้าเล่นได้ (เรียกในจังหวะที่ผู้ใช้แตะ เพื่อให้เบราว์เซอร์อนุญาตเสียง)
export function playCry(species) {
  const c = getCtx()
  if (!c) return false
  try {
    if (c.state === 'suspended') c.resume()
    ;(CRIES[species] || CRIES.tiger)(c)
    return true
  } catch { return false }
}
