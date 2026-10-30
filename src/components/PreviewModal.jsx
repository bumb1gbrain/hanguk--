import { useState } from 'react'
import { useGame } from '../game/store.jsx'
import { levelInfo, stageFor } from '../game/logic.js'
import { GEAR_BY_ID, GEAR, SETS, RARITY, SLOT_TH, isPetSlot } from '../data/shop.js'
import { Avatar, Pet } from '../pixel/Characters.jsx'
import RoomScene from './RoomScene.jsx'
import { Modal } from './ui.jsx'
import { speak } from '../game/lessonVoice.js'
import { salePrice } from '../game/loot.js'

// หน้าต่างดูไอเทมขนาดใหญ่ + ลองสวม/วางก่อนซื้อ (แสดงบนตัวละคร/สัตว์เลี้ยง/ห้องของผู้เล่นจริง)
export default function PreviewModal({ id, onClose }) {
  const { state, dispatch } = useGame()
  const [mode, setMode] = useState('mine') // mine = ลองกับชุดของฉัน · plain = ดูเดี่ยว ๆ บนเสื้อมาตรฐาน
  const g = GEAR_BY_ID[id]
  if (!g) return null
  const { player, pet, daily } = state
  const price = salePrice(g, daily.featured)
  const onSale = price !== g.price
  const wished = (player.wish || []).includes(g.id)
  const owned = player.owned.includes(g.id)
  const level = levelInfo(player.xp).level
  const locked = level < g.level
  const r = RARITY[g.rarity]
  const set = SETS.find((x) => x.items.includes(g.id))
  const setHave = set ? set.items.filter((x) => player.owned.includes(x)).length : 0

  const isRoom = g.slot === 'room' || g.slot === 'wall' || g.slot === 'floor'
  const roomTry = g.slot === 'room' ? { ...player.room, [g.spot]: g.id } : g.slot === 'wall' || g.slot === 'floor' ? { ...player.room, [g.slot]: g.id } : player.room
  const wornNow = isRoom ? (g.slot === 'room' ? player.room?.[g.spot] === g.id : player.room?.[g.slot] === g.id)
    : isPetSlot(g.slot) ? pet.outfit?.[g.slot] === g.id : player.outfit[g.slot] === g.id
  const fixed = ['top', 'bottom', 'wall', 'floor'].includes(g.slot)
  const stage = stageFor(pet.growth).id === 'egg' ? 'baby' : stageFor(pet.growth).id // ไข่ใส่ของไม่ได้ จึงโชว์ร่างลูกเสือแทน
  const outfit = mode === 'mine' ? { ...player.outfit, [g.slot]: g.id } : { top: 'top_blue', [g.slot]: g.id }

  return (
    <Modal onClose={onClose} closable>
      <div className="pv">
        <div className="pv-head">
          <button className="ko pv-name" onClick={() => speak(g.ko)}>{g.ko} 🔊</button>
          {!owned && !g.achv && (
            <button className={`wish-btn big ${wished ? 'on' : ''}`} onClick={() => dispatch({ type: 'WISH', id: g.id })}>{wished ? '★ อยู่ในรายการอยากได้' : '☆ เพิ่มในรายการอยากได้'}</button>
          )}
          <small>{g.th}</small>
          <small className="rar-tag" style={{ color: r.c }}>● {r.ko} · {r.th} · {SLOT_TH[g.slot]}</small>
        </div>

        <div className={`pv-stage rar-${g.rarity}`}>
          {isRoom ? <RoomScene room={roomTry} outfit={player.outfit} petGrowth={pet.growth} petOutfit={pet.outfit} />
            : isPetSlot(g.slot) ? <Pet stage={stage} mood="happy" outfit={mode === 'mine' ? { ...pet.outfit, [g.slot]: g.id } : { [g.slot]: g.id }} scale={9} className="bob" />
            : <Avatar outfit={outfit} scale={9} className="bob" />}
        </div>

        {!isRoom && !isPetSlot(g.slot) && (
          <div className="chips">
            <button className={`chip ${mode === 'mine' ? 'on' : ''}`} onClick={() => setMode('mine')}>ลองกับชุดของฉัน</button>
            <button className={`chip ${mode === 'plain' ? 'on' : ''}`} onClick={() => setMode('plain')}>ดูเดี่ยว ๆ</button>
          </div>
        )}
        {isPetSlot(g.slot) && (
          <div className="chips">
            <button className={`chip ${mode === 'mine' ? 'on' : ''}`} onClick={() => setMode('mine')}>ลองกับของที่ใส่อยู่</button>
            <button className={`chip ${mode === 'plain' ? 'on' : ''}`} onClick={() => setMode('plain')}>ดูเดี่ยว ๆ</button>
          </div>
        )}

        {set && (
          <div className="pv-set">
            <small>{set.icon} ชุด <b className="ko">{set.ko}</b> ({set.th}) · สะสมแล้ว {setHave}/{set.items.length} · ครบชุดรับ 🪙 {set.coins}</small>
            <small className="muted">{set.items.map((x) => (player.outfit && player.owned.includes(x) ? '✓ ' : '• ') + (player.owned.includes(x) ? GEAR_BY_ID[x].th : '???')).join('  ')}</small>
          </div>
        )}

        <div className="pv-actions">
          {owned ? (
            <button className={`pixel-btn ${wornNow ? 'on' : 'primary'}`} onClick={() => dispatch({ type: 'EQUIP', id: g.id })}>
              {wornNow ? (fixed ? '✔ ใช้อยู่' : 'ถอดออก') : g.slot === 'room' ? 'วางในห้อง' : 'สวมใส่'}
            </button>
          ) : g.achv ? (
            <span className="lock">🏆 ได้จากความสำเร็จเท่านั้น</span>
          ) : locked ? (
            <span className="lock">🔒 ปลดล็อกที่ Lv.{g.level} (ตอนนี้ Lv.{level})</span>
          ) : (
            <button className="pixel-btn primary" disabled={player.coins < price} onClick={() => dispatch({ type: 'BUY', kind: 'gear', id: g.id })}>
              {player.coins < price ? `ขาดอีก 🪙 ${price - player.coins}` : `ซื้อและใช้เลย ${onSale ? `🪙 ${price} (ลด 30%)` : `🪙 ${price}`}`}
            </button>
          )}
          <button className="pixel-btn" onClick={onClose}>ปิด</button>
        </div>
      </div>
    </Modal>
  )
}
