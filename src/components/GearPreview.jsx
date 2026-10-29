import { Avatar, Pet, RoomItem } from '../pixel/Characters.jsx'
import { isPetSlot } from '../data/shop.js'

// ภาพตัวอย่างไอเทม: ของห้อง/วอลเปเปอร์/พื้นแสดงเดี่ยว ๆ, ของ 범이 แสดงบนเสือ, ที่เหลือแสดงบนตัวละครของผู้เล่น
// (หน้าตาตามที่ผู้เล่นตั้งไว้ แต่ใส่เฉพาะไอเทมนั้นบนเสื้อมาตรฐาน เพื่อให้เปรียบเทียบชิ้นต่อชิ้นได้ชัด)
const BASE_OUTFIT = { top: 'top_blue' }
export default function GearPreview({ g, scale = 3 }) {
  if (g.slot === 'room') {
    if (g.rug) return <div className={`rug-preview ${g.rug}`} />
    return <RoomItem id={g.id} scale={Math.max(2, scale)} />
  }
  if (g.slot === 'wall' || g.slot === 'floor') return <div className={`swatch-room ${g.cls}`} />
  if (isPetSlot(g.slot)) return <Pet stage="teen" outfit={{ [g.slot]: g.id }} scale={scale + 1} />
  return <Avatar outfit={{ ...BASE_OUTFIT, [g.slot]: g.id }} scale={scale} />
}
