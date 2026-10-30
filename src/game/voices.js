// เสียงพากย์: ให้ผู้พูดแต่ละคนมีเสียงของตัวเอง
// ลำดับความสำคัญ: 1) ไฟล์เสียงสำเร็จรูป (public/voice, สร้างด้วย scripts/gen-voice.mjs) 2) Web Speech พร้อมโปรไฟล์เสียง (เสียง/ระดับเสียง/ความเร็ว) 3) สัตว์เลี้ยงใช้เสียงร้องสังเคราะห์
import { speak, stopSpeaking, voicesForCast } from './tts.js'
import { playCry } from './cry.js'
import { voiceKey, voiceText } from './voiceKey.js'

// st = เสียงสำเร็จรูปจาก Supertonic 2 (M1–M5, F1–F5 หรือผสม 'M1+F5@0.5') ใช้ตอนสร้างไฟล์ด้วย scripts/gen-voice.mjs · เพิ่มตัวละครใหม่ = เพิ่มบรรทัดเดียว
// rate = ตัวคูณความเร็วจากที่ผู้เล่นตั้งไว้ · pitch = ระดับเสียง (1 = ปกติ) · slot = ลำดับเสียงในเครื่องที่แจกให้ (ถ้ามีหลายเสียง)
export const VOICE_PROFILES = {
  narr: { th: 'ผู้เล่าเรื่อง', rate: 0.95, pitch: 0.95, slot: 0, st: { voice: 'M3', speed: 1.0 } },
  gran: { th: 'คุณยาย', rate: 0.78, pitch: 0.65, slot: 1, st: { voice: 'F5', speed: 0.9 } },
  vendor: { th: 'แม่ค้า', rate: 1.05, pitch: 1.0, slot: 4, st: { voice: 'F4', speed: 1.0 } },
  teacher: { th: 'ครู (เนื้อหาบทเรียน)', rate: 1, pitch: 1, slot: 0, st: { voice: 'F1', speed: 0.9 } },
  teacher_slow: { th: 'ครู (แบบช้า)', rate: 0.7, pitch: 1, slot: 0, st: { voice: 'F1', speed: 0.7 } },
  teacher_m: { th: 'ครูมินจุน (เนื้อหาบทเรียน)', rate: 1, pitch: 1, slot: 0, st: { voice: 'M4', speed: 0.9 } },
  teacher_m_slow: { th: 'ครูมินจุน (แบบช้า)', rate: 0.7, pitch: 1, slot: 0, st: { voice: 'M4', speed: 0.7 } },
  me_f: { th: 'ผู้เล่น (หญิง)', rate: 1.0, pitch: 1.25, slot: 2, st: { voice: 'F2', speed: 1.0 } },
  me_m: { th: 'ผู้เล่น (ชาย)', rate: 1.0, pitch: 0.85, slot: 3, st: { voice: 'M1', speed: 1.0 } },
}

export const speakerKey = (who, gender) => (who === 'me' ? (gender === 'f' ? 'me_f' : 'me_m') : who)

let manifest = null // { key: 'path.mp3' }
let manifestLoading = null
export function preloadVoices() {
  if (manifest) return Promise.resolve()
  if (manifestLoading) return manifestLoading
  if (typeof fetch === 'undefined') { manifest = {}; return Promise.resolve() }
  manifestLoading = fetch('/voice/manifest.json', { cache: 'no-cache' })
    .then((r) => (r.ok ? r.json() : {}))
    .then((m) => { manifest = m && typeof m === 'object' ? m : {} })
    .catch(() => { manifest = {} })
  return manifestLoading
}

export const voicesReady = () => !!manifest
// ไฟล์เสียงสำเร็จรูปของข้อความนั้น (ถ้ามี) — speaker: teacher | teacher_slow | narr | ...
export const voiceFile = (speaker, text) => manifest?.[voiceKey(speaker, voiceText(text))] || null

