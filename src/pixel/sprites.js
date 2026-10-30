// Pixel sprites as string grids. '.' = transparent.
import { ITEM_OVERLAYS, ITEM_TOP_COLORS, ROOM_ITEMS } from './items.js'


// ── Player avatar (16 x 22) ──
// ฐานตัวละคร: หัวล้าน (ไม่มีผม) และไม่มีขา — ผม/ขา(กางเกง,กระโปรง)/ไอเทมเป็น overlay ซ้อนทับ
// s=skin h=hair e=eye r=blush m=mouth c=shirt p=pants b=shoes
export const AVATAR = [
  '................',
  '................',
  '................',
  '.....ssssss.....',
  '...ssssssssss...',
  '...ssssssssss...',
  '...ssessssess...',
  '...ssessssess...',
  '...srssssssrs...',
  '...ssssmmssss...',
  '....ssssssss....',
  '.....ssssss.....',
  '....cccccccc....',
  '...cccccccccc...',
  '..cccccccccccc..',
  '..cccccccccccc..',
  '..sccccccccccs..',
  '................',
  '................',
  '................',
  '...bbbb..bbbb...',
  '................',
]
// eyes closed (sleepy) — replaces rows 6-7
export const AVATAR_SLEEPY = { 6: '...ssssssssss...', 7: '...seessssees...' }
export const AVATAR_HAPPY = { 6: '...ssessssess...', 7: '...sesesseses...' }

// ── ฐานตามเพศ: ชาย = ไหล่กว้าง กรามเหลี่ยม มีคิ้ว / หญิง = ไหล่แคบ เอวคอด คางเรียว ขนตา แก้มแดง ──
const withRows = (rows) => AVATAR.map((r, i) => rows[i] ?? r)
const AVATAR_M = withRows({
  5: '...sshsssshss...', 8: '...ssssssssss...', 11: '....ssssssss....',
  12: '...cccccccccc...', 13: '..cccccccccccc..',
})
const AVATAR_F = withRows({
  5: '...sesssssses...', 8: '...srrssssrrs...', 10: '.....ssssss.....', 11: '......ssss......',
  13: '...cccccccccc...', 14: '...cccccccccc...', 15: '....cccccccc....', 16: '...sccccccccs...',
})
export const avatarBase = (gender) => (gender === 'f' ? AVATAR_F : AVATAR_M)

// เสื้อถูกออกแบบมาให้พอดีลำตัวกว้าง: ตัวหญิงตัดส่วนที่ล้นออกนอกลำตัวที่แคบกว่า (แถว 12-16) เพื่อให้เสื้อพอดีตัว
export function fitToBody(ov, base, lo = 12, hi = 16) {
  if (!ov?.grid) return ov
  const cut = (row, r) => (r < lo || r > hi || !base[r] ? row : [...row].map((ch, i) => (base[r][i] === '.' ? '.' : ch)).join(''))
  const g = ov.grid
  const grid = Array.isArray(g) ? g.map((row, r) => cut(row, r)) : Object.fromEntries(Object.entries(g).map(([r, row]) => [r, cut(row, Number(r))]))
  return { ...ov, grid }
}

export const AVATAR_PAL = {
  h: '#3b2a24', s: '#ffd9b8', e: '#1b1424', r: '#ff9aa8', m: '#c2475d',
  c: '#4f8cff', p: '#2f3a5c', b: '#1f1b2e', k: '#1b1424', w: '#ffffff',
}

