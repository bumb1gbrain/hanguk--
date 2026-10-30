import { useState } from 'react'
import { useGame } from '../game/store.jsx'
import { ROUTINE, ROUTINE_TIMES } from '../data/routine.js'
import { SpeakBtn } from '../components/ui.jsx'
import { speak } from '../game/lessonVoice.js'

// ช่วงเวลาปัจจุบัน: เช้า 05–11 · กลางวัน 11–18 · กลางคืน 18–05
const currentTime = (h) => (h >= 5 && h < 11 ? 'morning' : h >= 11 && h < 18 ? 'day' : 'night')

export default function Routine() {
  const { state, dispatch } = useGame()
  const [edit, setEdit] = useState(false)
  const done = new Set(state.daily.routine)
  const off = state.player.routineOff || []
  const active = ROUTINE.length - off.length
  const now = currentTime(new Date().getHours())
  // กลุ่มของช่วงเวลาตอนนี้ขึ้นก่อน
  const groups = [...ROUTINE_TIMES].sort((a, b) => (a.id === now ? -1 : b.id === now ? 1 : 0))

  return (
    <div className="page">
      <div className="row between">
        <h2 className="section-title">오늘의 루틴 · กิจวัตรวันนี้</h2>
        <button className="pixel-btn small" onClick={() => setEdit(!edit)}>{edit ? '✔ เสร็จ' : '✎ ปรับ'}</button>
      </div>
      {edit ? (
        <div className="tip">⚙ เลือกกิจวัตรที่ตรงกับชีวิตจริงของคุณ (ต้องเหลืออย่างน้อย 3 ข้อ) ข้อที่ปิดจะไม่แสดงและไม่นับในเป้าหมาย</div>
      ) : (
        <div className="tip">
          💡 ติ๊กเมื่อทำเสร็จจริง แล้วพูดตามประโยคเกาหลี! ประโยคเหล่านี้ใช้รูปอดีต <b className="ko">-았/었어요</b> = “…แล้ว”
          <br />เช่น 먹다 (กิน) → <b className="ko">먹었어요</b> (กินแล้ว) · 하다 (ทำ) → <b className="ko">했어요</b> (ทำแล้ว)
        </div>
      )}
      {groups.map((t) => {
        const list = ROUTINE.filter((r) => r.time === t.id && (edit || !off.includes(r.id)))
        if (!list.length) return null
        return (
          <section key={t.id}>
            <h3 className="time-title">
              <span className="ko">{t.ko}</span> · {t.th}
              {t.id === now && !edit && <span className="badge now-badge">ตอนนี้</span>}
            </h3>
            <div className="routine-list">
              {list.map((r) => {
                const ok = done.has(r.id)
                const isOff = off.includes(r.id)
                if (edit) {
                  return (
                    <div
                      key={r.id}
                      role="button"
                      tabIndex={0}
                      className={`routine pixel-box ${isOff ? 'off' : ''}`}
                      onClick={() => dispatch({ type: 'TOGGLE_ROUTINE', id: r.id })}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') dispatch({ type: 'TOGGLE_ROUTINE', id: r.id }) }}
                    >
                      <span className="check">{isOff ? '' : '✔'}</span>
                      <span className="r-icon">{r.icon}</span>
                      <span className="r-text">
                        <span className="ko">{r.ko}</span>
                        <small>{r.th}</small>
                      </span>
                    </div>
                  )
                }
                return (
                  <div
                    key={r.id}
                    role="button"
                    tabIndex={0}
                    className={`routine pixel-box ${ok ? 'checked' : ''}`}
                    onClick={() => { if (!ok) { dispatch({ type: 'ROUTINE_CHECK', id: r.id }); speak(r.ko) } }}
                    onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !ok) { dispatch({ type: 'ROUTINE_CHECK', id: r.id }); speak(r.ko) } }}
                  >
                    <span className="check">{ok ? '✔' : ''}</span>
                    <span className="r-icon">{r.icon}</span>
                    <span className="r-text">
                      <span className="ko">{r.ko}</span>
                      <small>{r.read} · {r.th}</small>
                    </span>
                    {ok ? <span className="earned">+5</span> : <SpeakBtn text={r.ko} small />}
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}
      <p className="muted small center">รีเซ็ตทุกวันตอนเที่ยงคืน · ทำครบ {active} ข้อได้ {active * 5} XP</p>
    </div>
  )
}
