import { useState } from 'react'
import { useGame } from '../game/store.jsx'
import { levelInfo } from '../game/logic.js'
import { FOODS, GEAR, GEAR_BY_ID, STREAK_FREEZE, SLOT_GROUPS, SLOT_TH, RARITY, SET_OF } from '../data/shop.js'
import { BOX_PRICE, ODDS, FEATURED_DISCOUNT, salePrice } from '../game/loot.js'
import GearPreview from '../components/GearPreview.jsx'
import PreviewModal from '../components/PreviewModal.jsx'
import { Coins } from '../components/ui.jsx'
import { speak } from '../game/lessonVoice.js'

const TABS = [
  { id: 'food', ko: '음식', th: 'อาหาร' },
  { id: 'wear', ko: '옷', th: 'เสื้อผ้า' },
  { id: 'acc', ko: '소품', th: 'เครื่องประดับ' },
  { id: 'pet', ko: '펫', th: 'ของสัตว์เลี้ยง' },
  { id: 'room', ko: '방', th: 'ห้อง' },
  { id: 'wish', ko: '★', th: 'อยากได้' },
  { id: 'item', ko: '특별', th: 'พิเศษ' },
]

export default function Shop() {
  const { state, dispatch } = useGame()
  const [tab, setTab] = useState('food')
  const [slot, setSlot] = useState('all') // ตัวกรองช่องย่อยในแท็บ
  const [preview, setPreview] = useState(null) // id ไอเทมที่เปิดหน้าต่างลองสวม
  const { player, daily } = state
  const level = levelInfo(player.xp).level
  const owned = new Set(player.owned)
  const wish = new Set(player.wish || [])
  const slots = SLOT_GROUPS[tab]
  const featured = daily.featured && !owned.has(daily.featured) ? GEAR_BY_ID[daily.featured] : null

  const list = slots
    ? GEAR.filter((g) => slots.includes(g.slot) && (slot === 'all' || g.slot === slot) && (!g.achv || owned.has(g.id)))
      // ที่ซื้อได้ก่อน → ยังไม่ปลดล็อกถัดมา → ที่มีแล้วท้ายสุด; ในกลุ่มเดียวกันเรียงตามเลเวล แล้วราคา
      .sort((a, b) => (owned.has(a.id) - owned.has(b.id)) || (level < a.level) - (level < b.level) || a.level - b.level || a.price - b.price)
    : []
  const ownedCount = slots ? GEAR.filter((g) => slots.includes(g.slot) && owned.has(g.id)).length : 0
  const totalCount = slots ? GEAR.filter((g) => slots.includes(g.slot) && !g.achv).length : 0
  const wished = GEAR.filter((g) => wish.has(g.id) && !owned.has(g.id))

  const star = (g) => (
    <button className={`wish-btn ${wish.has(g.id) ? 'on' : ''}`} onClick={() => dispatch({ type: 'WISH', id: g.id })} aria-label={wish.has(g.id) ? 'เอาออกจากรายการอยากได้' : 'เพิ่มในรายการอยากได้'}>
      {wish.has(g.id) ? '★' : '☆'}
    </button>
  )

  const card = (g) => {
    const has = owned.has(g.id)
    const locked = level < g.level
    const price = salePrice(g, daily.featured)
    const onSale = price !== g.price && !has
    const set = SET_OF[g.id]
    const setHave = set ? set.items.filter((x) => owned.has(x)).length : 0
    const wornNow = g.slot === 'room' ? player.room?.[g.spot] === g.id
      : g.slot === 'wall' || g.slot === 'floor' ? player.room?.[g.slot] === g.id
      : g.slot.startsWith('pet_') ? state.pet.outfit?.[g.slot] === g.id
      : player.outfit[g.slot] === g.id
    const fixed = g.slot === 'top' || g.slot === 'bottom' || g.slot === 'wall' || g.slot === 'floor'
    return (
      <div key={g.id} className={`shop-item pixel-box rar-${g.rarity} ${locked && !has ? 'locked' : ''}`}>
        {!has && star(g)}
        <button className="s-prev" onClick={() => setPreview(g.id)} aria-label={`ดู ${g.th} ขนาดใหญ่และลองสวม`}>
          <GearPreview g={g} />
          <span className="zoom-hint">🔍</span>
        </button>
        <div className="ko s-name">{g.ko}</div>
        <small className="s-th">{g.th}</small>
        <small className="rar-tag" style={{ color: RARITY[g.rarity].c }}>● {RARITY[g.rarity].th}</small>
        {g.gender && <small className={`g-tag ${g.gender}`}>{g.gender === 'f' ? '♀ ทรงผู้หญิง' : '♂ ทรงผู้ชาย'}</small>}
        {set && !has && <small className={`set-tag ${setHave >= set.items.length - 1 ? 'near' : ''}`}>🧩 {set.ko} {setHave}/{set.items.length}{setHave === set.items.length - 1 ? ' · ชิ้นสุดท้าย!' : ''}</small>}
        {has ? (
          <button className={`pixel-btn ${wornNow ? 'on' : ''}`} onClick={() => dispatch({ type: 'EQUIP', id: g.id })}>
            {wornNow ? (fixed ? '✔ ใช้อยู่' : 'ถอด') : g.slot === 'room' ? 'วาง' : 'สวมใส่'}
          </button>
        ) : locked ? (
          <span className="lock">🔒 Lv.{g.level}</span>
        ) : (
          <button className="pixel-btn primary" disabled={player.coins < price} onClick={() => dispatch({ type: 'BUY', kind: 'gear', id: g.id })}>
            {onSale && <s className="old-price">{g.price}</s>} 🪙 {price}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="page">
      <div className="row between">
        <h2 className="section-title">상점 · ร้านค้า</h2>
        <Coins n={player.coins} />
      </div>
      <div className="tabs tabs-wrap">
        {TABS.map((t) => (
          <button key={t.id} className={`tab ${tab === t.id ? 'on' : ''}`} onClick={() => { setTab(t.id); setSlot('all') }}>
            <span className="ko">{t.ko}</span> {t.th}{t.id === 'wish' && wished.length > 0 ? ` (${wished.length})` : ''}
          </button>
        ))}
      </div>

      {/* ของเด่นประจำวัน: แสดงบนทุกแท็บของแต่งตัว */}
      {slots && featured && (
        <button className="featured pixel-box" onClick={() => setPreview(featured.id)}>
          <span className="featured-prev"><GearPreview g={featured} scale={2} /></span>
          <span className="featured-text">
            <small className="muted">⭐ ของเด่นวันนี้ · ลด {Math.round(FEATURED_DISCOUNT * 100)}%</small>
            <b className="ko">{featured.ko}</b>
            <small>{featured.th} · <s>{featured.price}</s> → 🪙 {salePrice(featured, featured.id)}</small>
          </span>
          <span className="chev">▶</span>
        </button>
      )}

      {tab === 'food' && (
        <div className="shop-grid">
          {FOODS.map((f) => (
            <div key={f.id} className="shop-item pixel-box">
              <div className="s-ico">{f.icon}</div>
              <button className="ko s-name" onClick={() => speak(f.ko)}>{f.ko} 🔊</button>
              <small>{f.read} · {f.th}</small>
              <small className="muted">🍙+{f.full}{f.happy ? ` ❤️+${f.happy}` : ''} · มี {state.inventory[f.id] || 0}</small>
              <button className="pixel-btn primary" disabled={player.coins < f.price} onClick={() => dispatch({ type: 'BUY', kind: 'food', id: f.id })}>
                🪙 {f.price}
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'item' && (
        <div className="shop-grid">
          <div className="shop-item pixel-box">
            <div className="s-ico">🎁</div>
            <b className="ko s-name">미스터리 박스</b>
            <small>กล่องสุ่มไอเทม (ได้ของที่ยังไม่มีแน่นอน)</small>
            <small className="muted">
              ธรรมดา {ODDS.paid.common}% · หายาก {ODDS.paid.rare}% · ล้ำค่า {ODDS.paid.epic}% · ตำนาน {ODDS.paid.legendary}%
            </small>
            <button className="pixel-btn primary" disabled={player.coins < BOX_PRICE} onClick={() => dispatch({ type: 'OPEN_BOX', kind: 'paid' })}>
              เปิดกล่อง 🪙 {BOX_PRICE}
            </button>
          </div>
          <div className="shop-item pixel-box">
            <div className="s-ico">{STREAK_FREEZE.icon}</div>
            <button className="ko s-name" onClick={() => speak('스트릭 보호')}>{STREAK_FREEZE.ko} 🔊</button>
            <small>{STREAK_FREEZE.th}</small>
            <small className="muted">ใช้อัตโนมัติเมื่อพลาดเรียนหนึ่งวัน streak ไม่ขาด · มี {player.freezes || 0}/{STREAK_FREEZE.max}</small>
            <button
              className="pixel-btn primary"
              disabled={player.coins < STREAK_FREEZE.price || (player.freezes || 0) >= STREAK_FREEZE.max}
              onClick={() => dispatch({ type: 'BUY', kind: 'special', id: STREAK_FREEZE.id })}
            >
              {(player.freezes || 0) >= STREAK_FREEZE.max ? 'ถือครบแล้ว' : `🪙 ${STREAK_FREEZE.price}`}
            </button>
          </div>
        </div>
      )}

      {tab === 'wish' && (
        wished.length === 0 ? (
          <div className="tip">☆ ยังไม่มีของที่อยากได้ — กดดาว ☆ บนการ์ดไอเทมเพื่อเก็บไว้ที่นี่ จะได้เห็นว่าเหลืออีกกี่เหรียญ</div>
        ) : (
          <div className="wish-list">
            {[...wished].sort((a, b) => salePrice(a, daily.featured) - salePrice(b, daily.featured)).map((g) => {
              const price = salePrice(g, daily.featured)
              const locked = level < g.level
              const ok = !locked && player.coins >= price
              return (
                <div key={g.id} className={`wish-row pixel-box rar-${g.rarity}`}>
                  <button className="wish-prev" onClick={() => setPreview(g.id)}><GearPreview g={g} scale={2} /></button>
                  <div className="wish-info">
                    <b className="ko">{g.ko}</b> <small className="muted">{g.th}</small>
                    {locked ? <small className="muted">🔒 ปลดล็อกที่ Lv.{g.level}</small> : (
                      <>
                        <div className="bar-track"><div className="bar-fill" style={{ width: `${Math.min(100, (player.coins / price) * 100)}%`, background: ok ? '#5fd38d' : 'var(--accent)' }} /></div>
                        <small className="muted">{ok ? 'พอซื้อแล้ว!' : `ขาดอีก 🪙 ${price - player.coins}`} · 🪙 {price}</small>
                      </>
                    )}
                  </div>
                  <div className="wish-actions">
                    {!locked && <button className="pixel-btn primary small" disabled={!ok} onClick={() => dispatch({ type: 'BUY', kind: 'gear', id: g.id })}>ซื้อ</button>}
                    {star(g)}
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}

      {slots && (
        <>
          <div className="chips filter-chips">
            <button className={`chip ${slot === 'all' ? 'on' : ''}`} onClick={() => setSlot('all')}>ทั้งหมด <small>{ownedCount}/{totalCount}</small></button>
            {slots.map((sl) => <button key={sl} className={`chip ${slot === sl ? 'on' : ''}`} onClick={() => setSlot(sl)}>{SLOT_TH[sl]}</button>)}
          </div>
          <div className="shop-grid compact">{list.map(card)}</div>
        </>
      )}
      {preview && <PreviewModal id={preview} onClose={() => setPreview(null)} />}
    </div>
  )
}
