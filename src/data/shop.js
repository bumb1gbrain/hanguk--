// ร้านค้า — ชื่อสินค้าเป็นภาษาเกาหลีด้วย ได้เรียนไปในตัว
import { ITEMS, ROOM_ITEMS, WALLS, FLOORS, SETS } from '../pixel/items.js'

export const FOODS = [
  { id: 'milk', ko: '우유', read: 'อูยู', th: 'นม', price: 5, full: 12, happy: 0, icon: '🥛' },
  { id: 'banana', ko: '바나나우유', read: 'พานานาอูยู', th: 'นมกล้วย', price: 10, full: 15, happy: 8, icon: '🍌' },
  { id: 'kimbap', ko: '김밥', read: 'คิมบับ', th: 'คิมบับ', price: 12, full: 28, happy: 3, icon: '🍙' },
  { id: 'tteok', ko: '떡볶이', read: 'ต็อกบกกี', th: 'ต็อกบกกี', price: 18, full: 30, happy: 12, icon: '🌶️' },
  { id: 'songpyeon', ko: '송편', read: 'ซงพยอน', th: 'ซงพยอน (ขนมข้าวชูซอก)', price: 20, full: 22, happy: 10, icon: '🥟' },
  { id: 'samgyeop', ko: '삼겹살', read: 'ซัมกยอบซัล', th: 'หมูสามชั้นย่าง', price: 30, full: 50, happy: 15, icon: '🥓' },
]

// slot: top | bottom | shoes | hat | glasses | face | neck | back | hand | pet_hat | pet_face | pet_neck | room | wall | floor
// achv: true = ไอเทมพิเศษที่ได้จากความสำเร็จเท่านั้น (ไม่ขายในร้าน)
// ── ของพื้นฐานชุดแรก (สไปรต์อยู่ใน sprites.js) ──
const BASE_GEAR = [
  // เสื้อ
  { id: 'top_blue', slot: 'top', ko: '파란 티셔츠', th: 'เสื้อยืดสีฟ้า', price: 0, level: 1 },
  { id: 'top_red', slot: 'top', ko: '빨간 후드티', th: 'ฮู้ดสีแดง', price: 40, level: 2 },
  { id: 'top_green', slot: 'top', ko: '초록 티셔츠', th: 'เสื้อยืดสีเขียว', price: 40, level: 3 },
  { id: 'top_yellow', slot: 'top', ko: '노란 티셔츠', th: 'เสื้อยืดสีเหลือง', price: 40, level: 2 },
  { id: 'top_pink', slot: 'top', ko: '분홍 티셔츠', th: 'เสื้อยืดสีชมพู', price: 40, level: 2 },
  { id: 'top_black', slot: 'top', ko: '검은 티셔츠', th: 'เสื้อยืดสีดำ', price: 60, level: 4 },
  { id: 'top_uniform', slot: 'top', ko: '교복', th: 'ชุดนักเรียน', price: 120, level: 5 },
  { id: 'top_hanbok', slot: 'top', ko: '한복', th: 'ชุดฮันบก', price: 200, level: 6 },
  // กางเกง/กระโปรง
  { id: 'pants_navy', slot: 'bottom', ko: '남색 바지', th: 'กางเกงสีกรม', price: 0, level: 1 },
  { id: 'skirt_navy', slot: 'bottom', ko: '남색 치마', th: 'กระโปรงสีกรม', price: 0, level: 1 },
  { id: 'pants_khaki', slot: 'bottom', ko: '카키 바지', th: 'กางเกงสีกากี', price: 40, level: 2 },
  { id: 'shorts_denim', slot: 'bottom', ko: '청반바지', th: 'กางเกงยีนส์ขาสั้น', price: 50, level: 3 },
  { id: 'skirt_pink', slot: 'bottom', ko: '분홍 치마', th: 'กระโปรงสีชมพู', price: 50, level: 3 },
  { id: 'pants_black', slot: 'bottom', ko: '검은 바지', th: 'กางเกงสีดำ', price: 60, level: 4 },
  // รองเท้า
  { id: 'shoes_sneaker', slot: 'shoes', ko: '운동화', th: 'รองเท้าผ้าใบสีขาว', price: 50, level: 3 },
  { id: 'shoes_boots', slot: 'shoes', ko: '부츠', th: 'รองเท้าบูท', price: 80, level: 5 },
  // หมวก/เครื่องประดับผม
  { id: 'hat_beanie', slot: 'hat', ko: '비니', th: 'หมวกไหมพรม', price: 40, level: 2 },
  { id: 'hat_band', slot: 'hat', ko: '머리띠', th: 'ที่คาดผม', price: 35, level: 2 },
  { id: 'hat_flower', slot: 'hat', ko: '꽃 핀', th: 'กิ๊บดอกไม้', price: 45, level: 3 },
  { id: 'hat_cap', slot: 'hat', ko: '야구 모자', th: 'หมวกแก๊ป', price: 60, level: 3 },
  { id: 'hat_cat', slot: 'hat', ko: '고양이 귀', th: 'ที่คาดผมหูแมว', price: 80, level: 4 },
  { id: 'hat_beret', slot: 'hat', ko: '베레모', th: 'หมวกเบเร่ต์', price: 90, level: 5 },
  { id: 'hat_bunny', slot: 'hat', ko: '토끼 귀', th: 'ที่คาดผมหูกระต่าย', price: 120, level: 6 },
  { id: 'hat_gat', slot: 'hat', ko: '갓', th: 'หมวกกัด (โบราณ)', price: 150, level: 5 },
  { id: 'hat_crown', slot: 'hat', ko: '왕관', th: 'มงกุฎ', price: 300, level: 8 },
  { id: 'hat_tiger', slot: 'hat', ko: '호랑이 귀', th: 'หูเสือ (ของพิเศษ)', price: 0, level: 1, achv: true },
  // แว่น
  { id: 'glasses', slot: 'glasses', ko: '안경', th: 'แว่นตา', price: 50, level: 2 },
  { id: 'glasses_round', slot: 'glasses', ko: '동그란 안경', th: 'แว่นกลม', price: 60, level: 3 },
  { id: 'glasses_sun', slot: 'glasses', ko: '선글라스', th: 'แว่นกันแดด', price: 70, level: 4 },
  // คอ
  { id: 'neck_bow', slot: 'neck', ko: '나비넥타이', th: 'โบว์ผูกคอ', price: 50, level: 3 },
  { id: 'scarf', slot: 'neck', ko: '목도리', th: 'ผ้าพันคอ', price: 70, level: 4 },
  { id: 'neck_chain', slot: 'neck', ko: '목걸이', th: 'สร้อยคอ', price: 90, level: 5 },
  { id: 'neck_medal', slot: 'neck', ko: '메달', th: 'เหรียญรางวัล (ของพิเศษ)', price: 0, level: 1, achv: true },
  // กระเป๋า
  { id: 'back_pack', slot: 'back', ko: '배낭', th: 'กระเป๋าเป้', price: 80, level: 3 },
]

