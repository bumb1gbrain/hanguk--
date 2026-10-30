// แคตตาล็อกไอเทมสะสมทั้งหมด (สไปรต์ + ข้อมูลร้านค้าในที่เดียว กันข้อมูลไม่ตรงกัน)
// - ไม่ import อะไรเลย เพื่อให้ sprites.js และ data/shop.js ดึงไปใช้ได้โดยไม่วนกลับ
// - overlay ของตัวละครกว้าง 16 คอลัมน์ ' . ' = ไม่แตะ pixel เดิม  ('s' = สีผิวที่ Avatar ใส่ให้)
// - ราคา/เลเวล: ของพื้นฐานถูกและเลเวลต่ำ ของซับซ้อนแพงและเลเวลสูง

// จัดกึ่งกลางสตริงสั้น ๆ ให้กว้าง 16
const C = (s) => {
  const n = 16 - s.length
  const l = Math.floor(n / 2)
  return '.'.repeat(l) + s + '.'.repeat(n - l)
}

const item = (id, slot, ko, th, price, level, sprite, extra = {}) => ({ id, slot, ko, th, price, level, sprite, ...extra })
const top = (id, ko, th, price, level, color, sprite = null, extra = {}) => ({ id, slot: 'top', ko, th, price, level, color, sprite, ...extra })

// ── กางเกง/กระโปรง: รูปทรง × สี ──
const SHAPES = {
  pants: { 17: '....pppppppp....', 18: '....ppp..ppp....', 19: '....ppp..ppp....' },
  shorts: { 17: '....pppppppp....', 18: '....ppp..ppp....', 19: '....sss..sss....' },
  skirt: { 17: '...pppppppppp...', 18: '...pppppppppp...', 19: '....sss..sss....' },
  long: { 17: '...pppppppppp...', 18: '..pppppppppppp..', 19: '..pppppppppppp..' },
  jogger: { 17: '....pppppppp....', 18: '....ppp..ppp....', 19: '....www..www....' },
  cargo: { 17: '....pppppppp....', 18: '....pxp..pxp....', 19: '....ppp..ppp....' },
  plaid: { 17: '...pxpxpxpxpx...', 18: '...xpxpxpxpxp...', 19: '....sss..sss....' },
}
const bottom = (id, ko, th, price, level, shape, color, extra = {}) =>
  item(id, 'bottom', ko, th, price, level, { pal: { p: color, x: '#2f3a5c', w: '#f4f4f8' }, grid: SHAPES[shape] }, extra)

// ── รองเท้า ──
const sneaker = (id, ko, th, price, level, color, extra = {}) =>
  item(id, 'shoes', ko, th, price, level, { pal: { w: color, x: '#f4f4f8' }, grid: { 20: '...wwww..wwww...' } }, extra)

// ── ผ้าพันคอ: สีเดียวกัน 2 โทน ──
const scarf = (id, ko, th, price, level, a, b, extra = {}) =>
  item(id, 'neck', ko, th, price, level, {
    pal: { x: a, o: b },
    grid: { 11: '....xxoxxoxx....', 12: '....xxxxxxxx.ox.', 13: '............xo..' },
  }, extra)

const HANBOK_GRID = {
  12: '.....xx..xx.....',
  13: '.......xx.......',
  14: '..RR...x....RR..',
  15: '..YY........YY..',
  16: '..B....x.....B..',
}

