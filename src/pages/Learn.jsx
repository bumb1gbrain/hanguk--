import { useState } from 'react'
import { useGame } from '../game/store.jsx'
import SyllableGame from './SyllableGame.jsx'
import SpeakingGame from './SpeakingGame.jsx'
import { LESSONS, suggestLesson } from '../data/lessons.js'

function LessonCard({ l, rec, onOpen }) {
  const { state } = useGame()
  const prog = state.lessons[l.id]
  return (
    <button className={`lesson-card pixel-box ${rec ? 'rec' : ''}`} onClick={() => onOpen(l)}>
      <span className="l-icon">{l.icon}</span>
      <div className="l-text">
        <b className="ko">{l.title}</b>
        <small>{l.titleTh}</small>
        <small className="muted">{l.items.length} คำ{l.hours && l.id !== 'greet' ? ` · ${String(l.hours[0] % 24).padStart(2, '0')}:00–${String(l.hours[1] % 24).padStart(2, '0')}:00` : ''}</small>
      </div>
      <div className="l-side">
        {rec && <span className="badge">ตอนนี้</span>}
        {prog ? <span className="stars">{prog.best >= 100 ? '★★★' : prog.best >= 70 ? '★★☆' : '★☆☆'}</span> : <span className="muted">NEW</span>}
      </div>
    </button>
  )
}

export default function Learn({ openLesson }) {
  const { state } = useGame()
  const [game, setGame] = useState(0) // 0 = ปิด, เพิ่มค่าเพื่อเริ่มรอบใหม่
  const [talk, setTalk] = useState(0) // เกมฝึกพูด (เช่นเดียวกัน)
  const sug = suggestLesson(new Date(), state.lessons, state.player.skipHangul)
  const hangul = LESSONS.filter((l) => l.group === 'hangul')
  const basics = LESSONS.filter((l) => l.group === 'basics')
  const daily = LESSONS.filter((l) => l.group === 'daily')
  return (
    <div className="page">
      <h2 className="section-title">한글 · ตัวอักษรฮันกึล</h2>
      <p className="muted small">เริ่มจากตรงนี้ถ้ายังอ่านเกาหลีไม่ได้ — สระ 10 ตัว + พยัญชนะ 14 ตัว</p>
      <div className="lesson-list">
        {hangul.map((l) => <LessonCard key={l.id} l={l} rec={l.id === sug.id} onOpen={openLesson} />)}
      </div>
      <h2 className="section-title">기본 · พื้นฐานเพิ่มเติม</h2>
      <p className="muted small">ตัวสะกด ตัวเลข และเวลา — เรียนหลังอ่านฮันกึลได้แล้ว จะช่วยให้ประโยคในชีวิตจริงง่ายขึ้นมาก</p>
      <div className="lesson-list">
        {basics.map((l) => <LessonCard key={l.id} l={l} onOpen={openLesson} />)}
      </div>
      <button className="lesson-card pixel-box" onClick={() => setGame((g) => g + 1)}>
        <span className="l-icon">🧩</span>
        <div className="l-text">
          <b className="ko">글자 만들기</b>
          <small>เกมประกอบพยางค์ — เลือกพยัญชนะ + สระ + ตัวสะกด</small>
          <small className="muted">6 คำ/รอบ · รางวัลสูงสุด 6 คำต่อวัน ({Math.min(state.daily.syllable || 0, 6)}/6)</small>
        </div>
      </button>
      <button className="lesson-card pixel-box" onClick={() => setTalk((g) => g + 1)}>
        <span className="l-icon">🎤</span>
        <div className="l-text">
          <b className="ko">말하기 연습</b>
          <small>ฝึกพูดตาม — ระบบฟังแล้วบอกว่าตรงไหม</small>
          <small className="muted">5 ประโยค/รอบ · รางวัลสูงสุด 6 ประโยคต่อวัน ({Math.min(state.daily.speaking || 0, 6)}/6)</small>
        </div>
      </button>
      {talk > 0 && <SpeakingGame key={talk} onClose={(again) => setTalk(again === 'again' ? talk + 1 : 0)} />}
      {game > 0 && <SyllableGame key={game} onClose={(again) => setGame(again === 'again' ? game + 1 : 0)} />}
      <h2 className="section-title">하루 일과 · ภาษาเกาหลีในชีวิตประจำวัน</h2>
      <p className="muted small">เรียงตามช่วงเวลาของวัน แอปจะแนะนำบทที่ตรงกับเวลาตอนนี้</p>
      <div className="lesson-list">
        {daily.map((l) => <LessonCard key={l.id} l={l} rec={l.id === sug.id} onOpen={openLesson} />)}
      </div>
    </div>
  )
}
