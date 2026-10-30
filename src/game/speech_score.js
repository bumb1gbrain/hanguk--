// ตรวจคำพูดเกาหลี: เทียบ "ข้อความที่ระบบฟังได้" กับ "ประโยคเป้าหมาย"
// ใช้ได้เฉพาะข้อความ (Web Speech API ไม่ให้เสียงดิบ/คะแนนออกเสียง) จึงบอกได้ว่า "ฟังแล้วเป็นคำที่ตั้งใจหรือไม่"
// ไม่ได้ประเมินสำเนียงละเอียด — ดูหมายเหตุใน CLAUDE.md
import { LEAD, VOWEL, TAIL, isSyllable, decompose } from './hangul.js'

// เกณฑ์ผ่านตามระดับความเข้มงวด (ค่าเริ่มต้น = มาตรฐาน 80 ซึ่งเข้มกว่าเดิมที่ 70)
export const LEVELS = {
  standard: { pass: 80, great: 92, th: 'มาตรฐาน' },
  strict: { pass: 90, great: 96, th: 'เข้มงวด' },
}
export const PASS_SCORE = LEVELS.standard.pass

// ───────── ตัวเลข: ระบบรู้จำมักพิมพ์เป็นเลขอารบิก ('3시') ต้องแปลงกลับเป็นคำก่อนเทียบ ─────────
const SINO = ['영', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구']
const NATIVE = ['', '하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉']
const NATIVE_TENS = ['', '열', '스물', '서른', '마흔', '쉰', '예순', '일흔', '여든', '아흔']
const NATIVE_COUNTERS = '시개명잔살마리권장병대번' // ตัวนับที่ใช้เลขเกาหลีแท้ (ส่วนวัน เงิน นาที ใช้เลขจีน-เกาหลี)

export function sinoNumber(n) {
  if (n === 0) return SINO[0]
  let out = ''
  const units = [[1000, '천'], [100, '백'], [10, '십']]
  let rest = n
  for (const [u, name] of units) {
    const d = Math.floor(rest / u)
    rest %= u
    if (d > 0) out += (d === 1 ? '' : SINO[d]) + name
  }
  if (rest > 0) out += SINO[rest]
  return out
}

// contracted=true: ใช้รูปย่อหน้าตัวนับ (한, 두, 세, 네, 스무)
export function nativeNumber(n, contracted) {
  if (n < 1 || n > 99) return null
  const tens = Math.floor(n / 10)
  const ones = n % 10
  if (contracted) {
    if (n === 20) return '스무'
    if (ones >= 1 && ones <= 4) return NATIVE_TENS[tens] + ['', '한', '두', '세', '네'][ones]
  }
  return NATIVE_TENS[tens] + NATIVE[ones]
}

// คืนรายการข้อความที่เป็นไปได้ (ต้นฉบับ + แปลงเลขแบบฉลาด + แปลงเลขจีน-เกาหลีล้วน)
export function expandNumerals(text) {
  const clean = text.replace(/(\d),(\d)/g, '$1$2')
  if (!/\d/.test(clean)) return [text]
  const smart = clean.replace(/(\d+)(\s*)([^\d\s]?)/g, (m, num, sp, next) => {
    const n = Number(num)
    const native = NATIVE_COUNTERS.includes(next) ? nativeNumber(n, true) : null
    return (native ?? sinoNumber(n)) + sp + next
  })
  const allSino = clean.replace(/\d+/g, (num) => sinoNumber(Number(num)))
  return [...new Set([text, smart, allSino])]
}

// ───────── ลดรูปเป็นพยางค์ฮันกึลล้วน ─────────
export function syllablesOf(text) {
  return [...text.normalize('NFC')].filter(isSyllable)
}

// ───────── ถอดเสียง (ประมาณ): ตัวสะกดไม่ออกเสียงตามตัวเขียน + เชื่อมเสียง (연음) ─────────
const SPLIT = { ㄳ: ['ㄱ', 'ㅅ'], ㄵ: ['ㄴ', 'ㅈ'], ㄶ: ['ㄴ', 'ㅎ'], ㄺ: ['ㄹ', 'ㄱ'], ㄻ: ['ㄹ', 'ㅁ'], ㄼ: ['ㄹ', 'ㅂ'], ㄽ: ['ㄹ', 'ㅅ'], ㄾ: ['ㄹ', 'ㅌ'], ㄿ: ['ㄹ', 'ㅍ'], ㅀ: ['ㄹ', 'ㅎ'], ㅄ: ['ㅂ', 'ㅅ'] }
const NEUTRAL = { ㄲ: 'ㄱ', ㅋ: 'ㄱ', ㅅ: 'ㄷ', ㅆ: 'ㄷ', ㅈ: 'ㄷ', ㅊ: 'ㄷ', ㅌ: 'ㄷ', ㅎ: 'ㄷ', ㅍ: 'ㅂ' }
const SILENT_LEAD = 11 // ㅇ ต้นพยางค์

export function phoneticTokens(syls) {
  const parts = syls.map((ch) => {
    const d = decompose(ch)
    return { l: d.l, v: d.v, t: TAIL[d.t] }
  })
  parts.forEach((p, i) => {
    const next = parts[i + 1]
    if (!p.t) return
    if (next && next.l === SILENT_LEAD && p.t !== 'ㅇ') {
      // 연음: ตัวสะกดย้ายไปเป็นพยัญชนะต้นของพยางค์ถัดไป
      if (SPLIT[p.t]) {
        const [a, b] = SPLIT[p.t]
        p.t = a
        next.l = b === 'ㅎ' ? SILENT_LEAD : LEAD.indexOf(b)
      } else if (p.t === 'ㅎ') {
        p.t = ''
      } else {
        next.l = LEAD.indexOf(p.t)
        p.t = ''
      }
      if (next.l < 0) next.l = SILENT_LEAD
      // 구개음화: ㄷ/ㅌ ที่ย้ายมาหน้าสระ ㅣ ออกเสียงเป็น ㅈ/ㅊ (같이 → 가치)
      if (next.v === VOWEL.indexOf('ㅣ')) {
        if (next.l === LEAD.indexOf('ㄷ')) next.l = LEAD.indexOf('ㅈ')
        else if (next.l === LEAD.indexOf('ㅌ')) next.l = LEAD.indexOf('ㅊ')
      }
    }
    if (p.t && SPLIT[p.t]) p.t = SPLIT[p.t][0] // ตัวสะกดคู่: ออกเสียงตัวแรก (ประมาณ)
    if (p.t && NEUTRAL[p.t]) p.t = NEUTRAL[p.t]
  })
  const out = []
  for (const p of parts) {
    if (p.l !== SILENT_LEAD) out.push(LEAD[p.l])
    out.push(VOWEL[p.v])
    if (p.t) out.push(p.t)
  }
  return out
}

// ตัวอักษรย่อย (jamo) ตามที่เขียน
export function orthoTokens(syls) {
  const out = []
  for (const ch of syls) {
    const d = decompose(ch)
    out.push(LEAD[d.l], VOWEL[d.v])
    if (d.t) out.push(TAIL[d.t])
  }
  return out
}

export function levenshtein(a, b) {
  const m = a.length
  const n = b.length
  if (!m) return n
  if (!n) return m
  let prev = Array.from({ length: n + 1 }, (_, j) => j)
  for (let i = 1; i <= m; i++) {
    const cur = [i]
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    prev = cur
  }
  return prev[n]
}

const ratio = (a, b) => (a.length === 0 && b.length === 0 ? 0 : Math.max(0, 1 - levenshtein(a, b) / Math.max(a.length, b.length)))

// ───────── จัดแนวพยางค์เป้าหมายกับที่ได้ยิน (Needleman–Wunsch) เพื่อบอกว่า "พยางค์ไหนผิด และผิดส่วนไหน" ─────────
const SYL_W = { lead: 0.34, vowel: 0.4, tail: 0.26 }

function sylCost(a, b) {
  if (a === b) return 0
  const x = decompose(a)
  const y = decompose(b)
  return (x.l !== y.l ? SYL_W.lead : 0) + (x.v !== y.v ? SYL_W.vowel : 0) + (x.t !== y.t ? SYL_W.tail : 0)
}

// ส่วนที่ต่างกันของพยางค์สองตัว
function sylDiffs(t, h) {
  const x = decompose(t)
  const y = decompose(h)
  const out = []
  if (x.l !== y.l) out.push({ part: 'lead', exp: LEAD[x.l], got: LEAD[y.l] })
  if (x.v !== y.v) out.push({ part: 'vowel', exp: VOWEL[x.v], got: VOWEL[y.v] })
  if (x.t !== y.t) out.push({ part: 'tail', exp: TAIL[x.t], got: TAIL[y.t] })
  return out
}

// ops: [{ type: 'match' | 'sub' | 'miss' | 'extra', t, h, diffs?, soft? }]
export function alignSyllables(target, heard) {
  const m = target.length
  const n = heard.length
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = 1; i <= m; i++) dp[i][0] = i
  for (let j = 1; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + sylCost(target[i - 1], heard[j - 1]))
    }
  }
  const ops = []
  let i = m
  let j = n
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && Math.abs(dp[i][j] - (dp[i - 1][j - 1] + sylCost(target[i - 1], heard[j - 1]))) < 1e-9) {
      const t = target[i - 1]
      const h = heard[j - 1]
      if (t === h) ops.push({ type: 'match', t, h })
      // เสียงเดี่ยว ๆ เหมือนกันแม้เขียนต่าง (เช่น 같/갇) → ถือว่าตรง
      else if (phoneticTokens([t]).join('') === phoneticTokens([h]).join('')) ops.push({ type: 'match', t, h, soft: true })
      else ops.push({ type: 'sub', t, h, diffs: sylDiffs(t, h) })
      i--; j--
    } else if (i > 0 && Math.abs(dp[i][j] - (dp[i - 1][j] + 1)) < 1e-9) {
      ops.push({ type: 'miss', t: target[i - 1], h: null }) // ไม่ได้ยินพยางค์นี้
      i--
    } else {
      ops.push({ type: 'extra', t: null, h: heard[j - 1] }) // ได้ยินเกินมา
      j--
    }
  }
  return ops.reverse()
}

