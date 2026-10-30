import { useEffect, useMemo, useState } from 'react'
import { useGame } from '../game/store.jsx'
import { ALL_ITEMS } from '../data/lessons.js'
import { LEAD, VOWEL, TAIL, isSyllable, decompose, compose, choices, COMMON_LEAD, COMMON_VOWEL, COMMON_TAIL } from '../game/hangul.js'
import { syllableReward, SYLLABLE_CAP, stageFor } from '../game/logic.js'
import { speak, stopSpeech } from '../game/lessonVoice.js'
import { SpeakBtn } from '../components/ui.jsx'
import { Pet } from '../pixel/Characters.jsx'

const ROUNDS = 6
const MAX_TRIES = 2

// คำพยางค์เดียวทั้งหมดในบทเรียน เป็นโจทย์ให้ประกอบ
const TARGETS = ALL_ITEMS.filter((it) => it.kind === 'word' && isSyllable(it.ko))

function newRound(item) {
  const { l, v, t } = decompose(item.ko)
  return {
    item, l, v, t,
    leadOpts: choices(LEAD, l, 5, COMMON_LEAD.includes(l) ? COMMON_LEAD : [...COMMON_LEAD, l]),
    vowelOpts: choices(VOWEL, v, 5, COMMON_VOWEL.includes(v) ? COMMON_VOWEL : [...COMMON_VOWEL, v]),
    tailOpts: [0, ...choices(TAIL, t, 4, COMMON_TAIL.includes(t) ? COMMON_TAIL : [...COMMON_TAIL, t]).filter((x) => x !== 0)].slice(0, 5),
  }
}

function Tile({ label, on, state, onClick }) {
  return <button className={`syl-tile ko ${on ? 'on' : ''} ${state || ''}`} onClick={onClick}>{label}</button>
}

