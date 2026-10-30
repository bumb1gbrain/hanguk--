import { useState } from 'react'
import { useGame } from '../game/store.jsx'
import SyllableGame from './SyllableGame.jsx'
import SpeakingGame from './SpeakingGame.jsx'
import { LESSONS, suggestLesson } from '../data/lessons.js'
import { Bar } from '../components/ui.jsx'
import { isPassed, passedLessons, PASS_PCT } from '../game/logic.js'

function LessonCard({ l, rec, onOpen }) {
  const { state } = useGame()
  const prog = state.lessons[l.id]
  const best = prog?.best ?? 0
  const iconText = [...String(l.icon)].length > 1 && /[가-힣A-Za-z0-9]/.test(l.icon) // ไอคอนที่เป็นตัวอักษรหลายตัว (เช่น 하나, 123) ใช้ฟอนต์เล็กลง ไม่ให้ตกบรรทัด
  const passed = isPassed(prog)
  const status = prog && !passed ? { t: `ลองอีกครั้ง (${best}%)`, c: 'retry' } : prog ? (best >= 100 ? { t: '★★★', c: 'done' } : best >= 85 ? { t: '★★☆', c: 'done' } : { t: '★☆☆', c: 'done' }) : { t: 'ใหม่', c: 'new' }
  return (
    <button className={`lesson-card pixel-box ${rec ? 'rec' : ''} ${passed ? 'finished' : ''}`} onClick={() => onOpen(l)} aria-label={`${l.title} ${l.titleTh} ${l.items.length} คำ`}>
      <span className={`l-icon ${iconText ? 'txt' : ''}`}>{l.icon}</span>
      <div className="l-text">
        <b className="ko">{l.title}</b>
        <small>{l.titleTh}</small>
        <small className="muted">{l.items.length} คำ{l.hours && l.id !== 'greet' ? ` · ${String(l.hours[0] % 24).padStart(2, '0')}:00–${String(l.hours[1] % 24).padStart(2, '0')}:00` : ''}</small>
      </div>
      <div className="l-side">
        {rec && <span className="badge">แนะนำ</span>}
        <span className={`stat-chip ${status.c}`}>{status.t}</span>
      </div>
    </button>
  )
}

export default function Learn({ openLesson }) {
  const { state } = useGame()
  const [game, setGame] = useState(0) // 0 = ปิด, เพิ่มค่าเพื่อเริ่มรอบใหม่
  const [talk, setTalk] = useState(0) // เกมฝึกพูด (เช่นเดียวกัน)
  const sug = suggestLesson(new Date(), passedLessons(state.lessons), state.player.skipHangul)
  const groups = [
    { id: 'hangul', ko: '한글', th: 'ตัวอักษรฮันกึล', note: 'เริ่มจากตรงนี้ถ้ายังอ่านเกาหลีไม่ได้ — สระ 10 ตัว + พยัญชนะ 14 ตัว', list: LESSONS.filter((l) => l.group === 'hangul') },
    { id: 'basics', ko: '기본', th: 'พื้นฐานเพิ่มเติม', note: 'ตัวสะกด ตัวเลข และเวลา — เรียนหลังอ่านฮันกึลได้แล้ว', list: LESSONS.filter((l) => l.group === 'basics') },
    { id: 'daily', ko: '하루 일과', th: 'ภาษาเกาหลีในชีวิตประจำวัน', note: 'เรียงตามช่วงเวลาของวัน แอปจะแนะนำบทที่ตรงกับเวลาตอนนี้', list: LESSONS.filter((l) => l.group === 'daily') },
  ]
  const total = LESSONS.length
  const done = LESSONS.filter((l) => isPassed(state.lessons[l.id])).length
  // กลุ่มที่เปิดไว้ตอนแรก: กลุ่มที่มีบทแนะนำ หรือกลุ่มแรกที่ยังเรียนไม่ครบ (กลุ่มอื่นพับไว้ให้หน้าไม่ยาว)
  const firstOpen = groups.find((g) => g.list.some((l) => l.id === sug.id))?.id || groups.find((g) => g.list.some((l) => !isPassed(state.lessons[l.id])))?.id || 'hangul'
  const [open, setOpen] = useState({ [firstOpen]: true })
  const toggle = (id) => setOpen((o) => ({ ...o, [id]: !o[id] }))
  return (
    <div className="page learn">
      <section className="learn-hero pixel-box">
        <div className="lh-top">
          <b>เรียนผ่านแล้ว {done}/{total} บท</b>
          <span className="mono">{Math.round((done / total) * 100)}%</span>
        </div>
        <Bar value={done} max={total} color="var(--green)" />
        <button className="lh-cta" onClick={() => openLesson(sug)}>
          <span className={`l-icon ${[...String(sug.icon)].length > 1 && /[가-힣A-Za-z0-9]/.test(sug.icon) ? 'txt' : ''}`}>{sug.icon}</span>
          <span className="lh-text">
            <small>บทที่แนะนำตอนนี้</small>
            <b className="ko">{sug.title}</b>
            <small>{sug.titleTh}</small>
          </span>
          <span className="lh-go">เรียนเลย ▶</span>
        </button>
      </section>

      <div className="practice-row">
        <button className="practice-tile pixel-box" onClick={() => setGame((g) => g + 1)}>
          <span className="pt-ico">🧩</span>
          <b className="ko">글자 만들기</b>
          <small>ประกอบพยางค์</small>
          <small className="muted">วันนี้ {Math.min(state.daily.syllable || 0, 6)}/6</small>
        </button>
        <button className="practice-tile pixel-box" onClick={() => setTalk((g) => g + 1)}>
          <span className="pt-ico">🎤</span>
          <b className="ko">말하기 연습</b>
          <small>ฝึกพูดตาม</small>
          <small className="muted">วันนี้ {Math.min(state.daily.speaking || 0, 6)}/6</small>
        </button>
      </div>
      {talk > 0 && <SpeakingGame key={talk} onClose={(again) => setTalk(again === 'again' ? talk + 1 : 0)} />}
      {game > 0 && <SyllableGame key={game} onClose={(again) => setGame(again === 'again' ? game + 1 : 0)} />}

      {groups.map((g) => {
        const gd = g.list.filter((l) => isPassed(state.lessons[l.id])).length
        const isOpen = !!open[g.id]
        return (
          <section key={g.id} className="lesson-group">
            <button className="group-head" onClick={() => toggle(g.id)} aria-expanded={isOpen}>
              <span className="gh-title"><b className="ko">{g.ko}</b> <span>{g.th}</span></span>
              <span className={`gh-count ${gd === g.list.length ? 'full' : ''}`}>{gd === g.list.length ? '✓ ครบ' : `${gd}/${g.list.length}`}</span>
              <span className="gh-chev" aria-hidden="true">{isOpen ? '▾' : '▸'}</span>
            </button>
            {isOpen && (
              <>
                <p className="muted small">{g.note}</p>
                <div className="lesson-list">
                  {g.list.map((l) => <LessonCard key={l.id} l={l} rec={l.id === sug.id} onOpen={openLesson} />)}
                </div>
              </>
            )}
          </section>
        )
      })}
    </div>
  )
}
