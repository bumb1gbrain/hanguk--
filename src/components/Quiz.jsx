import { useEffect, useState } from 'react'
import { speakFor } from '../game/lessonVoice.js'
import { SpeakBtn } from './ui.jsx'

const PROMPT = {
  ko2th: 'คำนี้แปลว่าอะไร?',
  th2ko: 'ภาษาเกาหลีพูดว่าอะไร?',
  listen: 'ฟังแล้วเลือกคำที่ได้ยิน',
}

// โจทย์ของบทตัวอักษร (ไม่ใช่ "แปลว่าอะไร" เพราะตัวอักษรไม่มีความหมาย แต่มี "เสียงอ่าน")
const PROMPT_LETTER = {
  ko2th: 'ตัวอักษรนี้อ่านว่าอะไร?',
  th2ko: 'ตัวอักษรไหนอ่านว่านี้?',
  listen: 'ฟังเสียงแล้วเลือกตัวอักษรที่ได้ยิน',
}

export default function Quiz({ questions, onAnswer, onFinish }) {
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState(null)
  const [correct, setCorrect] = useState(0)
  const [missed, setMissed] = useState([]) // คำที่ตอบผิด (ไม่ซ้ำ)
  const q = questions[i]
  const sayText = q ? q.item.speak || q.item.ko : ''

  useEffect(() => {
    if (q && q.type === 'listen') setTimeout(() => speakFor(q.item, { quiz: true }), 250)
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

  const next = () => {
    if (i + 1 >= questions.length) onFinish(correct, questions.length, missed)
    else { setI(i + 1); setPicked(null) }
  }

  return (
    <div className="quiz">
      <div className="quiz-progress">
        {questions.map((_, k) => <span key={k} className={k < i ? 'done' : k === i ? 'cur' : ''} />)}
      </div>
      <p className="quiz-prompt">{(q.letter ? PROMPT_LETTER : PROMPT)[q.type]}</p>

      <div className="quiz-card pixel-box">
        {q.type === 'ko2th' && (
          <>
            <div className="big-ko">{q.item.ko}</div>
            <SpeakBtn text={sayText} item={q.item} />
          </>
        )}
        {q.type === 'th2ko' && <div className="big-th">{q.thText ?? q.item.th}</div>}
        {q.type === 'listen' && (
          <div className="listen-row">
            <button className="listen-btn" onClick={() => speakFor(q.item, { quiz: true })}>🔊<small>แตะเพื่อฟังอีกครั้ง</small></button>
            <button className="listen-btn slow" onClick={() => speakFor(q.item, { quiz: true, slow: true })} aria-label="ฟังแบบช้า">🐢<small>ช้า ๆ</small></button>
          </div>
        )}
      </div>

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

      {picked && (
        <div className={`feedback ${ok ? 'good' : 'bad'}`}>
          <div>
            <b>{ok ? '정답! ถูกต้อง 🎉' : '아쉬워요… ยังไม่ถูกนะ'}</b>
            <div className="fb-detail">
              <span className="ko">{q.item.ko}</span> · {q.item.read} · {q.item.th}
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
