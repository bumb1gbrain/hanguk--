import { FOODS } from '../data/shop.js'

// ───────── ตัวเลข/สมดุลเกม ─────────
export const DAILY_GOAL = 50
export const SRS_DAYS = [0, 1, 2, 4, 7, 15, 30] // index = box
export const STAGES = [
  { id: 'egg', min: 0, ko: '알', th: 'ไข่' },
  { id: 'baby', min: 30, ko: '아기', th: 'วัยเบบี๋' },
  { id: 'teen', min: 150, ko: '꼬마', th: 'วัยเด็ก' },
  { id: 'adult', min: 400, ko: '다 자란', th: 'โตเต็มวัย' },
]

// ── รางวัล: กันการปั๊มเหรียญ/XP จากบทเดิมซ้ำ ──
// เรียนจบครั้งแรกได้เต็ม · วันถัด ๆ ไปได้ครึ่งเดียว · เรียนซ้ำวันเดียวกันได้เฉพาะส่วนต่างเมื่อคะแนนดีขึ้น
export const LESSON_REPEAT_MULT = 0.5
export const STREAK_BONUS = { 3: 20, 7: 50, 14: 80, 30: 150, 60: 300, 100: 500 } // วันที่ -> เหรียญ

// paid = รางวัลที่จ่ายไปแล้ววันนี้สำหรับบทนี้ ({ xp, coins, growth, m }) หรือ undefined
// รางวัลสเกลตามความแม่นยำ (acc = ถูก/ทั้งหมด): ตอบถูกหมดได้เต็ม 50 XP · ถึงเกณฑ์ผ่านได้ ≥ ~38 XP · ไม่ถึงเกณฑ์ได้ 4 XP
// เกณฑ์ผ่านบท: ตอบถูกอย่างน้อย 60% ถึงนับว่า "เรียนจบ" (ปลดล็อกตอนเรื่อง/ความสำเร็จ/บทแนะนำถัดไป)
// ต่ำกว่านี้ได้แค่ XP ปลอบใจนิดเดียว ไม่ได้เหรียญ และคำในบทยังถูกเก็บเข้า "ทบทวน" ให้
export const PASS_PCT = 60
export const passedNow = (correct, total) => total > 0 && (correct / total) * 100 >= PASS_PCT
export const isPassed = (e) => !!e && e.passed !== false // เซฟเก่าไม่มีธง passed ถือว่าผ่านแล้ว
export const passedLessons = (ls = {}) => Object.fromEntries(Object.entries(ls).filter(([, e]) => isPassed(e)))

export function lessonReward({ correct, total, hadBefore, paid }) {
  const acc = total > 0 ? correct / total : 0
  const pass = passedNow(correct, total)
  const m = paid ? paid.m : hadBefore ? LESSON_REPEAT_MULT : 1
  const full = pass ? { xp: 8 + 42 * acc, coins: 3 + 9 * acc, growth: 6 + 8 * acc } : { xp: 4, coins: 0, growth: 1 }
  const out = { m }
  for (const k of Object.keys(full)) out[k] = Math.max(0, Math.round(full[k] * m) - (paid?.[k] || 0))
  out.happy = paid ? 0 : pass ? 12 : 2
  out.pass = pass
  return out
}

// เกมประกอบพยางค์: จ่ายรางวัลสูงสุด SYLLABLE_CAP รอบที่ผ่านต่อวัน เล่นซ้ำได้แต่ไม่ได้เพิ่ม
export const SYLLABLE_CAP = 6
export const SYLLABLE_PER = { xp: 3, coins: 1, growth: 1 }
export function syllableReward({ correct, paid = 0 }) {
  const n = Math.max(0, Math.min(correct, SYLLABLE_CAP) - paid)
  return { n, xp: n * SYLLABLE_PER.xp, coins: n * SYLLABLE_PER.coins, growth: n * SYLLABLE_PER.growth, happy: n ? 4 : 0 }
}
// ฝึกพูด: จ่ายรางวัลสูงสุด SPEAK_CAP ประโยคที่ผ่านต่อวัน ฝึกซ้ำได้ไม่จำกัดแต่ไม่ได้เพิ่ม
export const SPEAK_CAP = 6
export const SPEAK_PER = { xp: 4, coins: 1, growth: 1 }
export function speakReward({ passed, paid = 0 }) {
  const n = Math.max(0, Math.min(passed, SPEAK_CAP) - paid)
  return { n, xp: n * SPEAK_PER.xp, coins: n * SPEAK_PER.coins, growth: n * SPEAK_PER.growth, happy: n ? 4 : 0 }
}
export const REVIEW_REWARD = { xp: 4, coins: 1, growth: 2, happy: 2 } // ต่อคำ ต่อวัน (ครั้งแรกที่ตอบถูกของวัน)

