// อ่านออกเสียงภาษาเกาหลีด้วย Web Speech API (ทำงานออฟไลน์ได้ถ้าเครื่องมีเสียงเกาหลี)
let koVoice = null
let current = null // เก็บ utterance ไว้ไม่ให้ถูก GC ก่อนอ่านจบ (บั๊กของ Chrome/Android)
let pendingTimer = null

const supported = () => typeof window !== 'undefined' && 'speechSynthesis' in window

function pickVoice() {
  if (!supported()) return
  const voices = window.speechSynthesis.getVoices()
  if (!voices.length) return
  koVoice = voices.find((v) => v.lang === 'ko-KR' && /yuna|google|female|heami|sora/i.test(v.name))
    || voices.find((v) => v.lang?.replace('_', '-').toLowerCase().startsWith('ko')) || null
}

if (supported()) {
  pickVoice()
  window.speechSynthesis.addEventListener?.('voiceschanged', pickVoice)
  window.speechSynthesis.onvoiceschanged = pickVoice
}

export const canSpeak = supported

let watchdog = null
let noVoiceNotified = false

// แจ้งแอปให้โชว์ข้อความเตือน (reason: 'stuck' = engine ค้าง, 'no-voice' = ไม่มีเสียงเกาหลีในเครื่อง)
function notify(reason) {
  try { window.dispatchEvent(new CustomEvent('tts-problem', { detail: reason })) } catch { /* ignore */ }
}

function say(text, rate, retries = 1) {
  const synth = window.speechSynthesis
  if (!koVoice) pickVoice() // เสียงอาจโหลดช้า ลองเลือกใหม่ทุกครั้งที่ยังไม่มี
  if (!koVoice && !noVoiceNotified && synth.getVoices().length) { noVoiceNotified = true; notify('no-voice') }
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'ko-KR'
  u.rate = rate
  if (koVoice) u.voice = koVoice
  let started = false
  u.onstart = () => { started = true; clearTimeout(watchdog) }
  u.onend = u.onerror = () => { clearTimeout(watchdog); if (current === u) current = null }
  current = u
  if (synth.paused) synth.resume()
  synth.speak(u)
  // บางครั้ง engine ค้าง (speaking=true แต่ไม่เริ่มอ่านเลย) -> ล้างคิวแล้วลองใหม่
  clearTimeout(watchdog)
  watchdog = setTimeout(() => {
    if (started || current !== u) return
    if (retries <= 0) { synth.cancel(); notify('stuck'); return }
    synth.cancel()
    pendingTimer = setTimeout(() => { try { say(text, rate, retries - 1) } catch { /* ignore */ } }, 150)
  }, 1200)
}

export function speak(text, rate = 0.85) {
  if (!supported() || !text) return
  try {
    const synth = window.speechSynthesis
    clearTimeout(pendingTimer)
    if (synth.speaking || synth.pending) {
      // cancel() แล้ว speak() ทันที เสียงใหม่จะถูกกลืน -> เว้นช่วงสั้น ๆ ให้คิวเคลียร์ก่อน
      synth.cancel()
      pendingTimer = setTimeout(() => { try { say(text, rate) } catch { /* ignore */ } }, 80)
    } else {
      say(text, rate) // เรียกทันทีตอนอยู่ใน user gesture (iOS ต้องการ)
    }
  } catch { /* ignore */ }
}

export const hasKoreanVoice = () => { if (!koVoice) pickVoice(); return !!koVoice }
