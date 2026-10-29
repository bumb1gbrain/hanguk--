import { useRef, useState } from 'react'
import { useGame, dueItems } from '../game/store.jsx'
import { buildQuiz, REVIEW_REWARD } from '../game/logic.js'
import { canSpeak } from '../game/tts.js'
import { ALL_ITEMS, ITEM_BY_ID } from '../data/lessons.js'
import Quiz from '../components/Quiz.jsx'
import { SpeakBtn } from '../components/ui.jsx'

const BOX_LABEL = ['', '새싹 🌱', '새싹 🌱', '잎 🌿', '잎 🌿', '나무 🌳', '나무 🌳']

export default function Review({ go }) {
  const { state, dispatch } = useGame()
  const [questions, setQuestions] = useState(null)
  const [done, setDone] = useState(null)
  const earned = useRef(0) // จำนวนคำที่ได้รางวัลในรอบนี้
  const due = dueItems(state.srs)
  const learned = Object.keys(state.srs).map((id) => ITEM_BY_ID[id]).filter(Boolean)

  const start = () => {
    const items = due.map((id) => ITEM_BY_ID[id]).filter(Boolean)
    setDone(null)
    earned.current = 0
    setQuestions(buildQuiz(items, ALL_ITEMS, { n: 10, canListen: canSpeak() }))
  }
  // ฝึกเพิ่ม: สุ่มจากคำที่เรียนแล้ว (ไม่นับ SRS)
  const practice = () => {
    setDone(null)
    setQuestions(buildQuiz(learned, ALL_ITEMS, { n: 8, canListen: canSpeak() }).map((q) => ({ ...q, practice: true })))
  }

  if (questions) {
    return (
      <div className="page">
        <Quiz
          questions={questions}
          onAnswer={(item, ok) => {
            if (questions[0].practice) return
            if (ok && !(state.daily.reviewed || []).includes(item.id)) earned.current += 1
            dispatch({ type: 'REVIEW_ANSWER', itemId: item.id, ok })
          }}
          onFinish={(c, t) => { setQuestions(null); setDone({ c, t, n: earned.current }) }}
        />
      </div>
    )
  }

  return (
    <div className="page">
      <h2 className="section-title">복습 · ทบทวน</h2>
      {done && <div className="tip good">수고했어요! ทบทวนเสร็จ ถูก {done.c}/{done.t} ข้อ{done.n > 0 ? ` · +${done.n * REVIEW_REWARD.xp} XP +${done.n * REVIEW_REWARD.coins} 🪙` : ' · คำเหล่านี้รับรางวัลของวันนี้ไปแล้ว'}</div>}
      <section className="card pixel-box center">
        <div className="mini-n big">{due.length}</div>
        <p>คำที่ถึงเวลาทบทวนวันนี้</p>
        {due.length > 0 ? (
          <button className="pixel-btn primary" onClick={start}>เริ่มทบทวน ▶</button>
        ) : learned.length > 0 ? (
          <>
            <p className="muted small">ไม่มีคำค้างแล้ว เก่งมาก! อยากฝึกเพิ่มไหม?</p>
            <button className="pixel-btn" onClick={practice}>ฝึกเพิ่ม (สุ่มคำที่เรียนแล้ว)</button>
          </>
        ) : (
          <>
            <p className="muted small">ยังไม่มีคำในคลัง เรียนบทแรกก่อนนะ</p>
            <button className="pixel-btn primary" onClick={() => go('learn')}>ไปเรียน</button>
          </>
        )}
        <p className="muted small">รางวัลทบทวน: คำละ 1 ครั้งต่อวัน · ฝึกซ้ำได้ไม่จำกัดแต่ไม่ได้รางวัลเพิ่ม</p>
        <p className="muted small">ระบบทบทวนแบบเว้นระยะ: ตอบถูก → เว้นนานขึ้น (1, 2, 4, 7, 15, 30 วัน) · ตอบผิด → กลับมาทวนใหม่</p>
      </section>

      {learned.length > 0 && (
        <>
          <h3 className="time-title">คลังคำศัพท์ของฉัน ({learned.length})</h3>
          <div className="vocab-list">
            {learned.map((it) => (
              <div key={it.id} className="vocab pixel-box">
                <span className="ko">{it.ko}</span>
                <small>{it.read} · {it.th}</small>
                <span className="lvl">{BOX_LABEL[state.srs[it.id].box]}</span>
                <SpeakBtn text={it.speak || it.ko} small />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
