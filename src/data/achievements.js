// ความสำเร็จ: ปลดล็อกอัตโนมัติเมื่อเงื่อนไขครบ (ตรวจหลังทุก action) ได้เหรียญ และบางข้อได้ไอเทมพิเศษ
import { levelInfo, stageFor } from '../game/logic.js'
import { ROUTINE } from './routine.js'
import { GEAR, SETS, rarityOf } from './shop.js'

const HANGUL = ['vowels', 'consonants1', 'consonants2']

export const ACHIEVEMENTS = [
  { id: 'first_lesson', icon: '📖', ko: '첫 수업', th: 'เรียนจบบทแรก', coins: 20, check: (s) => Object.keys(s.lessons).length >= 1 },
  { id: 'hangul_done', icon: '🔤', ko: '한글 졸업', th: 'จบบทฮันกึลครบทั้ง 3 บท', coins: 60, check: (s) => HANGUL.every((id) => s.lessons[id]) },
  { id: 'perfect', icon: '🌟', ko: '만점!', th: 'ได้คะแนนเต็มในบทเรียน', coins: 40, check: (s) => Object.values(s.lessons).some((l) => l.best >= 100) },
  { id: 'words30', icon: '📚', ko: '단어 30개', th: 'เก็บคำศัพท์ได้ 30 คำ', coins: 40, check: (s) => Object.keys(s.srs).length >= 30 },
  { id: 'words100', icon: '🎓', ko: '단어 100개', th: 'เก็บคำศัพท์ได้ 100 คำ', coins: 120, check: (s) => Object.keys(s.srs).length >= 100 },
  { id: 'first_speak', icon: '🎤', ko: '첫 발음', th: 'พูดตามผ่านครั้งแรก', coins: 30, check: (s) => (s.stats.spoken || 0) >= 1 },
  { id: 'speak50', icon: '🗣️', ko: '말하기 달인', th: 'พูดตามผ่านครบ 50 ประโยค', coins: 120, check: (s) => (s.stats.spoken || 0) >= 50 },
  { id: 'streak3', icon: '🔥', ko: '3일 연속', th: 'เล่นต่อเนื่อง 3 วัน', coins: 30, check: (s) => (s.streak.best || 0) >= 3 },
  { id: 'streak7', icon: '🏅', ko: '7일 연속', th: 'เล่นต่อเนื่อง 7 วัน', coins: 80, item: 'neck_medal', check: (s) => (s.streak.best || 0) >= 7 },
  { id: 'streak30', icon: '👑', ko: '30일 연속', th: 'เล่นต่อเนื่อง 30 วัน', coins: 300, check: (s) => (s.streak.best || 0) >= 30 },
  { id: 'hatch', icon: '🐣', ko: '알이 깼어요', th: 'ฟักไข่ 범이 สำเร็จ', coins: 30, check: (s) => stageFor(s.pet.growth).id !== 'egg' },
  { id: 'adult', icon: '🐯', ko: '멋진 범', th: 'เลี้ยง 범이 จนโตเต็มวัย', coins: 150, item: 'hat_tiger', check: (s) => stageFor(s.pet.growth).id === 'adult' },
  { id: 'level5', icon: '⭐', ko: 'Lv.5', th: 'ถึงเลเวล 5', coins: 50, check: (s) => levelInfo(s.player.xp).level >= 5 },
  { id: 'level10', icon: '🌠', ko: 'Lv.10', th: 'ถึงเลเวล 10', coins: 150, check: (s) => levelInfo(s.player.xp).level >= 10 },
  { id: 'shopper', icon: '🛍️', ko: '쇼핑왕', th: 'มีไอเทมครบ 15 ชิ้น', coins: 40, check: (s) => s.player.owned.length >= 15 },
  { id: 'collector30', icon: '🧺', ko: '수집가', th: 'สะสมไอเทมครบ 30 ชิ้น', coins: 100, check: (s) => s.player.owned.length >= 30 },
  { id: 'collector60', icon: '🏛️', ko: '대수집가', th: 'สะสมไอเทมครบ 60 ชิ้น', coins: 250, check: (s) => s.player.owned.length >= 60 },
  { id: 'legend1', icon: '💎', ko: '전설 획득', th: 'ได้ไอเทมระดับตำนานชิ้นแรก', coins: 80, check: (s) => s.player.owned.some((id) => GEAR.find((g) => g.id === id && rarityOf(g) === 'legendary')) },
  {
    id: 'routine_all', icon: '✅', ko: '루틴 완료', th: 'ติ๊กกิจวัตรครบทุกข้อในวันเดียว', coins: 40,
    check: (s) => {
      const off = s.player.routineOff || []
      const active = ROUTINE.filter((r) => !off.includes(r.id))
      return active.length > 0 && active.every((r) => s.daily.routine.includes(r.id))
    },
  },
  { id: 'quests_all', icon: '🎯', ko: '퀘스트 완료', th: 'รับภารกิจประจำวันครบทุกข้อ', coins: 40, check: (s) => (s.daily.quests || []).length > 0 && (s.daily.claimed || []).length >= (s.daily.quests || []).length },
  { id: 'syllable', icon: '🧩', ko: '글자 장인', th: 'ประกอบพยางค์ผ่านครบโควตาวันหนึ่ง', coins: 30, check: (s) => (s.daily.syllable || 0) >= 6 },
]
// ชุดสะสม: ครบทั้งชุดได้เหรียญโบนัส (สร้างจาก SETS อัตโนมัติ)
for (const set of SETS) {
  ACHIEVEMENTS.push({
    id: `set_${set.id}`, kind: 'set', icon: set.icon, ko: `${set.ko} 세트`, th: `สะสมครบชุด ${set.th} (${set.items.length} ชิ้น)`, coins: set.coins,
    check: (s) => set.items.every((id) => s.player.owned.includes(id)),
  })
}

export const ACH_BY_ID = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]))
