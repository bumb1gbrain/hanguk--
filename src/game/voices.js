// เสียงพากย์: ให้ผู้พูดแต่ละคนมีเสียงของตัวเอง
// ลำดับความสำคัญ: 1) ไฟล์เสียงสำเร็จรูป (public/voice, สร้างด้วย scripts/gen-voice.mjs) 2) Web Speech พร้อมโปรไฟล์เสียง (เสียง/ระดับเสียง/ความเร็ว) 3) สัตว์เลี้ยงใช้เสียงร้องสังเคราะห์
import { speak, stopSpeaking, voicesForCast } from './tts.js'
import { playCry } from './cry.js'
import { voiceKey } from './voiceKey.js'

// rate = ตัวคูณความเร็วจากที่ผู้เล่นตั้งไว้ · pitch = ระดับเสียง (1 = ปกติ) · slot = ลำดับเสียงในเครื่องที่แจกให้ (ถ้ามีหลายเสียง)
export const VOICE_PROFILES = {
  narr: { th: 'ผู้เล่าเรื่อง', rate: 0.95, pitch: 0.95, slot: 0, azure: 'ko-KR-BongJinNeural' },
  gran: { th: 'คุณยาย', rate: 0.78, pitch: 0.65, slot: 1, azure: 'ko-KR-SoonBokNeural' },
  vendor: { th: 'แม่ค้า', rate: 1.05, pitch: 1.0, slot: 4, azure: 'ko-KR-SunHiNeural' },
  me_f: { th: 'ผู้เล่น (หญิง)', rate: 1.0, pitch: 1.25, slot: 2, azure: 'ko-KR-JiMinNeural' },
  me_m: { th: 'ผู้เล่น (ชาย)', rate: 1.0, pitch: 0.85, slot: 3, azure: 'ko-KR-InJoonNeural' },
}

export const speakerKey = (who, gender) => (who === 'me' ? (gender === 'f' ? 'me_f' : 'me_m') : who)

let manifest = null // { key: 'path.mp3' }
let manifestLoading = null
export function preloadVoices() {
  if (manifest || manifestLoading || typeof fetch === 'undefined') return manifestLoading
  manifestLoading = fetch('/voice/manifest.json', { cache: 'no-cache' })
    .then((r) => (r.ok ? r.json() : {}))
    .then((m) => { manifest = m && typeof m === 'object' ? m : {} })
    .catch(() => { manifest = {} })
  return manifestLoading
}

let audio = null
export function stopVoice() {
  if (audio) { try { audio.pause() } catch { /* ignore */ } audio = null }
  stopSpeaking()
}

function viaSpeech(key, text, onDone) {
  const p = VOICE_PROFILES[key] || VOICE_PROFILES.narr
  const cast = voicesForCast()
  const voice = cast.length > 1 ? cast[p.slot % cast.length] : cast[0] || null
  // ถ้ามีหลายเสียงในเครื่อง แต่ละคนใช้คนละเสียง · ถ้ามีเสียงเดียว ใช้ระดับเสียง/ความเร็วแยกให้ต่างกัน
  speak(text, undefined, { pitch: p.pitch, voice, rateMul: p.rate }, onDone)
}

// who: narr | gran | me | pet · คืน 'cry' | 'audio' | 'speech' บอกว่าใช้เสียงแบบไหน (ใช้ทดสอบ)
export function playLine({ who, text, gender, species, onDone }) {
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
