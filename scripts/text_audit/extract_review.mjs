// ดึงข้อความทั้งแอป (เกาหลี/คำอ่านไทย/คำแปล + ที่มา) สำหรับส่งให้เจ้าของภาษา/ครูตรวจ — ใช้: node scripts/text_audit/extract_review.mjs out.json
globalThis.window = { speechSynthesis: { getVoices: () => [] } }
import fs from 'node:fs'
const R = process.cwd() + '/src/'
const { LESSONS } = await import(R + 'data/lessons.js')
const { ROUTINE } = await import(R + 'data/routine.js')
const { FOODS, GEAR } = await import(R + 'data/shop.js')
const quests = await import(R + 'data/quests.js')
const { ACHIEVEMENTS } = await import(R + 'data/achievements.js')
const { TRICKS } = await import(R + 'data/tricks.js')
const { EGG_PHRASES } = await import(R + 'data/tricks.js')
const { MOOD_TEXT } = await import(R + 'game/logic.js')
const { SPECIES_LIST } = await import(R + 'pixel/pets.js')
const { ALL_PARTS, CHAPTERS } = await import(R + 'data/story.js')
const rows = []
const add = (sheet, where, o) => rows.push({ sheet, where, who: o.who || '', ko: o.ko || '', read: o.read || '', rom: o.rom || '', th: o.th || '', note: o.note || '' })
for (const l of LESSONS) {
  for (const it of l.items) {
    add('บทเรียน', `${l.title} (${l.titleTh}) · ${it.kind === 'letter' ? 'ตัวอักษร' : it.kind === 'word' ? 'คำศัพท์' : 'ประโยค'}`, { ...it, note: it.ex ? `คำตัวอย่าง: ${it.ex.ko} (${it.ex.read}) = ${it.ex.th}` : '' })
  }
  if (l.note) add('บทเรียน', `${l.title} · หมายเหตุประจำบท (ข้อความภาษาไทย)`, { th: l.note })
}
for (const r of ROUTINE) add('กิจวัตร', 'กิจวัตรประจำวัน', r)
for (const f of FOODS) add('ร้านค้า', 'อาหารสัตว์เลี้ยง', f)
for (const g of GEAR) add('ร้านค้า', `ไอเทมแต่งตัว (${g.slot})`, g)
for (const q of Object.values(quests).flatMap((v) => (Array.isArray(v) ? v : []))) if (q.ko) add('ภารกิจ/ความสำเร็จ', 'ภารกิจรายวัน', q)
for (const a of ACHIEVEMENTS) add('ภารกิจ/ความสำเร็จ', 'ความสำเร็จ', a)
for (const t of TRICKS) add('สัตว์เลี้ยง', 'คำสั่งสอนสัตว์เลี้ยง', t)
for (const e of EGG_PHRASES) add('สัตว์เลี้ยง', 'คำพูดกับไข่', e)
for (const [k, m] of Object.entries(MOOD_TEXT)) add('สัตว์เลี้ยง', `อารมณ์สัตว์เลี้ยง (${k})`, m)
for (const s of SPECIES_LIST) { add('สัตว์เลี้ยง', 'ชื่อสายพันธุ์', s); add('สัตว์เลี้ยง', 'เสียงร้อง', { ko: s.sound.ko, read: s.sound.read, th: s.sound.th }) }
const sp = SPECIES_LIST[0]
const fill = (t = '') => t.replaceAll('{pet}', sp.name).replaceAll('{sound}', sp.sound.ko).replaceAll('{soundRead}', sp.sound.read)
const WHO = { narr: 'ผู้เล่าเรื่อง', gran: 'คุณยาย', vendor: 'แม่ค้า', me: 'ผู้เล่น', pet: 'สัตว์เลี้ยง' }
const seen = new Set()
for (const part of ALL_PARTS) {
  const scenes = typeof part.scenes === 'function' ? part.scenes(sp.id) : part.scenes
  scenes.forEach((sc, i) => {
    const where = `เรื่อง · ${part.title} (${part.th}) · ฉาก ${i + 1}`
    const push = (kind, o, who) => { const key = kind + '|' + o.ko; if (seen.has(key)) return; seen.add(key); add('เรื่องราว', where + (kind === 'vocab' ? ' · คำศัพท์' : kind === 'option' ? ' · ตัวเลือกผู้เล่น' : kind === 'reply' ? ' · คำตอบตัวละคร' : ''), { who: WHO[who] || who || '', ko: fill(o.ko), read: fill(o.read || ''), th: fill(o.th || ''), note: kind === 'option' && o.ok === false ? 'ตัวเลือกที่ "ผิด" ในโจทย์' : '' }) }
    push('line', sc, sc.who)
    for (const v of sc.vocab || []) push('vocab', { ko: v.ko, th: v.th })
    for (const o of sc.options || []) { push('option', o, 'me'); if (o.reply) push('reply', o.reply, o.reply.who); for (const v of o.vocab || []) push('vocab', { ko: v.ko, th: v.th }) }
  })
}
fs.writeFileSync(process.argv[2], JSON.stringify(rows))
const c = {}; rows.forEach((r) => (c[r.sheet] = (c[r.sheet] || 0) + 1)); console.log(rows.length, c)