export const ITEMS = [
  // ───────── เสื้อ (สีล้วน) ─────────
  top('top_white', '흰 티셔츠', 'เสื้อยืดสีขาว', 30, 1, '#f4f4f8'),
  top('top_navy', '네이비 티셔츠', 'เสื้อยืดสีกรม', 40, 2, '#35467a'),
  top('top_orange', '주황 티셔츠', 'เสื้อยืดสีส้ม', 40, 2, '#ff9f43'),
  top('top_mint', '민트 티셔츠', 'เสื้อยืดสีมิ้นต์', 45, 2, '#6fd6b5'),
  top('top_purple', '보라 티셔츠', 'เสื้อยืดสีม่วง', 45, 3, '#9b6bd6'),
  top('top_gray', '회색 티셔츠', 'เสื้อยืดสีเทา', 40, 2, '#8a8fa8'),
  top('top_cream', '크림 티셔츠', 'เสื้อยืดสีครีม', 45, 3, '#f3e5c0'),
  top('top_wine', '와인 티셔츠', 'เสื้อยืดสีไวน์', 55, 4, '#8a2b45'),
  top('top_sky', '하늘 티셔츠', 'เสื้อยืดสีฟ้าอ่อน', 45, 3, '#7cc4ff'),
  // ───────── เสื้อ (ลวดลาย/ทรงพิเศษ) ─────────
  top('top_stripe', '줄무늬 티', 'เสื้อลายทาง', 70, 4, '#f4f4f8', { pal: { x: '#4f8cff' }, grid: { 13: '...xxxxxxxxxx...', 15: '..xxxxxxxxxxxx..' } }),
  top('top_hoodie', '후드 집업', 'ฮู้ดซิป', 85, 5, '#8a8fa8', { pal: { x: '#6d7290', p: '#5b6080' }, grid: { 12: '....xx....xx....', 13: '...xx......xx...', 15: '....pppppppp....' } }, { set: 'street' }),
  top('top_jersey', '유니폼', 'เสื้อทีมกีฬา', 90, 5, '#e5484d', { pal: { w: '#fff' }, grid: { 13: '...w........w...', 14: '..w..........w..', 15: '..w..........w..', 16: '..w..........w..' } }, { set: 'sport' }),
  top('top_suit', '정장', 'สูทสุดเนี้ยบ', 160, 7, '#2f3a5c', { pal: { w: '#f4f4f8', t: '#e5484d' }, grid: { 12: '.....wwwwww.....', 13: '......wwww......', 14: '.......tt.......', 15: '.......tt.......' } }, { set: 'royal' }),
  top('top_cardigan', '가디건', 'คาร์ดิแกน', 80, 4, '#c9a77c', { pal: { w: '#f4f4f8', d: '#8a6a44' }, grid: { 12: '.....wwwwww.....', 13: '.....wwwwww.....', 14: '.......dd.......', 15: '.......dd.......', 16: '.......dd.......' } }, { set: 'cafe' }),
  top('top_overalls', '멜빵바지', 'ชุดเอี๊ยม', 95, 5, '#f4f4f8', { pal: { b: '#4a7bd0' }, grid: { 12: '....b......b....', 13: '....b......b....', 14: '....bbbbbbbb....', 15: '....bbbbbbbb....', 16: '....bbbbbbbb....' } }, { set: 'garden' }),
  top('top_padded', '패딩', 'เสื้อพองกันหนาว', 110, 6, '#4fa3d9', { pal: { d: '#2f7fb0' }, grid: { 13: '...dddddddddd...', 15: '..dddddddddddd..' } }, { set: 'winter' }),
  top('top_sailor', '세일러복', 'ชุดกะลาสี', 130, 6, '#f4f4f8', { pal: { n: '#2f3a5c', r: '#e5484d' }, grid: { 12: '....nn....nn....', 13: '.....nnnnnn.....', 14: '......nrrn......' } }, { set: 'school' }),
  // ───────── เสื้อเฉพาะเพศ (gender: 'f' | 'm' — ใส่ข้ามเพศได้ แต่ออกแบบมาให้พอดีกับทรงตัวของเพศนั้น) ─────────
  top('top_crop', '크롭티', 'ครอปท็อปเผยเอว', 60, 3, '#ff8fb1', { pal: {}, grid: { 15: '....ssssssss....', 16: '...ssssssssss...' } }, { gender: 'f' }),
  top('top_blouse', '리본 블라우스', 'เบลาส์ผูกโบว์', 75, 4, '#ffffff', { pal: { x: '#e5484d' }, grid: { 12: '.....xx..xx.....', 13: '......xxxx......' } }, { gender: 'f' }),
  top('top_offshoulder', '오프숄더', 'เสื้อเปิดไหล่', 85, 5, '#c9a0ff', { pal: {}, grid: { 12: '....ss....ss....', 13: '...ss......ss...' } }, { gender: 'f' }),
  top('top_tank', '나시', 'เสื้อกล้าม', 45, 2, '#3a3748', { pal: {}, grid: { 12: '...ss......ss...', 13: '..ss........ss..', 14: '..ss........ss..', 15: '..ss........ss..' } }, { gender: 'm' }),
  top('top_polo', '카라 티', 'เสื้อโปโล', 60, 3, '#3fbf7f', { pal: { x: '#f4f4f8' }, grid: { 12: '....xx....xx....', 13: '.....x....x.....', 14: '.......xx.......' } }, { gender: 'm' }),
  top('top_varsity', '야구점퍼', 'แจ็กเก็ตเบสบอล', 90, 5, '#e5484d', { pal: { x: '#f4f4f8' }, grid: { 13: '..xx........xx..', 14: '..xx........xx..', 15: '..xx........xx..', 16: '..xx........xx..' } }, { gender: 'm' }),
  top('top_dress', '원피스', 'เดรส', 140, 5, '#e58aa8', { pal: { p: '#e58aa8' }, grid: { 17: '...pppppppppp...', 18: '..pppppppppppp..', 19: '..pppppppppppp..' } }, { late: true, set: 'cute' }),
  top('top_hanbok_pink', '분홍 한복', 'ฮันบกสีชมพู', 210, 7, '#fff2d6', { pal: { R: '#ff8fb1', Y: '#ffd23f', B: '#7cc4ff', x: '#ff8fb1' }, grid: HANBOK_GRID }, { set: 'hanbok' }),

  // ───────── กางเกง/กระโปรง ─────────
  bottom('pants_gray', '회색 바지', 'กางเกงสีเทา', 40, 2, 'pants', '#8a8fa8'),
  bottom('pants_white', '흰 바지', 'กางเกงสีขาว', 45, 3, 'pants', '#f4f4f8'),
  bottom('pants_brown', '갈색 바지', 'กางเกงสีน้ำตาล', 45, 3, 'pants', '#7a5230'),
  bottom('pants_green', '초록 바지', 'กางเกงสีเขียว', 50, 3, 'pants', '#3f7d5c', { set: 'garden' }),
  bottom('jogger_gray', '조거 팬츠', 'กางเกงจ๊อกเกอร์', 80, 4, 'jogger', '#8a8fa8', { set: 'street' }),
  bottom('jogger_black', '검은 조거', 'จ๊อกเกอร์สีดำ', 85, 5, 'jogger', '#26242c', { set: 'sport' }),
  bottom('shorts_black', '검은 반바지', 'ขาสั้นสีดำ', 45, 2, 'shorts', '#26242c', { set: 'sport' }),
  bottom('shorts_khaki', '카키 반바지', 'ขาสั้นสีกากี', 45, 3, 'shorts', '#b39b6b'),
  bottom('shorts_pink', '분홍 반바지', 'ขาสั้นสีชมพู', 50, 3, 'shorts', '#ff8fb1'),
  bottom('shorts_red', '빨간 반바지', 'ขาสั้นสีแดง', 50, 3, 'shorts', '#e5484d'),
  bottom('pants_cargo', '카고 바지', 'กางเกงคาร์โก้', 70, 4, 'cargo', '#6b7a4a', { gender: 'm' }),
  bottom('shorts_high', '하이웨이스트 반바지', 'กางเกงขาสั้นเอวสูง', 55, 3, 'shorts', '#e58aa8', { gender: 'f' }),
  bottom('skirt_red', '빨간 치마', 'กระโปรงสีแดง', 55, 3, 'skirt', '#c2475d'),
  bottom('skirt_mint', '민트 치마', 'กระโปรงสีมิ้นต์', 55, 3, 'skirt', '#6fd6b5'),
  bottom('skirt_black', '검은 치마', 'กระโปรงสีดำ', 60, 4, 'skirt', '#26242c'),
  bottom('skirt_yellow', '노란 치마', 'กระโปรงสีเหลือง', 60, 4, 'skirt', '#ffd23f', { set: 'cute' }),
  bottom('skirt_plaid', '체크 치마', 'กระโปรงลายสก๊อต', 90, 5, 'plaid', '#c2475d', { set: 'school' }),
  bottom('skirt_long_navy', '롱스커트 네이비', 'กระโปรงยาวสีกรม', 85, 5, 'long', '#2f3a5c', { set: 'cafe' }),
  bottom('skirt_long_wine', '롱스커트 와인', 'กระโปรงยาวสีไวน์', 95, 6, 'long', '#8a2b45', { set: 'royal' }),
  bottom('skirt_long_cream', '롱스커트 크림', 'กระโปรงยาวสีครีม', 95, 6, 'long', '#f3e5c0', { set: 'hanbok' }),

  // ───────── รองเท้า ─────────
  sneaker('shoes_red', '빨간 운동화', 'รองเท้าผ้าใบสีแดง', 55, 3, '#e5484d'),
  sneaker('shoes_black', '검은 운동화', 'รองเท้าผ้าใบสีดำ', 55, 3, '#26242c', { set: 'street' }),
  sneaker('shoes_pink', '분홍 운동화', 'รองเท้าผ้าใบสีชมพู', 60, 4, '#ff8fb1', { set: 'cute' }),
  sneaker('shoes_blue', '파란 운동화', 'รองเท้าผ้าใบสีฟ้า', 60, 4, '#4f8cff', { set: 'sport' }),
  sneaker('shoes_gold', '골드 운동화', 'รองเท้าผ้าใบสีทอง', 180, 8, '#ffd23f', { set: 'idol' }),
  item('shoes_loafer', 'shoes', '로퍼', 'รองเท้าโลฟเฟอร์', 80, 5, { pal: { k: '#6b3f26' }, grid: { 20: '...kkkk..kkkk...' } }, { set: 'cafe' }),
  item('shoes_slipper', 'shoes', '슬리퍼', 'รองเท้าแตะในบ้าน', 35, 2, { pal: { y: '#ffd23f' }, grid: { 20: '...yyyy..yyyy...' } }),
  item('shoes_boots_black', 'shoes', '검은 부츠', 'บูทสีดำ', 100, 6, { pal: { k: '#26242c' }, grid: { 19: '....kkk..kkk....', 20: '...kkkk..kkkk...' } }, { set: 'winter' }),
  item('shoes_goma', 'shoes', '꽃신', 'รองเท้าฮันบก', 120, 6, { pal: { w: '#f4f4f8', p: '#ff8fb1' }, grid: { 20: '..wwwwp..wwwwp..' } }, { set: 'hanbok' }),

  // ───────── หมวก / ที่คาดผม ─────────
  item('hat_santa', 'hat', '산타 모자', 'หมวกซานต้า', 90, 5, { pal: { r: '#e5484d', w: '#fff' }, grid: { 0: '...........ww...', 1: '....rrrrrrrr.w..', 2: '...rrrrrrrrrr...', 3: '...wwwwwwwwww...' } }, { set: 'winter' }),
  item('hat_witch', 'hat', '마녀 모자', 'หมวกแม่มด', 130, 6, { pal: { k: '#2a2a36', p: '#8a4fd6' }, grid: { 0: '.......kk.......', 1: '......kkkk......', 2: '....kppppppk....', 3: '..kkkkkkkkkkkk..' } }, { set: 'fantasy' }),
  item('hat_chef', 'hat', '요리사 모자', 'หมวกเชฟ', 100, 5, { pal: { w: '#fff', g: '#d8d8d8' }, grid: { 0: '....wwwwwwww....', 1: '...wwwwwwwwww...', 2: '....wwwwwwww....', 3: '....gggggggg....' } }, { set: 'cafe' }),
  item('hat_party', 'hat', '고깔모자', 'หมวกปาร์ตี้', 60, 3, { pal: { r: '#e5484d', y: '#ffd23f', b: '#4f8cff' }, grid: { 0: '.......y........', 1: '.......rr.......', 2: '......rbrr......', 3: '.....rrrrrr.....' } }),
  item('hat_bear', 'hat', '곰 귀', 'ที่คาดผมหูหมี', 85, 4, { pal: { x: '#8b5a2b', p: '#d9a441' }, grid: { 0: '...xx......xx...', 1: '..xppx....xppx..', 2: '...xx......xx...' } }, { set: 'cute' }),
  item('hat_fox', 'hat', '여우 귀', 'ที่คาดผมหูจิ้งจอก', 110, 5, { pal: { x: '#e87722', w: '#fff' }, grid: { 0: '...x........x...', 1: '..xxx......xxx..', 2: '..xwx......xwx..' } }, { set: 'fantasy' }),
  item('hat_devil', 'hat', '악마 뿔', 'เขาปีศาจ', 120, 6, { pal: { r: '#e5484d' }, grid: { 0: '...r........r...', 1: '...rr......rr...', 2: '....rr....rr....' } }, { set: 'fantasy' }),
  item('hat_halo', 'hat', '천사 링', 'วงแหวนนางฟ้า', 140, 6, { pal: { y: '#ffd23f', o: '#e59e00' }, grid: { 0: '.....yyyyyy.....', 1: '....y......y....', 2: '.....oooooo.....' } }, { set: 'fantasy' }),
  item('hat_headphones', 'hat', '헤드폰', 'หูฟังครอบหู', 100, 5, { pal: { h: '#2f3a5c', c: '#e5484d' }, grid: { 1: '.....hhhhhh.....', 2: '....h......h....', 3: '...h........h...', 5: '..cc........cc..', 6: '..cc........cc..', 7: '..cc........cc..', 8: '..cc........cc..' } }, { set: 'idol' }),
  item('hat_ribbon', 'hat', '리본 핀', 'กิ๊บโบว์', 55, 3, { pal: { p: '#ff8fb1', d: '#d6537a' }, grid: { 2: '.........pp.pp..', 3: '.........ppdpp..', 4: '.........pp.pp..' } }, { set: 'cute' }),
  item('hat_flowercrown', 'hat', '꽃관', 'มงกุฎดอกไม้', 95, 5, { pal: { p: '#ff8fb1', y: '#ffd23f', g: '#3fbf7f', w: '#fff' }, grid: { 3: '...pgwgypgwgy...' } }, { set: 'garden' }),
  item('hat_cowboy', 'hat', '카우보이 모자', 'หมวกคาวบอย', 110, 6, { pal: { x: '#8b5a2b' }, grid: { 1: '.....xxxxxx.....', 2: '....xxxxxxxx....', 3: '.xxxxxxxxxxxxxx.' } }),
  item('hat_bucket', 'hat', '벙거지', 'หมวกบักเก็ต', 65, 3, { pal: { x: '#c9d6a3' }, grid: { 1: '....xxxxxxxx....', 2: '...xxxxxxxxxx...', 3: '..xxxxxxxxxxxx..' } }, { set: 'garden' }),
  item('hat_visor', 'hat', '바이저', 'หมวกไบเซอร์', 55, 3, { pal: { x: '#4f8cff', w: '#fff' }, grid: { 2: '...wwwwwwwwww...', 3: '...xxxxxxxxxx...' } }, { set: 'sport' }),
  item('hat_sprout', 'hat', '새싹', 'ต้นอ่อนบนหัว', 70, 3, { pal: { g: '#3fbf7f', G: '#2a8a5a' }, grid: { 0: '......gg.gg.....', 1: '.......gGg......', 2: '........G.......' } }, { set: 'garden' }),
  item('hat_star', 'hat', '별 핀', 'กิ๊บดาว', 60, 3, { pal: { y: '#ffd23f' }, grid: { 2: '..........y.....', 3: '.........yyy....', 4: '..........y.....' } }, { set: 'idol' }),
  item('hat_cap_blue', 'hat', '파란 야구 모자', 'หมวกแก๊ปสีฟ้า', 60, 3, { pal: { x: '#4f8cff', w: '#fff' }, grid: { 1: '.....xxxxxx.....', 2: '....xxxwxxxx....', 3: '...xxxxxxxxxxxx.' } }, { set: 'street' }),
  item('hat_cap_black', 'hat', '검은 야구 모자', 'หมวกแก๊ปสีดำ', 65, 4, { pal: { x: '#26242c', w: '#fff' }, grid: { 1: '.....xxxxxx.....', 2: '....xxxwxxxx....', 3: '...xxxxxxxxxxxx.' } }, { set: 'street' }),
  item('hat_beanie_blue', 'hat', '파란 비니', 'หมวกไหมพรมสีฟ้า', 45, 2, { pal: { x: '#4f8cff', w: '#fff2d6' }, grid: { 0: '......wwww......', 1: '....xxxxxxxx....', 2: '...xxxxxxxxxx...', 3: '...wwwwwwwwww...' } }, { set: 'winter' }),
  item('hat_earmuff', 'hat', '귀마개', 'ที่ปิดหู', 75, 4, { pal: { x: '#e5484d', m: '#2f3a5c' }, grid: { 1: '....mmmmmmmm....', 2: '...m........m...', 4: '..xx........xx..', 5: '..xx........xx..', 6: '..xx........xx..' } }, { set: 'winter' }),

  // ───────── แว่น ─────────
  item('glasses_heart', 'glasses', '하트 안경', 'แว่นรูปหัวใจ', 85, 4, { pal: { r: '#ff5c7a' }, grid: { 5: '....r.r..r.r....', 6: '....rrr..rrr....', 7: '.....r....r.....' } }, { set: 'cute' }),
  item('glasses_star', 'glasses', '별 안경', 'แว่นรูปดาว', 110, 5, { pal: { y: '#ffd23f' }, grid: { 5: '.....y....y.....', 6: '....yyy..yyy....', 7: '.....y....y.....' } }, { set: 'idol' }),
  item('glasses_3d', 'glasses', '3D 안경', 'แว่น 3D', 70, 3, { pal: { r: '#e5484d', b: '#4f8cff', w: '#fff' }, grid: { 5: '...wwwwwwwwww...', 6: '....rrr..bbb....', 7: '....rrr..bbb....' } }),
  item('glasses_mono', 'glasses', '외눈 안경', 'แว่นข้างเดียว', 140, 6, { pal: { g: '#d99a1e' }, grid: { 5: '.........ggg....', 6: '.........g.g....', 7: '.........g.g....', 8: '.........ggg....', 9: '..........g.....' } }, { set: 'royal' }),
  item('glasses_goggle', 'glasses', '고글', 'แว่นสกี', 120, 6, { pal: { b: '#4f8cff', g: '#2a2a36' }, grid: { 5: '...gggggggggg...', 6: '...gbbg..gbbg...', 7: '...gbbg..gbbg...', 8: '...gggg..gggg...' } }, { set: 'winter' }),

  // ───────── ใบหน้า (ช่องใหม่) ─────────
  item('face_freckles', 'face', '주근깨', 'กระที่แก้ม', 40, 2, { pal: { f: '#c0804a' }, grid: { 8: '.....f.f..f.f...' } }),
  item('face_bandaid', 'face', '밴드', 'พลาสเตอร์ปิดแผล', 35, 2, { pal: { b: '#f3d9a4', r: '#e5484d' }, grid: { 8: '........bbb.....', 9: '........brb.....' } }),
  item('face_whiskers', 'face', '고양이 수염', 'หนวดแมว', 60, 3, { pal: { k: '#2a1a12' }, grid: { 8: '..kk........kk..', 9: '...kk......kk...' } }, { set: 'cute' }),
  item('face_mask', 'face', '마스크', 'หน้ากากอนามัย', 45, 2, { pal: { w: '#f4f4f8' }, grid: { 9: '...wwwwwwwwww...', 10: '....wwwwwwww....', 11: '.....wwwwww.....' } }),
  item('face_cheekheart', 'face', '볼 하트', 'สติกเกอร์หัวใจที่แก้ม', 55, 3, { pal: { r: '#ff5c7a' }, grid: { 8: '....r......r....' } }, { set: 'idol' }),
  item('face_taegeuk', 'face', '태극 스티커', 'สติกเกอร์แทกึก', 80, 4, { pal: { r: '#e5484d', b: '#4f8cff' }, grid: { 8: '..........rb....', 9: '..........br....' } }, { set: 'hanbok' }),
  item('face_mustache', 'face', '콧수염', 'หนวด', 70, 4, { pal: { k: '#3b2a24' }, grid: { 8: '.....kkkkkk.....' } }, { set: 'royal' }),

  // ───────── คอ ─────────
  item('neck_tie', 'neck', '넥타이', 'เนคไท', 60, 3, { pal: { t: '#e5484d' }, grid: { 12: '.......tt.......', 13: '.......tt.......', 14: '.......tt.......', 15: '.......tt.......' } }, { set: 'school' }),
  scarf('scarf_blue', '파란 목도리', 'ผ้าพันคอสีฟ้า', 70, 4, '#4f8cff', '#2f5fb8'),
  scarf('scarf_pink', '분홍 목도리', 'ผ้าพันคอสีชมพู', 70, 4, '#ff8fb1', '#d6537a', { set: 'cute' }),
  scarf('scarf_green', '초록 목도리', 'ผ้าพันคอสีเขียว', 70, 4, '#3fbf7f', '#2a8a5a', { set: 'winter' }),
  scarf('scarf_white', '흰 목도리', 'ผ้าพันคอสีขาว', 75, 5, '#f4f4f8', '#c9ccd8', { set: 'winter' }),
  item('neck_choker', 'neck', '초커', 'โชคเกอร์', 75, 4, { pal: { k: '#1b1424', y: '#ffd23f' }, grid: { 11: '.....kkyykk.....' } }, { set: 'idol' }),
  item('neck_bell', 'neck', '방울 목걸이', 'สร้อยกระดิ่ง', 65, 3, { pal: { r: '#e5484d', y: '#ffd23f' }, grid: { 11: '.....rrrrrr.....', 12: '.......yy.......' } }, { set: 'cute' }),
  item('neck_headset', 'neck', '목걸이 헤드폰', 'หูฟังคล้องคอ', 95, 5, { pal: { h: '#2f3a5c', c: '#e5484d' }, grid: { 11: '....h......h....', 12: '...hc......ch...', 13: '...hc......ch...' } }, { set: 'street' }),
  item('neck_lei', 'neck', '꽃목걸이', 'พวงมาลัยดอกไม้', 90, 5, { pal: { p: '#ff8fb1', y: '#ffd23f' }, grid: { 12: '....pyppyppy....', 13: '.....pyppyp.....' } }, { set: 'garden' }),

  // ───────── หลัง ─────────
  item('wings_angel', 'back', '천사 날개', 'ปีกนางฟ้า', 220, 8, { pal: { w: '#fff', g: '#d8e6ff' }, grid: { 10: 'ww............ww', 11: 'www..........www', 12: 'wgw..........wgw', 13: 'wgw..........wgw', 14: 'ww............ww', 15: '.w............w.' } }, { set: 'fantasy' }),
  item('wings_bat', 'back', '박쥐 날개', 'ปีกค้างคาว', 200, 8, { pal: { k: '#3a334f', p: '#8a4fd6' }, grid: { 10: 'kk............kk', 11: 'kpk..........kpk', 12: 'kpk..........kpk', 13: 'kpk..........kpk', 14: 'kk............kk', 15: '.k............k.' } }, { set: 'fantasy' }),
  item('back_cape', 'back', '망토', 'ผ้าคลุม', 150, 7, { pal: { r: '#e5484d', d: '#a82a2f' }, grid: { 12: '..rr........rr..', 13: '.rr..........rr.', 14: '.rr..........rr.', 15: '.rr..........rr.', 16: '.rr..........rr.', 17: '.rd..........dr.', 18: '.rd..........dr.', 19: '.rr..........rr.' } }, { set: 'royal' }),
  item('back_bag', 'back', '크로스백', 'กระเป๋าสะพายข้าง', 90, 4, { pal: { b: '#8b5a2b', y: '#d9a441' }, grid: { 12: '....b...........', 13: '.....b..........', 14: '......b.........', 15: '.......b........', 16: '........b..yyyy.', 17: '...........yyyy.', 18: '...........yyyy.' } }, { set: 'cafe' }),
  item('back_balloon', 'back', '풍선', 'ลูกโป่งลอย', 75, 3, { pal: { r: '#e5484d', b: '#cfcfd8' }, grid: { 0: '.............rr.', 1: '............rrrr', 2: '............rrrr', 3: '.............rr.', 4: '.............b..', 5: '.............b..' } }),
  item('back_tail', 'back', '여우 꼬리', 'หางจิ้งจอก', 130, 6, { pal: { o: '#e87722', w: '#fff' }, grid: { 15: '.............oo.', 16: '.............oo.', 17: '............ooow', 18: '............ooow' } }, { set: 'fantasy' }),

  // ───────── ถือในมือ (ช่องใหม่) ─────────
  item('hand_book', 'hand', '책', 'หนังสือ', 50, 2, { pal: { b: '#4f8cff', w: '#fff' }, grid: { 14: '.............bbb', 15: '.............bwb', 16: '.............bbb' } }, { set: 'school' }),
  item('hand_coffee', 'hand', '커피', 'กาแฟ', 55, 2, { pal: { w: '#fff', c: '#8a5a3a' }, grid: { 14: '..............w.', 15: '.............www', 16: '.............wcw', 17: '..............w.' } }, { set: 'cafe' }),
  item('hand_phone', 'hand', '스마트폰', 'สมาร์ตโฟน', 70, 3, { pal: { k: '#1b1424', b: '#7cc4ff' }, grid: { 14: '.............kkk', 15: '.............kbk', 16: '.............kbk' } }, { set: 'street' }),
  item('hand_lightstick', 'hand', '응원봉', 'แท่งไฟเชียร์', 120, 5, { pal: { p: '#ff5c9c', w: '#fff' }, grid: { 10: '..............pp', 11: '..............pp', 12: '..............ww', 13: '..............ww', 14: '..............ww', 15: '..............ww', 16: '..............ww' } }, { set: 'idol' }),
  item('hand_balloon', 'hand', '손풍선', 'ลูกโป่งในมือ', 60, 3, { pal: { r: '#ff5c7a' }, grid: { 9: '.............rrr', 10: '.............rrr', 11: '..............r.', 12: '..............r.', 13: '..............r.', 14: '..............r.' } }),
  item('hand_bouquet', 'hand', '꽃다발', 'ช่อดอกไม้', 80, 4, { pal: { p: '#ff8fb1', y: '#ffd23f', g: '#3fbf7f' }, grid: { 13: '.............pyp', 14: '.............pgp', 15: '..............g.', 16: '.............ggg' } }, { set: 'garden' }),
  item('hand_ramen', 'hand', '컵라면', 'บะหมี่ถ้วย', 60, 3, { pal: { r: '#e5484d', w: '#fff' }, grid: { 14: '.............www', 15: '.............rrr', 16: '.............rrr', 17: '..............r.' } }),
  item('hand_icecream', 'hand', '아이스크림', 'ไอศกรีม', 65, 3, { pal: { p: '#ff8fb1', c: '#f3d9a4' }, grid: { 13: '.............ppp', 14: '..............p.', 15: '..............c.', 16: '..............c.' } }, { set: 'cute' }),
  item('hand_guitar', 'hand', '기타', 'กีตาร์', 150, 6, { pal: { w: '#c9863f', k: '#3a2418' }, grid: { 11: '..............k.', 12: '..............k.', 13: '..............k.', 14: '.............ww.', 15: '............www.', 16: '............wkw.', 17: '............www.' } }, { set: 'idol' }),
  item('hand_ball', 'hand', '축구공', 'ลูกฟุตบอล', 60, 3, { pal: { w: '#fff', k: '#1b1424' }, grid: { 15: '.............wkw', 16: '.............kwk', 17: '.............wkw' } }, { set: 'sport' }),

  // ───────── ของแต่ง 범이 (ช่อง pet_*) — พิกัดบนหัวเสือ 16×13 ─────────
  item('pet_hat_crown', 'pet_hat', '작은 왕관', 'มงกุฎจิ๋ว', 120, 4, { pal: { y: '#ffd23f', o: '#e59e00' }, grid: { 0: '.....y.yy.y.....', 1: '.....yyyyyy.....', 2: '.....oooooo.....' } }),
  item('pet_hat_bow', 'pet_hat', '리본', 'โบว์', 40, 2, { pal: { p: '#ff8fb1', d: '#d6537a' }, grid: { 1: '.....pp..pp.....', 2: '.....pppdpp.....' } }),
  item('pet_hat_party', 'pet_hat', '고깔모자', 'หมวกปาร์ตี้', 45, 2, { pal: { r: '#e5484d', y: '#ffd23f', b: '#4f8cff' }, grid: { 0: '.......y........', 1: '.......rr.......', 2: '......rbrr......' } }),
  item('pet_hat_santa', 'pet_hat', '산타 모자', 'หมวกซานต้า', 70, 3, { pal: { r: '#e5484d', w: '#fff' }, grid: { 0: '.........ww.....', 1: '.....rrrrrr.w...', 2: '.....wwwwww.....' } }, { set: 'pet_winter' }),
  item('pet_hat_witch', 'pet_hat', '마녀 모자', 'หมวกแม่มด', 90, 4, { pal: { k: '#2a2a36', p: '#8a4fd6' }, grid: { 0: '.......kk.......', 1: '......kppk......', 2: '....kkkkkkkk....' } }, { set: 'pet_party' }),
  item('pet_hat_chef', 'pet_hat', '요리사 모자', 'หมวกเชฟ', 80, 4, { pal: { w: '#fff', g: '#d8d8d8' }, grid: { 0: '.....wwwwww.....', 1: '.....wwwwww.....', 2: '.....gggggg.....' } }),
  item('pet_hat_halo', 'pet_hat', '천사 링', 'วงแหวนนางฟ้า', 100, 5, { pal: { y: '#ffd23f' }, grid: { 0: '.....yyyyyy.....', 1: '.....y....y.....' } }),
  item('pet_hat_sprout', 'pet_hat', '새싹', 'ต้นอ่อน', 50, 2, { pal: { g: '#3fbf7f', G: '#2a8a5a' }, grid: { 0: '......gg.gg.....', 1: '.......gGg......', 2: '........G.......' } }),
  item('pet_hat_flower', 'pet_hat', '꽃', 'ดอกไม้', 55, 3, { pal: { p: '#ff8fb1', y: '#ffd23f' }, grid: { 0: '.......pp.......', 1: '......pyyp......', 2: '.......pp.......' } }),
  item('pet_face_sun', 'pet_face', '선글라스', 'แว่นกันแดดสัตว์เลี้ยง', 80, 4, { pal: { g: '#111018' }, grid: { 5: '..gggg....gggg..', 6: '..gggggggggggg..', 7: '..gggg....gggg..' } }),
  item('pet_face_round', 'pet_face', '동그란 안경', 'แว่นกลมสัตว์เลี้ยง', 70, 3, { pal: { g: '#d99a1e' }, grid: { 5: '..gggg....gggg..', 6: '..g..gggggg..g..', 7: '..gggg....gggg..' } }),
  item('pet_face_heart', 'pet_face', '하트 안경', 'แว่นหัวใจสัตว์เลี้ยง', 90, 5, { pal: { r: '#ff5c7a' }, grid: { 5: '..rr.r....r.rr..', 6: '..rrrr....rrrr..', 7: '...rr......rr...' } }, { set: 'pet_party' }),
  item('pet_neck_bell', 'pet_neck', '방울', 'กระดิ่ง', 35, 2, { pal: { r: '#e5484d', y: '#ffd23f' }, grid: { 12: '.......yy.......', 13: '.......yy.......' } }),
  item('pet_neck_bow', 'pet_neck', '나비넥타이', 'โบว์ผูกคอ', 50, 3, { pal: { r: '#e5484d', d: '#a82a2f' }, grid: { 12: '.....rr..rr.....', 13: '......rdrr......' } }, { set: 'pet_party' }),
  item('pet_neck_bandana_red', 'pet_neck', '빨간 반다나', 'ผ้าพันคอแดง', 55, 3, { pal: { r: '#e5484d' }, grid: { 12: '...rrrrrrrrrr...', 13: '....rrrrrrrr....', 14: '......rrrr......' } }, { set: 'pet_winter' }),
  item('pet_neck_bandana_blue', 'pet_neck', '파란 반다나', 'ผ้าพันคอฟ้า', 55, 3, { pal: { r: '#4f8cff' }, grid: { 12: '...rrrrrrrrrr...', 13: '....rrrrrrrr....', 14: '......rrrr......' } }, { set: 'pet_winter' }),
]

