import { useGame } from '../game/store.jsx'
import { Modal } from './ui.jsx'
import { Pet } from '../pixel/Characters.jsx'
import { SPECIES_LIST, SPECIES } from '../pixel/pets.js'
import { stageFor, levelInfo } from '../game/logic.js'
import { bondInfo } from '../data/tricks.js'
import { FOOD_BY_ID } from '../data/shop.js'

// บ้านสัตว์เลี้ยง: ดูตัวที่เลี้ยง/ตัวที่พักอยู่ รับเลี้ยงสายพันธุ์ใหม่ (เริ่มเป็นไข่) และสลับตัวที่เลี้ยง
export default function PetHouse({ onClose }) {
  const { state, dispatch } = useGame()
  const lv = levelInfo(state.player.xp).level
  const box = state.petBox || {}
  return (
    <Modal onClose={onClose} closable>
      <h2 className="center">🏠 บ้านสัตว์เลี้ยง</h2>
      <p className="muted small center">ตัวที่พักอยู่ในบ้านค่าสถานะจะไม่ลดลง · สลับมาเลี้ยงได้ทุกเมื่อ</p>
      <div className="pet-house">
        {SPECIES_LIST.map((sp) => {
          const cur = state.pet.species === sp.id
          const mine = cur ? state.pet : box[sp.id]
          const locked = !mine && lv < sp.level
          const afford = state.player.coins >= sp.price
          const st = mine ? stageFor(mine.growth).id : 'egg'
          return (
            <div key={sp.id} className={`ph-card pixel-box ${cur ? 'cur' : ''} ${locked ? 'locked' : ''}`}>
              <div className="ph-pic"><Pet species={sp.id} stage={mine ? (st === 'egg' ? 'egg' : st) : 'baby'} mood="normal" outfit={{}} scale={4} className={locked ? 'dim' : ''} /></div>
              <b className="ko">{sp.ko}</b>
              <small className="muted">{sp.th} · {sp.read}</small>
              {mine ? (
                <>
                  <small>{mine.name} · {stageFor(mine.growth).ko} · 💞 Lv.{bondInfo(mine.bond || 0).level}</small>
                  {cur ? <small className="good-fx">กำลังเลี้ยงอยู่</small>
                    : <button className="pixel-btn small" onClick={() => { dispatch({ type: 'SWITCH_PET', species: sp.id }); onClose() }}>เลี้ยงตัวนี้</button>}
                </>
              ) : locked ? (
                <small className="muted">🔒 ต้องถึง Lv.{sp.level}</small>
              ) : (
                <button className="pixel-btn small primary" disabled={!afford} onClick={() => dispatch({ type: 'ADOPT', species: sp.id })}>
                  รับเลี้ยง 🪙{sp.price}
                </button>
              )}
              {!mine && !locked && <small className="muted">ชอบ: {FOOD_BY_ID[sp.fav]?.icon} {FOOD_BY_ID[sp.fav]?.th}</small>}
            </div>
          )
        })}
      </div>
      <button className="pixel-btn" onClick={onClose}>ปิด</button>
    </Modal>
  )
}
