// ภารกิจประจำวัน — แต่ละวันสุ่มมา 3 ข้อจากวันที่ (เหมือนกันทั้งวัน) รับรางวัลได้ครั้งเดียวต่อข้อ
// ความคืบหน้าอ่านจากข้อมูลรายวันที่มีอยู่แล้ว จึงเล่นซ้ำปั๊มไม่ได้
export const QUEST_ALL_BONUS = 15 // เหรียญโบนัสเมื่อรับครบทุกข้อ

export const QUESTS = [
  { id: 'lesson', icon: '📖', ko: '수업 1개 끝내기', th: 'เรียนจบ 1 บทวันนี้', target: 1, xp: 10, coins: 6 },
  { id: 'review', icon: '🔁', ko: '복습 5개 맞히기', th: 'ทบทวนตอบถูก 5 คำ', target: 5, xp: 8, coins: 5 },
  { id: 'syllable', icon: '🧩', ko: '글자 3개 만들기', th: 'ประกอบพยางค์ให้ถูก 3 คำ', target: 3, xp: 8, coins: 5 },
  { id: 'routine', icon: '✅', ko: '루틴 3개 하기', th: 'ติ๊กกิจวัตรจริง 3 ข้อ', target: 3, xp: 6, coins: 5 },
  { id: 'perfect', icon: '🌟', ko: '만점 받기', th: 'ทำแบบทดสอบบทเรียนได้คะแนนเต็ม 1 ครั้ง', target: 1, xp: 10, coins: 8 },
  { id: 'speak', icon: '🎤', ko: '말하기 3번', th: 'พูดตามให้ผ่าน 3 ประโยค', target: 3, xp: 8, coins: 5 },
  { id: 'care', icon: '🐯', ko: '범이 돌보기 3번', th: 'ดูแล 범이 3 ครั้ง (ให้อาหาร/เล่น/อาบน้ำ)', target: 3, xp: 6, coins: 4 },
]

export const QUEST_BY_ID = Object.fromEntries(QUESTS.map((q) => [q.id, q]))

// เลือก 3 ข้อจากวันที่ (คงที่ทั้งวัน เพราะบันทึกลง daily.quests ตอนเปิดวัน)
// ภารกิจ "ทบทวน" จะไม่ถูกสุ่มถ้ามีคำถึงกำหนดน้อยกว่าเป้า (กันภารกิจที่ทำไม่ได้ เช่นวันแรก)
export function pickQuestIds(date, { dueCount = 0, listen = false } = {}) {
  let seed = 0
  for (const ch of date) seed = (seed * 31 + ch.charCodeAt(0)) % 9973
  const pool = QUESTS.filter((q) => (q.id !== 'review' || dueCount >= q.target) && (q.id !== 'speak' || listen)) // speak ต้องมีไมค์/การรู้จำเสียง
  const out = []
  for (let i = 0; i < 3; i++) {
    seed = (seed * 7 + 13) % 9973
    out.push(pool.splice(seed % pool.length, 1)[0].id)
  }
  return out
}

export function questProgress(q, s) {
  const d = s.daily
  let n = 0
  if (q.id === 'lesson') n = Object.keys(d.lessons || {}).length
  else if (q.id === 'review') n = (d.reviewed || []).length
  else if (q.id === 'syllable') n = d.syllable || 0
  else if (q.id === 'routine') n = d.routine.length
  else if (q.id === 'perfect') n = d.perfect || 0
  else if (q.id === 'speak') n = d.speaking || 0
  else if (q.id === 'care') n = d.care || 0
  return Math.min(n, q.target)
}
