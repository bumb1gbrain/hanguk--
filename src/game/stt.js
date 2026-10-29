// ฟังเสียงพูดเกาหลีด้วย Web Speech API (SpeechRecognition / webkitSpeechRecognition)
// หมายเหตุ: Chrome ส่งเสียงไปประมวลผลบนเซิร์ฟเวอร์ (ต้องมีเน็ต), Safari ใช้ระบบเสียงของ Apple, Firefox ยังไม่รองรับ
const Rec = () => (typeof window === 'undefined' ? null : window.SpeechRecognition || window.webkitSpeechRecognition || null)

export const canListen = () => !!Rec()

// ข้อความอธิบายข้อผิดพลาดของ SpeechRecognition เป็นภาษาไทย
export const STT_ERRORS = {
  'not-allowed': 'ยังไม่ได้อนุญาตให้ใช้ไมโครโฟน — กดอนุญาตที่เบราว์เซอร์ (ไอคอนกุญแจ/ไมค์ข้างช่อง URL) แล้วลองใหม่',
  'service-not-allowed': 'ระบบไม่อนุญาตให้ใช้การรู้จำเสียง — บน iPhone/Mac ให้เปิด Siri และการป้อนด้วยเสียง (Dictation) ในตั้งค่าก่อน',
  'no-speech': 'ไม่ได้ยินเสียงพูด ลองพูดให้ดังขึ้นหรือใกล้ไมค์มากขึ้น',
  'audio-capture': 'ไม่พบไมโครโฟน ตรวจสอบว่าเสียบ/เปิดไมค์อยู่',
  network: 'ต้องใช้อินเทอร์เน็ตเพื่อประมวลผลเสียง (Chrome ส่งเสียงไปที่เซิร์ฟเวอร์) ตรวจสอบการเชื่อมต่อแล้วลองใหม่',
  'language-not-supported': 'เบราว์เซอร์นี้ยังไม่รองรับการฟังภาษาเกาหลี',
  'start-failed': 'เริ่มฟังไม่สำเร็จ ลองกดปุ่มอีกครั้ง',
}

// เริ่มฟัง 1 ประโยค · คืน { stop, abort }
// callbacks: onStart(), onInterim(text) ข้อความที่กำลังฟังอยู่สด ๆ, onSilence() เงียบแล้วเริ่มฟังใหม่อัตโนมัติ (1 ครั้ง),
//            onResult(alternatives), onError(code), onEnd(gotResult)
export function listen({ lang = 'ko-KR', maxAlternatives = 5, timeoutMs = 12000, retryOnSilence = true, onStart, onInterim, onSilence, onResult, onError, onEnd } = {}) {
  const R = Rec()
  if (!R) { onError?.('language-not-supported'); onEnd?.(false); return { stop() {}, abort() {} } }

  let current = null
  let timer = null
  let got = false
  let finished = false
  let retried = false
  let aborted = false

  const done = () => {
    if (finished) return
    finished = true
    clearTimeout(timer)
    onEnd?.(got)
  }

  const run = () => {
    const rec = new R()
    current = rec
    rec.lang = lang
    rec.interimResults = true // ส่งข้อความระหว่างพูดมาด้วย เพื่อโชว์สด ๆ และรู้สึกว่าตอบสนองไว
    rec.continuous = false
    rec.maxAlternatives = maxAlternatives
    clearTimeout(timer)
    timer = setTimeout(() => { try { rec.stop() } catch { /* ignore */ } }, timeoutMs)
    rec.onstart = () => onStart?.()
    rec.onspeechend = () => { try { rec.stop() } catch { /* ignore */ } } // ตัดจบทันทีที่หยุดพูด ไม่ต้องรอหมดเวลา
    rec.onresult = (e) => {
      const res = e.results[e.results.length - 1]
      if (!res) return
      if (res.isFinal === false) { onInterim?.(res[0]?.transcript || ''); return }
      got = true
      onResult?.(Array.from(res).map((a) => ({ text: a.transcript, confidence: a.confidence })))
    }
    rec.onerror = (e) => {
      if (e.error === 'aborted' || aborted) { done(); return }
      if (e.error === 'no-speech' && retryOnSilence && !retried) {
        retried = true // ครั้งแรกที่เงียบ: เริ่มฟังใหม่เงียบ ๆ ไม่ต้องให้ผู้ใช้กดซ้ำ
        rec.__ignoreEnd = true // onend ของรอบเก่าจะตามมา — ไม่ต้องถือเป็นการจบ
        onSilence?.()
        setTimeout(() => { if (!finished && !aborted) { try { run() } catch { onError?.('start-failed'); done() } } }, 150)
        return
      }
      onError?.(e.error)
      done()
    }
    rec.onend = () => { if (!rec.__ignoreEnd) done() }
    try {
      window.speechSynthesis?.cancel() // กันไมค์ได้ยินเสียงตัวอย่างของแอปเอง
      rec.start()
    } catch {
      onError?.('start-failed')
      done()
    }
  }

  run()
  return {
    stop: () => { try { current?.stop() } catch { /* ignore */ } },
    abort: () => { aborted = true; clearTimeout(timer); try { current?.abort() } catch { /* ignore */ } },
  }
}