let audio = null
export function stopVoice() {
  if (audio) { try { audio.pause() } catch { /* ignore */ } audio = null }
  stopSpeaking()
}

// ชื่อเสียงในเครื่องที่เหมาะกับตัวละคร (ตัวพิมพ์เล็ก/ใหญ่ไม่สำคัญ) เรียงตามความชอบ
// Apple: Grandma/Eddy/Flo/Reed/Rocko/Sandy/Shelley/Yuna (ต้องดาวน์โหลดเพิ่มในการตั้งค่าระบบ) · Edge: SunHi (หญิง) InJoon/Hyunsu (ชาย)
const PREFER = {
  narr: ['reed', 'hyunsu', 'rocko', 'injoon'],
  gran: ['grandma', 'sandy', 'shelley', 'sunhi'],
  me_m: ['eddy', 'injoon', 'rocko', 'grandpa'],
  me_f: ['flo', 'sunhi', 'shelley', 'yuna'],
  vendor: ['sandy', 'shelley', 'sunhi', 'flo'],
}
export function chooseVoice(key, cast, taken = []) {
  if (!cast.length) return null
  const low = cast.map((v) => v.name.toLowerCase())
  for (const want of PREFER[key] || []) {
    const i = low.findIndex((n) => n.includes(want))
    if (i >= 0 && !taken.includes(cast[i])) return cast[i]
  }
  const p = VOICE_PROFILES[key] || VOICE_PROFILES.narr
  return cast.length > 1 ? cast[p.slot % cast.length] : cast[0]
}

function viaSpeech(key, text, onDone) {
  const p = VOICE_PROFILES[key] || VOICE_PROFILES.narr
  const voice = chooseVoice(key, voicesForCast())
  // ถ้ามีหลายเสียงในเครื่อง แต่ละคนใช้คนละเสียง · ถ้ามีเสียงเดียว ใช้ระดับเสียง/ความเร็วแยกให้ต่างกัน
  speak(text, undefined, { pitch: p.pitch, voice, rateMul: p.rate }, onDone)
}

// who: narr | gran | me | pet · คืน 'cry' | 'audio' | 'speech' บอกว่าใช้เสียงแบบไหน (ใช้ทดสอบ)
let lineToken = 0
export function playLine(args) {
  const token = ++lineToken
  if (!manifest) { // บรรทัดแรกอาจมาก่อนโหลดรายการไฟล์เสียงเสร็จ → รอแล้วค่อยเล่น (ถ้ายังเป็นบรรทัดล่าสุด)
    preloadVoices().then(() => { if (token === lineToken) playLine(args) })
    return 'pending'
  }
  const { who, text, gender, species, onDone } = args
  stopVoice()
  if (who === 'pet') { const ok = playCry(species); if (ok) { setTimeout(() => onDone?.(), 700); return 'cry' } }
  const key = speakerKey(who === 'pet' ? 'narr' : who, gender)
  const file = manifest?.[voiceKey(key, text)]
  if (file) {
    try {
      const a = new Audio(file)
      audio = a
      a.onended = () => onDone?.()
      a.play().catch(() => viaSpeech(key, text, onDone)) // เบราว์เซอร์ไม่ให้เล่น → ใช้เสียงสังเคราะห์แทน
      return 'audio'
    } catch { /* fall through */ }
  }
  viaSpeech(key, text, onDone)
  return 'speech'
}

// ครูผู้สอน (เสียงอ่านเนื้อหาบทเรียน) — เพิ่มครูใหม่: เพิ่มโปรไฟล์ `<id>` และ `<id>_slow` ข้างบน แล้วเพิ่มที่นี่ จากนั้นรัน npm run voice -- --run
export const TEACHERS = {
  hana: { th: 'ครูฮานา', ko: '하나 선생님', icon: '👩‍🏫', speaker: 'teacher' },
  minjun: { th: 'ครูมินจุน', ko: '민준 선생님', icon: '👨‍🏫', speaker: 'teacher_m' },
}
export const DEFAULT_TEACHER = 'hana'
