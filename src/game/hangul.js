// ประกอบ/แยกพยางค์ฮันกึลด้วยสูตร Unicode: 0xAC00 + (초성*21 + 중성)*28 + 종성
export const LEAD = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']
export const VOWEL = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ']
export const TAIL = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']

export const isSyllable = (ch) => !!ch && ch.length === 1 && ch >= '가' && ch <= '힣'

export function decompose(ch) {
  const n = ch.charCodeAt(0) - 0xac00
  return { l: Math.floor(n / 588), v: Math.floor((n % 588) / 28), t: n % 28 }
}

export function compose(l, v, t = 0) {
  return String.fromCharCode(0xac00 + (l * 21 + v) * 28 + t)
}

const shuffle = (a) => [...a].sort(() => Math.random() - 0.5)

// ตัวเลือก n ตัวที่มี "ตัวจริง" รวมอยู่ด้วย (index ใน list) และสลับตำแหน่งแล้ว
export function choices(list, answerIdx, n, pool = list.map((_, i) => i)) {
  const others = shuffle(pool.filter((i) => i !== answerIdx)).slice(0, n - 1)
  return shuffle([answerIdx, ...others])
}

// พยัญชนะ/สระ/ตัวสะกดที่พบบ่อยสำหรับตัวเลือกหลอก
export const COMMON_LEAD = [0, 2, 3, 5, 6, 7, 9, 11, 12, 14, 15, 16, 17, 18]
export const COMMON_VOWEL = [0, 4, 8, 13, 18, 20, 2, 6, 12, 17]
export const COMMON_TAIL = [1, 4, 7, 8, 16, 17, 21] // ㄱ ㄴ ㄷ ㄹ ㅁ ㅂ ㅇ