export const clamp = (n, a = 0, b = 100) => Math.max(a, Math.min(b, n))

export function dayStr(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}
export function addDays(str, n) {
  const [y, m, d] = str.split('-').map(Number)
  return dayStr(new Date(y, m - 1, d + n))
}
export function daysBetween(a, b) {
  const [y1, m1, d1] = a.split('-').map(Number)
  const [y2, m2, d2] = b.split('-').map(Number)
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000)
}
// streak ที่ยังมีผลอยู่: พลาดไปกี่วันก็ตามที่ตัวป้องกัน (freezes) ครอบคลุมยังนับว่ายังอยู่ ไม่งั้นเป็น 0
export function liveStreak(st, today = dayStr(), freezes = 0) {
  if (!st.last) return 0
  const gap = daysBetween(st.last, today)
  if (gap <= 1) return st.count
  return gap - 1 <= freezes ? st.count : 0
}

// XP ที่ต้องใช้จากเลเวล L → L+1
export const needFor = (L) => 60 + 25 * (L - 1)
export function levelInfo(xp) {
  let L = 1
  let rest = xp
  while (rest >= needFor(L)) { rest -= needFor(L); L++ }
  return { level: L, into: rest, need: needFor(L) }
}

// ฉายา/ยศตามเลเวล
export const RANKS = [
  { lv: 1, ko: '새내기', th: 'มือใหม่' },
  { lv: 3, ko: '학생', th: 'นักเรียน' },
  { lv: 5, ko: '열공러', th: 'สายขยัน' },
  { lv: 8, ko: '한국어 러버', th: 'คนรักภาษาเกาหลี' },
  { lv: 12, ko: '통역사 지망생', th: 'นักแปลฝึกหัด' },
  { lv: 16, ko: '한글 마스터', th: 'ปรมาจารย์ฮันกึล' },
  { lv: 20, ko: '한국 통', th: 'เซียนเกาหลี' },
]
export const rankFor = (level) => [...RANKS].reverse().find((r) => level >= r.lv) || RANKS[0]
export const nextRank = (level) => RANKS.find((r) => r.lv > level) || null

export function stageFor(growth) {
  let s = STAGES[0]
  for (const st of STAGES) if (growth >= st.min) s = st
  return s
}
export function nextStage(growth) {
  return STAGES.find((s) => s.min > growth) || null
}

// ค่าสถานะสัตว์เลี้ยงลดลงตามเวลา
export function decayPet(pet, now = Date.now()) {
  const hrs = Math.max(0, (now - (pet.lastTick || now)) / 36e5)
  if (hrs < 1 / 60) return pet
  const p = { ...pet, lastTick: now }
  if (p.asleep) {
    p.full = clamp(p.full - 2 * hrs)
    p.happy = clamp(p.happy - 1 * hrs)
    p.clean = clamp((p.clean ?? 80) - 1 * hrs)
    p.energy = clamp(p.energy + 15 * hrs)
    if (p.energy >= 100) p.asleep = false
  } else {
    p.full = clamp(p.full - 4 * hrs)
    p.clean = clamp((p.clean ?? 80) - 2 * hrs)
    p.happy = clamp(p.happy - ((p.full < 20 ? 5 : 3) + (p.clean < 25 ? 2 : 0)) * hrs)
    p.energy = clamp(p.energy - 3 * hrs)
  }
  return p
}

// ถ้าสัตว์เลี้ยงหิว/เหงา/สกปรก การเติบโตจากการเรียนจะลดเหลือครึ่งหนึ่ง (การดูแลเองไม่โดนลด)
export const neglected = (pet) => pet.full < 25 || pet.happy < 25 || (pet.clean ?? 80) < 25
export const growthMult = (pet) => (neglected(pet) ? 0.5 : 1)

