// อ่านออกเสียงภาษาเกาหลีด้วย Web Speech API (ทำงานออฟไลน์ได้ถ้าเครื่องมีเสียงเกาหลี)
const PREF_KEY = 'hb-tts'
const DEFAULT_PREFS = { voice: null, rate: 0.85 }
let prefs = { ...DEFAULT_PREFS }
try { prefs = { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(PREF_KEY) || '{}') } } catch { /* ignore */ }

let koVoice = null
let current = null // เก็บ utterance ไว้ไม่ให้ถูก GC ก่อนอ่านจบ (บั๊กของ Chrome/Android)
let pendingTimer = null
let seqToken = 0 // เพิ่มทุกครั้งที่สั่งอ่านใหม่ เพื่อยกเลิกชุดเสียงที่ยังเล่นค้างอยู่

const supported = () => typeof window !== 'undefined' && 'speechSynthesis' in window
const isKo = (v) => v.lang?.replace('_', '-').toLowerCase().startsWith('ko')

function pickVoice() {
  if (!supported()) return
  const voices = window.speechSynthesis.getVoices()
  if (!voices.length) return
  const saved = prefs.voice && voices.find((v) => v.name === prefs.voice && isKo(v))
  koVoice = saved
    || voices.find((v) => v.lang === 'ko-KR' && /yuna|google|female|heami|sora/i.test(v.name))
    || voices.find(isKo) || null
}

if (supported()) {
  pickVoice()
  window.speechSynthesis.addEventListener?.('voiceschanged', pickVoice)
  window.speechSynthesis.onvoiceschanged = pickVoice
}

export const canSpeak = supported

// ───── การตั้งค่าเสียง (เก็บในเครื่อง) ─────
export const getTtsPrefs = () => ({ ...prefs })
export function setTtsPrefs(patch) {
  prefs = { ...prefs, ...patch }
  try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)) } catch { /* ignore */ }
  koVoice = null
  pickVoice()
}
export const listKoVoices = () => (supported() ? window.speechSynthesis.getVoices().filter(isKo) : [])
export const currentVoiceName = () => { if (!koVoice) pickVoice(); return koVoice?.name || null }
// ความเร็วแบบ "ช้า" อิงจากความเร็วที่ผู้เล่นตั้งไว้
export const slowRate = () => Math.max(0.5, Math.round(prefs.rate * 0.62 * 100) / 100)

let watchdog = null
let noVoiceNotified = false

// แจ้งแอปให้โชว์ข้อความเตือน (reason: 'stuck' = engine ค้าง, 'no-voice' = ไม่มีเสียงเกาหลีในเครื่อง)
function notify(reason) {
  try { window.dispatchEvent(new CustomEvent('tts-problem', { detail: reason })) } catch { /* ignore */ }
}

// onDone: เรียกเมื่ออ่านจบ (หรือเลิกอ่าน) เพียงครั้งเดียว — ใช้ต่อคิวในชุดเสียง
function say(text, rate, retries = 1, onDone, opts = {}) {
  const synth = window.speechSynthesis
  if (!koVoice) pickVoice() // เสียงอาจโหลดช้า ลองเลือกใหม่ทุกครั้งที่ยังไม่มี
  if (!koVoice && !noVoiceNotified && synth.getVoices().length) { noVoiceNotified = true; notify('no-voice') }
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'ko-KR'
  u.rate = rate
  u.pitch = opts.pitch ?? 1
  if (opts.voice || koVoice) u.voice = opts.voice || koVoice
  let started = false
  u.onstart = () => { started = true; clearTimeout(watchdog) }
  u.onend = u.onerror = () => {
    if (u.__retired) return // utterance ที่ถูกยกเลิกเพราะ watchdog ลองใหม่: ไม่ต้องนับว่าจบ
    clearTimeout(watchdog)
    if (current === u) current = null
    onDone?.()
  }
  current = u
  if (synth.paused) synth.resume()
  synth.speak(u)
  // บางครั้ง engine ค้าง (speaking=true แต่ไม่เริ่มอ่านเลย) -> ล้างคิวแล้วลองใหม่
  clearTimeout(watchdog)
  watchdog = setTimeout(() => {
    if (started || current !== u) return
    u.__retired = true
    synth.cancel()
    if (retries <= 0) { notify('stuck'); onDone?.(); return }
    pendingTimer = setTimeout(() => { try { say(text, rate, retries - 1, onDone, opts) } catch { /* ignore */ } }, 150)
  }, 1200)
}

