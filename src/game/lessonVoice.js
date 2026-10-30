// เสียงอ่านของเนื้อหาบทเรียนและข้อความทั่วไปในแอป: ใช้เสียงครู (Supertonic, ไฟล์สำเร็จรูป) ถ้ามี ไม่มีก็ถอยไปใช้ Web Speech ในเครื่อง
// ผู้เล่นเลือกแหล่งเสียงได้ใน ⚙ ตั้งค่า (tts prefs: source = 'ai' | 'device')
import { speak as deviceSpeak, speakFor as deviceSpeakFor, speakSeq as deviceSpeakSeq, getTtsPrefs } from './tts.js'
import { preloadVoices, voiceFile, voicesReady, stopVoice } from './voices.js'

if (typeof window !== 'undefined') preloadVoices() // โหลดรายการไฟล์เสียงไว้ก่อน จะได้เล่นได้ทันทีตอนผู้เล่นแตะ

let token = 0
let clip = null
const useAi = () => getTtsPrefs().source !== 'device'
const SLOW_BELOW = 0.7 // โค้ดเดิมเรียก speak(text, 0.55) สำหรับปุ่มช้า → ตีความว่า "ช้า"

function stopClip() {
  if (clip) { try { clip.pause() } catch { /* ignore */ } clip = null }
}

// เล่นไฟล์ต่อกันเป็นชุด (เว้นช่วง gap ms) · ถ้าเล่นไม่ได้ (เบราว์เซอร์ไม่อนุญาต/ไฟล์เสีย) เรียก fallback เพื่อใช้เสียงในเครื่องแทน
function playClips(files, gap, fallback) {
  const t = ++token
  stopVoice()
  stopClip()
  const run = (i) => {
    if (t !== token || i >= files.length) return
    const a = new Audio(files[i])
    clip = a
    a.onended = () => { if (t === token && i + 1 < files.length) setTimeout(() => run(i + 1), gap) }
    a.onerror = () => { if (t === token && i === 0) fallback() }
    a.play().catch(() => { if (t === token && i === 0) fallback() })
  }
  run(0)
}

const whenReady = (fn) => { if (voicesReady()) return false; preloadVoices().then(fn); return true }

export function speak(text, rate) {
  if (!text) return
  if (useAi()) {
    if (whenReady(() => speak(text, rate))) return
    const slow = typeof rate === 'number' && rate < SLOW_BELOW
    const f = voiceFile(slow ? 'teacher_slow' : 'teacher', text)
    if (f) { playClips([f], 0, () => deviceSpeak(text, rate)); return }
  }
  token++; stopClip()
  deviceSpeak(text, rate)
}

// ไอเทมของบทเรียน: ตัวอักษรเล่นเป็นชุด (ชื่อ → พยางค์ → คำตัวอย่าง) · quiz=true ไม่อ่านชื่อตัวอักษร (ไม่เฉลยเกินไป)
export function speakFor(item, opts = {}) {
  if (!item) return
  const { slow = false, quiz = false } = opts
  if (useAi()) {
    if (whenReady(() => speakFor(item, opts))) return
    const who = slow ? 'teacher_slow' : 'teacher'
    const texts = []
    if (item.kind === 'letter') {
      const name = /\(([^)]+)\)/.exec(item.th || '')?.[1]
      if (name && !quiz) texts.push(name)
      texts.push(item.speak || item.ko)
      if (item.ex) texts.push(item.ex.ko)
    } else texts.push(item.speak || item.ko)
    const files = texts.map((t) => voiceFile(who, t))
    if (files.every(Boolean)) { playClips(files, slow ? 750 : 480, () => deviceSpeakFor(item, opts)); return }
  }
  token++; stopClip()
  deviceSpeakFor(item, opts)
}

// อ่านเป็นชุดข้อความสั้น ๆ (ใช้ทดสอบเสียงและสั่งคำสั่งสัตว์เลี้ยง) · มีไฟล์ครบทุกชิ้นถึงใช้ AI ไม่ครบใช้เสียงในเครื่อง
export function speakSeq(parts, opts = {}) {
  if (!parts?.length) return
  if (useAi()) {
    if (whenReady(() => speakSeq(parts, opts))) return
    const files = parts.map((t) => voiceFile(opts.slow ? 'teacher_slow' : 'teacher', t))
    if (files.every(Boolean)) { playClips(files, opts.gap ?? (opts.slow ? 750 : 480), () => deviceSpeakSeq(parts, opts)); return }
  }
  token++; stopClip()
  deviceSpeakSeq(parts, opts)
}
