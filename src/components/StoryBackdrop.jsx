import Sprite from '../pixel/Sprite.jsx'
import { RoomItem } from '../pixel/Characters.jsx'

// ฉากหลังของเรื่อง: วาดจากพิกเซล + CSS เพื่อให้เห็นว่าอยู่ที่ไหน (ร้านเก่าแก่ / ห้องนอน / ลานบ้านยามค่ำ)
const JAR = ['..kkkk..', '..kllk..', '.kcccck.', 'kcwcccck', 'kcwcccck', 'kcccccck', '.kcccck.', '..kkkk..']
const LANTERN = ['...kk...', '..kkkk..', '.krrrrk.', 'krrwwrrk', 'krrwwrrk', 'krrrrrrk', '.krrrrk.', '..kkkk..', '...yy...', '...yy...']
const POT = ['.g.gg.', 'gggggg', '.gggg.', 'kkkkkk', '.kttk.', '.kttk.', '..kk..']
const BOOKS = ['kkkkkkkk', 'krrbbggk', 'krrbbggk', 'krrbbggk', 'kkkkkkkk']
const jar = (c) => ({ k: '#2a1a12', l: '#c9a36b', c, w: '#ffffff' })
const FF = Array.from({ length: 7 }, (_, i) => i)

function Shop() {
  return (
    <>
      <div className="bd-wall bd-wood" />
      <div className="bd-window"><span className="bd-sun" /></div>
      <div className="bd-sign ko">골동품<small>오래된 가게</small></div>
      <div className="bd-lantern"><span className="bd-glow" /><Sprite grid={LANTERN} pal={{ k: '#2a1a12', r: '#e5484d', w: '#ffd23f', y: '#ffd23f' }} scale={5} /></div>
      <div className="bd-shelf s1">
        <div className="bd-items">
          {['#e5484d', '#4f8cff', '#3fbf7f', '#ffd23f', '#b07cff'].map((c) => <Sprite key={c} grid={JAR} pal={jar(c)} scale={4} />)}
        </div>
        <i />
      </div>
      <div className="bd-shelf s2">
        <div className="bd-items">
          <Sprite grid={POT} pal={{ k: '#2a1a12', g: '#3fbf7f', t: '#c46a3b' }} scale={5} />
          <Sprite grid={BOOKS} pal={{ k: '#2a1a12', r: '#e5484d', b: '#4f8cff', g: '#3fbf7f' }} scale={5} />
          <Sprite grid={POT} pal={{ k: '#2a1a12', g: '#ff8fb1', t: '#8f4a28' }} scale={4} />
        </div>
        <i />
      </div>
      <div className="bd-floor bd-plank" />
      <div className="bd-rug rug-shop" />
    </>
  )
}

function Room() {
  return (
    <>
      <div className="bd-wall bd-dots" />
      <div className="bd-window night"><span className="bd-moon" /><span className="bd-star a" /><span className="bd-star b" /></div>
      <RoomItem id="room_frame" scale={5} className="bd-abs fr" />
      <RoomItem id="room_clock" scale={5} className="bd-abs ck" />
      <div className="bd-floor bd-plank light" />
      <div className="bd-rug rug-room" />
      <RoomItem id="room_plant" scale={7} className="bd-abs pl" />
      <div className="bd-lampglow" />
      <RoomItem id="room_lamp" scale={7} className="bd-abs lp" />
    </>
  )
}

const APPLE = ['..g...', '.rrrr.', 'rrrrrr', 'rrrrrr', '.rrrr.']
const CARROT = ['.gg.', '.gg.', 'oooo', '.oo.', '.oo.', '..o.']
const FRUIT_PAL = { g: '#3fbf7f', r: '#e5484d', o: '#ff9a3c' }

function Market() {
  return (
    <>
      <div className="bd-mkt-sky"><i className="cloud c1" /><i className="cloud c2" /></div>
      <div className="bd-mkt-sign ko">시장</div>
      <div className="bd-lights" />
      <div className="bd-stall l">
        <div className="awning red" />
        <div className="crate">
          {Array.from({ length: 6 }, (_, i) => <Sprite key={i} grid={APPLE} pal={FRUIT_PAL} scale={4} />)}
        </div>
      </div>
      <div className="bd-stall r">
        <div className="awning green" />
        <div className="crate">
          {Array.from({ length: 5 }, (_, i) => <Sprite key={i} grid={CARROT} pal={FRUIT_PAL} scale={4} />)}
        </div>
      </div>
      <div className="bd-floor bd-stone" />
    </>
  )
}

function Night() {
  return (
    <>
      <div className="bd-stars" />
      <div className="bd-bigmoon" />
      <div className="bd-hill h1" />
      <div className="bd-hill h2" />
      <div className="bd-hanok"><i className="roof" /><i className="wall"><b /></i></div>
      <div className="bd-tree"><i /><i /></div>
      <div className="bd-ground" />
      <div className="bd-lantern low"><span className="bd-glow" /><Sprite grid={LANTERN} pal={{ k: '#2a1a12', r: '#e5484d', w: '#ffd23f', y: '#ffd23f' }} scale={5} /></div>
      {FF.map((i) => <span key={i} className="bd-fly" style={{ '--i': i }} />)}
    </>
  )
}

export default function StoryBackdrop({ bg }) {
  return (
    <div className={`bd bd-${bg}`} aria-hidden="true">
      {bg === 'shop' ? <Shop /> : bg === 'night' ? <Night /> : bg === 'market' ? <Market /> : <Room />}
    </div>
  )
}