// ── สีของเสื้อสีล้วนและเสื้อลวดลาย (c) ──
export const ITEM_TOP_COLORS = Object.fromEntries(ITEMS.filter((i) => i.slot === 'top' && i.color).map((i) => [i.id, { c: i.color }]))
// ── overlay สำหรับ Avatar / Pet ──
export const ITEM_OVERLAYS = Object.fromEntries(ITEMS.filter((i) => i.sprite).map((i) => [i.id, { ...i.sprite, late: !!i.late }]))

// ── ชุดสะสม: ครบทั้งชุดได้โบนัสเหรียญ (เพิ่มเป็นความสำเร็จอัตโนมัติ) ──
export const SETS = [
  { id: 'school', ko: '학교', th: 'ชุดนักเรียน', icon: '🏫', coins: 120, items: ['top_uniform', 'top_sailor', 'skirt_plaid', 'neck_tie', 'hand_book', 'back_pack'] },
  { id: 'hanbok', ko: '한복', th: 'ชุดฮันบก', icon: '🎎', coins: 200, items: ['top_hanbok', 'top_hanbok_pink', 'hat_gat', 'shoes_goma', 'skirt_long_cream', 'face_taegeuk'] },
  { id: 'winter', ko: '겨울', th: 'หน้าหนาว', icon: '⛄', coins: 160, items: ['top_padded', 'hat_beanie_blue', 'hat_earmuff', 'scarf_white', 'scarf_green', 'shoes_boots_black', 'hat_santa', 'glasses_goggle'] },
  { id: 'idol', ko: '아이돌', th: 'ไอดอล', icon: '🎤', coins: 220, items: ['hat_headphones', 'glasses_star', 'hand_lightstick', 'neck_choker', 'shoes_gold', 'face_cheekheart', 'hat_star', 'hand_guitar'] },
  { id: 'cafe', ko: '카페', th: 'คาเฟ่', icon: '☕', coins: 130, items: ['top_cardigan', 'hat_chef', 'hand_coffee', 'back_bag', 'shoes_loafer', 'skirt_long_navy', 'glasses_round', 'hat_beret'] },
  { id: 'sport', ko: '스포츠', th: 'สายกีฬา', icon: '⚽', coins: 130, items: ['top_jersey', 'shorts_black', 'jogger_black', 'shoes_blue', 'hat_visor', 'hand_ball'] },
  { id: 'street', ko: '스트릿', th: 'สตรีท', icon: '🛹', coins: 140, items: ['top_hoodie', 'jogger_gray', 'shoes_black', 'hat_cap_blue', 'hat_cap_black', 'neck_headset', 'hand_phone'] },
  { id: 'fantasy', ko: '판타지', th: 'แฟนตาซี', icon: '🧙', coins: 300, items: ['hat_witch', 'hat_fox', 'hat_devil', 'hat_halo', 'wings_angel', 'wings_bat', 'back_tail'] },
  { id: 'royal', ko: '왕실', th: 'ราชสำนัก', icon: '👑', coins: 280, items: ['hat_crown', 'top_suit', 'back_cape', 'glasses_mono', 'face_mustache', 'skirt_long_wine'] },
  { id: 'garden', ko: '정원', th: 'สวนดอกไม้', icon: '🌷', coins: 140, items: ['top_overalls', 'pants_green', 'hat_flowercrown', 'hat_bucket', 'hat_sprout', 'hand_bouquet', 'neck_lei', 'shoes_boots'] },
  { id: 'cute', ko: '러블리', th: 'น่ารักฟรุ้งฟริ้ง', icon: '🎀', coins: 150, items: ['top_dress', 'hat_bear', 'hat_ribbon', 'hat_bunny', 'hat_cat', 'glasses_heart', 'scarf_pink', 'shoes_pink', 'skirt_yellow', 'face_whiskers', 'neck_bell', 'hand_icecream'] },
  { id: 'pet_winter', ko: '펫 겨울', th: 'สัตว์เลี้ยง หน้าหนาว', icon: '🐯', coins: 80, items: ['pet_hat_santa', 'pet_neck_bandana_red', 'pet_neck_bandana_blue'] },
  { id: 'room_korea', ko: '한국 방', th: 'ห้องสไตล์เกาหลี', icon: '🏠', coins: 200, items: ['room_flag', 'room_kposter', 'room_tv', 'rug_tiger'] },
  { id: 'pet_party', ko: '펫 파티', th: 'สัตว์เลี้ยง ปาร์ตี้', icon: '🎉', coins: 90, items: ['pet_hat_witch', 'pet_face_heart', 'pet_neck_bow'] },
]