// ── หน้าตา (ปรับแต่งได้) ──
export const SKIN_TONES = [
  { id: 0, c: '#ffd9b8', th: 'ขาวอมชมพู' },
  { id: 1, c: '#fbe3d0', th: 'ขาวนวล' },
  { id: 2, c: '#f1c27d', th: 'เหลืองอ่อน' },
  { id: 3, c: '#e0ac69', th: 'เหลืองเข้ม' },
  { id: 4, c: '#c68642', th: 'แทน' },
  { id: 5, c: '#8d5524', th: 'น้ำตาลเข้ม' },
]
export const HAIR_COLORS = [
  { id: 0, c: '#3b2a24', th: 'น้ำตาลเข้ม' },
  { id: 1, c: '#15121f', th: 'ดำ' },
  { id: 2, c: '#8b5a2b', th: 'น้ำตาล' },
  { id: 3, c: '#d9a441', th: 'บลอนด์' },
  { id: 4, c: '#c2475d', th: 'แดง/ชมพูเข้ม' },
  { id: 5, c: '#6a5acd', th: 'ม่วง' },
  { id: 6, c: '#4fa3d9', th: 'ฟ้า' },
  { id: 7, c: '#cfcfd8', th: 'เทา/เงิน' },
]
// ทรงผม: '.' = ไม่แก้ pixel เดิม (ซ้อนทับบนหัวล้าน) แถวที่ 0-10
export const HAIR_STYLES = {
  short: { th: 'สั้น', grid: { 1: '.....hhhhhh.....', 2: '....hhhhhhhh....', 3: '...hhhhhhhhhh...', 4: '...hh......hh...', 5: '...h........h...' } },
  spiky: { th: 'หัวตั้ง', grid: { 0: '....h..hh..h....', 1: '....hhhhhhhh....', 2: '...hhhhhhhhhh...', 3: '...hhhhhhhhhh...', 4: '...hh......hh...' } },
  buzz: { th: 'เกรียน', grid: { 2: '....hhhhhhhh....', 3: '...hhhhhhhhhh...', 4: '...h........h...' } },
  long: { th: 'ยาว', grid: { 1: '.....hhhhhh.....', 2: '....hhhhhhhh....', 3: '...hhhhhhhhhh...', 4: '...hh......hh...', 5: '..hhh......hhh..', 6: '..hh........hh..', 7: '..hh........hh..', 8: '..hh........hh..', 9: '..hhh......hhh..', 10: '...hh......hh...' } },
  bob: { th: 'บ็อบ', grid: { 1: '.....hhhhhh.....', 2: '....hhhhhhhh....', 3: '...hhhhhhhhhh...', 4: '...hh......hh...', 5: '..hhh......hhh..', 6: '..hh........hh..', 7: '..hh........hh..', 8: '...hh......hh...' } },
  ponytail: { th: 'ผมหางม้า', grid: { 1: '.....hhhhhh.....', 2: '....hhhhhhhh....', 3: '...hhhhhhhhhh...', 4: '...hh......hhh..', 5: '...h........hhh.', 6: '.............hhh', 7: '.............hh.', 8: '..............h.' } },
}
// ทรงผมแยกตามเพศ: g = 'm' | 'f' | 'any' (ทรงกลางใช้ได้ทั้งสองเพศ)
const HAIR_G = { short: 'any', bob: 'any', spiky: 'm', buzz: 'm', long: 'f', ponytail: 'f' }
Object.entries(HAIR_G).forEach(([id, g]) => { HAIR_STYLES[id].g = g })
Object.assign(HAIR_STYLES, {
  sidepart: { th: 'แสกข้าง', g: 'm', grid: { 1: '.....hhhhhh.....', 2: '....hhhhhhhh....', 3: '...hhhhhhhhhh...', 4: '...hhhhhh..hh...', 5: '...hhh......h...' } },
  messy: { th: 'ยุ่งๆ', g: 'm', grid: { 0: '....h.h..h.h....', 1: '...hhhhhhhhhh...', 2: '..hhhhhhhhhhhh..', 3: '...hhhhhhhhhh...', 4: '...hh.hh..hhh...', 5: '...h........h...' } },
  twin: { th: 'ผมแกละ', g: 'f', grid: { 1: '.....hhhhhh.....', 2: '....hhhhhhhh....', 3: '...hhhhhhhhhh...', 4: '..hhh......hhh..', 5: '.hhh........hhh.', 6: '.hh..........hh.', 7: '.hh..........hh.', 8: '..h..........h..' } },
  bun: { th: 'มวยผม', g: 'f', grid: { 0: '.....hhhhhh.....', 1: '....hhhhhhhh....', 2: '.....hhhhhh.....', 3: '...hhhhhhhhhh...', 4: '...hh......hh...', 5: '...h........h...' } },
  bangs: { th: 'ยาวม้าหน้า', g: 'f', grid: { 1: '.....hhhhhh.....', 2: '....hhhhhhhh....', 3: '...hhhhhhhhhh...', 4: '...hhhhhhhhhh...', 5: '..hhh......hhh..', 6: '..hh........hh..', 7: '..hh........hh..', 8: '..hh........hh..', 9: '..hhh......hhh..', 10: '...hh......hh...' } },
})
export const hairFor = (gender) => Object.entries(HAIR_STYLES).filter(([, h]) => h.g === 'any' || h.g === gender)