// ───────── คำอธิบายภาษาไทย ─────────
const LEAD_TH = ['ก', 'กก เน้น', 'น', 'ด', 'ต เน้น', 'ร/ล', 'ม', 'บ', 'ป เน้น', 'ซ', 'ซซ เน้น', 'เงียบ', 'จ', 'จจ เน้น', 'ช', 'ค พ่นลม', 'ท พ่นลม', 'พ พ่นลม', 'ฮ']
const VOWEL_TH = ['อา', 'แอ', 'ยา', 'แย', 'ออ', 'เอ', 'ยอ', 'เย', 'โอ', 'วา', 'แว', 'เว', 'โย', 'อู', 'วอ', 'เว', 'วี', 'ยู', 'อือ', 'อึย', 'อี']
function tailTh(ch) {
  if (!ch) return 'ไม่มีตัวสะกด'
  if (ch === 'ㅎ') return 'มักไม่ออกเสียง'
  const phon = phoneticTokensFromTail(ch)
  return { ㄱ: 'แม่กก', ㄴ: 'แม่กน', ㄷ: 'แม่กด', ㄹ: 'ล', ㅁ: 'แม่กม', ㅂ: 'แม่กบ', ㅇ: 'แม่กง' }[phon] || ch
}
function phoneticTokensFromTail(ch) {
  const first = SPLIT[ch] ? SPLIT[ch][0] : ch
  return NEUTRAL[first] || first
}