// ── ความหายาก: ตามราคา (ของพิเศษจากความสำเร็จ = ตำนานเสมอ) ──
export const RARITY = {
  common: { th: 'ธรรมดา', ko: '일반', c: '#9aa0b4' },
  rare: { th: 'หายาก', ko: '레어', c: '#4f8cff' },
  epic: { th: 'ล้ำค่า', ko: '에픽', c: '#c86bfa' },
  legendary: { th: 'ตำนาน', ko: '전설', c: '#ffd23f' },
}
export const rarityOf = (g) => (g.achv ? 'legendary' : g.price <= 55 ? 'common' : g.price <= 100 ? 'rare' : g.price <= 200 ? 'epic' : 'legendary')

// ของเริ่มต้นราคาถูก/ปลดล็อกตั้งแต่เลเวล 1 เพื่อให้วันแรกมีของให้เลือกหลายหมวด (ไม่ต้องรอเลเวล 2)
const STARTER = {
  top_gray: { level: 1, price: 30 }, top_navy: { level: 1, price: 35 },
  pants_gray: { level: 1, price: 30 }, shorts_black: { level: 1, price: 35 },
  shoes_slipper: { level: 1, price: 25 },
  hat_band: { level: 1, price: 25 }, hat_party: { level: 1, price: 35 }, hat_beanie: { level: 1, price: 30 },
  glasses: { level: 1, price: 35 }, face_freckles: { level: 1, price: 20 }, face_bandaid: { level: 1, price: 20 }, face_mask: { level: 1, price: 25 },
  hand_book: { level: 1, price: 30 }, hand_coffee: { level: 1, price: 30 },
  neck_tie: { level: 1, price: 40 }, back_balloon: { level: 1, price: 45 },
  pet_hat_bow: { level: 1, price: 25 }, pet_neck_bell: { level: 1, price: 20 },
  wall_mint: { level: 1, price: 35 }, room_cactus: { level: 1, price: 40 },
}
const strip = ({ sprite, color, late, ...rest }) => rest
export const GEAR = [
  ...BASE_GEAR,
  ...ITEMS.map(strip),
  ...ROOM_ITEMS.map(({ pal, grid, ...rest }) => ({ ...rest, slot: 'room' })),
  ...WALLS.map((w) => ({ ...w, slot: 'wall' })),
  ...FLOORS.map((f) => ({ ...f, slot: 'floor' })),
].map((g) => ({ ...g, ...(STARTER[g.id] || {}) })).map((g) => ({ ...g, rarity: g.rarity || rarityOf(g) }))

// กลุ่มช่องสำหรับแท็บในร้านและตู้เสื้อผ้า
export const SLOT_GROUPS = {
  wear: ['top', 'bottom', 'shoes'],
  acc: ['hat', 'glasses', 'face', 'neck', 'back', 'hand'],
  pet: ['pet_hat', 'pet_face', 'pet_neck'],
  room: ['room', 'wall', 'floor'],
}
export const SLOT_TH = {
  top: 'เสื้อ', bottom: 'กางเกง/กระโปรง', shoes: 'รองเท้า', hat: 'หมวก/ที่คาดผม', glasses: 'แว่น', face: 'ใบหน้า', neck: 'คอ', back: 'หลัง', hand: 'ถือในมือ',
  pet_hat: 'หมวก 범이', pet_face: 'แว่น 범이', pet_neck: 'คอ 범이', room: 'ของตกแต่ง', wall: 'วอลเปเปอร์', floor: 'พื้น',
}
export const isPetSlot = (slot) => slot.startsWith('pet_')
export { SETS }
export const GEAR_BY_ID = Object.fromEntries(GEAR.map((g) => [g.id, g]))
// ไอเทม → ชุดสะสมที่มันอยู่ (ถ้ามี)
export const SET_OF = Object.fromEntries(SETS.flatMap((set) => set.items.map((id) => [id, set])))
export const FOOD_BY_ID = Object.fromEntries(FOODS.map((f) => [f.id, f]))

// ของพิเศษ: ตัวป้องกัน streak ใช้อัตโนมัติเมื่อพลาดวัน (ถือได้สูงสุด max ชิ้น)
export const STREAK_FREEZE = { id: 'freeze', ko: '스트릭 보호권', read: 'ซือทือริก โพโฮกวอน', th: 'ตัวป้องกัน streak', price: 60, max: 2, icon: '🧊' }