export const EYE_STYLES = {
  dot: { th: 'ตาเรียว', rows: {} },
  round: { th: 'ตากลม', rows: { 6: '...sswesswess...', 7: '...sseesseess...' } }, // w = ประกายตา
  calm: { th: 'ตาสงบ', rows: { 6: '...ssssssssss...', 7: '...sseesseess...' } },
}
export const DEFAULT_LOOK = { gender: 'm', skin: 0, hair: 'short', hairColor: 0, eyes: 'dot' }
export const GENDER_DEFAULTS = {
  m: { hair: 'short', eyes: 'dot', bottom: 'pants_navy' },
  f: { hair: 'long', eyes: 'round', bottom: 'skirt_navy' },
}

export const TOP_COLORS = {
  ...ITEM_TOP_COLORS,
  top_blue: { c: '#4f8cff' },
  top_red: { c: '#e5484d' },
  top_green: { c: '#3fbf7f' },
  top_hanbok: { c: '#fff2d6' },
  top_yellow: { c: '#ffd23f' },
  top_pink: { c: '#ff8fb1' },
  top_black: { c: '#3a3748' },
  top_uniform: { c: '#f4f4f8' },
}

// ── กางเกง/กระโปรง/รองเท้า (แถว 17-20) ──
const BOTTOM_SHAPES = {
  pants: { 17: '....pppppppp....', 18: '....ppp..ppp....', 19: '....ppp..ppp....' },
  shorts: { 17: '....pppppppp....', 18: '....ppp..ppp....', 19: '....sss..sss....' },
  skirt: { 17: '...pppppppppp...', 18: '...pppppppppp...', 19: '....sss..sss....' },
}
const bottom = (shape, c) => ({ pal: { p: c }, grid: BOTTOM_SHAPES[shape] })