// ── ห้อง: ตำแหน่ง (spot) ที่วางของได้ ──
// wallC/wallR = ผนังกลาง/ขวา, floorL/floorR = พื้นซ้าย/ขวา, rug = พรม
export const ROOM_SPOTS = ['wallC', 'wallR', 'floorL', 'floorR', 'rug']

export const ROOM_ITEMS = [
  // ผนังกลาง
  { id: 'room_clock', spot: 'wallC', ko: '시계', th: 'นาฬิกาแขวน', price: 35, level: 1, pal: { w: '#fff6e5', k: '#1b1424', f: '#8f4a28' }, grid: ['..ffff..', '.fwwwwf.', 'fwwwkwwf', 'fwwwkwwf', 'fwwkkwwf', 'fwwwwwwf', '.fwwwwf.', '..ffff..'] },
  { id: 'room_frame', spot: 'wallC', ko: '액자', th: 'กรอบรูปทิวทัศน์', price: 55, level: 2, pal: { f: '#8f4a28', s: '#8fd3ff', g: '#3fbf7f', y: '#ffd23f' }, grid: ['ffffffffff', 'fssssssssf', 'fssssyyssf', 'fssssyyssf', 'fsgssssssf', 'fgggsssggf', 'fggggggggf', 'ffffffffff'] },
  { id: 'room_flag', spot: 'wallC', ko: '태극기', th: 'ธงแทกึกกี', price: 90, level: 4, set: 'room_korea', pal: { w: '#fff', k: '#1b1424', r: '#e5484d', b: '#4f8cff', f: '#8f4a28' }, grid: ['ffffffffff', 'fwkwwwwkwf', 'fwwrrrrwwf', 'fwwrrrrwwf', 'fwwbbbbwwf', 'fwwbbbbwwf', 'fwkwwwwkwf', 'ffffffffff'] },
  { id: 'room_calendar', spot: 'wallC', ko: '달력', th: 'ปฏิทิน', price: 45, level: 2, pal: { w: '#fff6e5', r: '#e5484d', k: '#8a8fa8', f: '#8f4a28' }, grid: ['ffffffff', 'frrrrrrf', 'fwwwwwwf', 'fwkwkwkf', 'fwwwwwwf', 'fwkwkwkf', 'fwwwwwwf', 'ffffffff'] },
  // ผนังขวา
  { id: 'room_poster', spot: 'wallR', ko: '포스터', th: 'โปสเตอร์', price: 40, level: 3, legacy: true },
  { id: 'room_kposter', spot: 'wallR', ko: '아이돌 포스터', th: 'โปสเตอร์ไอดอล', price: 100, level: 5, set: 'room_korea', pal: { p: '#ff8fb1', k: '#1b1424', y: '#ffd23f', s: '#ffd9b8', f: '#8f4a28' }, grid: ['ffffffff', 'fppppppf', 'fpkkkkpf', 'fpsskspf', 'fpsssspf', 'fppyyppf', 'fyyyyyyf', 'ffffffff'] },
  { id: 'room_shelf', spot: 'wallR', ko: '선반', th: 'ชั้นวางของ', price: 70, level: 3, pal: { w: '#a0643c', b: '#4f8cff', r: '#e5484d', g: '#3fbf7f', y: '#ffd23f' }, grid: ['..bryg..', '.bbrrygg', 'wwwwwwww', 'wwwwwwww'] },
  // พื้นซ้าย
  { id: 'room_plant', spot: 'floorL', ko: '화분', th: 'กระถางต้นไม้', price: 30, level: 1, legacy: true },
  { id: 'room_bookshelf', spot: 'floorL', ko: '책장', th: 'ตู้หนังสือ', price: 120, level: 4, pal: { w: '#a0643c', d: '#7a4a2a', b: '#4f8cff', r: '#e5484d', g: '#3fbf7f', y: '#ffd23f' }, grid: ['wwwwwwww', 'wbrgybrw', 'wbrgybrw', 'wwwwwwww', 'wygbrygw', 'wygbrygw', 'wwwwwwww', 'd......d'] },
  { id: 'room_beanbag', spot: 'floorL', ko: '빈백', th: 'บีนแบ็ก', price: 80, level: 3, pal: { p: '#ff8fb1', d: '#d6537a', k: '#1b1424' }, grid: ['..pppp..', '.pppppp.', 'pppppppp', 'ppppdppp', 'pdpppppd', '.dddddd.'] },
  { id: 'room_cactus', spot: 'floorL', ko: '선인장', th: 'กระบองเพชร', price: 50, level: 2, pal: { g: '#3fbf7f', G: '#2a8a5a', t: '#c46a3b', T: '#8f4a28', p: '#ff8fb1' }, grid: ['...p....', '..gg.g..', '..gg.gg.', 'g.gGgg..', 'gggggg..', '..ggg...', '.tttttt.', '.tTTTTt.', '..tttt..'] },
  // พื้นขวา
  { id: 'room_lamp', spot: 'floorR', ko: '램프', th: 'โคมไฟ', price: 50, level: 2, legacy: true },
  { id: 'room_tv', spot: 'floorR', ko: '텔레비전', th: 'ทีวี', price: 140, level: 5, set: 'room_korea', pal: { k: '#26242c', s: '#7cc4ff', w: '#fff', g: '#8a8fa8' }, grid: ['kkkkkkkkk', 'ksssssssk', 'kswsssssk', 'ksssssssk', 'kkkkkkkkk', '...gkg...', '..ggggg..'] },
  { id: 'room_fridge', spot: 'floorR', ko: '냉장고', th: 'ตู้เย็น', price: 130, level: 5, pal: { w: '#e8eefc', g: '#b8c2dc', k: '#1b1424' }, grid: ['.gggggg.', '.wwwwww.', '.wkwwww.', '.wwwwww.', '.gggggg.', '.wwwwww.', '.wkwwww.', '.wwwwww.', '.wwwwww.', '.gggggg.'] },
  { id: 'room_guitar', spot: 'floorR', ko: '기타 스탠드', th: 'กีตาร์ตั้งพื้น', price: 110, level: 4, pal: { w: '#c9863f', k: '#3a2418', s: '#ddd' }, grid: ['..k.....', '..k.....', '..k.....', '.www....', 'wwwww...', 'wwkww...', 'wwwww...', '.www....'] },
  { id: 'room_pot_big', spot: 'floorR', ko: '큰 화분', th: 'กระถางต้นไม้ใหญ่', price: 85, level: 3, pal: { g: '#3fbf7f', G: '#2a8a5a', t: '#c46a3b', T: '#8f4a28' }, grid: ['..g..g..', '.gGgggg.', 'ggggGggg', '.gggggg.', '..gGgg..', '..tttt..', '.tTTTTt.', '..tttt..'] },
  // พรม (CSS)
  { id: 'room_rug', spot: 'rug', ko: '러그', th: 'พรม', price: 60, level: 4, legacy: true, rug: 'rug-classic' },
  { id: 'rug_blue', spot: 'rug', ko: '파란 러그', th: 'พรมสีฟ้า', price: 55, level: 3, rug: 'rug-blue' },
  { id: 'rug_pink', spot: 'rug', ko: '분홍 러그', th: 'พรมสีชมพู', price: 55, level: 3, rug: 'rug-pink' },
  { id: 'rug_green', spot: 'rug', ko: '초록 러그', th: 'พรมสีเขียว', price: 55, level: 3, rug: 'rug-green' },
  { id: 'rug_tiger', spot: 'rug', ko: '호랑이 러그', th: 'พรมลายเสือ', price: 150, level: 6, rug: 'rug-tiger', set: 'room_korea' },
]

