import { useEffect, useMemo, useRef, useState } from 'react'
import { useGame } from '../game/store.jsx'
import { Avatar, Pet } from '../pixel/Characters.jsx'
import Sprite from '../pixel/Sprite.jsx'
import { SPECIES } from '../pixel/pets.js'
import { stageFor, levelInfo } from '../game/logic.js'
import { speak, speakSeq } from '../game/lessonVoice.js'
import { playLine, stopVoice, preloadVoices } from '../game/voices.js'
import { voiceText } from '../game/voiceKey.js'
import { CHAPTERS, STORY_REWARD } from '../data/story.js'
import { FOOD_BY_ID } from '../data/shop.js'
import StoryBackdrop from './StoryBackdrop.jsx'

// คุณยายเจ้าของร้าน (สไปรต์ซ้ายขวาสมมาตร ครึ่งซ้ายเท่านั้น)
const mir = (h) => h + [...h].reverse().join('')
const GRAN = ['....kk', '...kgg', '..kggg', '..kgss', '..kses', '..ksps', '..kssr', '...kss', '..kccw', '.kcccw', '.kccww', '.kcwww', '.kcwww', '..kccc', '...kkk'].map(mir)
const GRAN_PAL = { k: '#3a2a3a', g: '#d8d8e6', s: '#f4cfa8', e: '#1b1424', p: '#f2a0a0', r: '#c94a4a', c: '#7a5ac8', w: '#ffffff' }

// รอยร้าวของไข่ (ขนาดเท่ากริดไข่ 12×12) วางทับบนไข่
const CRACK = ['............', '............', '............', '.....k.w....', '....kk.k....', '.....kk.....', '....k.kk....', '.....k.k....', '............', '............', '............', '............']

const NOTEBOOK = ['kkkkkkkk', 'kbbbbbbk', 'kbwwwwbk', 'kbwkkwbk', 'kbwwwwbk', 'kbbbbbbk', 'kkkkkkkk']

// คุณป้าแม่ค้าในตลาด
const VENDOR = ['....rr', '...rrr', '..krrr', '..ksss', '..kses', '..ksps', '..kssr', '...kss', '..kaaw', '.kaaaw', '.kaaww', '.kaaww', '.kaaaa', '..kaaa', '...kkk'].map(mir)
const VENDOR_PAL = { k: '#3a2a3a', r: '#e5484d', s: '#f0c49a', e: '#1b1424', p: '#f2a0a0', a: '#3fbf7f', w: '#ffffff' }

const WHO = { narr: null, gran: { ko: '할머니', th: 'คุณยาย' }, vendor: { ko: '아주머니', th: 'คุณป้าแม่ค้า' }, me: null, pet: null }