// 범이 ขออาหารวันละ 3 ช่วง (เช้า/กลางวัน/เย็น-ดึก) ต่อช่วงตรงใจได้โบนัสครั้งเดียว
export function wantSlot(date = new Date()) {
  const h = date.getHours()
  const part = h >= 5 && h < 11 ? 0 : h >= 11 && h < 17 ? 1 : 2
  const day = h < 5 ? dayStr(new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1)) : dayStr(date)
  return `${day}-${part}`
}

// เลือกอาหารที่ขอตอนเริ่มช่วง (แล้วบันทึกไว้ใน pet.want): ให้ได้จริงเสมอ
// ถ้ามีของในกระเป๋าเลือกจากนั้น ไม่งั้นเลือกจากที่เหรียญซื้อไหว ไม่งั้นนมธรรมดา (ถูกสุด)
export function chooseWant(slot, { inventory = {}, coins = 0 } = {}) {
  let seed = 0
  for (const ch of slot) seed = (seed * 31 + ch.charCodeAt(0)) % 9973
  const have = FOODS.filter((f) => inventory[f.id] > 0)
  const afford = FOODS.filter((f) => f.price <= coins)
  const pool = have.length ? have : afford.length ? afford : [FOODS[0]]
  return pool[seed % pool.length].id
}

export function petMood(pet) {
  if (pet.asleep) return 'sleep'
  if (pet.full < 25) return 'hungry'
  if (pet.energy < 15) return 'tired'
  if ((pet.clean ?? 80) < 25) return 'dirty'
  if (pet.happy < 25) return 'sad'
  if (pet.happy >= 70 && pet.full >= 50 && (pet.clean ?? 80) >= 40) return 'happy'
  return 'normal'
}

export const MOOD_TEXT = {
  sleep: { ko: '쿨쿨… 자고 있어요', th: 'กำลังหลับปุ๋ย', icon: '💤' },
  hungry: { ko: '배고파요!', th: 'หิวแล้ว ให้อาหารหน่อย', icon: '🍙' },
  tired: { ko: '졸려요…', th: 'ง่วงแล้ว พาเข้านอนหน่อย', icon: '🥱' },
  dirty: { ko: '씻고 싶어요…', th: 'ตัวเหม็นแล้ว อาบน้ำให้หน่อย', icon: '🫧' },
  sad: { ko: '심심해요…', th: 'เหงาจัง มาเรียน/เล่นด้วยกันนะ', icon: '💧' },
  happy: { ko: '행복해요!', th: 'มีความสุขมาก!', icon: '❤️' },
  normal: { ko: '안녕!', th: 'สบายดี', icon: '✨' },
}

// ───────── Quiz ─────────
const shuffle = (a) => {
  const b = [...a]
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[b[i], b[j]] = [b[j], b[i]]
  }
  return b
}
export { shuffle }

// โจทย์เรียงชิ้นส่วน: คำที่มีหลายพยางค์ → เรียงพยางค์ · ประโยคที่มีหลายคำ → เรียงคำ · ตัวอักษรใช้ "คำตัวอย่าง" (it.ex) แทน
// คืน null ถ้าไม่เหมาะ (สั้นเกินไป/ยาวเกินไป/ชิ้นส่วนซ้ำกันจนเรียงสลับแล้วเท่ากัน)
const HANGUL_SYL = /[가-힣]/
export function orderTarget(it) {
  const t = it.kind === 'letter' ? it.ex : it
  if (!t?.ko) return null
  const clean = t.ko.replace(/[?!.,~…“”]/g, '').trim()
  const words = clean.split(/\s+/).filter(Boolean)
  const parts = words.length >= 3 ? words : words.length === 1 ? [...clean].filter((c) => HANGUL_SYL.test(c)) : words.length === 2 && clean.replace(/\s/g, '').length <= 5 ? [...clean].filter((c) => HANGUL_SYL.test(c)) : words
  if (parts.length < 2 || parts.length > 6 || new Set(parts).size < 2) return null
  return { ko: t.ko, read: t.read, th: t.th, parts, join: words.length >= 3 ? ' ' : '' }
}

