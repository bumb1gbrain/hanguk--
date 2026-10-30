// ความผูกพันกับสัตว์เลี้ยง + คำสั่งภาษาเกาหลีที่สอนได้ (ใช้ประโยคคำสั่งแบบกันเอง 반말 เหมือนที่เรียกสัตว์เลี้ยงจริง)
// ได้ความผูกพันจากการดูแล/เล่น/กอด/สอนคำสั่ง (เพดานต่อวัน) ยิ่งสูงยิ่งปลดล็อกคำสั่งใหม่
export const BOND_STEPS = [0, 15, 40, 80, 140, 220] // คะแนนสะสมที่ต้องใช้เพื่อถึงระดับ 0..5
export const BOND_DAILY_CAP = 30
export const BOND_LEVEL_COINS = 10 // โบนัสเหรียญทุกครั้งที่เลื่อนระดับ

export function bondInfo(bond = 0) {
  let level = 0
  for (let i = 0; i < BOND_STEPS.length; i++) if (bond >= BOND_STEPS[i]) level = i
  const max = level >= BOND_STEPS.length - 1
  const cur = BOND_STEPS[level]
  const nxt = BOND_STEPS[level + 1]
  return { level, max, into: bond - cur, need: max ? 1 : nxt - cur }
}

// anim = ชื่อแอนิเมชันใน styles.css (trick-*) · level = ระดับความผูกพันที่ต้องถึง
export const TRICKS = [
  { id: 'sit', ko: '앉아', read: 'อันจา', th: 'นั่ง', level: 0, anim: 'sit', icon: '🪑' },
  { id: 'jump', ko: '점프', read: 'จอมพือ', th: 'กระโดด', level: 0, anim: 'jump', icon: '⬆️' },
  { id: 'paw', ko: '손', read: 'ซน', th: 'ยื่นมือ (จับมือ)', level: 1, anim: 'paw', icon: '🤝' },
  { id: 'down', ko: '엎드려', read: 'ออบตือรยอ', th: 'หมอบ', level: 1, anim: 'down', icon: '⬇️' },
  { id: 'spin', ko: '돌아', read: 'โดรา', th: 'หมุนตัว', level: 2, anim: 'spin', icon: '🔄' },
  { id: 'roll', ko: '굴러', read: 'กุลลอ', th: 'กลิ้ง', level: 2, anim: 'roll', icon: '🌀' },
  { id: 'dance', ko: '춤춰', read: 'ชุมชวอ', th: 'เต้น', level: 3, anim: 'dance', icon: '💃' },
  { id: 'sleep', ko: '자', read: 'จา', th: 'นอน', level: 4, anim: 'nap', icon: '😴' },
]
export const TRICK_BY_ID = Object.fromEntries(TRICKS.map((t) => [t.id, t]))

// พูดกับไข่: ไข่ยังทำท่าไม่ได้ จึงให้ผู้เล่น "ทักทาย" เป็นภาษาเกาหลีแทน (วันละ EGG_TALK_CAP ครั้ง) — เสียงใช้คลิปครูที่มีอยู่แล้ว
export const EGG_TALK_CAP = 3
export const EGG_PHRASES = [
  { ko: '안녕하세요', read: 'อันนยองฮาเซโย', th: 'สวัสดี' },
  { ko: '좋은 아침이에요', read: 'โจอึน อาชีมีเอโย', th: 'อรุณสวัสดิ์' },
  { ko: '괜찮아요', read: 'แควนชานาโย', th: 'ไม่เป็นไรนะ' },
  { ko: '사랑해', read: 'ซารังแฮ', th: 'รักนะ' },
  { ko: '잘 자요', read: 'ชัล จาโย', th: 'หลับฝันดี' },
]
