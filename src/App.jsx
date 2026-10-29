import { useEffect, useState } from 'react'
import { useGame } from './game/store.jsx'
import { levelInfo, STAGES, liveStreak, dayStr } from './game/logic.js'
import { suggestLesson } from './data/lessons.js'
import { GEAR } from './data/shop.js'
import { ACH_BY_ID } from './data/achievements.js'
import { DEFAULT_LOOK } from './pixel/sprites.js'
import LookEditor from './components/LookEditor.jsx'
import GearPreview from './components/GearPreview.jsx'
import { GEAR_BY_ID, FOOD_BY_ID, RARITY } from './data/shop.js'
import Home from './pages/Home.jsx'
import Learn from './pages/Learn.jsx'
import Routine from './pages/Routine.jsx'
import Review from './pages/Review.jsx'
import Shop from './pages/Shop.jsx'
import LessonView from './pages/LessonView.jsx'
import { Avatar, Pet } from './pixel/Characters.jsx'
import { Coins, Modal } from './components/ui.jsx'

const NAV = [
  { id: 'home', ko: '홈', th: 'บ้าน', icon: '🏠' },
  { id: 'learn', ko: '배우기', th: 'เรียน', icon: '📖' },
  { id: 'routine', ko: '루틴', th: 'กิจวัตร', icon: '✅' },
  { id: 'review', ko: '복습', th: 'ทบทวน', icon: '🔁' },
  { id: 'shop', ko: '상점', th: 'ร้านค้า', icon: '🏪' },
]

// เปิดกล่อง/ซื้อของหายาก: กล่องสั่นก่อน (แตะเพื่อเปิด) แล้วเผยของพร้อมแสงตามความหายาก
function LootNotice({ n, onClose }) {
  const loot = n.loot
  const [open, setOpen] = useState(loot.source === 'buy') // ซื้อของหายากโชว์เลย ส่วนกล่องให้ผู้เล่นแตะเปิดเอง
  const g = loot.kind === 'item' ? GEAR_BY_ID[loot.id] : null
  const rar = loot.rarity ? RARITY[loot.rarity] : null
  const food = loot.kind === 'food' ? FOOD_BY_ID[loot.id] : null
  const big = loot.rarity === 'epic' || loot.rarity === 'legendary'
  return (
    <Modal onClose={() => { if (open) onClose() }}>
      <div className="center loot">
        {!open ? (
          <>
            <button className="loot-box" onClick={() => setOpen(true)} aria-label="เปิดกล่อง">🎁</button>
            <p>{loot.source === 'paid' ? 'กล่องสุ่มพิเศษ' : 'กล่องของขวัญวันนี้'}<br /><small className="muted">แตะกล่องเพื่อเปิด!</small></p>
          </>
        ) : (
          <>
            {big && <div className="confetti" aria-hidden="true">{Array.from({ length: 14 }, (_, i) => <i key={i} style={{ '--i': i }} />)}</div>}
            <div className={`loot-reveal ${loot.rarity ? `rar-${loot.rarity}` : ''}`}>
              {g && <GearPreview g={g} scale={7} />}
              {loot.kind === 'coins' && <span className="loot-ico">🪙</span>}
              {loot.kind === 'refund' && <span className="loot-ico">🪙</span>}
              {food && <span className="loot-ico">{food.icon}</span>}
            </div>
            {g && <h2 className="ko">{g.ko}</h2>}
            {g && <p>{g.th}<br /><b style={{ color: rar.c }}>● {rar.ko} · {rar.th}</b>{loot.source === 'buy' ? '' : <><br /><small className="muted">เก็บเข้าคอลเลกชันแล้ว — ไปสวมได้ที่ ตัวละคร ▸ ตู้เสื้อผ้า</small></>}</p>}
            {loot.kind === 'coins' && <><h2>+{loot.coins} 🪙</h2><p><small className="muted">ได้เหรียญ!</small></p></>}
            {loot.kind === 'refund' && <><h2>+{loot.coins} 🪙</h2><p><small className="muted">คุณมีไอเทมครบทุกชิ้นแล้ว! คืนเงินให้เต็มจำนวน</small></p></>}
            {food && <><h2 className="ko">{food.ko}</h2><p>ได้อาหารให้ 범이 1 ชิ้น <small className="muted">(อยู่ในกระเป๋า)</small></p></>}
            <button className="pixel-btn primary" onClick={onClose}>{big ? '와! 대박!' : '좋아요!'}</button>
          </>
        )}
      </div>
    </Modal>
  )
}

