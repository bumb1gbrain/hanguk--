import { useEffect, useRef, useState } from 'react'
import { useGame } from '../game/store.jsx'
import { Avatar, Pet } from '../pixel/Characters.jsx'
import Sprite from '../pixel/Sprite.jsx'
import { SPECIES } from '../pixel/pets.js'
import { stageFor, levelInfo } from '../game/logic.js'
import { speak } from '../game/tts.js'
import { CHAPTERS, STORY_REWARD } from '../data/story.js'
import StoryBackdrop from './StoryBackdrop.jsx'

// คุณยายเจ้าของร้าน (สไปรต์ซ้ายขวาสมมาตร ครึ่งซ้ายเท่านั้น)
const mir = (h) => h + [...h].reverse().join('')
const GRAN = ['....kk', '...kgg', '..kggg', '..kgss', '..kses', '..ksps', '..kssr', '...kss', '..kccw', '.kcccw', '.kccww', '.kcwww', '.kcwww', '..kccc', '...kkk'].map(mir)
const GRAN_PAL = { k: '#3a2a3a', g: '#d8d8e6', s: '#f4cfa8', e: '#1b1424', p: '#f2a0a0', r: '#c94a4a', c: '#7a5ac8', w: '#ffffff' }

// รอยร้าวของไข่ (ขนาดเท่ากริดไข่ 12×12) วางทับบนไข่
const CRACK = ['............', '............', '............', '.....k.w....', '....kk.k....', '.....kk.....', '....k.kk....', '.....k.k....', '............', '............', '............', '............']

const WHO = { narr: null, gran: { ko: '할머니', th: 'คุณยาย' }, me: null, pet: null }

// ขั้นตอนฉาก: พิมพ์ข้อความทีละตัว แตะเพื่อข้าม/ไปต่อ · อ่านออกเสียงบรรทัดเกาหลีอัตโนมัติ
export default function StoryScene({ part, onDone, replay = false }) {
  const { state } = useGame()
  const { pet, player } = state
  const sp = SPECIES[pet.species] || SPECIES.tiger
  const fill = (t) => t.replaceAll('{name}', player.name).replaceAll('{pet}', pet.name).replaceAll('{soundRead}', sp.sound.read).replaceAll('{sound}', sp.sound.ko)
  const [i, setI] = useState(0)
  const [typed, setTyped] = useState(0)
  const timer = useRef(null)
  const scenes = typeof part.scenes === 'function' ? part.scenes(pet.species) : part.scenes
  const end = i >= scenes.length
  const sc = end ? null : scenes[i]
  const ko = sc ? fill(sc.ko) : ''

  useEffect(() => {
    if (!sc) return undefined
    setTyped(0)
    speak(ko.replace(/[“”?!~…]/g, ''))
    let n = 0
    timer.current = setInterval(() => { n += 1; setTyped(n); if (n >= ko.length) clearInterval(timer.current) }, 45)
    return () => clearInterval(timer.current)
  }, [i]) // eslint-disable-line react-hooks/exhaustive-deps

  const tap = () => {
    if (end) return
    if (typed < ko.length) { clearInterval(timer.current); setTyped(ko.length); return }
    setI(i + 1)
  }

  const show = sc?.show || {}
  const who = sc?.who
  const stage = stageFor(pet.growth).id
  const petStage = show.pet ? (stage === 'egg' ? 'baby' : stage) : 'baby'
  const speaker = who === 'gran' ? WHO.gran : who === 'me' ? { ko: player.name, th: `Lv.${levelInfo(player.xp).level}` } : who === 'pet' ? { ko: pet.name, th: sp.th } : null
  const vocab = [...new Map(scenes.flatMap((s) => s.vocab || []).map((v) => [v.ko, v])).values()]
  const first = !state.story?.seen?.[part.id] && !replay

  return (
    <div className={`story sbg-${sc?.bg || scenes[scenes.length - 1].bg || 'room'}`} onClick={tap}>
      <StoryBackdrop bg={sc?.bg || scenes[scenes.length - 1].bg || 'room'} />
      <div className="story-top">
        <small className="ko">{part.title} · {part.th}</small>
        <button className="link" onClick={(e) => { e.stopPropagation(); onDone() }}>ข้าม ⏭</button>
      </div>
      {!end && (
        <>
          <div className="story-stage">
            {show.gran && <div className={`st-char ${who === 'gran' ? 'talk' : ''}`}><Sprite grid={GRAN} pal={GRAN_PAL} outline="#1b1424" scale={7} className="bob" /></div>}
            {show.avatar && <div className={`st-char ${who === 'me' ? 'talk' : ''}`}><Avatar scale={6} mood={sc.pose === 'happy' ? 'happy' : 'normal'} className="idle" /></div>}
            {show.egg && (
              <div className={`st-char egg-wrap ${show.egg}`}>
                {show.egg === 'crack' && <><span className="egg-glow" /><Sprite grid={CRACK} pal={{ k: '#2a1a12', w: '#fffbe0' }} scale={6} className="egg-crack" /></>}
                <Pet stage="egg" scale={6} outfit={{}} className={show.egg === 'crack' ? 'shake' : 'wobble'} />
                {show.egg === 'crack' && ['✨', '✨', '⭐'].map((e, k) => <span key={k} className={`fx-part spark s${k}`}>{e}</span>)}
              </div>
            )}
            {show.pet && <div className={`st-char ${who === 'pet' ? 'talk' : ''}`}><Pet stage={petStage} mood={sc.pose === 'happy' ? 'happy' : 'normal'} scale={petStage === 'adult' ? 5 : 6} outfit={pet.outfit} className="bob" /></div>}
          </div>
          <div className="story-box pixel-box">
            {speaker && <div className="story-name"><b className="ko">{speaker.ko}</b> <small className="muted">{speaker.th}</small></div>}
            <div className="story-ko ko">{ko.slice(0, typed)}<span className="caret">{typed < ko.length ? '▌' : ''}</span></div>
            <div className={`story-sub ${typed >= ko.length ? 'on' : ''}`}>
              <small className="read">{fill(sc.read)}</small>
              <span>{fill(sc.th)}</span>
            </div>
            <small className="story-next muted">{typed >= ko.length ? '▼ แตะเพื่อไปต่อ' : ''}</small>
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
              <b>📝 คำที่ได้เจอ</b>
              <div className="vocab-chips">
                {vocab.map((v) => <button key={v.ko} className="chip" onClick={() => speak(v.ko)}><b className="ko">{v.ko}</b> <small>{v.th}</small></button>)}
              </div>
            </>
          )}
          {first && <div className="rewards"><span className="reward gold">+{STORY_REWARD} 🪙</span></div>}
          <button className="pixel-btn primary" onClick={onDone}>{replay ? 'ปิด' : '계속! ไปต่อ'}</button>
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
      <div className="modal pixel-box" onClick={(e) => e.stopPropagation()}>
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
        <button className="pixel-btn" onClick={onClose}>ปิด</button>
      </div>
    </div>
  )
}
