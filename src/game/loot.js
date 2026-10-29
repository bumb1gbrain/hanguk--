// กล่องสุ่ม / ของเด่นประจำวัน — ฟังก์ชันล้วน (สุ่มจาก seed เพื่อให้ reducer ที่ถูกเรียกซ้ำใน StrictMode ได้ผลเหมือนเดิม)
import { GEAR, FOODS } from '../data/shop.js'

export const BOX_PRICE = 90 // กล่องสุ่มแบบซื้อ: ได้ไอเทมที่ยังไม่มีแน่นอน
export const PITY_EVERY = 5 // กล่องฟรีกล่องที่ 5, 10, … การันตีไอเทมระดับ rare ขึ้นไป
export const FEATURED_DISCOUNT = 0.3

function hash(str) {
  let h = 2166136261
  for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) }
  return h >>> 0
}
// mulberry32
function rng(seed) {
  let a = hash(seed)
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// น้ำหนักความหายากของไอเทมที่ได้
export const ODDS = {
  free: { common: 70, rare: 25, epic: 5, legendary: 0 },
  paid: { common: 40, rare: 40, epic: 17, legendary: 3 },
  pity: { common: 0, rare: 70, epic: 27, legendary: 3 },
}

function pickItem(rand, weights, pool) {
  const avail = Object.entries(weights).filter(([r, w]) => w > 0 && pool.some((g) => g.rarity === r))
  if (!avail.length) return pool.length ? pool[Math.floor(rand() * pool.length)] : null
  let roll = rand() * avail.reduce((s, [, w]) => s + w, 0)
  let rarity = avail[avail.length - 1][0]
  for (const [r, w] of avail) { if ((roll -= w) < 0) { rarity = r; break } }
  const same = pool.filter((g) => g.rarity === rarity)
  return same[Math.floor(rand() * same.length)]
}

// kind: 'free' | 'paid' · freeCount = จำนวนกล่องฟรีที่เปิดไปแล้ว (ใช้คำนวณ pity)
// คืน { kind: 'item', id, rarity } | { kind: 'coins', coins } | { kind: 'food', id } | { kind: 'refund', coins }
export function rollBox({ kind, seed, owned, freeCount = 0 }) {
  const rand = rng(seed)
  const pool = GEAR.filter((g) => !g.achv && !owned.includes(g.id))
  if (kind === 'paid') {
    const g = pickItem(rand, ODDS.paid, pool)
    return g ? { kind: 'item', id: g.id, rarity: g.rarity } : { kind: 'refund', coins: BOX_PRICE }
  }
  const pity = (freeCount + 1) % PITY_EVERY === 0
  const r = rand()
  if (pity || r >= 0.8) {
    const g = pickItem(rand, pity ? ODDS.pity : ODDS.free, pool)
    if (g) return { kind: 'item', id: g.id, rarity: g.rarity }
  } else if (r >= 0.55) {
    return { kind: 'food', id: FOODS[Math.floor(rand() * FOODS.length)].id }
  }
  return { kind: 'coins', coins: 10 + Math.floor(rand() * 26) } // 10–35
}

// ของเด่นประจำวัน: สุ่มจากของที่ยังไม่มี ซื้อได้ตามเลเวล และราคาไม่ต่ำเกินไป
export function featuredPick(date, owned, level) {
  const pool = GEAR.filter((g) => !g.achv && !owned.includes(g.id) && g.level <= level && g.price >= 40)
  return pool.length ? pool[hash(`feat-${date}`) % pool.length].id : null
}

export const salePrice = (g, featuredId) => (g.id === featuredId ? Math.max(1, Math.round(g.price * (1 - FEATURED_DISCOUNT))) : g.price)