// ขั้นตอนฉาก: พิมพ์ข้อความทีละตัว แตะเพื่อข้าม/ไปต่อ · อ่านออกเสียงบรรทัดเกาหลีอัตโนมัติ
export default function StoryScene({ part, onDone, replay = false }) {
  const { state } = useGame()
  const { pet, player } = state
  const sp = SPECIES[pet.species] || SPECIES.tiger
  const fill = (t) => t.replaceAll('{name}', player.name).replaceAll('{pet}', pet.name).replaceAll('{soundRead}', sp.sound.read).replaceAll('{sound}', sp.sound.ko)
  const [i, setI] = useState(0)
  const [typed, setTyped] = useState(0)
  const [reply, setReply] = useState(null) // คำตอบของคู่สนทนาหลังผู้เล่นเลือกตัวเลือก
  const gives = useRef([]) // ของที่ได้จากตัวเลือก (ให้ตอนดูจบครั้งแรก)
  const [hint, setHint] = useState(false) // โหมดโจทย์: ขอคำใบ้ = เผยคำอ่าน/คำแปล
  const timer = useRef(null)
  useEffect(() => { preloadVoices(); return () => stopVoice() }, [])
  const scenes = typeof part.scenes === 'function' ? part.scenes(pet.species) : part.scenes
  const end = i >= scenes.length
  const sc = end ? null : scenes[i]
  const line = reply || sc // บรรทัดที่กำลังแสดง: คำตอบหลังเลือก หรือบทของฉาก
  const ko = line ? fill(line.ko) : ''
  const choosing = !!sc?.options && !reply
  const quizHide = !!sc?.quiz && choosing && !hint // โจทย์ทดสอบ: ซ่อนคำแปล/คำอ่านไว้ก่อน ไม่ให้เฉลยในตัวโจทย์
  // สลับลำดับตัวเลือกทุกครั้งที่เข้าฉาก ไม่ให้ข้อถูกอยู่ที่เดิม
  const options = useMemo(() => (sc?.options ? [...sc.options].sort(() => Math.random() - 0.5) : null), [i]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setHint(false) }, [i])

  useEffect(() => {
    if (!line) return undefined
    setTyped(0)
    const gender = player.look?.gender
    const say = () => playLine({ who: line.who, text: voiceText(ko), gender, species: pet.species })
    if (reply?.said) playLine({ who: 'me', text: voiceText(reply.said.ko), gender, species: pet.species, onDone: say }) // พูดตัวเลือกที่เลือกก่อน แล้วคู่สนทนาตอบ
    else say()
    let n = 0
    timer.current = setInterval(() => { n += 1; setTyped(n); if (n >= ko.length) clearInterval(timer.current) }, 45)
    return () => clearInterval(timer.current)
  }, [i, reply]) // eslint-disable-line react-hooks/exhaustive-deps

  const tap = () => {
    if (end) return
    if (typed < ko.length) { clearInterval(timer.current); setTyped(ko.length); return }
    if (choosing) return
    if (reply) { const r = reply; setReply(null); if (!r.retry) setI(i + 1); return } // ตอบผิด = ถามใหม่ ตอบถูก = ไปต่อ
    setI(i + 1)
  }

  const pick = (o) => {
    if (o.ok !== false && o.give) gives.current.push(o.give)
    setReply({ ...o.reply, said: o, retry: o.ok === false })
  }

  const show = sc?.show || {}
  const who = line?.who
  const stage = stageFor(pet.growth).id
  const petStage = show.pet ? (stage === 'egg' ? 'baby' : stage) : 'baby'
  const speaker = who === 'gran' || who === 'vendor' ? WHO[who] : who === 'me' ? { ko: player.name, th: `Lv.${levelInfo(player.xp).level}` } : who === 'pet' ? { ko: pet.name, th: sp.th } : null
  const vocab = [...new Map(scenes.flatMap((s) => [...(s.vocab || []), ...(s.options || []).flatMap((o) => (o.ok === false ? [] : o.vocab || []))]).map((v) => [v.ko, v])).values()]
  // คำสำคัญ ≤ 8 คำ: คำจากตัวเลือกที่ผู้เล่นได้ใช้ก่อน แล้วค่อยคำสั้น ๆ จากบทพูด · ที่เหลือพับเก็บไว้ ไม่ให้หน้าสรุปเป็นกำแพงคำ
  const optionKo = new Set(scenes.flatMap((s) => (s.options || []).flatMap((o) => (o.ok === false ? [] : (o.vocab || []).map((v) => v.ko)))))
  const ranked = [...vocab].sort((a, b) => (optionKo.has(b.ko) ? 1 : 0) - (optionKo.has(a.ko) ? 1 : 0) || (a.ko.length > 7 ? 1 : 0) - (b.ko.length > 7 ? 1 : 0))
  const keyWords = ranked.slice(0, 8)
  const restWords = ranked.slice(8)
  const first = !state.story?.seen?.[part.id] && !replay

  return (
    <div className={`story sbg-${sc?.bg || scenes[scenes.length - 1].bg || 'room'}`} onClick={tap}>
      <StoryBackdrop bg={sc?.bg || scenes[scenes.length - 1].bg || 'room'} />
      <div className="story-top">
        <small className="ko">{part.title} · {part.th}</small>
        <button className="skip-pill" onClick={(e) => { e.stopPropagation(); onDone() }}>ข้าม ⏭</button>
      </div>
      {!end && (
        <>
          <div className="story-stage">
            {show.gran && <div className={`st-char ${who === 'gran' ? 'talk' : ''}`}><Sprite grid={GRAN} pal={GRAN_PAL} outline="#1b1424" scale={7} className="bob" /></div>}
            {show.vendor && <div className={`st-char ${who === 'vendor' ? 'talk' : ''}`}><Sprite grid={VENDOR} pal={VENDOR_PAL} outline="#1b1424" scale={7} className="bob" /></div>}
            {show.avatar && <div className={`st-char ${who === 'me' ? 'talk' : ''}`}><Avatar scale={6} mood={sc.pose === 'happy' ? 'happy' : 'normal'} className="idle" /></div>}
            {show.book && <div className="st-char st-prop"><Sprite grid={NOTEBOOK} pal={{ k: '#1b1424', b: '#4f8cff', w: '#fff' }} scale={5} className="bob" /></div>}
            {show.egg && (
              <div className={`st-char egg-wrap ${show.egg}`}>
                {show.egg === 'crack' && <><span className="egg-glow" /><Sprite grid={CRACK} pal={{ k: '#2a1a12', w: '#fffbe0' }} scale={6} className="egg-crack" /></>}
                <Pet stage="egg" scale={6} outfit={{}} className={show.egg === 'crack' ? 'shake' : 'wobble'} />
                {show.egg === 'crack' && ['✨', '✨', '⭐'].map((e, k) => <span key={k} className={`fx-part spark s${k}`}>{e}</span>)}
              </div>
            )}
            {show.pet && <div className={`st-char ${who === 'pet' ? 'talk' : ''}`}><Pet stage={petStage} mood={sc.pose === 'happy' ? 'happy' : 'normal'} scale={petStage === 'adult' ? 5 : 6} outfit={pet.outfit} className="bob" /></div>}
          </div>
          <div className={`story-box pixel-box ${reply ? (reply.retry ? 'wrong' : 'right') : ''}`}>
            {speaker && <div className="story-name"><b className="ko">{speaker.ko}</b> <small className="muted">{speaker.th}</small></div>}
            <div className="story-ko ko">{ko.slice(0, typed)}<span className="caret">{typed < ko.length ? '▌' : ''}</span></div>
            <div className={`story-sub ${typed >= ko.length && !quizHide ? 'on' : ''}`}>
              <small className="read">{fill(line.read)}</small>
              <span>{fill(line.th)}</span>
            </div>
            {choosing && typed >= ko.length && (
              <div className="story-opts" onClick={(e) => e.stopPropagation()}>
                {options.map((o) => (
                  <button key={o.ko} className="story-opt" onClick={() => pick(o)}>
                    <b className="ko">{o.ko}</b>
                    {!quizHide && <small className="read">{o.read}</small>}
                    {!quizHide && <small>{o.th}</small>}
                  </button>
                ))}
                {quizHide && <button className="hint-btn" onClick={() => setHint(true)}>💡 ขอคำใบ้ (ดูคำอ่านและคำแปล)</button>}
              </div>
            )}
            <small className="story-next muted">{typed >= ko.length && !choosing ? (reply?.retry ? '▼ แตะเพื่อลองใหม่' : '▼ แตะเพื่อไปต่อ') : ''}</small>
          </div>
          <div className="dots story-dots">{scenes.map((_, k) => <span key={k} className={k === i ? 'cur' : k < i ? 'done' : ''} />)}</div>
        </>
      )}
      {end && (
        <div className="story-end pixel-box" onClick={(e) => e.stopPropagation()}>
          <h2 className="ko">{part.title}</h2>
          <small className="muted">จบช่วงนี้แล้ว · {part.th}</small>
          {vocab.length > 0 && (
            <>
              <b>📝 คำสำคัญของช่วงนี้</b>
              <div className="vocab-key">
                {keyWords.map((v) => (
                  <button key={v.ko} className="vk-card" onClick={() => speak(v.ko)} aria-label={`ฟัง ${v.ko}`}>
                    <span className="vk-ico">🔊</span>
                    <b className="ko">{v.ko}</b>
                    <small>{v.th}</small>
                  </button>
                ))}
              </div>
              <button className="pixel-btn small" onClick={() => speakSeq(keyWords.map((v) => v.ko), { slow: false })}>▶ ฟังคำสำคัญทั้งหมด</button>
              {restWords.length > 0 && (
                <details className="vocab-more">
                  <summary>คำอื่นที่เจอ ({restWords.length})</summary>
                  <div className="vocab-chips">
                    {restWords.map((v) => <button key={v.ko} className="chip" onClick={() => speak(v.ko)}><b className="ko">{v.ko}</b> <small>{v.th}</small></button>)}
                  </div>
                </details>
              )}
            </>
          )}
          {first && <div className="rewards"><span className="reward gold">+{STORY_REWARD} 🪙</span>{gives.current.map((id, k) => <span key={k} className="reward">{FOOD_BY_ID[id]?.icon} {FOOD_BY_ID[id]?.th}</span>)}</div>}
          <button className="pixel-btn primary" onClick={() => onDone(gives.current)}>{replay ? 'ปิด' : '계속! ไปต่อ'}</button>
        </div>
      )}
    </div>
  )
}

