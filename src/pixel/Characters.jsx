import Sprite from './Sprite.jsx'
import { useGame } from '../game/store.jsx'
import {
  AVATAR, AVATAR_PAL, AVATAR_SLEEPY, AVATAR_HAPPY, TOP_COLORS, OVERLAYS,
  SKIN_TONES, HAIR_COLORS, HAIR_STYLES, EYE_STYLES, DEFAULT_LOOK, GENDER_DEFAULTS,
  TIGER_PAL, petGrid, ROOM_SPRITES,
} from './sprites.js'

// ลำดับการวาด (ท้ายสุด = อยู่บนสุด) · เสื้อแบบ `late` (เช่นเดรส) วาดต่อจากรองเท้า เพื่อคลุมกางเกง
const SLOT_ORDER = ['top', 'bottom', 'shoes', 'late', 'back', 'neck', 'face', 'glasses', 'hat', 'hand']

// look: { gender, skin, hair, hairColor, eyes } — ถ้าไม่ส่งมา จะอ่านจากเซฟของผู้เล่น
export function Avatar({ outfit = {}, look, mood = 'normal', scale = 6, className }) {
  const ctx = useGame()
  const lk = { ...DEFAULT_LOOK, ...(look || ctx?.state?.player?.look || {}) }
  const grid = [...AVATAR]
  const eyes = EYE_STYLES[lk.eyes] || EYE_STYLES.dot
  for (const [r, row] of Object.entries(eyes.rows)) grid[r] = row
  const swap = mood === 'sleepy' ? AVATAR_SLEEPY : mood === 'happy' ? AVATAR_HAPPY : null
  if (swap) for (const [r, row] of Object.entries(swap)) grid[r] = row
  const skin = (SKIN_TONES[lk.skin] || SKIN_TONES[0]).c
  const hairC = (HAIR_COLORS[lk.hairColor] || HAIR_COLORS[0]).c
  const pal = { ...AVATAR_PAL, s: skin, h: hairC, ...(TOP_COLORS[outfit.top] || {}) }
  // ผมวาดก่อน แล้วค่อยซ้อนเสื้อ/กางเกง/รองเท้า/เป้/เครื่องประดับ/หมวก ตามลำดับ
  const layers = [{ grid: (HAIR_STYLES[lk.hair] || HAIR_STYLES.short).grid, pal: { h: hairC } }]
  const withSkin = (ov) => ({ ...ov, pal: { s: skin, ...ov.pal } })
  const topOv = OVERLAYS[outfit.top]
  for (const slot of SLOT_ORDER) {
    if (slot === 'late') { if (topOv?.late) layers.push(withSkin(topOv)); continue }
    const id = outfit[slot] || (slot === 'bottom' ? GENDER_DEFAULTS[lk.gender === 'f' ? 'f' : 'm'].bottom : null)
    const ov = OVERLAYS[id]
    if (!ov || (slot === 'top' && ov.late)) continue
    layers.push(withSkin(ov))
  }
  return <Sprite grid={grid} pal={pal} layers={layers} outline="#1b1424" scale={scale} className={className} title="ตัวละครของคุณ" />
}

// outfit: { pet_hat, pet_face, pet_neck } — ถ้าไม่ส่งมา อ่านจากเซฟ (ไข่ไม่ใส่ของ)
export function Pet({ stage = 'egg', mood = 'normal', scale = 6, className, outfit }) {
  const ctx = useGame()
  const wear = outfit || ctx?.state?.pet?.outfit || {}
  const layers = stage === 'egg' ? [] : ['pet_neck', 'pet_face', 'pet_hat'].map((k) => OVERLAYS[wear[k]]).filter(Boolean)
  return <Sprite grid={petGrid(stage, mood)} pal={TIGER_PAL} layers={layers} scale={scale} className={className} title="범이" />
}

export function RoomItem({ id, scale = 4, className, style }) {
  const s = ROOM_SPRITES[id]
  if (!s) return null
  return <Sprite grid={s.grid} pal={s.pal} outline="#1b1424" scale={scale} className={className} style={style} />
}
