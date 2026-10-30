import { useMemo, useState } from 'react'
import { useGame } from '../game/store.jsx'
import { buildQuiz } from '../game/logic.js'
import { canSpeak, speakFor } from '../game/tts.js'
import { ALL_ITEMS } from '../data/lessons.js'
import Quiz from '../components/Quiz.jsx'
import { SpeakBtn } from '../components/ui.jsx'
import { Pet } from '../pixel/Characters.jsx'
import SyllableGame from './SyllableGame.jsx'
import { isSyllable, decompose, LEAD, VOWEL, TAIL } from '../game/hangul.js'
import { stageFor, lessonReward } from '../game/logic.js'
import { dayStr } from '../game/logic.js'

export default function LessonView({ lesson, onClose }) {
  const { state, dispatch } = useGame()
  const [phase, setPhase] = useState('study') // study | quiz | result
  const [idx, setIdx] = useState(0)
  const [result, setResult] = useState(null)
  const items = lesson.items
  const pool = useMemo(() => {
    const same = ALL_ITEMS.filter((x) => x.lesson === lesson.id)
    const group = ALL_ITEMS.filter((x) => x.kind === 'letter') // ensure letters get letter distractors
    return lesson.group === 'hangul' ? group : [...same, ...ALL_ITEMS.filter((x) => x.kind !== 'letter')]
  }, [lesson])
  const [questions, setQuestions] = useState(null)
  const [retryNote, setRetryNote] = useState(null) // ผลการลองเฉพาะคำที่ผิด (ไม่มีรางวัล)
  const [retrying, setRetrying] = useState(false)
  const [syl, setSyl] = useState(false) // เปิดเกมประกอบพยางค์ซ้อนทับ

  const startQuiz = () => {
    setQuestions(buildQuiz(items, pool, { n: Math.min(8, items.length), canListen: canSpeak() }))
    setRetrying(false)
    setRetryNote(null)
    setPhase('quiz')
  }

  const startRetry = () => {
    setQuestions(buildQuiz(result.missed, pool, { n: result.missed.length, canListen: canSpeak() }))
    setRetrying(true)
    setPhase('quiz')
  }

  // จบรอบ "ลองเฉพาะคำที่ผิด": ไม่ให้รางวัลเพิ่ม แค่อัปเดตรายการคำที่ยังพลาด
  const finishRetry = (correct, total, missed) => {
    setRetryNote({ correct, total })
    setResult((r) => ({ ...r, missed }))
    setRetrying(false)
    setPhase('result')
  }

  const finish = (correct, total, missed = []) => {
    // คำนวณด้วยสูตรเดียวกับ reducer จากสถานะก่อน dispatch เพื่อโชว์รางวัลที่ได้จริง
    const paid = state.daily.date === dayStr() ? (state.daily.lessons || {})[lesson.id] : undefined
    const r = lessonReward({ correct, total, hadBefore: !!state.lessons[lesson.id], paid })
    dispatch({ type: 'LESSON_DONE', lessonId: lesson.id, correct, total, itemIds: items.map((x) => x.id), missedIds: missed.map((x) => x.id) })
    setResult({ correct, total, missed, xp: r.xp, coins: r.coins, happy: r.happy, repeat: !!paid || !!state.lessons[lesson.id], paid: !!paid })
    setPhase('result')
  }

  const it = items[idx]
  // แยกคำเป็นพยางค์ พร้อมส่วนประกอบ (พยัญชนะต้น + สระ + ตัวสะกด) ให้เห็นว่าอ่านยังไง
  const parts = it.kind === 'word' ? [...it.ko].filter(isSyllable) : []
  const showParts = parts.length > 0 && parts.length <= 4

  return (
    <div className="overlay">
      {syl && <SyllableGame onClose={() => setSyl(false)} />}
      <header className="lesson-head">
        <button className="icon-btn" onClick={onClose} aria-label="ปิด">✕</button>
        <div>
          <div className="ko">{lesson.icon} {lesson.title}</div>
          <small>{lesson.titleTh}</small>
        </div>
        <span />
      </header>

      {phase === 'study' && (
        <div className="study">
          {lesson.note && idx === 0 && <div className="tip">💡 {lesson.note}</div>}
          <div className="flash pixel-box" onClick={() => speakFor(it)}>
            <span className={`kind-tag ${it.kind}`}>{it.kind === 'letter' ? '글자' : it.kind === 'word' ? '단어' : '표현'}</span>
            <div className={`big-ko ${it.ko.length > 8 ? 'long' : ''}`}>{it.ko}</div>
            {it.kind === 'letter' && it.speak && (
              <div className="example">
                เสียงอ่าน: <span className="ko">{it.speak}</span>
                {it.ex && <> · ตัวอย่างคำ: <span className="ko">{it.ex.ko}</span> <small>({it.ex.read} · {it.ex.th})</small></>}
              </div>
            )}
            {showParts && (
              <div className="syl-parts">
                {parts.map((ch, k) => {
                  const d = decompose(ch)
                  return (
                    <span key={k} className="syl-chip">
                      {parts.length > 1 && <b className="ko">{ch}</b>}
                      <small className="ko">{LEAD[d.l]}+{VOWEL[d.v]}{d.t ? `+${TAIL[d.t]}` : ''}</small>
                    </span>
                  )
                })}
              </div>
            )}
            <div className="read">{it.read}</div>
            <div className="rom mono">{it.rom}</div>
            <div className="mean">{it.th}</div>
            <div className="row gap center-row">
              <button className="speak" onClick={(e) => { e.stopPropagation(); speakFor(it) }} aria-label="ฟังเสียง">🔊 ฟัง</button>
              <button className="speak" onClick={(e) => { e.stopPropagation(); speakFor(it, { slow: true }) }} aria-label="ฟังแบบช้า">🐢 ช้า ๆ</button>
            </div>
          </div>
          <div className="dots">{items.map((_, k) => <span key={k} className={k === idx ? 'cur' : k < idx ? 'done' : ''} />)}</div>
          <div className="row gap">
            <button className="pixel-btn" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>◀ ก่อนหน้า</button>
            {idx < items.length - 1 ? (
              <button className="pixel-btn primary" onClick={() => { setIdx(idx + 1); speakFor(items[idx + 1]) }}>ถัดไป ▶</button>
            ) : (
              <button className="pixel-btn primary" onClick={startQuiz}>เริ่มแบบทดสอบ ⚔️</button>
            )}
          </div>
          <div className="row gap study-extra">
            {lesson.group !== 'daily' && <button className="pixel-btn small" onClick={() => setSyl(true)}>🧩 เกมประกอบพยางค์</button>}
            <button className="pixel-btn small ghost" onClick={startQuiz}>⏩ ข้ามไปทำแบบทดสอบ</button>
          </div>
        </div>
      )}

      {phase === 'quiz' && questions && <Quiz questions={questions} onFinish={retrying ? finishRetry : finish} />}

      {phase === 'result' && result && (
        <div className="result">
          <Pet stage={stageFor(state.pet.growth).id} mood="happy" scale={8} className="bob" />
          <h2>{result.correct === result.total ? '완벽해요! 🌟' : result.correct >= result.total / 2 ? '잘했어요! 👍' : '괜찮아요! 💪'}</h2>
          <p>ตอบถูก {result.correct}/{result.total} ข้อ</p>
          {result.xp + result.coins > 0 ? (
            <div className="rewards">
              <span className="reward">+{result.xp} XP</span>
              <span className="reward gold">+{result.coins} 🪙</span>
              {result.happy > 0 && <span className="reward pink">{state.pet.name} ❤️+{result.happy}</span>}
            </div>
          ) : (
            <p className="muted">บทนี้รับรางวัลของวันนี้ไปแล้ว — ฝึกซ้ำได้เลย แต่ต้องทำคะแนนให้ดีกว่าเดิมถึงจะได้เพิ่ม · 🔥 streak ยังนับต่อ</p>
          )}
          {result.repeat && result.xp + result.coins > 0 && (
            <p className="muted small">{result.paid ? 'ได้เพิ่มเฉพาะส่วนที่ทำคะแนนดีกว่าเดิม' : 'เรียนซ้ำต่างวัน ได้รางวัล 50%'}</p>
          )}
          {result.missed.length > 0 && (
            <div className="missed pixel-box">
              <b>คำที่ควรทวน ({result.missed.length})</b>
              {retryNote && <small className="muted"> · ลองใหม่ถูก {retryNote.correct}/{retryNote.total}</small>}
              <div className="missed-list">
                {result.missed.map((m) => (
                  <div key={m.id} className="missed-item">
                    <span className="ko">{m.ko}</span>
                    <small>{m.read} · {m.th}</small>
                    <SpeakBtn text={m.speak || m.ko} item={m} small />
                  </div>
                ))}
              </div>
              <button className="pixel-btn" onClick={startRetry}>🎯 ลองเฉพาะคำที่ผิด</button>
            </div>
          )}
          <p className="muted small">
            {result.missed.length > 0
              ? 'คำที่ตอบผิดจะกลับมาให้ทบทวนวันนี้เลย ส่วนคำอื่นพรุ่งนี้'
              : 'คำในบทนี้ถูกเพิ่มเข้า “ทบทวน” แล้ว จะกลับมาให้ทวนพรุ่งนี้'}
          </p>
          <div className="row gap">
            <button className="pixel-btn" onClick={() => { setIdx(0); setPhase('study') }}>เรียนซ้ำ</button>
            <button className="pixel-btn primary" onClick={onClose}>กลับ</button>
          </div>
        </div>
      )}
    </div>
  )
}