// overlays share the avatar coordinate system (ใช้ pal ของ overlay เอง + s=สีผิวที่ Avatar ใส่ให้)
const BASE_OVERLAYS = {
  // กางเกง/กระโปรง
  pants_navy: bottom('pants', '#2f3a5c'),
  pants_khaki: bottom('pants', '#b39b6b'),
  pants_black: bottom('pants', '#26242c'),
  shorts_denim: bottom('shorts', '#4a7bd0'),
  skirt_navy: bottom('skirt', '#2f3a5c'),
  skirt_pink: bottom('skirt', '#e58aa8'),
  // รองเท้า
  shoes_sneaker: { pal: { w: '#f4f4f8' }, grid: { 20: '...wwww..wwww...' } },
  shoes_boots: { pal: { k: '#6b3f26' }, grid: { 19: '....kkk..kkk....', 20: '...kkkk..kkkk...' } },
  // เสื้อ
  top_uniform: {
    pal: { x: '#2f3a5c', t: '#e5484d' },
    grid: { 12: '.....xx..xx.....', 13: '......xttx......', 14: '.......tt.......', 15: '.......tt.......' },
  },
  top_hanbok: {
    pal: { R: '#e5484d', Y: '#ffd23f', B: '#4f8cff', G: '#3fbf7f', P: '#c86bfa', x: '#e5484d' },
    grid: {
      12: '.....xx..xx.....',
      13: '.......xx.......',
      14: '..RR...x....RR..',
      15: '..YY........YY..',
      16: '..B....x.....B..',
    },
  },
  // หมวก/เครื่องประดับผม
  hat_beanie: {
    pal: { x: '#ff7a59', w: '#fff2d6' },
    grid: { 0: '......wwww......', 1: '....xxxxxxxx....', 2: '...xxxxxxxxxx...', 3: '...wwwwwwwwww...' },
  },
  hat_cap: {
    pal: { x: '#e5484d', w: '#ffffff' },
    grid: { 1: '.....xxxxxx.....', 2: '....xxxwxxxx....', 3: '...xxxxxxxxxxxx.' },
  },
  hat_gat: {
    pal: { x: '#15121f', g: '#3a334f' },
    grid: { 0: '.....xxxxxx.....', 1: '.....xggggx.....', 2: '.....xxxxxx.....', 3: '.xxxxxxxxxxxxxx.' },
  },
  hat_crown: {
    pal: { y: '#ffd23f', r: '#e5484d', o: '#d99a1e' },
    grid: { 0: '....y..yy..y....', 1: '....yyyyyyyy....', 2: '....yryyyyry....', 3: '....oooooooo....' },
  },
  hat_band: { pal: { x: '#e5484d' }, grid: { 3: '...xxxxxxxxxx...' } },
  hat_flower: { pal: { p: '#ff8fb1', y: '#ffd23f' }, grid: { 2: '..........pp....', 3: '.........pyyp...', 4: '..........pp....' } },
  hat_beret: { pal: { x: '#c2475d', k: '#7a2434' }, grid: { 0: '.......k........', 1: '....xxxxxx......', 2: '..xxxxxxxxxxx...', 3: '...xxxxxxxxxx...' } },
  hat_bunny: { pal: { w: '#ffffff', p: '#ff9aa8' }, grid: { 0: '....ww....ww....', 1: '....wp....wp....', 2: '....ww....ww....' } },
  hat_cat: { pal: { x: '#2a2a36', p: '#ff9aa8' }, grid: { 0: '....x......x....', 1: '...xxx....xxx...', 2: '...xpx....xpx...' } },
  hat_tiger: { pal: { x: '#f28c28', y: '#ffe7c2' }, grid: { 0: '....x......x....', 1: '...xxx....xxx...', 2: '...xyx....xyx...' } },
  // แว่น
  glasses: {
    pal: { g: '#1b1424' },
    grid: { 5: '...gggggggggg...', 6: '...g..gggg..g...', 7: '...gggg..gggg...' },
  },
  glasses_sun: { pal: { g: '#111018' }, grid: { 6: '...gggggggggg...', 7: '...gggg..gggg...' } },
  glasses_round: { pal: { g: '#d99a1e' }, grid: { 5: '....ggg..ggg....', 6: '....g.g..g.g....', 7: '....g.g..g.g....', 8: '....ggg..ggg....' } },
  // คอ/หน้าอก
  scarf: {
    pal: { x: '#ffd23f', o: '#e59e00' },
    grid: { 11: '....xxoxxoxx....', 12: '....xxxxxxxx.ox.', 13: '............xo..' },
  },
  neck_bow: { pal: { x: '#e5484d', d: '#a82a2f' }, grid: { 12: '.....xxddxx.....' } },
  neck_chain: { pal: { y: '#ffd23f' }, grid: { 12: '....y......y....', 13: '.....y....y.....', 14: '......yyyy......', 15: '.......yy.......' } },
  neck_medal: { pal: { b: '#4f8cff', y: '#ffd23f' }, grid: { 12: '.....bb..bb.....', 13: '......bbbb......', 14: '.......yy.......', 15: '.......yy.......' } },
  // กระเป๋าเป้
  back_pack: {
    pal: { x: '#e59e00' },
    grid: { 12: '....x......x....', 13: '....x......x....', 14: '.xx.x......x.xx.', 15: '.xx.x......x.xx.', 16: '.xx..........xx.', 17: '.xx..........xx.' },
  },
}

export const OVERLAYS = { ...BASE_OVERLAYS, ...ITEM_OVERLAYS }

