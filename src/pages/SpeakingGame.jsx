import { useEffect, useMemo, useRef, useState } from 'react'
import { useGame } from '../game/store.jsx'
import { ALL_ITEMS, ITEM_BY_ID } from '../data/lessons.js'
import { isSyllable } from '../game/hangul.js'
import { shuffle, speakReward, SPEAK_CAP, stageFor } from '../game/logic.js'
import { canListen, listen, STT_ERRORS } from '../game/stt.js'
import { evaluateSpeech, LEVELS } from '../game/speech_score.js'
import { speak } from '../game/tts.js'
import { Pet } from '../pixel/Characters.jsx'

const ROUNDS = 5
const MAX_TRIES = 3
const LEVEL_KEY = 'hb-speak-level'

// โจทย์: คำ/ประโยคที่ผู้เล่นเรียนแล้วก่อน (ที่ยังไม่เพียงพอเติมจากบทเรียนทั้งหมด) ความยาวไม่เกิน 14 พยางค์
const sylCount = (it) => [...it.ko].filter(isSyllable).length
const speakable = (it) => it.kind !== 'letter' && sylCount(it) >= 1 && sylCount(it) <= 14
function pickItems(srs) {
  const learned = Object.keys(srs).map((id) => ITEM_BY_ID[id]).filter(Boolean).filter(speakable)
  const rest = ALL_ITEMS.filter((it) => speakable(it) && !srs[it.id])
  return [...shuffle(learned), ...shuffle(rest)].slice(0, ROUNDS)
}

