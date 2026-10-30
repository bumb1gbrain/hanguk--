import { useEffect, useState } from 'react'
import { speak, speakFor, stopSpeech, preloadItems } from '../game/lessonVoice.js'
import { SpeakBtn } from './ui.jsx'

const PROMPT = {
  ko2th: 'คำนี้แปลว่าอะไร?',
  th2ko: 'ภาษาเกาหลีพูดว่าอะไร?',
  listen: 'ฟังแล้วเลือกคำที่ได้ยิน',
  order: 'แตะชิ้นส่วนเรียงให้เป็นภาษาเกาหลีที่ถูกต้อง',
  dictate: 'ฟังแล้วเรียงชิ้นส่วนให้ตรงกับที่ได้ยิน',
}

// โจทย์ของบทตัวอักษร (ไม่ใช่ "แปลว่าอะไร" เพราะตัวอักษรไม่มีความหมาย แต่มี "เสียงอ่าน")
const PROMPT_LETTER = {
  ko2th: 'ตัวอักษรนี้อ่านว่าอะไร?',
  th2ko: 'ตัวอักษรไหนอ่านว่านี้?',
  listen: 'ฟังเสียงแล้วเลือกตัวอักษรที่ได้ยิน',
  order: 'เรียงพยางค์ให้เป็นคำตัวอย่างของตัวอักษรนี้',
  dictate: 'ฟังคำตัวอย่างแล้วเรียงพยางค์ให้ตรงกับที่ได้ยิน',
}

