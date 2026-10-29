import { useState } from 'react'
import { useGame } from '../game/store.jsx'
import { GEAR, GEAR_BY_ID, SETS, SLOT_GROUPS, RARITY } from '../data/shop.js'
import GearPreview from './GearPreview.jsx'

const FILTERS = [
  { id: 'all', th: 'ทั้งหมด' },
  { id: 'wear', th: 'เสื้อผ้า' },
  { id: 'acc', th: 'เครื่องประดับ' },
  { id: 'pet', th: '범이' },
  { id: 'room', th: 'ห้อง' },
]

// สมุดสะสม: ภาพรวมความสำเร็จของการสะสม / ชุดสะสม / รายการทั้งหมด (ที่ยังไม่มีแสดงเป็นเงาดำ)
export default function CollectionBook() {
  const { state } = useGame()
  const [filter, setFilter] = useState('all')
  const owned = new Set(state.player.owned)
  const total = GEAR.length
  const have = GEAR.filter((g) => owned.has(g.id)).length
  const pct = Math.round((have / total) * 100)
  const remaining = GEAR.filter((g) => !owned.has(g.id) && !g.achv).reduce((sum, g) => sum + g.price, 0)

  const shown = GEAR.filter((g) => filter === 'all' || SLOT_GROUPS[filter].includes(g.slot))
    .sort((a, b) => (owned.has(b.id) - owned.has(a.id)) || a.level - b.level || a.price - b.price)

  return (
    <div className="book">
      <div className="book-sum pixel-box">
        <b>สะสมแล้ว {have}/{total}</b> <small className="muted">({pct}%)</small>
        <div className="bar-track"><div className="bar-fill" style={{ width: `${pct}%`, background: 'var(--accent)' }} /></div>
        <small className="muted">ราคาที่เหลือของทั้งคอลเลกชัน ≈ 🪙 {remaining.toLocaleString()} (ไม่รวมของพิเศษที่ได้จากความสำเร็จ)</small>
        <div className="rar-row">
          {Object.entries(RARITY).map(([k, r]) => {
            const all = GEAR.filter((g) => g.rarity === k)
            return <span key={k} style={{ color: r.c }}>● {r.th} {all.filter((g) => owned.has(g.id)).length}/{all.length}</span>
          })}
        </div>
      </div>

      <h4 className="time-title">ชุดสะสม · 세트 <small className="muted">(ใกล้ครบขึ้นก่อน)</small></h4>
      <div className="set-list">
        {[...SETS].sort((a, b) => {
          const ma = a.items.filter((id) => !owned.has(id)).length
          const mb = b.items.filter((id) => !owned.has(id)).length
          return (ma === 0) - (mb === 0) || ma - mb
        }).map((set) => {
          const got = set.items.filter((id) => owned.has(id)).length
          const done = got === set.items.length
          const missing = set.items.filter((id) => !owned.has(id))
          const cost = missing.reduce((sum, id) => sum + (GEAR_BY_ID[id].achv ? 0 : GEAR_BY_ID[id].price), 0)
          const near = !done && missing.length <= 2
          return (
            <div key={set.id} className={`set pixel-box ${done ? 'done' : ''} ${near ? 'near' : ''}`}>
              <div className="row between">
                <span><span className="achv-ico">{set.icon}</span> <b className="ko">{set.ko}</b> <small className="muted">{set.th}</small></span>
                <small className="mono">{done ? '✓ ครบชุด' : near ? `🔥 ขาดอีก ${missing.length} ชิ้น` : `${got}/${set.items.length}`}</small>
              </div>
              <div className="bar-track"><div className="bar-fill" style={{ width: `${(got / set.items.length) * 100}%`, background: done ? '#5fd38d' : 'var(--accent)' }} /></div>
              <small className="muted">
                {set.items.map((id) => <span key={id} className={owned.has(id) ? 'set-have' : 'set-miss'}>{owned.has(id) ? GEAR_BY_ID[id].th : '???'} · </span>)}
                รางวัล 🪙 {set.coins}{!done && cost > 0 ? ` · ที่เหลือราคารวม ≈ 🪙 ${cost}` : ''}
              </small>
            </div>
          )
        })}
      </div>

      <h4 className="time-title">รายการทั้งหมด</h4>
      <div className="chips filter-chips">
        {FILTERS.map((f) => <button key={f.id} className={`chip ${filter === f.id ? 'on' : ''}`} onClick={() => setFilter(f.id)}>{f.th}</button>)}
      </div>
      <div className="book-grid">
        {shown.map((g) => {
          const has = owned.has(g.id)
          return (
            <div key={g.id} className={`book-item pixel-box rar-${g.rarity} ${has ? '' : 'missing'}`} title={has ? g.th : '???'}>
              <div className="book-prev"><GearPreview g={g} outfit={state.player.outfit} scale={2} /></div>
              <small className="ko">{has ? g.ko : '???'}</small>
              {!has && <small className="muted">{g.achv ? '🏆 ความสำเร็จ' : `Lv.${g.level}`}</small>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