export default function SyllableGame({ onClose }) {
  const { state, dispatch } = useGame()
  const rounds = useMemo(() => [...TARGETS].sort(() => Math.random() - 0.5).slice(0, ROUNDS).map(newRound), [])
  const [i, setI] = useState(0)
  useEffect(() => () => stopSpeech(), [])
  const [pick, setPick] = useState({ l: null, v: null, t: 0 })
  const [tries, setTries] = useState(0)
  const [verdict, setVerdict] = useState(null) // null | 'wrong' | 'right' | 'fail'
  const [solved, setSolved] = useState(0)
  const [result, setResult] = useState(null)
  const r = rounds[i]

  const built = pick.l != null && pick.v != null ? compose(pick.l, pick.v, pick.t) : null
  const preview = built || (pick.l != null ? LEAD[pick.l] : pick.v != null ? VOWEL[pick.v] : '?')

  const check = () => {
    if (built == null || verdict === 'right' || verdict === 'fail') return
    if (pick.l === r.l && pick.v === r.v && pick.t === r.t) {
      setVerdict('right'); setSolved((n) => n + 1); speak(r.item.speak || r.item.ko)
      navigator.vibrate?.(15)
    } else if (tries + 1 >= MAX_TRIES) {
      setVerdict('fail'); setTries(tries + 1); speak(r.item.speak || r.item.ko)
    } else {
      setVerdict('wrong'); setTries(tries + 1); navigator.vibrate?.([30, 40, 30])
    }
  }

  const next = () => {
    if (i + 1 >= rounds.length) {
      const before = state.daily.syllable || 0
      const rw = syllableReward({ correct: solved, paid: before })
      dispatch({ type: 'SYLLABLE_DONE', correct: solved, total: rounds.length })
      setResult({ ...rw, solved })
      return
    }
    setI(i + 1); setPick({ l: null, v: null, t: 0 }); setTries(0); setVerdict(null)
  }

  const slotState = (kind) => (verdict === 'fail' || verdict === 'wrong') && pick[kind] !== r[kind] ? 'bad' : ''

  if (result) {
    return (
      <div className="overlay">
        <header className="lesson-head">
          <button className="icon-btn" onClick={onClose} aria-label="ปิด">✕</button>
          <div><div className="ko">🧩 글자 만들기</div><small>ประกอบพยางค์</small></div>
          <span />
        </header>
        <div className="result">
          <Pet stage={stageFor(state.pet.growth).id} mood="happy" scale={8} className="bob" />
          <h2>{result.solved === rounds.length ? '완벽해요! 🌟' : result.solved >= rounds.length / 2 ? '잘했어요! 👍' : '괜찮아요! 💪'}</h2>
          <p>ประกอบได้ถูก {result.solved}/{rounds.length} คำ</p>
          {result.n > 0 ? (
            <div className="rewards">
              <span className="reward">+{result.xp} XP</span>
              <span className="reward gold">+{result.coins} 🪙</span>
              <span className="reward pink">{state.pet.name} ❤️+{result.happy}</span>
            </div>
          ) : (
            <p className="muted">วันนี้รับรางวัลเกมนี้ครบแล้ว (สูงสุด {SYLLABLE_CAP} คำ/วัน) — เล่นฝึกต่อได้ไม่จำกัด · 🔥 streak ยังนับต่อ</p>
          )}
          <div className="row gap">
            <button className="pixel-btn" onClick={() => { setResult(null); onClose('again') }}>เล่นอีกรอบ</button>
            <button className="pixel-btn primary" onClick={() => onClose()}>กลับ</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="overlay">
      <header className="lesson-head">
        <button className="icon-btn" onClick={() => onClose()} aria-label="ปิด">✕</button>
        <div><div className="ko">🧩 글자 만들기</div><small>ประกอบพยางค์ · {i + 1}/{rounds.length}</small></div>
        <span />
      </header>

      <div className="syl">
        <div className="quiz-card pixel-box syl-prompt">
          <SpeakBtn text={r.item.speak || r.item.ko} />
          <div className="read">{r.item.read}</div>
          <div className="mean">{r.item.th}</div>
        </div>

        <div className={`syl-preview pixel-box ko ${verdict === 'right' ? 'right' : verdict === 'wrong' ? 'wrong' : ''}`}>{preview}</div>

        <div className="syl-row"><small>① พยัญชนะต้น</small>
          <div>{r.leadOpts.map((k) => <Tile key={k} label={LEAD[k]} on={pick.l === k} state={slotState('l') && pick.l === k ? 'bad' : ''} onClick={() => verdict !== 'right' && verdict !== 'fail' && setPick((p) => ({ ...p, l: k }))} />)}</div>
        </div>
        <div className="syl-row"><small>② สระ</small>
          <div>{r.vowelOpts.map((k) => <Tile key={k} label={VOWEL[k]} on={pick.v === k} state={slotState('v') && pick.v === k ? 'bad' : ''} onClick={() => verdict !== 'right' && verdict !== 'fail' && setPick((p) => ({ ...p, v: k }))} />)}</div>
        </div>
        <div className="syl-row"><small>③ ตัวสะกด (받침)</small>
          <div>{r.tailOpts.map((k) => <Tile key={k} label={k === 0 ? 'ไม่มี' : TAIL[k]} on={pick.t === k} state={slotState('t') && pick.t === k ? 'bad' : ''} onClick={() => verdict !== 'right' && verdict !== 'fail' && setPick((p) => ({ ...p, t: k }))} />)}</div>
        </div>

        {verdict === 'wrong' && <div className="feedback bad"><b>아쉬워요… ยังไม่ถูก ลองเปลี่ยนดูอีกครั้ง</b></div>}
        {(verdict === 'right' || verdict === 'fail') && (
          <div className={`feedback ${verdict === 'right' ? 'good' : 'bad'}`}>
            <div>
              <b>{verdict === 'right' ? '정답! ถูกต้อง 🎉' : 'เฉลย'}</b>
              <div className="fb-detail"><span className="ko">{r.item.ko}</span> = {LEAD[r.l]} + {VOWEL[r.v]}{r.t ? ` + ${TAIL[r.t]}` : ''} · {r.item.read}</div>
            </div>
            <button className="pixel-btn primary" onClick={next}>{i + 1 >= rounds.length ? 'ดูผล' : 'ต่อไป ▶'}</button>
          </div>
        )}
        {verdict !== 'right' && verdict !== 'fail' && (
          <button className="pixel-btn primary" disabled={built == null} onClick={check}>ตรวจคำตอบ ✔</button>
        )}
      </div>
    </div>
  )
}
