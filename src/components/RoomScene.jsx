import { Avatar, Pet, RoomItem } from '../pixel/Characters.jsx'
import { WALLS, FLOORS, ROOM_ITEMS } from '../pixel/items.js'
import { stageFor } from '../game/logic.js'

const WALL_CLS = Object.fromEntries(WALLS.map((w) => [w.id, w.cls]))
const FLOOR_CLS = Object.fromEntries(FLOORS.map((f) => [f.id, f.cls]))
const RUG_CLS = { room_rug: 'rug-classic', ...Object.fromEntries(ROOM_ITEMS.filter((r) => r.rug).map((r) => [r.id, r.rug])) }

// ห้องจำลองสำหรับดูตัวอย่าง (ไม่มีปุ่ม/ข้อความ) ใช้ในหน้าต่างลองสวมของตกแต่งห้อง
export default function RoomScene({ room, outfit, petGrowth, petOutfit }) {
  return (
    <div className={`room pixel-box ${WALL_CLS[room.wall] || 'wall-default'} ${FLOOR_CLS[room.floor] || 'floor-default'}`}>
      <div className="window"><span className="sun" /></div>
      {room.wallC && <RoomItem id={room.wallC} scale={3} className="r-wallC" />}
      {room.wallR && <RoomItem id={room.wallR} scale={3} className="r-poster" />}
      {room.floorL && <RoomItem id={room.floorL} scale={4} className="r-plant" />}
      {room.floorR && <RoomItem id={room.floorR} scale={4} className="r-lamp" />}
      {room.rug && <div className={`r-rug ${RUG_CLS[room.rug] || 'rug-classic'}`} />}
      <div className="floor" />
      <div className="avatar-spot"><Avatar outfit={outfit} scale={5} /></div>
      <div className="pet-spot"><Pet stage={stageFor(petGrowth).id} outfit={petOutfit} scale={4} /></div>
    </div>
  )
}