// สมุดเรื่องราว: รายการช่วงที่ปลดล็อกแล้ว (เล่นซ้ำได้) และช่วงที่ยังล็อกพร้อมคำใบ้
export function StoryBook({ onClose, onPlay }) {
  const { state } = useGame()
  const seen = state.story?.seen || {}
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal pixel-box" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button className="modal-x" onClick={onClose} aria-label="ปิด">✕</button>
        <h2 className="center">📖 เรื่องราว</h2>
        {CHAPTERS.map((c) => (
          <div key={c.id} className="story-chap">
            <b className="ko">{c.ko}</b> <small className="muted">{c.th}</small>
            {c.parts.map((p) => (
              <button key={p.id} className="story-row" disabled={!seen[p.id]} onClick={() => onPlay(p)}>
                <span>{seen[p.id] ? '▶' : '🔒'}</span>
                <span className="ko">{seen[p.id] ? p.title : '???'}</span>
                <small className="muted">{seen[p.id] ? p.th : p.hint}</small>
              </button>
            ))}
          </div>
        ))}
        <small className="muted">ตอนต่อไปกำลังมา… 🌙</small>
        <small className="muted">🎙 เสียงพากย์สร้างด้วย AI (Supertonic 2)</small>
        <button className="pixel-btn" onClick={onClose}>ปิด</button>
      </div>
    </div>
  )
}
