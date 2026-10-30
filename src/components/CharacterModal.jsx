import { useState } from 'react'
import { useGame } from '../game/store.jsx'
import { levelInfo, rankFor, nextRank } from '../game/logic.js'
import { GEAR, SLOT_GROUPS, SLOT_TH } from '../data/shop.js'
import { ACHIEVEMENTS } from '../data/achievements.js'
import { Avatar, Pet } from '../pixel/Characters.jsx'
import { stageFor } from '../game/logic.js'
import CollectionBook from './CollectionBook.jsx'
import { Modal } from './ui.jsx'
import LookEditor from './LookEditor.jsx'
import GearPreview from './GearPreview.jsx'

const TABS = [
  { id: 'look', th: '🎨 หน้าตา' },
  { id: 'wear', th: '👕 ตัวละคร' },
  { id: 'pet', th: '🐾 สัตว์เลี้ยง' },
  { id: 'room', th: '🏠 ห้อง' },
  { id: 'book', th: '📕 สะสม' },
  { id: 'achv', th: '🏆 สำเร็จ' },
]

// รายการของที่มีแล้วในกลุ่มช่องที่กำหนด + ปุ่มสวมใส่/ถอด/วาง
function OwnedList({ slots, wornOf, state, dispatch }) {
  const owned = new Set(state.player.owned)
  return (
    <div className="wardrobe">
      {slots.map((slot) => {
        const items = GEAR.filter((g) => g.slot === slot && owned.has(g.id))
        if (!items.length) return null
        return (
          <div key={slot}>
            <h4 className="time-title">{SLOT_TH[slot]} <small className="muted">({items.length})</small></h4>
            <div className="wardrobe-list">
              {items.map((g) => {
                const worn = wornOf(g)
                return (
                  <button key={g.id} className={`wd-item pixel-box rar-${g.rarity} ${worn ? 'on' : ''}`} onClick={() => dispatch({ type: 'EQUIP', id: g.id })}>
                    <GearPreview g={g} outfit={state.player.outfit} />
                    <small className="ko">{g.gender ? (g.gender === 'f' ? '♀ ' : '♂ ') : ''}{g.ko}</small>
                    <small className="muted">{worn ? '✔ ใช้อยู่' : g.slot === 'room' ? 'วาง' : 'ใช้'}</small>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
      <small className="muted">ซื้อเพิ่มได้ที่ร้านค้า · ไอเทมพิเศษได้จากความสำเร็จและการสะสมครบชุด</small>
    </div>
  )
}

export default function CharacterModal({ onClose }) {
  const { state, dispatch } = useGame()
  const [tab, setTab] = useState('look')
  const { player } = state
  const lv = levelInfo(player.xp)
  const rank = rankFor(lv.level)
  const nr = nextRank(lv.level)
  const owned = new Set(player.owned)
  const got = state.achv || {}

  return (
    <Modal onClose={onClose} closable>
      <div className="char-head">
        <Avatar outfit={player.outfit} scale={6} className="bob" />
        <div>
          <b>{player.name}</b> <small className="muted">Lv.{lv.level}</small>
          <div className="ko rank">{rank.ko} <small className="muted">· {rank.th}</small></div>
          {nr && <small className="muted">ฉายาถัดไป: <span className="ko">{nr.ko}</span> ที่ Lv.{nr.lv}</small>}
        </div>
      </div>
      <div className="tabs tabs-grid">
        {TABS.map((t) => <button key={t.id} className={`tab ${tab === t.id ? 'on' : ''}`} onClick={() => setTab(t.id)}>{t.th}</button>)}
      </div>

      {tab === 'look' && <LookEditor look={player.look} onChange={(look) => dispatch({ type: 'SET_LOOK', look })} />}

      {tab === 'wear' && (
        <OwnedList slots={[...SLOT_GROUPS.wear, ...SLOT_GROUPS.acc]} state={state} dispatch={dispatch} wornOf={(g) => player.outfit[g.slot] === g.id} />
      )}

      {tab === 'pet' && (
        <>
          <div className="center"><Pet stage={stageFor(state.pet.growth).id === 'egg' ? 'baby' : stageFor(state.pet.growth).id} mood="happy" scale={6} className="bob" /></div>
          <OwnedList slots={SLOT_GROUPS.pet} state={state} dispatch={dispatch} wornOf={(g) => state.pet.outfit?.[g.slot] === g.id} />
        </>
      )}

      {tab === 'room' && (
        <OwnedList
          slots={SLOT_GROUPS.room}
          state={state}
          dispatch={dispatch}
          wornOf={(g) => (g.slot === 'room' ? player.room?.[g.spot] === g.id : player.room?.[g.slot] === g.id)}
        />
      )}

      {tab === 'book' && <CollectionBook />}

      {tab === 'achv' && (
        <div className="achv-list">
          <small className="muted">{Object.keys(got).length}/{ACHIEVEMENTS.length} สำเร็จแล้ว</small>
          {ACHIEVEMENTS.map((a) => (
            <div key={a.id} className={`achv pixel-box ${got[a.id] ? 'got' : ''}`}>
              <span className="achv-ico">{got[a.id] ? a.icon : '🔒'}</span>
              <div className="achv-text">
                <div className="ko">{a.ko}</div>
                <small className="muted">{a.th} · +{a.coins} 🪙{a.item ? ' + ไอเทมพิเศษ' : ''}</small>
              </div>
              {got[a.id] && <small className="mono">✓</small>}
            </div>
          ))}
        </div>
      )}

      <button className="pixel-btn" onClick={onClose}>ปิด</button>
    </Modal>
  )
}