function Notice({ n, onClose }) {
  const { state } = useGame()
  if (n.type === 'loot') return <LootNotice n={n} onClose={onClose} />
  if (n.type === 'level') {
    return (
      <Modal onClose={onClose}>
        <div className="center">
          <Avatar outfit={state.player.outfit} mood="happy" scale={6} className="bob" />
          <h2>레벨 업! Lv.{n.level}</h2>
          <p>เลเวลอัป! ได้รับโบนัส 🪙 30</p>
          {(() => {
            const fresh = GEAR.filter((g) => !g.achv && g.level === n.level)
            return fresh.length > 0
              ? <p><small className="muted">ปลดล็อกในร้านค้า: {fresh.map((g) => g.th).join(' · ')}</small></p>
              : <p><small className="muted">ลองไปดูร้านค้า อาจมีของใหม่ปลดล็อก</small></p>
          })()}
          <button className="pixel-btn primary" onClick={onClose}>좋아요!</button>
        </div>
      </Modal>
    )
  }
  if (n.type === 'achv') {
    const a = ACH_BY_ID[n.id]
    if (!a) return null
    return (
      <Modal onClose={onClose}>
        <div className="center">
          <div className="streak-big">{a.icon}</div>
          <h2>🏆 {a.ko}</h2>
          <p>{a.th}<br /><b>+{a.coins} 🪙</b>{a.item ? ' และได้ไอเทมพิเศษ! (ดูในตัวละคร ▸ ตู้เสื้อผ้า)' : ''}</p>
          <button className="pixel-btn primary" onClick={onClose}>멋져요!</button>
        </div>
      </Modal>
    )
  }
  if (n.type === 'freeze') {
    return (
      <Modal onClose={onClose}>
        <div className="center">
          <div className="streak-big">🧊</div>
          <h2>스트릭 보호!</h2>
          <p>เมื่อวานคุณพลาดไป — ใช้ตัวป้องกัน {n.used} ชิ้น streak จึงไม่ขาด 🔥 {n.count} วัน</p>
          <button className="pixel-btn primary" onClick={onClose}>다행이다!</button>
        </div>
      </Modal>
    )
  }
  if (n.type === 'evolve') {
    const st = STAGES.find((s) => s.id === n.stage)
    const hatch = n.stage === 'baby' // ฟักไข่ครั้งแรก = ช่วงเด่นของวันแรก ๆ
    return (
      <Modal onClose={onClose}>
        <div className="center">
          <Pet stage={n.stage} mood="happy" scale={7} className="evolve" />
          {hatch && <div className="hatch-fx">✨ 🐣 ✨</div>}
          <h2>{hatch ? '알이 깼어요!' : `${state.pet.name}가 자랐어요!`}</h2>
          <p>{hatch ? <>ไข่ฟักแล้ว! <b>{state.pet.name}</b> ลูกเสือน้อยออกมาทักทายคุณ — ดูแลและเรียนด้วยกันต่อนะ</> : <>{state.pet.name} เติบโตเป็น <b>{st.ko}</b> ({st.th}) แล้ว!</>}</p>
          <button className="pixel-btn primary" onClick={onClose}>와! 대박!</button>
        </div>
      </Modal>
    )
  }
  if (n.type === 'streak') {
    return (
      <Modal onClose={onClose}>
        <div className="center">
          <div className="streak-big">🔥 {n.count}</div>
          <h2>{n.count}일 연속!</h2>
          <p>เรียนต่อเนื่อง {n.count} วันแล้ว เก่งมาก!{n.bonus > 0 && <><br /><b>โบนัส streak 🪙 +{n.bonus}</b></>}</p>
          <button className="pixel-btn primary" onClick={onClose}>계속 가자!</button>
        </div>
      </Modal>
    )
  }
  return null
}