// ── วอลเปเปอร์ / พื้น (CSS ล้วน — class อยู่ใน styles.css) ──
export const WALLS = [
  { id: 'wall_default', cls: 'wall-default', ko: '기본 벽지', th: 'วอลเปเปอร์เริ่มต้น', price: 0, level: 1 },
  { id: 'wall_mint', cls: 'wall-mint', ko: '민트 벽지', th: 'วอลเปเปอร์มิ้นต์', price: 45, level: 2 },
  { id: 'wall_pink', cls: 'wall-pink', ko: '핑크 벽지', th: 'วอลเปเปอร์ชมพู', price: 45, level: 2 },
  { id: 'wall_cream', cls: 'wall-cream', ko: '크림 벽지', th: 'วอลเปเปอร์ครีม', price: 50, level: 3 },
  { id: 'wall_stars', cls: 'wall-stars', ko: '별 벽지', th: 'วอลเปเปอร์ดาว', price: 90, level: 4 },
  { id: 'wall_brick', cls: 'wall-brick', ko: '벽돌 벽', th: 'ผนังอิฐ', price: 100, level: 5 },
  { id: 'wall_sky', cls: 'wall-sky', ko: '하늘 벽지', th: 'วอลเปเปอร์ท้องฟ้า', price: 110, level: 5 },
  { id: 'wall_sakura', cls: 'wall-sakura', ko: '벚꽃 벽지', th: 'วอลเปเปอร์ซากุระ', price: 180, level: 7 },
]
export const FLOORS = [
  { id: 'floor_default', cls: 'floor-default', ko: '기본 바닥', th: 'พื้นไม้เริ่มต้น', price: 0, level: 1 },
  { id: 'floor_tatami', cls: 'floor-tatami', ko: '다다미', th: 'เสื่อทาทามิ', price: 70, level: 3 },
  { id: 'floor_checker', cls: 'floor-checker', ko: '체크 바닥', th: 'พื้นกระเบื้องหมากรุก', price: 80, level: 4 },
  { id: 'floor_carpet', cls: 'floor-carpet', ko: '파란 카펫', th: 'พื้นพรมสีฟ้า', price: 90, level: 4 },
  { id: 'floor_stone', cls: 'floor-stone', ko: '돌바닥', th: 'พื้นหิน', price: 100, level: 5 },
  { id: 'floor_grass', cls: 'floor-grass', ko: '잔디', th: 'พื้นหญ้า', price: 120, level: 6 },
]