// ── Tiger pet 범이 ── k=outline o=orange y=cream b=stripe p=pink e=eye w=shine r=scarf
export const TIGER_HEAD = [
  '..kk........kk..',
  '.kook......kook.',
  '.kopokkkkkkopok.',
  '.kooooboobooook.',
  'kbooooobbooooobk',
  'kooooooooooooook',
  'kooewooooooewook',
  'kooeeooooooeeook',
  'kbooyyyyyyyyoobk',
  'koopyyykkyyypook',
  'kooyyykyykyyyook',
  '.kooyyyyyyyyook.',
  '..kkooooooookk..',
]
export const TIGER_BODY = [
  '...kooyyyyook...',
  '..kbooyyyyoobk..',
  '..koooyyyyoook..',
  '..koook..koook..',
  '..kkkkk..kkkkk..',
]
const SLEEP_EYES = { 6: 'kooooooooooooook', 7: 'kookkooooookkook' }
const HAPPY_EYES = { 6: 'koookooooookoook', 7: 'kookokooookokook' }

export const TIGER_PAL = {
  k: '#2a1a12', o: '#f28c28', y: '#ffe7c2', b: '#3a2418', p: '#ff9aa8',
  e: '#1b1424', w: '#ffffff', r: '#e5484d', g: '#ffd23f',
}

export const PET_STAGES = {
  egg: [
    '....kkkk....',
    '...kyyyyk...',
    '..kyyoyyyk..',
    '..kyoooyyk..',
    '.kyyyyyyyyk.',
    '.kbbyyyybbk.',
    '.kyyyyyyyyk.',
    '.kyyyooyyyk.',
    '.kyyooooyyk.',
    '.kbyyyyyybk.',
    '..kyyyyyyk..',
    '...kkkkkk...',
  ],
  baby: [...TIGER_HEAD, '...kook..kook...', '....kk....kk....'],
  teen: [...TIGER_HEAD, ...TIGER_BODY],
  adult: [
    ...TIGER_HEAD.slice(0, 12),
    '..kkrrrrrrrrkk..',
    '...kooyyyyook.kk',
    '..kbooyyyyoobkok',
    '..koooyyyyookbk.',
    '..kbook..kboobk.',
    '..kkkkk..kkkkk..',
  ],
}

export function petGrid(stage, mood) {
  const g = [...PET_STAGES[stage]]
  if (stage === 'egg') return g
  const swap = mood === 'sleep' ? SLEEP_EYES : mood === 'happy' ? HAPPY_EYES : null
  if (swap) for (const [r, row] of Object.entries(swap)) g[r] = row
  return g
}

// ── Room items ──
const BASE_ROOM_SPRITES = {
  room_plant: {
    pal: { g: '#3fbf7f', G: '#2a8a5a', t: '#c46a3b', T: '#8f4a28' },
    grid: ['...gg...', '.g.gG.g.', '.gGgggg.', '..gGgg..', '...gG...', '.tttttt.', '.tTTTTt.', '..tttt..'],
  },
  room_lamp: {
    pal: { y: '#ffd23f', Y: '#ffef9a', k: '#3a334f' },
    grid: ['..yyyy..', '.yYYYYy.', 'yyyyyyyy', '...kk...', '...kk...', '...kk...', '...kk...', '..kkkk..'],
  },
  room_poster: {
    pal: { w: '#fff6e5', f: '#8f4a28', r: '#e5484d', b: '#4f8cff', k: '#1b1424' },
    grid: [
      'ffffffffff',
      'fwwwwwwwwf',
      'fwkwwwwkwf',
      'fwwwrrwwwf',
      'fwwrrrrwwf',
      'fwwbbbbwwf',
      'fwwwbbwwwf',
      'fwkwwwwkwf',
      'fwwwwwwwwf',
      'ffffffffff',
    ],
  },
}

export const ROOM_SPRITES = {
  ...BASE_ROOM_SPRITES,
  ...Object.fromEntries(ROOM_ITEMS.filter((r) => r.grid).map((r) => [r.id, { pal: r.pal, grid: r.grid }])),
}

// emotes bubble
export const HEART = { pal: { r: '#ff5c7a' }, grid: ['.rr.rr.', 'rrrrrrr', 'rrrrrrr', '.rrrrr.', '..rrr..', '...r...'] }