// ตัวเลขวิ่งขึ้นจาก 0 → value เพื่อให้คะแนนดูลื่น (restartKey เปลี่ยนเมื่อมีผลรอบใหม่)
function useCountUp(value, restartKey, ms = 650) {
  const [v, setV] = useState(0)
  useEffect(() => {
    let raf
    let start
    setV(0)
    const step = (t) => {
      if (start === undefined) start = t
      const p = Math.min(1, (t - start) / ms)
      setV(Math.round(value * (1 - (1 - p) ** 3)))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [value, restartKey, ms])
  return v
}

const STATUS_LABEL = { match: 'ตรง', soft: 'เสียงเหมือนกัน', sub: 'ไม่ตรง', miss: 'ไม่ได้ยิน', extra: 'เกินมา' }
const opStatus = (o) => (o.type === 'match' && o.soft ? 'soft' : o.type)

// กระดานเปรียบเทียบ: แถวบน = ที่ควรพูด, แถวล่าง = ที่ระบบได้ยิน (จัดแนวทีละพยางค์)
function CompareBoard({ ops }) {
  return (
    <div className="cmp" role="table" aria-label="เปรียบเทียบสิ่งที่พูดกับประโยคเป้าหมาย">
      <div className="cmp-label"><span>ควรพูด</span><span>ได้ยิน</span></div>
      <div className="cmp-cols">
        {ops.map((o, k) => {
          const st = opStatus(o)
          return (
            <button key={k} className={`cmp-col ${st}`} onClick={() => speak(o.t || o.h)} title={STATUS_LABEL[st]} aria-label={`${o.t || '—'} ${STATUS_LABEL[st]}`}>
              <span className="cmp-exp ko">{o.t || '·'}</span>
              <span className="cmp-mark">{st === 'match' ? '✓' : st === 'soft' ? '≈' : st === 'miss' ? '∅' : st === 'extra' ? '+' : '✗'}</span>
              <span className="cmp-got ko">{o.h || '·'}</span>
            </button>
          )
        })}
      </div>
      <div className="cmp-legend">
        <span className="ok">✓ ตรง</span><span className="soft">≈ เสียงเหมือนกัน</span><span className="bad">✗ ไม่ตรง</span><span className="miss">∅ ไม่ได้ยิน</span><span className="extra">+ เกินมา</span>
        <small className="muted">แตะช่องเพื่อฟังพยางค์นั้น</small>
      </div>
    </div>
  )
}

export default function SpeakingGame({ onClose }) {
  const { state, dispatch } = useGame()
  const supported = canListen()
  const items = useMemo(() => pickItems(state.srs), []) // eslint-disable-line react-hooks/exhaustive-deps
  const [level, setLevel] = useState(() => { try { return localStorage.getItem(LEVEL_KEY) === 'strict' ? 'strict' : 'standard' } catch { return 'standard' } })
  const [i, setI] = useState(0)
  const [phase, setPhase] = useState('ready') // ready | listening | result
  const [tries, setTries] = useState(0)
  const [history, setHistory] = useState([]) // คะแนนของแต่ละครั้งในประโยคนี้
  const [res, setRes] = useState(null)
  const [live, setLive] = useState('') // ข้อความที่กำลังฟังอยู่สด ๆ
  const [silent, setSilent] = useState(false)
  const [error, setError] = useState(null)
  const [passed, setPassed] = useState(0)
  const [recap, setRecap] = useState([])
  const [summary, setSummary] = useState(null)
  const ctl = useRef(null)
  const it = items[i]
  const cfg = LEVELS[level]
  const shown = useCountUp(res?.score ?? 0, tries)

  useEffect(() => () => ctl.current?.abort(), [])

  const changeLevel = (lv) => {
    setLevel(lv)
    try { localStorage.setItem(LEVEL_KEY, lv) } catch { /* ignore */ }
  }

  const start = () => {
    if (phase === 'listening') return
    setError(null); setLive(''); setSilent(false); setRes(null)
    setPhase('listening')
    ctl.current = listen({
      onInterim: (t) => { setLive(t); setSilent(false) },
      onSilence: () => setSilent(true),
      onResult: (alts) => {
        const r = evaluateSpeech(it.ko, alts, level)
        setRes(r)
        setTries((t) => t + 1)
        setHistory((h) => [...h, r.score])
        setPhase('result')
        navigator.vibrate?.(r.passed ? 15 : [30, 40, 30])
      },
      onError: (code) => { setError(STT_ERRORS[code] || `เกิดข้อผิดพลาด (${code})`); setPhase('ready') },
      onEnd: (got) => setPhase((p) => (p === 'listening' && !got ? 'ready' : p)),
    })
  }

  const stop = () => ctl.current?.stop()

  const solved = !!res?.passed
  const outOfTries = !solved && tries >= MAX_TRIES

  const retry = () => { setPhase('ready'); setRes(null); setLive('') }

  const next = () => {
    const nowPassed = passed + (solved ? 1 : 0)
    const entry = { ko: it.ko, best: history.length ? Math.max(...history) : 0, passed: solved, tries }
    const nextRecap = [...recap, entry]
    if (i + 1 >= items.length) {
      const before = state.daily.speaking || 0
      const rw = speakReward({ passed: nowPassed, paid: before })
      dispatch({ type: 'SPEAK_DONE', passed: nowPassed, total: items.length })
      setRecap(nextRecap)
      setSummary({ ...rw, passed: nowPassed })
      return
    }
    setRecap(nextRecap)
    setPassed(nowPassed)
    setI(i + 1)
    setPhase('ready'); setTries(0); setHistory([]); setRes(null); setError(null); setLive('')
  }

  // คีย์ลัดบนคอมพิวเตอร์: Space = เริ่ม/หยุดฟัง · Enter = ต่อไป/ลองอีกครั้ง
  const keyRef = useRef(null)
  keyRef.current = { phase, solved, outOfTries, start, stop, next, retry, summary }
  useEffect(() => {
    const onKey = (e) => {
      const k = keyRef.current
      if (k.summary || ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName)) return
      if (e.code === 'Space') {
        e.preventDefault()
        if (k.phase === 'ready') k.start()
        else if (k.phase === 'listening') k.stop()
      } else if (e.key === 'Enter' && k.phase === 'result') {
        e.preventDefault()
        if (k.solved || k.outOfTries) k.next()
        else k.retry()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const header = (
    <header className="lesson-head">
      <button className="icon-btn" onClick={() => onClose()} aria-label="ปิด">✕</button>
      <div><div className="ko">🎤 말하기 연습</div><small>ฝึกพูดตาม{summary ? '' : ` · ${i + 1}/${items.length}`}</small></div>
      <span />
    </header>
  )

  if (!supported) {
    return (
      <div className="overlay">
        {header}
        <div className="speak-box">
          <div className="tip">
            🎤 เบราว์เซอร์นี้ยังไม่รองรับการฟังเสียงพูด (Web Speech API)<br />
            ลองเปิดแอปนี้ใน <b>Chrome / Edge</b> (คอมพิวเตอร์, Android) หรือ <b>Safari</b> (iPhone/Mac) แล้วลองใหม่
          </div>
          <button className="pixel-btn primary" onClick={() => onClose()}>กลับ</button>
        </div>
      </div>
    )
  }

  if (summary) {
    return (
      <div className="overlay">
        {header}
        <div className="result">
          <Pet stage={stageFor(state.pet.growth).id} mood="happy" scale={7} className="bob" />
          <h2>{summary.passed === items.length ? '완벽해요! 🌟' : summary.passed >= items.length / 2 ? '잘했어요! 👍' : '괜찮아요! 💪'}</h2>
          <p>พูดผ่าน {summary.passed}/{items.length} ประโยค</p>
          <div className="recap">
            {recap.map((r, k) => (
              <div key={k} className={`recap-row ${r.passed ? 'ok' : 'bad'}`}>
                <span className="ko">{r.ko}</span>
                <span className="mono">{r.best}</span>
                <span>{r.passed ? '✓' : '✗'}</span>
              </div>
            ))}
          </div>
          {summary.n > 0 ? (
            <div className="rewards">
              <span className="reward">+{summary.xp} XP</span>
              <span className="reward gold">+{summary.coins} 🪙</span>
              <span className="reward pink">{state.pet.name} ❤️+{summary.happy}</span>
            </div>
          ) : (
            <p className="muted">วันนี้รับรางวัลฝึกพูดครบแล้ว (สูงสุด {SPEAK_CAP} ประโยค/วัน) — ฝึกต่อได้ไม่จำกัด · 🔥 streak ยังนับต่อ</p>
          )}
          <div className="row gap">
            <button className="pixel-btn" onClick={() => onClose('again')}>ฝึกอีกรอบ</button>
            <button className="pixel-btn primary" onClick={() => onClose()}>กลับ</button>
          </div>
        </div>
      </div>
    )
  }

  const verdict = res
    ? res.great ? { t: '정답! ยอดเยี่ยมมาก', c: 'great' } : solved ? { t: '좋아요! ผ่านแล้ว', c: 'ok' } : { t: '아쉬워요… ยังไม่ผ่าน', c: 'bad' }
    : null

  return (
    <div className="overlay">
      {header}
      <div className="speak-box">
        <div className="sp-top">
          <div className="dots-row">{items.map((_, k) => <span key={k} className={k < i ? 'done' : k === i ? 'cur' : ''} />)}</div>
          <div className="seg" role="group" aria-label="เกณฑ์การให้คะแนน">
            {Object.entries(LEVELS).map(([k, v]) => (
              <button key={k} className={`seg-opt ${level === k ? 'on' : ''}`} onClick={() => changeLevel(k)}>
                <b>{v.pass}</b><small>{v.th}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="sp-card pixel-box">
          <span className="sp-cap">🗣 พูดตามประโยคนี้</span>
          <div className="big-ko speak-text">{it.ko}</div>
          <div className="sp-read">{it.read}</div>
          <div className="sp-rom mono">{it.rom}</div>
          <div className="sp-mean">{it.th}</div>
          <div className="sp-listen">
            <button className="pixel-btn" onClick={() => speak(it.speak || it.ko)}>🔊 ฟังตัวอย่าง</button>
            <button className="pixel-btn" onClick={() => speak(it.speak || it.ko, 0.55)}>🐢 ช้า ๆ</button>
          </div>
        </div>

        {phase === 'ready' && (
          <div className="mic-wrap">
            <button className="mic-btn" onClick={start} aria-label="เริ่มพูด">
              <span className="mic-ring" /><span className="mic-ring r2" />
              <span className="mic-core"><span className="mic-ico">🎤</span></span>
            </button>
            <b className="mic-label">แตะเพื่อเริ่มพูด</b>
            <small className="muted">
              {tries > 0 ? `ลองแล้ว ${tries}/${MAX_TRIES} ครั้ง · ` : ''}ผ่านที่ {cfg.pass} คะแนน<span className="kbd-hint"> · กด Space เพื่อเริ่ม</span>
            </small>
          </div>
        )}

        {phase === 'listening' && (
          <div className="mic-wrap">
            <button className="mic-btn live" onClick={stop} aria-label="หยุดฟัง">
              <span className="mic-ring" /><span className="mic-ring r2" />
              <span className="mic-core"><span className="wave" aria-hidden="true"><i /><i /><i /><i /><i /></span></span>
            </button>
            <b className="mic-label">{silent ? 'ยังไม่ได้ยินเสียง… ฟังอีกครั้ง' : 'กำลังฟัง… พูดได้เลย'}</b>
            <small className="muted">แตะปุ่มเพื่อหยุดเมื่อพูดจบ</small>
            <div className={`live-box ${live ? 'on' : ''}`} aria-live="polite">
              <small className="muted">ระบบได้ยินว่า</small>
              <div className="ko live-text">{live || <span className="blink">…</span>}</div>
            </div>
          </div>
        )}

        {error && <div className="tip bad-tip">⚠️ {error}</div>}

        {phase === 'result' && res && (
          <div className={`speak-result ${verdict.c}`}>
            <div className="speak-score">
              <span className={`score-ring ${verdict.c}`} data-score={res.score}>{shown}</span>
              <div className="score-text">
                <b>{verdict.t}</b>
                <small className="muted">เกณฑ์ผ่าน {cfg.pass} · {cfg.th}</small>
                {history.length > 1 && <small className="hist">ครั้งที่ 1…{history.length}: {history.join(' → ')}</small>}
              </div>
            </div>

            <div className="heard-box">
              <small className="muted">คุณพูดว่า (ตามที่ระบบได้ยิน)</small>
              <div className="ko heard-text">{res.heard || '— ไม่ได้ยินเสียง —'}</div>
            </div>

            <CompareBoard ops={res.ops} />

            {res.problems.length > 0 && (
              <div className="problems">
                <b>จุดที่ควรแก้ ({res.problems.length})</b>
                {res.problems.map((p, k) => (
                  <div key={k} className={`problem ${opStatus(p.op)}`}>
                    <div className="p-title">{p.title}</div>
                    {p.lines.map((l, n) => <div key={n} className="p-line">• {l}</div>)}
                    {p.tips.map((t, n) => <div key={n} className="p-tip">💡 {t}</div>)}
                  </div>
                ))}
              </div>
            )}
            {res.problems.length === 0 && <div className="tip good">พยางค์ครบและตรงทุกตัว 🎉</div>}
            <small className="muted fine">ระบบเดาจาก “ข้อความที่ฟังได้” จึงบอกได้แค่ว่าฟังเป็นคำไหน ไม่ได้วัดสำเนียงละเอียด</small>

            <div className="row gap speak-actions">
              {!solved && !outOfTries && <button className="pixel-btn primary" onClick={retry}>🔁 ลองอีกครั้ง</button>}
              <button className={`pixel-btn ${solved || outOfTries ? 'primary' : ''}`} onClick={next}>
                {i + 1 >= items.length ? 'ดูผล' : solved ? 'ต่อไป ▶' : 'ข้าม ▶'}
              </button>
            </div>
          </div>
        )}

        {phase !== 'result' && <button className="link sp-skip" onClick={next}>ข้ามประโยคนี้ ▶</button>}
        <details className="sp-privacy">
          <summary>🔒 เสียงของคุณไปที่ไหน?</summary>
          <p>การฟังใช้ระบบรู้จำเสียงของเบราว์เซอร์ (Chrome ใช้ของ Google, Safari ใช้ของ Apple) แอปนี้ไม่ได้อัดหรือเก็บเสียงของคุณไว้เลย</p>
        </details>
      </div>
    </div>
  )
}