export default function Quiz({ questions, onAnswer, onFinish }) {
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState(null)
  const [correct, setCorrect] = useState(0)
  const [missed, setMissed] = useState([]) // คำที่ตอบผิด (ไม่ซ้ำ)
  const [placed, setPlaced] = useState([]) // โจทย์เรียงชิ้นส่วน: id ของชิ้นที่วางแล้วตามลำดับ
  const q = questions[i]
  const sayText = q ? q.item.speak || q.item.ko : ''
  const isOrder = q && (q.type === 'order' || q.type === 'dictate')
  // ฟังเสียงของโจทย์เรียง: คำของบทใช้ speakFor ตัวอักษรใช้คำตัวอย่าง
  const sayTarget = (slow) => (q.letter ? speak(q.target.ko, slow ? 0.6 : undefined) : speakFor(q.item, { quiz: true, slow }))

  // โหลดเสียงของทุกข้อไว้ล่วงหน้า เพื่อให้เล่นได้ทันทีเมื่อถึงข้อนั้น · ออกจากแบบทดสอบ = หยุดเสียง
  useEffect(() => { preloadItems(questions.map((x) => x.item)); return () => stopSpeech() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!(q && (q.type === 'listen' || q.type === 'dictate'))) return undefined
    const t = setTimeout(() => (q.type === 'dictate' ? sayTarget(false) : speakFor(q.item, { quiz: true })), 120)
    return () => clearTimeout(t)
  }, [i]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!q) return null
  const ok = picked != null && picked === q.item.id

  const choose = (id) => {
    if (picked) return
    setPicked(id)
    const good = id === q.item.id
    if (good) setCorrect((c) => c + 1)
    else setMissed((m) => (m.some((x) => x.id === q.item.id) ? m : [...m, q.item]))
    onAnswer?.(q.item, good)
    if (q.type !== 'listen') speakFor(q.item) // เฉลยแล้วอ่านให้ฟัง (ตัวอักษรจะอ่านครบทั้งชื่อ พยางค์ และคำตัวอย่าง)
    navigator.vibrate?.(good ? 15 : [30, 40, 30])
  }

  const place = (id) => { if (!picked) setPlaced((p) => (p.includes(id) ? p : [...p, id])) }
  const unplace = (id) => { if (!picked) setPlaced((p) => p.filter((x) => x !== id)) }
  const submitOrder = () => {
    if (picked || placed.length !== q.tiles.length) return
    const textOf = (id) => q.tiles.find((t) => t.id === id).text
    const good = placed.every((id, k) => textOf(id) === q.target.parts[k])
    setPicked(good ? q.item.id : '__wrong')
    if (good) setCorrect((c) => c + 1)
    else setMissed((m) => (m.some((x) => x.id === q.item.id) ? m : [...m, q.item]))
    onAnswer?.(q.item, good)
    sayTarget(false) // เฉลยแล้วอ่านคำที่ถูกให้ฟัง
    navigator.vibrate?.(good ? 15 : [30, 40, 30])
  }

  const next = () => {
    stopSpeech() // ข้ามไปข้อถัดไป: ตัดเสียงเฉลยของข้อเดิม
    if (i + 1 >= questions.length) onFinish(correct, questions.length, missed)
    else { setI(i + 1); setPicked(null); setPlaced([]) }
  }

  return (
    <div className="quiz">
      <div className="quiz-progress">
        {questions.map((_, k) => <span key={k} className={k < i ? 'done' : k === i ? 'cur' : ''} />)}
      </div>
      <p className="quiz-prompt">{isOrder ? (q.letter ? PROMPT_LETTER : PROMPT)[q.type] : q.item.qprompt?.[q.type] || (q.letter ? PROMPT_LETTER : PROMPT)[q.type]}</p>

      <div className="quiz-card pixel-box">
        {q.type === 'ko2th' && (
          <>
            <div className="big-ko">{q.item.ko}</div>
            <SpeakBtn text={sayText} item={q.item} />
          </>
        )}
        {q.type === 'th2ko' && <div className="big-th">{q.thText ?? q.item.th}</div>}
        {q.type === 'order' && (
          <>
            <div className="big-th">{q.thText}</div>
          </>
        )}
        {q.type === 'dictate' && (
          <div className="listen-row">
            <button className="listen-btn" onClick={() => sayTarget(false)}>🔊<small>แตะเพื่อฟังอีกครั้ง</small></button>
            <button className="listen-btn slow" onClick={() => sayTarget(true)} aria-label="ฟังแบบช้า">🐢<small>ช้า ๆ</small></button>
          </div>
        )}
        {q.type === 'listen' && (
          <div className="listen-row">
            <button className="listen-btn" onClick={() => speakFor(q.item, { quiz: true })}>🔊<small>แตะเพื่อฟังอีกครั้ง</small></button>
            <button className="listen-btn slow" onClick={() => speakFor(q.item, { quiz: true, slow: true })} aria-label="ฟังแบบช้า">🐢<small>ช้า ๆ</small></button>
          </div>
        )}
      </div>

      {isOrder ? (
        <div className="order-area">
          <div className={`order-slots ${picked ? (ok ? 'right' : 'wrong') : ''}`} aria-label="คำตอบของคุณ">
            {q.tiles.map((_, k) => {
              const id = placed[k]
              const t = id != null ? q.tiles.find((x) => x.id === id) : null
              return <button key={k} className={`order-slot ${t ? 'filled' : ''}`} disabled={!t || !!picked} onClick={() => t && unplace(t.id)}>{t ? t.text : ''}</button>
            })}
          </div>
          <div className="order-bank">
            {q.tiles.map((t) => (
              <button key={t.id} className="order-tile pixel-btn" disabled={placed.includes(t.id) || !!picked} onClick={() => place(t.id)}>{t.text}</button>
            ))}
          </div>
          {!picked && (
            <div className="row gap">
              <button className="pixel-btn small" disabled={!placed.length} onClick={() => setPlaced([])}>ล้าง</button>
              <button className="pixel-btn primary" disabled={placed.length !== q.tiles.length} onClick={submitOrder}>ตรวจคำตอบ ✔</button>
            </div>
          )}
        </div>
      ) : (
      <div className="options">
        {q.options.map((o) => {
          const state = !picked ? '' : o.id === q.item.id ? 'right' : o.id === picked ? 'wrong' : 'dim'
          return (
            <button key={o.id} className={`option pixel-btn ${state}`} onClick={() => choose(o.id)}>
              <span className={q.type === 'ko2th' ? 'th' : 'ko'}>{o.label}</span>
              {o.sub && picked && <small>{o.sub}</small>}
            </button>
          )
        })}
      </div>
      )}

      {picked && (
        <div className={`feedback ${ok ? 'good' : 'bad'}`}>
          <div>
            <b>{ok ? '정답! ถูกต้อง 🎉' : '아쉬워요… ยังไม่ถูกนะ'}</b>
            <div className="fb-detail">
              {isOrder ? (
                <><span className="ko">{q.target.ko}</span> · {q.target.read} · {q.target.th}</>
              ) : (
                <><span className="ko">{q.item.ko}</span> · {q.item.read} · {q.item.th}</>
              )}
            </div>
          </div>
          <button className="pixel-btn primary" onClick={next}>
            {i + 1 >= questions.length ? 'ดูผล' : 'ต่อไป ▶'}
          </button>
        </div>
      )}
    </div>
  )
}
