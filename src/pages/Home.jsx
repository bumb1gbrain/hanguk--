import { useState, useRef, useEffect } from 'react'
import { useGame, dueItems } from '../game/store.jsx'
import { DAILY_GOAL, MOOD_TEXT, petMood, stageFor, nextStage, levelInfo, liveStreak, dayStr, neglected, rankFor } from '../game/logic.js'
import { suggestLesson } from '../data/lessons.js'
import { ROUTINE } from '../data/routine.js'
import { FOODS, FOOD_BY_ID } from '../data/shop.js'
import { WALLS, FLOORS, ROOM_ITEMS } from '../pixel/items.js'
import { QUEST_BY_ID, questProgress, QUEST_ALL_BONUS } from '../data/quests.js'
import { Avatar, Pet, RoomItem } from '../pixel/Characters.jsx'
import { Bar, Modal } from '../components/ui.jsx'
import CharacterModal from '../components/CharacterModal.jsx'
import PreviewModal from '../components/PreviewModal.jsx'
import GearPreview from '../components/GearPreview.jsx'
import { GEAR_BY_ID } from '../data/shop.js'
import { salePrice, FEATURED_DISCOUNT } from '../game/loot.js'
import { speak, speakSeq } from '../game/lessonVoice.js'
import { playCry } from '../game/cry.js'
import { SPECIES, SPECIES_LIST } from '../pixel/pets.js'
import { ALL_PARTS } from '../data/story.js'
import { TRICKS, bondInfo } from '../data/tricks.js'
import PetHouse from '../components/PetHouse.jsx'
import StoryScene, { StoryBook } from '../components/StoryScene.jsx'

function greeting(h) {
  if (h >= 5 && h < 11) return { ko: '좋은 아침이에요!', th: 'อรุณสวัสดิ์!' }
  if (h >= 11 && h < 17) return { ko: '좋은 오후예요!', th: 'สวัสดีตอนบ่าย!' }
  if (h >= 17 && h < 21) return { ko: '좋은 저녁이에요!', th: 'สวัสดีตอนเย็น!' }
  return { ko: '늦었어요, 잘 자요!', th: 'ดึกแล้ว ฝันดีนะ!' }
}

const WALL_CLS = Object.fromEntries(WALLS.map((w) => [w.id, w.cls]))
const FLOOR_CLS = Object.fromEntries(FLOORS.map((f) => [f.id, f.cls]))
const RUG_CLS = { room_rug: 'rug-classic', ...Object.fromEntries(ROOM_ITEMS.filter((r) => r.rug).map((r) => [r.id, r.rug])) }