export const PART_TH = { lead: 'พยัญชนะต้น', vowel: 'สระ', tail: 'ตัวสะกด' }
const describe = (part, jamo) => (part === 'lead' ? `${jamo} (${LEAD_TH[LEAD.indexOf(jamo)]})` : part === 'vowel' ? `${jamo} (${VOWEL_TH[VOWEL.indexOf(jamo)]})` : (jamo ? `${jamo} (${tailTh(jamo)})` : tailTh(jamo)))

const LAX_GROUPS = [['ㄱ', 'ㄲ', 'ㅋ'], ['ㄷ', 'ㄸ', 'ㅌ'], ['ㅂ', 'ㅃ', 'ㅍ'], ['ㅈ', 'ㅉ', 'ㅊ'], ['ㅅ', 'ㅆ']]
const VOWEL_TIPS = [
  [['ㅓ', 'ㅗ'], 'ㅓ (ออ) อ้าปากกว้างกว่า ส่วน ㅗ (โอ) ห่อริมฝีปากกลม'],
  [['ㅡ', 'ㅜ'], 'ㅡ (อือ) ริมฝีปากแบนไม่ยื่น ส่วน ㅜ (อู) ห่อและยื่นริมฝีปาก'],
  [['ㅣ', 'ㅡ'], 'ㅣ (อี) ยิ้มกว้าง ส่วน ㅡ (อือ) ริมฝีปากแบนและลิ้นถอยหลัง'],
  [['ㅏ', 'ㅓ'], 'ㅏ (อา) อ้าปากกว้างตรง ๆ ส่วน ㅓ (ออ) ปากอ้ากลมกว่าและลิ้นยกหลังขึ้นเล็กน้อย'],
  [['ㅐ', 'ㅔ'], 'ㅐ กับ ㅔ ออกเสียงใกล้กันมาก คนเกาหลีรุ่นใหม่แทบไม่แยก ฟังบริบทประกอบ'],
  [['ㅕ', 'ㅛ'], 'ㅕ (ยอ) ปากเปิดกว้างกว่า ㅛ (โย) ที่ห่อปาก'],
]
function tipFor(d) {
  if (d.part === 'lead') {
    if (['ㅅ', 'ㅆ'].includes(d.exp) && ['ㅅ', 'ㅆ'].includes(d.got)) return 'ㅆ ให้ตึงเสียงและยืดลมซ่านานกว่า ㅅ เล็กน้อย (ซซ เน้น) · ㅅ เสียงซ่าเบากว่า'
    if (LAX_GROUPS.some((g) => g.includes(d.exp) && g.includes(d.got))) return 'ㄱ ㄷ ㅂ ㅈ ไม่พ่นลม · ㅋ ㅌ ㅍ ㅊ ต้องพ่นลมแรง (ลองเอากระดาษมาจ่อปากให้ปลิว) · ㄲ ㄸ ㅃ ㅉ ㅆ ให้ตึงเสียงในลำคอ'
    if (['ㄴ', 'ㄹ'].includes(d.exp) && ['ㄴ', 'ㄹ'].includes(d.got)) return 'ㄴ ปลายลิ้นแตะเหงือกแน่น ส่วน ㄹ ปลายลิ้นแตะเหงือกเบา ๆ (คล้าย ร/ล กลาง ๆ)'
  }
  if (d.part === 'vowel') {
    const hit = VOWEL_TIPS.find(([pair]) => pair.includes(d.exp) && pair.includes(d.got))
    if (hit) return hit[1]
  }
  if (d.part === 'tail') {
    const nasal = ['ㄴ', 'ㅇ', 'ㅁ']
    if (nasal.includes(d.exp) && nasal.includes(d.got)) return 'ㄴ = ปลายลิ้นแตะเหงือก (น) · ㅇ = โคนลิ้นแตะเพดานอ่อน (ง) · ㅁ = ปิดริมฝีปาก (ม)'
    const stops = ['ㄱ', 'ㄷ', 'ㅂ']
    if (stops.includes(phoneticTokensFromTail(d.exp)) && stops.includes(phoneticTokensFromTail(d.got || ''))) return 'ตัวสะกด ㄱ ㄷ ㅂ ปิดเสียงแล้วไม่ปล่อยลม (แม่กก/กด/กบ)'
    if (!d.got) return 'พยางค์นี้ต้องมีตัวสะกด ปิดเสียงท้ายให้ครบ'
    if (!d.exp) return 'พยางค์นี้ไม่มีตัวสะกด ปล่อยเสียงสระให้จบโดยไม่ปิดท้าย'
  }
  return null
}

