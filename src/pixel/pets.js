// สัตว์เลี้ยงหลายสายพันธุ์: ทุกตัวใช้โครงหัว 16 คอลัมน์ (ตา/จมูกอยู่แถวเดียวกัน) เหมือนเสือ 범이
// จึงใส่ชุดแต่งตัว (pet_hat / pet_face / pet_neck) ได้ทุกสายพันธุ์ · สายพันธุ์ที่หูสูงใช้ topPad (แถวเพิ่มด้านบน) แล้วขยับชุดลง (dy)
import { TIGER_HEAD, TIGER_BODY, TIGER_PAL, PET_STAGES } from './sprites.js'

const rev = (s) => [...s].reverse().join('')
// สร้างแถวสมมาตรจากครึ่งซ้าย 8 ตัวอักษร
const S = (half) => half + rev(half)
const set = (row, col, ch) => row.slice(0, col) + ch + row.slice(col + 1)
const sub = (head, patch) => head.map((r, i) => (patch[i] !== undefined ? patch[i] : r))

// ─────────── หัวของแต่ละสายพันธุ์ (13 แถว) ───────────
const CAT_HEAD = sub(TIGER_HEAD, {
  9: 'koopyyyppyyypook', // จมูกชมพู
})
const FOX_HEAD = sub(TIGER_HEAD, {
  3: '.kooooooooooook.', 4: 'kooooooooooooook', // ไม่มีลายหน้าผาก
  8: 'kooyyyyyyyyyyook', 9: 'kooyyyykkyyyyook', // แก้มขาวกว้าง
})
// หมา: หูตก (ทรง b = สีน้ำตาล)
const DOG_HEAD = [
  '........', '....kkkk', '..kkoooo', '.kbooooo', 'kbbooooo', 'kbbooooo', 'kbbewooo', 'kbbeeooo', '.kbyyyyy', '..kyyyyk', '..kyyyky', '...kyyyy', '....kkoo',
].map(S)
// กระต่าย: หูยาวอยู่ใน topPad, หัวกลม
const BUNNY_PAD = [S('...kk...'), S('..kook..'), S('..kbbk..')]
const BUNNY_HEAD = [
  '..kbbk..', '..kbbkkk', '.koooooo', 'kooooooo', 'kooooooo', 'kooooooo', 'kooewooo', 'kooeeooo', 'koooyyyy', 'kooyyyyb', 'kooyyyky', '.kooyyyy', '..kkoooo',
].map(S)
// แพนด้า: หูกลมสีดำ + ปื้นรอบตา
const PANDA_HEAD = [
  '.kkk....', 'kbbbk...', 'kbbbkkkk', '.koooooo', 'kooooooo', 'kobbbboo', 'kobebbbo', 'kobeebbo', 'koobbooo', 'kooooook', 'koooooko', '.koooooo', '..kkoooo',
].map(S)
// ลูกไก่: ไม่มีหู มีจุกและปากสีส้ม
const CHICK_HEAD = [
  '.......k', '.....kkk', '...kkooo', '..kooooo', '.koooooo', '.koooooo', '.koewooo', '.koeeooo', '.koooobb', '.kooooob', '..kooooo', '...koooo', '....kkoo',
].map(S)

// ─────────── พาเลตต์ ───────────
const pal = (o) => ({ ...TIGER_PAL, ...o })

// ─────────── ท่ออกแบบสายพันธุ์ ───────────
// sound = เสียงร้อง/คำเลียนเสียงภาษาเกาหลี (ใช้ตอนแตะสัตว์เลี้ยง) · fav = อาหารโปรด (ให้แล้วอารมณ์ดีเพิ่ม)
export const SPECIES = {
  tiger: { id: 'tiger', ko: '호랑이', read: 'โฮรังอี', th: 'เสือ', sound: { ko: '어흥', read: 'ออฮึง', th: 'เสียงคำราม' }, name: '범이', fav: 'tteok', price: 0, level: 1, icon: '🐯', pal: TIGER_PAL },
  chick: { id: 'chick', ko: '병아리', read: 'พยองอารี', th: 'ลูกไก่', sound: { ko: '삐약', read: 'ปียัก', th: 'เสียงลูกไก่ร้อง' }, name: '삐약이', fav: 'milk', price: 120, level: 2, icon: '🐥', head: CHICK_HEAD, pal: pal({ k: '#5a3f12', o: '#ffd84a', y: '#fff0a8', b: '#f08a24', e: '#1b1424' }) },
  cat: { id: 'cat', ko: '고양이', read: 'โคยังอี', th: 'แมว', sound: { ko: '야옹', read: 'ยาอง', th: 'เสียงแมวร้อง' }, name: '나비', fav: 'milk', price: 150, level: 3, icon: '🐱', head: CAT_HEAD, topPad: ['..k..........k..'], pal: pal({ k: '#2a2433', o: '#9aa0b4', y: '#f3f3f8', b: '#6d7290', e: '#2e8f5b' }) },
  dog: { id: 'dog', ko: '강아지', read: 'คังอาจี', th: 'ลูกสุนัข', sound: { ko: '멍멍', read: 'มองมอง', th: 'เสียงสุนัขเห่า' }, name: '바둑이', fav: 'kimbap', price: 200, level: 4, icon: '🐶', head: DOG_HEAD, pal: pal({ k: '#2a1a12', o: '#d9a441', y: '#f6e4c0', b: '#8b5a2b', e: '#1b1424' }) },
  bunny: { id: 'bunny', ko: '토끼', read: 'โทกี', th: 'กระต่าย', sound: { ko: '깡충', read: 'กังชุง', th: 'เสียงกระโดดของกระต่าย' }, name: '토순이', fav: 'banana', price: 250, level: 5, icon: '🐰', head: BUNNY_HEAD, topPad: BUNNY_PAD, pal: pal({ k: '#4a3a4a', o: '#fdfdfd', y: '#ffe3ec', b: '#ff9aa8', e: '#1b1424' }) },
  fox: { id: 'fox', ko: '여우', read: 'ยอู', th: 'จิ้งจอก', sound: { ko: '컹컹', read: 'คองคง', th: 'เสียงจิ้งจอกร้อง' }, name: '여우', fav: 'tteok', price: 350, level: 6, icon: '🦊', head: FOX_HEAD, topPad: ['..k..........k..'], pal: pal({ k: '#3a1f14', o: '#e8602c', y: '#fff1e0', b: '#8a3b1b', e: '#1b1424' }) },
  panda: { id: 'panda', ko: '판다', read: 'พันดา', th: 'แพนด้า', sound: { ko: '냠냠', read: 'นยัมนยัม', th: 'เสียงกินอาหาร' }, name: '판돌이', fav: 'samgyeop', price: 500, level: 8, icon: '🐼', head: PANDA_HEAD, pal: pal({ k: '#1b1b22', o: '#f4f4f8', y: '#ffffff', b: '#26242c', e: '#ffffff', w: '#c9ccd8' }) },
}
export const SPECIES_LIST = Object.values(SPECIES)
export const DEFAULT_SPECIES = 'tiger'