export default function Home({ openLesson, go }) {
  const { state, dispatch } = useGame()
  const [feeding, setFeeding] = useState(false)
  const [charOpen, setCharOpen] = useState(false)
  const [pv, setPv] = useState(null) // ไอเทมที่เปิดดูจากหน้า Home (ของเด่น)
  const [bounce, setBounce] = useState(0)
  const [houseOpen, setHouseOpen] = useState(false)
  const [bookOpen, setBookOpen] = useState(false)
  const [replay, setReplay] = useState(null) // ช่วงเรื่องที่กำลังเล่นซ้ำ
  const [petAnim, setPetAnim] = useState(null) // ท่าที่สัตว์เลี้ยงกำลังทำ (trick-*)
  const [avAct, setAvAct] = useState(null) // ท่าของตัวละคร: cheer | hug | cmd
  const [cmd, setCmd] = useState(null) // คำสั่งที่ตัวละครกำลังพูด (บอลลูนข้อความ)
  const [parts, setParts] = useState([]) // อนุภาคเอฟเฟกต์ลอยขึ้น (หัวใจ ดาว ฟอง ...)
  const timers = useRef([])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  const later = (fn, ms) => { timers.current.push(setTimeout(fn, ms)) }
  const { pet, player, daily } = state
  const now = new Date()
  const g = greeting(now.getHours())
  const mood = petMood(pet)
  const stage = stageFor(pet.growth)
  const next = nextStage(pet.growth)
  const sug = suggestLesson(now, state.lessons, player.skipHangul)
  const due = dueItems(state.srs).length
  const room = player.room || {}
  const studiedToday = daily.xp > 0
  const night = now.getHours() >= 20 || now.getHours() < 6
  const avatarMood = !studiedToday && now.getHours() >= 9 ? 'sleepy' : daily.xp >= (player.goal || DAILY_GOAL) ? 'happy' : 'normal'
  const petSprMood = mood === 'sleep' ? 'sleep' : mood === 'happy' || bounce ? 'happy' : 'normal'
  const mt = MOOD_TEXT[mood]
  const wantFood = FOOD_BY_ID[pet.want?.foodId]
  const wantPending = !!pet.want && !!wantFood && pet.wantDone !== pet.want.slot
  const routineOff = player.routineOff || []
  const routineActive = ROUTINE.length - routineOff.length
  const routineDone = daily.routine.filter((id) => !routineOff.includes(id)).length
  const quests = (daily.quests || []).map((id) => QUEST_BY_ID[id]).filter(Boolean)
  const goal = player.goal || DAILY_GOAL
  const claimed = daily.claimed || []
  const [fx, setFx] = useState('') // ข้อความเอฟเฟกต์สั้น ๆ หลังให้อาหารตรงใจ
  const foodsHave = FOODS.filter((f) => state.inventory[f.id] > 0)

  // ให้อาหาร (ใช้ทั้งจากเมนูและปุ่มลัดบนป้ายคำขอ)
  const feedFood = (f) => {
    const hit = wantPending && wantFood.id === f.id
    dispatch({ type: 'FEED', id: f.id })
    speak(f.ko)
    setFeeding(false)
    poke()
    burst(f.icon, 3); doAv('cheer'); doPet('munch', 900)
    setFx(hit ? `🎉 ตรงใจ! ${pet.name} ดีใจมาก (+3 XP โบนัส)` : '')
    if (hit) setTimeout(() => setFx(''), 4000)
  }

  const poke = () => {
    setBounce((b) => b + 1)
    speak(mood === 'happy' ? '행복해요' : mt.ko.replace(/[…!]/g, ''))
    setTimeout(() => setBounce(0), 700)
  }

  // ปล่อยอนุภาคลอยขึ้นจากตำแหน่งสัตว์เลี้ยง (หายเองใน ~1.2 วิ)
  const burst = (emoji, n = 4, from = 'pet') => {
    const base = Date.now() + Math.random()
    const add = Array.from({ length: n }, (_, i) => ({ id: base + i, emoji, from, dx: Math.round((Math.random() - 0.5) * 60), delay: i * 90 }))
    setParts((p) => [...p, ...add])
    later(() => setParts((p) => p.filter((x) => !add.includes(x))), 1400)
  }
  const doAv = (name, ms = 900) => { setAvAct(name); later(() => setAvAct(null), ms) }
  const doPet = (name, ms = 1000) => { setPetAnim(name); later(() => setPetAnim(null), ms) }
  const speciesInfo = SPECIES[pet.species] || SPECIES.tiger
  const bond = bondInfo(pet.bond || 0)
  const tricksDone = daily.tricks || []
  const canTrick = !pet.asleep && pet.growth >= 30 && pet.energy >= 5

  // แตะสัตว์เลี้ยง: ร้องเสียงประจำสายพันธุ์ + หัวใจ
  const tapPet = () => {
    if (pet.asleep) { setBounce((b) => b + 1); later(() => setBounce(0), 700); burst('💤', 2); return }
    dispatch({ type: 'PET_TAP' })
    setBounce((b) => b + 1); later(() => setBounce(0), 700)
    burst('❤️', 3)
    if (!playCry(pet.species)) speak(speciesInfo.sound.ko)
  }

  // กอด: ตัวละครเดินไปหาสัตว์เลี้ยงแล้วกอด (คูลดาวน์ 45 วินาที)
  const hug = () => {
    dispatch({ type: 'HUG', now: Date.now() })
    doAv('hug', 1500)
    later(() => { doPet('nuzzle', 900); burst('💞', 5) }, 700)
    speak('사랑해')
  }

  // สอนคำสั่ง: ตัวละครพูดคำสั่งภาษาเกาหลี → สัตว์เลี้ยงทำท่า (ท่าละครั้งต่อวันที่ได้รางวัล ท่าที่ทำแล้วยังเล่นซ้ำดูได้)
  const trick = (t) => {
    const first = !tricksDone.includes(t.id)
    setCmd(t)
    doAv('cmd', 1300)
    speakSeq([t.ko], {})
    later(() => { doPet(t.anim, 1300); burst(first ? '⭐' : '✨', 4) }, 650)
    later(() => setCmd(null), 1500)
    if (first) dispatch({ type: 'TRICK', id: t.id })
  }

  const featured = daily.featured && !player.owned.includes(daily.featured) ? GEAR_BY_ID[daily.featured] : null
  const boxReady = !daily.boxOpened && daily.xp > 0
  // ของที่อยากได้ที่ตอนนี้ซื้อได้แล้ว (เหรียญพอและเลเวลถึง)
  const wishReady = (player.wish || []).map((id) => GEAR_BY_ID[id]).filter((g) => g && !player.owned.includes(g.id) && levelInfo(player.xp).level >= g.level && player.coins >= salePrice(g, daily.featured))
  const live = liveStreak(state.streak, dayStr(), player.freezes || 0)
  const goalPct = Math.min(daily.xp, goal)

  return (
    <div className="page home">
      {/* ── สรุปวันนี้: ทักทาย + streak + เป้า XP ในกล่องเดียว ── */}
      <section className="card pixel-box today">
        <div className="row between">
          <div className="greet"><span className="ko">{g.ko}</span> <small>{g.th}</small></div>
          <span className="mono">🔥 {live} วัน{state.streak.best > live ? ` (สูงสุด ${state.streak.best})` : ''}</span>
        </div>
        <Bar value={goalPct} max={goal} color="var(--accent)" />
        <small className="muted">
          XP วันนี้ {goalPct}/{goal}
          {daily.goalPaid ? ' · รับโบนัสเป้าแล้ว 🎉' : ' · ครบเป้าได้ +10 🪙'}
        </small>
        {state.streak.last !== dayStr() && live > 0 && (
          <small className="warn">⚠️ วันนี้ยังไม่ได้เล่น — เรียน/ทบทวน/ติ๊กกิจวัตรสักอย่างเพื่อรักษา streak</small>
        )}
      </section>

      {/* ── ทำอะไรต่อ: บทแนะนำ + ทางลัดทบทวน/กิจวัตร ── */}
      <section className="card pixel-box next">
        <button className="suggest" onClick={() => openLesson(sug)}>
          <span className="sug-icon">{sug.icon}</span>
          <div>
            <small className="muted">{sug.group === 'hangul' ? 'เริ่มจากอ่านฮันกึลก่อน · 한글부터!' : 'แนะนำตอนนี้ · 지금 추천'}</small>
            <div><b className="ko">{sug.title}</b> — {sug.titleTh}</div>
          </div>
          <span className="chev">▶</span>
        </button>
        <div className="chips">
          <button className="pixel-btn small" onClick={() => go('review')}>🔁 ทบทวน <b>{due}</b></button>
          <button className="pixel-btn small" onClick={() => go('routine')}>✅ กิจวัตร <b>{routineDone}/{routineActive}</b></button>
        </div>
      </section>

      {/* ── Pixel room ── */}
      <div className={`room pixel-box ${night ? 'night' : ''} ${WALL_CLS[room.wall] || 'wall-default'} ${FLOOR_CLS[room.floor] || 'floor-default'}`}>
        <div className="window"><span className={night ? 'moon' : 'sun'} /></div>
        {room.wallC && <RoomItem id={room.wallC} scale={3} className="r-wallC" />}
        {room.wallR && <RoomItem id={room.wallR} scale={3} className="r-poster" />}
        {room.floorL && <RoomItem id={room.floorL} scale={4} className="r-plant" />}
        {room.floorR && <RoomItem id={room.floorR} scale={4} className="r-lamp" />}
        {room.rug && <div className={`r-rug ${RUG_CLS[room.rug] || 'rug-classic'}`} />}
        <div className="floor" />
        <button className="room-btn" onClick={() => setCharOpen(true)} aria-label="ตัวละคร">👤 ตัวละคร</button>
        <div className={`avatar-spot ${avAct || ''}`}>
          {cmd && <div className="cmd-bubble"><b className="ko">{cmd.ko}!</b><small>{cmd.th}</small></div>}
          <Avatar outfit={player.outfit} mood={avAct === 'hug' ? 'happy' : avatarMood} scale={5} className="idle" />
          <span className="nametag">{player.name} · Lv.{levelInfo(player.xp).level}</span>
          <span className="nametag rank-tag ko">{rankFor(levelInfo(player.xp).level).ko}</span>
        </div>
        <button className={`pet-spot ${bounce ? 'jump' : ''} ${petAnim ? `pa-${petAnim}` : ''}`} onClick={tapPet} aria-label="แตะสัตว์เลี้ยง">
          <div className="bubble">{mt.icon}</div>
          <Pet stage={stage.id} mood={petAnim || bounce ? 'happy' : petSprMood} scale={stage.id === 'adult' ? 5 : 4} className={petAnim ? '' : mood === 'sleep' ? 'breathe' : 'bob'} />
          <span className="nametag">{pet.name}</span>
        </button>
        {parts.map((p) => (
          <span key={p.id} className={`fx-part from-${p.from}`} style={{ '--dx': `${p.dx}px`, animationDelay: `${p.delay}ms` }}>{p.emoji}</span>
        ))}
      </div>

      {/* ── 범이 ── */}
      <section className="card pixel-box">
        <div>
          <b>{pet.name}</b> <small className="muted">· {speciesInfo.icon} {speciesInfo.ko} · {stage.ko} ({stage.th})</small>
          <div className="mood-line"><span className="ko">{mt.ko}</span> <small className="muted">{mt.th}</small></div>
        </div>
        <div className="quick-menu">
          <button className="menu-tile" onClick={() => setHouseOpen(true)}>
            <span className="mt-ico">🏠</span>
            <span className="mt-txt"><b>บ้านสัตว์เลี้ยง</b><small>สะสมแล้ว {1 + Object.keys(state.petBox || {}).length}/{SPECIES_LIST.length} ตัว</small></span>
            <span className="chev">▶</span>
          </button>
          <button className="menu-tile" onClick={() => setBookOpen(true)}>
            <span className="mt-ico">📖</span>
            <span className="mt-txt"><b>เรื่องราว</b><small>ดูแล้ว {Object.keys(state.story?.seen || {}).length}/{ALL_PARTS.length} ช่วง</small></span>
            <span className="chev">▶</span>
          </button>
        </div>
        <div className="bars-grid">
          <Bar label="อิ่ม" icon="🍙" value={pet.full} color="var(--orange)" />
          <Bar label="อารมณ์" icon="❤️" value={pet.happy} color="var(--pink)" />
          <Bar label="พลัง" icon="⚡" value={pet.energy} color="var(--yellow)" />
          <Bar label="สะอาด" icon="🫧" value={pet.clean ?? 80} color="var(--blue, #6bb6ff)" />
          <div className="span2">
            <Bar label={`💞 ความผูกพัน Lv.${bond.level}${bond.max ? ' (สูงสุด)' : ''}`} icon="" value={bond.into} max={bond.need} color="var(--pink)" />
          </div>
          <div className="span2">
            <Bar
              label={next ? (stage.id === 'egg' ? `🥚 ใกล้ฟักเป็น ${next.ko}` : `โต → ${next.ko}`) : 'โตเต็มวัยแล้ว'}
              icon="🌱"
              value={next ? pet.growth - stage.min : 1}
              max={next ? next.min - stage.min : 1}
              color="var(--green)"
            />
          </div>
        </div>
        {neglected(pet) && <small className="warn">⚠️ {pet.name} ไม่สบายใจ — โตช้าลงครึ่งหนึ่งจนกว่าจะดูแล</small>}
        {!pet.asleep && wantPending && (
          <div className="want">
            <span className="food-ico">{wantFood.icon}</span>
            <div className="ko w-text">{wantFood.ko} 먹고 싶어요! <small className="muted">อยากกิน {wantFood.th} (โบนัส)</small></div>
            {state.inventory[wantFood.id] > 0 ? (
              <button className="pixel-btn primary small" onClick={() => feedFood(wantFood)}>ให้เลย</button>
            ) : player.coins >= wantFood.price ? (
              <button className="pixel-btn small" onClick={() => dispatch({ type: 'BUY', kind: 'food', id: wantFood.id })}>ซื้อ 🪙{wantFood.price}</button>
            ) : (
              <small className="muted">ขาดอีก 🪙{wantFood.price - player.coins}</small>
            )}
          </div>
        )}
        {fx && <small className="good-fx">{fx}</small>}
        <div className="row gap actions">
          <button className="pixel-btn" disabled={pet.asleep} onClick={() => setFeeding(true)}>🍙 먹이</button>
          <button className="pixel-btn" disabled={pet.asleep || pet.energy < 10} onClick={() => { dispatch({ type: 'PLAY' }); poke(); burst('🎾', 3); doAv('cheer'); doPet('spin', 1100) }}>🎾 놀기</button>
          <button className="pixel-btn" disabled={pet.asleep || (pet.clean ?? 80) >= 90} onClick={() => { dispatch({ type: 'WASH' }); poke(); burst('🫧', 6); doAv('cheer'); doPet('wobble', 1100) }}>🫧 씻기</button>
          <button className="pixel-btn" disabled={pet.asleep} onClick={hug}>🤗 안아주기</button>
          <button className="pixel-btn" onClick={() => dispatch({ type: 'SLEEP' })}>{pet.asleep ? '☀️ 깨우기' : '🌙 재우기'}</button>
        </div>
        <div className="tricks">
          <small className="muted">🎓 สอนคำสั่ง · 훈련 {canTrick ? '' : (pet.asleep ? '(กำลังหลับ)' : pet.growth < 30 ? '(ต้องฟักไข่ก่อน)' : '(พลังไม่พอ)')}</small>
          <div className="trick-row">
            {TRICKS.map((t) => {
              const locked = bond.level < t.level
              const done = tricksDone.includes(t.id)
              return (
                <button key={t.id} className={`trick-chip ${done ? 'done' : ''}`} disabled={locked || !canTrick} onClick={() => trick(t)} title={locked ? `ต้องผูกพัน Lv.${t.level}` : t.th}>
                  <span>{locked ? '🔒' : t.icon}</span>
                  <b className="ko">{t.ko}</b>
                  <small>{locked ? `Lv.${t.level}` : done ? '✓' : t.th}</small>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── ของขวัญวันนี้: กล่องสุ่มฟรี + ของเด่นลดราคา + ของที่อยากได้ ── */}
      <section className="card pixel-box gift">
        <div className="row between"><b>🎁 ของขวัญวันนี้</b><small className="muted">เปลี่ยนทุกวัน</small></div>
        <div className="gift-row">
          <button className={`gift-box ${boxReady ? 'ready' : ''}`} disabled={!boxReady} onClick={() => dispatch({ type: 'OPEN_BOX', kind: 'free' })}>
            <span className="gift-ico">{daily.boxOpened ? '📭' : '🎁'}</span>
            <small>{daily.boxOpened ? 'เปิดแล้ว · พรุ่งนี้มีใหม่' : boxReady ? 'แตะเพื่อเปิดกล่อง!' : 'เรียน/ทบทวนก่อน ถึงเปิดได้'}</small>
          </button>
          {featured ? (
            <button className="gift-feat" onClick={() => setPv(featured.id)}>
              <span className="gift-prev"><GearPreview g={featured} scale={2} /></span>
              <small className="muted">⭐ ของเด่น -{Math.round(FEATURED_DISCOUNT * 100)}%</small>
              <small><s>{featured.price}</s> → 🪙 {salePrice(featured, featured.id)}</small>
            </button>
          ) : <div className="gift-feat none"><small className="muted">ของเด่นวันนี้ซื้อไปหมดแล้ว 🎉</small></div>}
        </div>
        {wishReady.length > 0 && (
          <button className="wish-ready" onClick={() => go('shop')}>★ ของที่อยากได้ซื้อได้แล้ว: <b className="ko">{wishReady[0].ko}</b>{wishReady.length > 1 ? ` และอีก ${wishReady.length - 1} ชิ้น` : ''} ▶</button>
        )}
      </section>

      {/* ── ภารกิจ: พับเก็บอัตโนมัติเมื่อรับครบ ── */}
      <details className="card pixel-box quests" open={claimed.length < quests.length}>
        <summary className="row between">
          <b>오늘의 퀘스트 · ภารกิจวันนี้</b>
          <span className="mono">{claimed.length}/{quests.length}</span>
        </summary>
        <div className="quest-list">
          {quests.map((q) => {
            const got = questProgress(q, state)
            const done = got >= q.target
            const taken = claimed.includes(q.id)
            return (
              <div key={q.id} className={`quest ${taken ? 'taken' : done ? 'done' : ''}`}>
                <span className="food-ico">{q.icon}</span>
                <div className="q-text">
                  <div className="ko">{q.ko} <small className="muted">{got}/{q.target}</small></div>
                  <small className="muted q-th">{q.th}</small>
                </div>
                {taken ? <span className="mono">✓</span> : (
                  <button className="pixel-btn primary small" disabled={!done} onClick={() => dispatch({ type: 'QUEST_CLAIM', id: q.id })}>+{q.xp}XP +{q.coins}🪙</button>
                )}
              </div>
            )
          })}
        </div>
        <small className="muted">ครบทั้ง {quests.length} ข้อ โบนัส +{QUEST_ALL_BONUS} 🪙</small>
      </details>

      {bookOpen && !replay && <StoryBook onClose={() => setBookOpen(false)} onPlay={setReplay} />}
      {replay && <StoryScene part={replay} replay onDone={() => setReplay(null)} />}
      {houseOpen && <PetHouse onClose={() => setHouseOpen(false)} />}
      {charOpen && <CharacterModal onClose={() => setCharOpen(false)} />}
      {pv && <PreviewModal id={pv} onClose={() => setPv(null)} />}

      {feeding && (
        <Modal onClose={() => setFeeding(false)}>
          <h3>먹이 주기 · ให้อาหาร{pet.name}</h3>
          {foodsHave.length === 0 && <p className="muted">ยังไม่มีอาหารในกระเป๋า ไปซื้อที่ร้านค้าก่อนนะ</p>}
          <div className="food-list">
            {foodsHave.map((f) => (
              <button key={f.id} className="pixel-btn food" onClick={() => feedFood(f)}>
                <span className="food-ico">{f.icon}</span>
                <span><span className="ko">{f.ko}</span><small> {f.read} · {f.th}</small></span>
                <span className="mono">×{state.inventory[f.id]}</span>
              </button>
            ))}
          </div>
          <div className="row gap">
            <button className="pixel-btn" onClick={() => { setFeeding(false); go('shop') }}>🏪 ไปร้านค้า</button>
            <button className="pixel-btn" onClick={() => setFeeding(false)}>ปิด</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