const GOALS = [
  { xp: 30, min: 5, th: 'สบาย ๆ' },
  { xp: 50, min: 10, th: 'แนะนำ' },
  { xp: 80, min: 15, th: 'จริงจัง' },
]

function Onboarding({ onStart }) {
  const { dispatch } = useGame()
  const [name, setName] = useState('')
  const [skipHangul, setSkipHangul] = useState(false)
  const [goal, setGoal] = useState(50)
  const [look, setLook] = useState(DEFAULT_LOOK)
  const go = () => {
    dispatch({ type: 'ONBOARD', name: name.trim() || '나', goal, skipHangul, look })
    onStart(skipHangul)
  }
  return (
    <Modal onClose={() => {}}>
      <div className="center onboard">
        <div className="row gap center-row">
          <Avatar scale={5} look={look} outfit={{ top: 'top_blue', bottom: look.gender === 'f' ? 'skirt_navy' : 'pants_navy' }} className="bob" />
          <Pet stage="egg" scale={6} className="wobble" />
        </div>
        <h2>환영해요! ยินดีต้อนรับ</h2>
        <p>
          นี่คือไข่เสือ <b>범이</b> 🐯 เรียนภาษาเกาหลีและทำกิจวัตรทุกวัน ตัวละครของคุณจะเลเวลอัป และ 범이 จะฟักออกมาแล้วโตขึ้น
        </p>
        <label className="field">
          <span>ชื่อของคุณ (ภาษาอะไรก็ได้)</span>
          <input value={name} maxLength={10} onChange={(e) => setName(e.target.value)} placeholder="เช่น 민수 หรือ บุ๋ม" />
        </label>
        <div className="choices">
          <small>หน้าตาตัวละคร (เปลี่ยนทีหลังได้)</small>
          <LookEditor look={look} onChange={setLook} />
        </div>
        <div className="choices">
          <small>ตอนนี้คุณ…</small>
          <button className={`choice ${!skipHangul ? 'on' : ''}`} onClick={() => setSkipHangul(false)}>🌱 ยังอ่านฮันกึลไม่ได้ <small className="muted">— เริ่มจากตัวอักษร</small></button>
          <button className={`choice ${skipHangul ? 'on' : ''}`} onClick={() => setSkipHangul(true)}>📖 อ่านฮันกึลได้แล้ว <small className="muted">— ข้ามไปคำศัพท์ในชีวิตประจำวัน</small></button>
        </div>
        <div className="choices">
          <small>เวลาที่อยากเรียนต่อวัน (ตั้งเป้า XP)</small>
          {GOALS.map((g) => (
            <button key={g.xp} className={`choice ${goal === g.xp ? 'on' : ''}`} onClick={() => setGoal(g.xp)}>
              ⏱ {g.min} นาที/วัน <small className="muted">— {g.th} · เป้า {g.xp} XP</small>
            </button>
          ))}
        </div>
        <button className="pixel-btn primary" onClick={go}>시작하기! เริ่มบทแรกเลย</button>
      </div>
    </Modal>
  )
}

function Settings({ onClose }) {
  const { state, dispatch } = useGame()
  const [pn, setPn] = useState(state.player.name)
  const [petn, setPetn] = useState(state.pet.name)
  const acc = state.stats.answered ? Math.round((state.stats.correct / state.stats.answered) * 100) : 0
  return (
    <Modal onClose={onClose}>
      <h3>설정 · ตั้งค่า</h3>
      <label className="field"><span>ชื่อของฉัน</span><input value={pn} maxLength={10} onChange={(e) => setPn(e.target.value)} /></label>
      <label className="field"><span>ชื่อสัตว์เลี้ยง</span><input value={petn} maxLength={10} onChange={(e) => setPetn(e.target.value)} /></label>
      <div className="choices">
        <small>เป้า XP ต่อวัน</small>
        <div className="row gap">
          {GOALS.map((g) => (
            <button key={g.xp} className={`choice ${(state.player.goal || 50) === g.xp ? 'on' : ''}`} onClick={() => dispatch({ type: 'SET_GOAL', goal: g.xp })}>{g.min} นาที · {g.xp}</button>
          ))}
        </div>
      </div>
      <p className="muted small">
        คำที่เรียนแล้ว {Object.keys(state.srs).length} · ตอบทั้งหมด {state.stats.answered} ข้อ · ความแม่นยำ {acc}%
      </p>
      <div className="row gap">
        <button className="pixel-btn primary" onClick={() => {
          dispatch({ type: 'RENAME', who: 'player', name: pn.trim() || state.player.name })
          dispatch({ type: 'RENAME', who: 'pet', name: petn.trim() || state.pet.name })
          onClose()
        }}>บันทึก</button>
        <button className="pixel-btn danger" onClick={() => {
          if (window.confirm('ลบความคืบหน้าทั้งหมดและเริ่มใหม่?')) { dispatch({ type: 'RESET' }); onClose() }
        }}>เริ่มใหม่ทั้งหมด</button>
      </div>
      <p className="muted small">ข้อมูลเก็บในเครื่องนี้เท่านั้น · 🔊 ต้องมีเสียงภาษาเกาหลีในระบบ (iOS/Android/Chrome ส่วนใหญ่มีให้)</p>
    </Modal>
  )
}