// คำอธิบายของแต่ละ op สำหรับแสดงในกระดานเปรียบเทียบ
export function explainOp(op) {
  if (op.type === 'miss') return { title: `ไม่ได้ยินพยางค์ “${op.t}”`, lines: ['ลองพูดให้ครบทุกพยางค์ และอย่ากลืนเสียงท้ายประโยค'], tips: [] }
  if (op.type === 'extra') return { title: `มีเสียงเกินมา “${op.h}”`, lines: ['อาจเป็นเสียงรบกวน หรือพูดเกินจากประโยคเป้าหมาย'], tips: [] }
  const lines = op.diffs.map((d) => `${PART_TH[d.part]}: ควรเป็น ${describe(d.part, d.exp)} แต่ได้ยินเป็น ${describe(d.part, d.got)}`)
  const tips = [...new Set(op.diffs.map(tipFor).filter(Boolean))]
  return { title: `“${op.t}” ได้ยินเป็น “${op.h}”`, lines, tips }
}

// ───────── คะแนน ─────────
// 60% จากความใกล้เคียงระดับตัวอักษรย่อย (ตัวเขียน/เสียงโดยประมาณ ใช้ค่าที่สูงกว่า) + 40% จากสัดส่วนพยางค์ที่ตรงทั้งพยางค์ − โทษพยางค์เกิน
// เข้มกว่าเดิม: พลาดตัวอักษรย่อยตัวเดียวทำให้ทั้งพยางค์ไม่นับ จึงหักคะแนนหนักขึ้น
export function scoreDetail(target, heard) {
  if (!target.length || !heard.length) return { score: 0, ops: alignSyllables(target, heard) }
  let ops = alignSyllables(target, heard)
  const ortho = ratio(orthoTokens(target), orthoTokens(heard))
  const phon = ratio(phoneticTokens(target), phoneticTokens(heard))
  const contained = heard.length > target.length && heard.join('').includes(target.join(''))
  if (phon === 1 || ortho === 1) {
    // เสียงเหมือนกันทั้งประโยค (เช่น 같이 ↔ 가치) → ทุกพยางค์ถือว่าตรง
    ops = ops.map((o) => (o.type === 'sub' ? { type: 'match', t: o.t, h: o.h, soft: true } : o))
    return { score: 100, ops: ops.filter((o) => o.type !== 'extra' || !contained) }
  }
  if (contained) return { score: 95, ops }
  const matched = ops.filter((o) => o.type === 'match').length
  const extra = ops.filter((o) => o.type === 'extra').length
  const miss = ops.filter((o) => o.type === 'miss').length
  const base = Math.max(ortho, phon) * 100
  // หักเพิ่มเมื่อพยางค์หายไป (กลืนเสียงท้าย) หรือเกินมา
  const score = 0.6 * base + 0.4 * (matched / target.length) * 100 - Math.min(15, extra * 3) - Math.min(20, miss * 4)
  return { score: Math.max(0, Math.min(100, Math.round(score))), ops }
}