// ─────────── เปลี่ยนตา/อารมณ์ (หลับ/ดีใจ) แบบอัตโนมัติจากแถว 6-7 ───────────
// แถว 7 มีตา 'e' เป็นคู่ซ้าย (a,a+1) และคู่ขวา (b,b+1) → หลับ = เส้นปิดตา · ดีใจ = ตาโค้ง ^ ^
function moodRows(head, mood) {
  if (mood !== 'sleep' && mood !== 'happy') return {}
  const eyeCols = [...head[7]].map((c, i) => (c === 'e' ? i : -1)).filter((i) => i >= 0)
  if (eyeCols.length < 4) return {}
  const [a, , b] = [eyeCols[0], eyeCols[1], eyeCols[2]]
  const face = (row) => row.replace(/[ew]/g, 'o')
  let r6 = face(head[6])
  let r7 = face(head[7])
  if (mood === 'sleep') {
    for (const c of eyeCols) r7 = set(r7, c, 'k')
  } else {
    r6 = set(set(r6, a + 1, 'k'), b, 'k')
    for (const c of [a, a + 2, b - 1, b + 1]) r7 = set(r7, c, 'k')
  }
  return { 6: r6, 7: r7 }
}

// ─────────── ประกอบสไปรต์ตามช่วงวัย ───────────
// สีไข่ของแต่ละสายพันธุ์ (y = เปลือก, o = ลาย, b = เงา)
const EGG_PAL = {
  chick: { y: '#fff3b0', o: '#ffd23f', b: '#e0a82a' },
  cat: { y: '#e4e6ef', o: '#8b91ab', b: '#5c607a' },
  dog: { y: '#f6e4c0', o: '#c98a3a', b: '#8b5a2b' },
  bunny: { y: '#fff5f8', o: '#ffb3c6', b: '#e58fa8' },
  fox: { y: '#ffe8d4', o: '#e8602c', b: '#8a3b1b' },
  panda: { y: '#ffffff', o: '#2a2a33', b: '#c9ccd8' },
}

export function speciesSprite(id, stage, mood) {
  const sp = SPECIES[id] || SPECIES.tiger
  if (stage === 'egg') return { grid: PET_STAGES.egg, pal: { ...sp.pal, ...EGG_PAL[sp.id] }, dy: 0 }
  if (!sp.head) {
    // เสือ: ใช้สไปรต์เดิม (รวมสถานะโต)
    const g = [...PET_STAGES[stage]]
    const rows = moodRows(TIGER_HEAD, mood)
    for (const [r, row] of Object.entries(rows)) g[r] = row
    return { grid: g, pal: sp.pal, dy: 0 }
  }
  const pad = sp.topPad || []
  const head = sp.head.map((r, i) => moodRows(sp.head, mood)[i] ?? r)
  let body
  if (stage === 'baby') body = ['...kook..kook...', '....kk....kk....']
  else if (stage === 'teen') body = TIGER_BODY
  else {
    // โตเต็มวัย: ผ้าพันคอ + ลำตัวใหญ่ + หาง
    head[12] = '..kkrrrrrrrrkk..'
    body = ['...kooyyyyook.kk', '..kbooyyyyoobkok', '..koooyyyyookbk.', '..kbook..kboobk.', '..kkkkk..kkkkk..']
  }
  return { grid: [...pad, ...head, ...body], pal: sp.pal, dy: pad.length }
}