const TTS_MSG = {
  stuck: { ko: '소리가 안 나요', th: 'ระบบเสียงของเครื่องไม่ตอบสนอง ลองรีโหลดหน้า หรือเปิดใน Chrome/Safari' },
  'no-voice': { ko: '한국어 음성이 없어요', th: 'เครื่องนี้ยังไม่มีเสียงภาษาเกาหลี เพิ่มได้ที่ ตั้งค่าระบบ → การเข้าถึง → เสียงพูด' },
}

function TtsToast() {
  const [msg, setMsg] = useState(null)
  useEffect(() => {
    let timer
    const on = (e) => {
      setMsg(TTS_MSG[e.detail])
      clearTimeout(timer)
      timer = setTimeout(() => setMsg(null), 7000)
    }
    window.addEventListener('tts-problem', on)
    return () => { window.removeEventListener('tts-problem', on); clearTimeout(timer) }
  }, [])
  if (!msg) return null
  return (
    <div className="tts-toast pixel-box" role="alert" onClick={() => setMsg(null)}>
      <b className="ko">🔇 {msg.ko}</b>
      <small>{msg.th}</small>
    </div>
  )
}

export default function App() {
  const { state, dispatch } = useGame()
  const [tab, setTab] = useState('home')
  const [lesson, setLesson] = useState(null)
  const [settings, setSettings] = useState(false)
  const lv = levelInfo(state.player.xp)
  const notice = state.notices[0]

  return (
    <div className="app">
      <header className="topbar">
        <button className="lv" onClick={() => setSettings(true)} aria-label="ตั้งค่า">
          <span className="lv-badge">Lv.{lv.level}</span>
          <span className="xp-track"><span style={{ width: `${(lv.into / lv.need) * 100}%` }} /></span>
          <small className="mono">{lv.into}/{lv.need}</small>
        </button>
        <span className="streak">🔥{liveStreak(state.streak, dayStr(), state.player.freezes || 0)}</span>
        <Coins n={state.player.coins} />
        <button className="icon-btn" onClick={() => setSettings(true)} aria-label="ตั้งค่า">⚙</button>
      </header>

      <main key={tab}>
        {tab === 'home' && <Home openLesson={setLesson} go={setTab} />}
        {tab === 'learn' && <Learn openLesson={setLesson} />}
        {tab === 'routine' && <Routine />}
        {tab === 'review' && <Review go={setTab} />}
        {tab === 'shop' && <Shop />}
      </main>

      <nav className="bottomnav">
        {NAV.map((n) => (
          <button key={n.id} className={tab === n.id ? 'on' : ''} onClick={() => setTab(n.id)}>
            <span className="nav-ico">{n.icon}</span>
            <span className="ko">{n.ko}</span>
          </button>
        ))}
      </nav>

      <TtsToast />
      {lesson && <LessonView lesson={lesson} onClose={() => setLesson(null)} />}
      {settings && <Settings onClose={() => setSettings(false)} />}
      {!state.onboarded && <Onboarding onStart={(skip) => setLesson(suggestLesson(new Date(), {}, skip))} />}
      {state.onboarded && notice && <Notice n={notice} onClose={() => dispatch({ type: 'DISMISS' })} />}
    </div>
  )
}