export const scoreSyllables = (target, heard) => scoreDetail(target, heard).score

// ประเมินคำตอบ: alternatives = [{ text, confidence }] จาก SpeechRecognition → เลือกผู้สมัครที่ใกล้เป้าหมายที่สุด
// level: 'standard' | 'strict'
export function evaluateSpeech(targetText, alternatives, level = 'standard') {
  const cfg = LEVELS[level] || LEVELS.standard
  const target = syllablesOf(targetText)
  let best = { score: 0, heard: '', ops: alignSyllables(target, []), confidence: null }
  for (const alt of alternatives || []) {
    for (const variant of expandNumerals(alt.text || '')) {
      const heard = syllablesOf(variant)
      const d = scoreDetail(target, heard)
      if (d.score > best.score || (d.score === best.score && !best.heard)) best = { score: d.score, heard: variant.trim(), ops: d.ops, confidence: alt.confidence ?? null }
    }
  }
  const wrong = best.ops.filter((o) => o.type !== 'match')
  const explained = wrong.map((o) => ({ op: o, ...explainOp(o) }))
  const tips = [...new Set(explained.flatMap((e) => e.tips))].slice(0, 3)
  return {
    ...best,
    target,
    pass: cfg.pass,
    passed: best.score >= cfg.pass,
    great: best.score >= cfg.great,
    marks: best.ops.filter((o) => o.t).map((o) => o.type === 'match'), // ต่อพยางค์เป้าหมาย (เข้ากันได้กับโค้ดเดิม)
    problems: explained,
    tips,
  }
}