export function buildQuiz(items, pool, { n = 6, canListen = true } = {}) {
  const chosen = shuffle(items).slice(0, Math.min(n, items.length))
  const types = canListen ? ['ko2th', 'th2ko', 'listen'] : ['ko2th', 'th2ko']
  let handsOn = 0 // จำนวนโจทย์เรียงชิ้นส่วนในชุดนี้ (จำกัดไว้ ไม่ให้แทนการฝึกจำเสียงจนหมด)
  const handsOnMax = n >= 6 ? 2 : 1
  return chosen.map((it, i) => {
    let type = types[i % types.length]
    // เพิ่มโจทย์ "ลงมือทำ": ฟังแล้วเรียง (แทนข้อฟัง) และเรียงตามความหมาย (แทนข้อไทย→เกาหลีบางข้อ)
    const target = items.length > 1 ? orderTarget(it) : null
    if (target && handsOn < handsOnMax) {
      if (type === 'listen') type = 'dictate'
      else if (type === 'th2ko') type = 'order'
      if (type === 'dictate' || type === 'order') handsOn++
    }
    if (type === 'order' || type === 'dictate') {
      let tiles = shuffle(target.parts.map((text, k) => ({ id: k, text })))
      for (let tries = 0; tries < 5 && tiles.every((t, k) => t.id === k); tries++) tiles = shuffle(tiles)
      return { item: it, type, tiles, target, letter: it.kind === 'letter', thText: target.th }
    }
    // ตัวอักษรฮันกึล: ช่อง th เป็นคำอธิบายที่มีตัวอักษรนั้นอยู่ในข้อความ (เช่น "พยัญชนะ ㅂ (비읍)") ถ้าใช้เป็นตัวเลือก
    // จะเฉลยตัวเอง จึงใช้ "คำอ่านไทย" (read) แทน
    const letter = it.kind === 'letter'
    const thField = letter ? 'read' : it.qth ? 'qth' : 'th' // qth = ข้อความสำหรับโจทย์โดยเฉพาะ (กรณี th เฉลยตัวเอง)
    const field = type === 'ko2th' ? thField : 'ko'
    // ตัวหลอก: ต้องมีข้อมูลในช่องนั้น · เลือกจากประเภทเดียวกัน (คำ/ประโยค) และความยาวใกล้เคียงกัน
    // เพื่อไม่ให้เดาจากความยาวหรือรูปแบบของตัวเลือกได้ · ตัวหลอกจากบทเดียวกันมาก่อน
    const base = pool.filter((x) => x.id !== it.id && x[field] && x[field] !== it[field])
    const sameLesson = base.filter((x) => x.lesson === it.lesson)
    const sameKind = base.filter((x) => x.kind === it.kind)
    const others = letter ? base : sameLesson.length >= 3 ? sameLesson : sameKind.length >= 3 ? sameKind : base // ตัวอักษร: ให้รูปแบบตัวเลือกมาก่อนบทเดียวกัน
    const len = (o) => String(o[field]).length
    // รูปแบบข้อความ (มี "/" หรือวงเล็บ) ต้องเหมือนกัน ไม่งั้นตัวเลือกที่หน้าตาแปลกกว่าเพื่อนจะเป็นเฉลย
    const shape = (o) => (/ \//.test(String(o[field])) ? 1 : 0) + (/\(/.test(String(o[field])) ? 2 : 0)
    const rank = (o) => (o.kind === it.kind ? 0 : 8) + Math.min(Math.abs(len(o) - len(it)), 12) * 0.6 + (shape(o) === shape(it) ? 0 : 6) + (letter && o.lesson !== it.lesson ? 1.5 : 0) + Math.random() * 3
    const seen = new Set([it[field]])
    const distract = []
    for (const o of [...others].sort((x, y) => rank(x) - rank(y))) {
      if (seen.has(o[field])) continue
      seen.add(o[field])
      distract.push(o)
      if (distract.length === 3) break
    }
    const options = shuffle([it, ...distract]).map((o) => ({ id: o.id, label: o[field], sub: field === 'ko' ? o.read : null }))
    return { item: it, type, options, letter, thText: it[thField] }
  }).sort(() => Math.random() - 0.5)
}