export function speak(text, rate = prefs.rate, opts = {}, onDone) {
  if (!supported() || !text) { onDone?.(); return }
  if (opts.rateMul) rate = Math.max(0.5, Math.min(1.6, rate * opts.rateMul))
  seqToken++ // ยกเลิกชุดเสียงที่ค้างอยู่
  try {
    const synth = window.speechSynthesis
    clearTimeout(pendingTimer)
    if (synth.speaking || synth.pending) {
      // cancel() แล้ว speak() ทันที เสียงใหม่จะถูกกลืน -> เว้นช่วงสั้น ๆ ให้คิวเคลียร์ก่อน
      synth.cancel()
      pendingTimer = setTimeout(() => { try { say(text, rate, 1, onDone, opts) } catch { /* ignore */ } }, 80)
    } else {
      say(text, rate, 1, onDone, opts) // เรียกทันทีตอนอยู่ใน user gesture (iOS ต้องการ)
    }
  } catch { /* ignore */ }
}

// อ่านเป็นชุด เว้นช่วงระหว่างกัน (เสียงสั้น ๆ ที่ใกล้กันจะแยกออกง่ายขึ้นเมื่อมีจังหวะและบริบท)
export function speakSeq(parts, { slow = false, gap } = {}) {
  if (!supported() || !parts.length) return
  const token = ++seqToken
  const rate = slow ? slowRate() : prefs.rate
  const pause = gap ?? (slow ? 750 : 480)
  clearTimeout(pendingTimer)
  const synth = window.speechSynthesis
  const wasBusy = synth.speaking || synth.pending
  if (wasBusy) synth.cancel()
  const run = (i) => {
    if (token !== seqToken || i >= parts.length) return
    say(parts[i], rate, 1, () => { if (token === seqToken && i + 1 < parts.length) setTimeout(() => run(i + 1), pause) })
  }
  if (wasBusy) pendingTimer = setTimeout(() => run(0), 80)
  else run(0) // เริ่มทันทีตอนอยู่ใน user gesture (iOS ต้องการ)
}

// อ่านไอเทมของแอป: ตัวอักษรอ่านเป็นชุด (ชื่อ → พยางค์ → คำตัวอย่าง) ส่วนคำ/ประโยคอ่านตามปกติ
// quiz=true: ในโจทย์ฟังเสียงไม่อ่านชื่อตัวอักษรเพื่อไม่ให้เฉลยเกินไป อ่านแค่พยางค์ → คำตัวอย่าง
export function speakFor(item, { slow = false, quiz = false } = {}) {
  if (!item) return
  if (item.kind === 'letter') {
    const parts = []
    const name = /\(([^)]+)\)/.exec(item.th || '')?.[1] // ชื่อตัวอักษร เช่น 기역 จาก "พยัญชนะ ㄱ (기역)"
    if (name && !quiz) parts.push(name)
    parts.push(item.speak || item.ko)
    if (item.ex) parts.push(item.ex.ko)
    speakSeq(parts, { slow })
  } else {
    speak(item.speak || item.ko, slow ? slowRate() : undefined)
  }
}

export const hasKoreanVoice = () => { if (!koVoice) pickVoice(); return !!koVoice }

// เสียงเกาหลีทั้งหมดในเครื่อง เรียงให้เสียงที่ผู้เล่นเลือกไว้มาก่อน (ใช้แจกเสียงต่างกันให้ตัวละครแต่ละคน)
export function voicesForCast() {
  const all = listKoVoices()
  const first = prefs.voice && all.find((v) => v.name === prefs.voice)
  return first ? [first, ...all.filter((v) => v !== first)] : all
}
export const stopSpeaking = () => { if (supported()) { seqToken++; clearTimeout(pendingTimer); try { window.speechSynthesis.cancel() } catch { /* ignore */ } } }
