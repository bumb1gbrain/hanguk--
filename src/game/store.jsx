import { createContext, useContext, useEffect, useReducer } from 'react'
import { clamp, dayStr, addDays, decayPet, levelInfo, stageFor, SRS_DAYS, STREAK_BONUS, lessonReward, REVIEW_REWARD, syllableReward, DAILY_GOAL, growthMult, wantSlot, chooseWant, daysBetween, speakReward } from './logic.js'
import { canListen } from './stt.js'
import { BOX_PRICE, rollBox, featuredPick, salePrice } from './loot.js'
import { pickQuestIds, QUEST_BY_ID, questProgress, QUEST_ALL_BONUS } from '../data/quests.js'
import { FOOD_BY_ID, GEAR_BY_ID, STREAK_FREEZE, isPetSlot } from '../data/shop.js'
import { ROUTINE } from '../data/routine.js'
import { ACHIEVEMENTS } from '../data/achievements.js'
import { DEFAULT_LOOK, GENDER_DEFAULTS, HAIR_STYLES, EYE_STYLES, SKIN_TONES, HAIR_COLORS } from '../pixel/sprites.js'
import { SPECIES, DEFAULT_SPECIES } from '../pixel/pets.js'
import { STORY_REWARD, PART_BY_ID } from '../data/story.js'
import { BOND_DAILY_CAP, BOND_LEVEL_COINS, bondInfo, TRICK_BY_ID } from '../data/tricks.js'

const KEY = 'hyeongbum-save-v1'

export // กันค่าที่ไม่รู้จักเข้าเซฟ (ใช้ทั้งตอนเริ่มเกมและตอนแก้หน้าตา)
function sanitizeLook(look = {}, prev = DEFAULT_LOOK) {
  const l = { ...prev, ...look }
  return {
    gender: l.gender === 'f' ? 'f' : 'm',
    skin: SKIN_TONES[l.skin] ? l.skin : 0,
    hair: HAIR_STYLES[l.hair] ? l.hair : 'short',
    hairColor: HAIR_COLORS[l.hairColor] ? l.hairColor : 0,
    eyes: EYE_STYLES[l.eyes] ? l.eyes : 'dot',
  }
}

// ของที่ทุกคนมีตั้งแต่เริ่ม
const DEFAULT_OWNED = ['top_blue', 'pants_navy', 'skirt_navy', 'wall_default', 'floor_default']
// ห้อง: spot ละ 1 ชิ้น (null = ว่าง) · wall/floor ต้องมีเสมอ
const DEFAULT_ROOM = { wallC: null, wallR: null, floorL: null, floorR: null, rug: null, wall: 'wall_default', floor: 'floor_default' }
// เซฟเก่าที่ซื้อของห้องไว้แล้ว: วางของเดิมให้อัตโนมัติ
const LEGACY_ROOM = { room_poster: 'wallR', room_lamp: 'floorR', room_plant: 'floorL', room_rug: 'rug' }

// สวมใส่/วางไอเทม (ทั้งของตัวละคร ของ 범이 และของห้อง) · toggle=true จะถอดออกถ้าสวมอยู่แล้ว
function equipItem(s, g, toggle) {
  if (g.slot === 'room') {
    const room = { ...s.player.room }
    room[g.spot] = toggle && room[g.spot] === g.id ? null : g.id
    return { ...s, player: { ...s.player, room } }
  }
  if (g.slot === 'wall' || g.slot === 'floor') return { ...s, player: { ...s.player, room: { ...s.player.room, [g.slot]: g.id } } }
  if (isPetSlot(g.slot)) {
    const outfit = { ...(s.pet.outfit || {}) }
    if (toggle && outfit[g.slot] === g.id) delete outfit[g.slot]
    else outfit[g.slot] = g.id
    return { ...s, pet: { ...s.pet, outfit } }
  }
  const outfit = { ...s.player.outfit }
  if (toggle && outfit[g.slot] === g.id && g.slot !== 'top' && g.slot !== 'bottom') delete outfit[g.slot]
  else outfit[g.slot] = g.id
  return { ...s, player: { ...s.player, outfit } }
}

// สัตว์เลี้ยงตัวใหม่ (ไข่) ของสายพันธุ์นั้น
export function freshPet(species = DEFAULT_SPECIES) {
  const sp = SPECIES[species] || SPECIES[DEFAULT_SPECIES]
  return { name: sp.name, species: sp.id, full: 70, happy: 70, energy: 90, asleep: false, growth: 0, clean: 80, bond: 0, want: null, wantDone: null, outfit: {}, lastTick: Date.now() }
}

export function newDaily(date, dueCount = 0, featured) { // featured undefined = ยังไม่ได้สุ่ม (rollDay จะสุ่มให้)
  return { date, xp: 0, routine: [], lessons: {}, reviewed: [], syllable: 0, perfect: 0, care: 0, speaking: 0, claimed: [], goalPaid: false, boxOpened: false, petTaps: 0, bondGain: 0, tricks: [], featured, quests: pickQuestIds(date, { dueCount, listen: canListen() }) }
}

export function freshState() {
  return {
    v: 1,
    player: { name: '나', xp: 0, coins: 60, outfit: { top: 'top_blue' }, owned: [...DEFAULT_OWNED], room: DEFAULT_ROOM, look: DEFAULT_LOOK, goal: DAILY_GOAL, skipHangul: false, freezes: 0, routineOff: [], boxes: 0, freeBoxes: 0, wish: [] },
    pet: freshPet(DEFAULT_SPECIES),
    petBox: {}, // สัตว์เลี้ยงตัวอื่นที่รับเลี้ยงไว้ (พักอยู่ ไม่ลดค่าสถานะ) คีย์ = สายพันธุ์
    inventory: { milk: 2 },
    srs: {},
    lessons: {},
    streak: { count: 0, last: null, best: 0 },
    daily: newDaily(dayStr()),
    stats: { answered: 0, correct: 0 },
    achv: {},
    notices: [],
    onboarded: false,
    story: { seen: {} }, // ช่วงเรื่องที่ดูแล้ว (id → เวลา)
  }
}

function migrateRoom(player = {}) {
  if (player.room) return { ...DEFAULT_ROOM, ...player.room }
  const room = { ...DEFAULT_ROOM }
  for (const id of player.owned || []) if (LEGACY_ROOM[id]) room[LEGACY_ROOM[id]] = id
  return room
}

// รวมเซฟดิบ (จาก localStorage หรือคลาวด์) เข้ากับค่าเริ่มต้น: เติมฟิลด์ใหม่ให้เซฟเก่า และกันค่าเพี้ยน
export function hydrate(s) {
  const f = freshState()
  return { ...f, ...s, player: { ...f.player, ...s.player, look: { ...f.player.look, ...(s.player && s.player.look) }, owned: [...new Set([...(s.player?.owned || []), ...DEFAULT_OWNED])], room: migrateRoom(s.player) }, pet: { ...f.pet, ...s.pet, outfit: { ...(s.pet?.outfit || {}) } }, petBox: Object.fromEntries(Object.entries(s.petBox || {}).filter(([id]) => SPECIES[id]).map(([id, p]) => [id, { ...freshPet(id), ...p, outfit: { ...(p.outfit || {}) } }])), story: { seen: { ...(s.story?.seen || {}) } }, daily: { ...f.daily, ...s.daily }, streak: { ...f.streak, ...s.streak }, notices: [] }
}

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return freshState()
    return hydrate(JSON.parse(raw))
  } catch {
    return freshState()
  }
}

// ── helpers that return a new state ──
function rollDay(s) {
  const today = dayStr()
  const featured = () => featuredPick(today, s.player.owned, levelInfo(s.player.xp).level)
  if (s.daily.date !== today) return { ...s, daily: newDaily(today, dueItems(s.srs, today).length, featured()) }
  if (!s.daily.quests || s.daily.featured === undefined) {
    return {
      ...s,
      daily: {
        ...s.daily,
        quests: s.daily.quests || pickQuestIds(today, { dueCount: dueItems(s.srs, today).length, listen: canListen() }),
        featured: s.daily.featured === undefined ? featured() : s.daily.featured, // เซฟเก่าที่ยังไม่มีของเด่นของวันนี้
      },
    }
  }
  return s
}

// ถ้าเปลี่ยนช่วงเวลา (เช้า/กลางวัน/เย็น) ให้ 범이 ขออาหารใหม่ — เลือกชนิดที่ผู้เล่นให้ได้จริง
function ensureWant(s) {
  const slot = wantSlot()
  if (s.pet.want?.slot === slot) return s
  return { ...s, pet: { ...s.pet, want: { slot, foodId: chooseWant(slot, { inventory: s.inventory, coins: s.player.coins }) } } }
}

function touchStreak(s) {
  const today = dayStr()
  if (s.streak.last === today) return s
  const gap = s.streak.last ? daysBetween(s.streak.last, today) : 0
  const have = s.player.freezes || 0
  let count = 1
  let used = 0
  if (gap === 1) count = s.streak.count + 1
  else if (gap >= 2 && gap - 1 <= have) { used = gap - 1; count = s.streak.count + 1 } // ตัวป้องกันกันวันที่พลาด
  const bonus = STREAK_BONUS[count] || 0
  const notices = [...s.notices]
  if (used) notices.push({ type: 'freeze', used, count })
  if (count > 1) notices.push({ type: 'streak', count, bonus })
  const player = { ...s.player, freezes: have - used, coins: s.player.coins + bonus }
  return { ...s, player, streak: { count, last: today, best: Math.max(s.streak.best || 0, count) }, notices }
}

// ความผูกพัน: เพิ่มได้สูงสุด BOND_DAILY_CAP ต่อวัน (กันปั๊มจากการกดรัว) เลื่อนระดับได้เหรียญโบนัส + แจ้งเตือน
function bondGain(s, n) {
  const used = s.daily.bondGain || 0
  const add = Math.max(0, Math.min(n, BOND_DAILY_CAP - used))
  if (!add) return s
  const before = bondInfo(s.pet.bond || 0).level
  const bond = (s.pet.bond || 0) + add
  const after = bondInfo(bond).level
  const player = after > before ? { ...s.player, coins: s.player.coins + BOND_LEVEL_COINS * (after - before) } : s.player
  const notices = after > before ? [...s.notices, { type: 'bond', level: after, species: s.pet.species || DEFAULT_SPECIES, name: s.pet.name }] : s.notices
  return { ...s, player, notices, pet: { ...s.pet, bond }, daily: { ...s.daily, bondGain: used + add } }
}

function gain(s, { xp = 0, coins = 0, growth = 0, happy = 0, care = false }) {
  const before = levelInfo(s.player.xp).level
  const stageBefore = stageFor(s.pet.growth).id
  const player = { ...s.player, xp: s.player.xp + xp, coins: s.player.coins + coins }
  const after = levelInfo(player.xp).level
  const notices = [...s.notices]
  if (after > before) {
    player.coins += 30 * (after - before)
    notices.push({ type: 'level', level: after })
  }
  // โบนัสเหรียญเมื่อครบเป้า XP รายวัน (ครั้งเดียวต่อวัน)
  const daily = { ...s.daily, xp: s.daily.xp + xp }
  if (!daily.goalPaid && daily.xp >= (s.player.goal || DAILY_GOAL)) { daily.goalPaid = true; player.coins += 10 }
  const g = Math.round(growth * (care ? 1 : growthMult(s.pet)))
  const pet = { ...s.pet, growth: s.pet.growth + g, happy: clamp(s.pet.happy + happy) }
  const stageAfter = stageFor(pet.growth).id
  if (stageAfter !== stageBefore) notices.push({ type: 'evolve', stage: stageAfter })
  return { ...s, player, pet, notices, daily }
}

function step(state, a) {
  let s = ensureWant(rollDay(state))
  switch (a.type) {
    case 'TICK':
      return { ...s, pet: decayPet(s.pet, a.now || Date.now()) }

    case 'ONBOARD':
      return {
        ...s,
        onboarded: true,
        pet: SPECIES[a.species] ? freshPet(a.species) : s.pet, // ไข่ตัวแรกตามที่ผู้เล่นเลือก (ทุกสายพันธุ์ฟรี)
        player: {
          ...s.player,
          name: a.name || s.player.name,
          goal: a.goal || s.player.goal,
          skipHangul: !!a.skipHangul,
          look: sanitizeLook(a.look, s.player.look),
          outfit: { ...s.player.outfit, bottom: GENDER_DEFAULTS[a.look?.gender === 'f' ? 'f' : 'm'].bottom },
        },
      }

    case 'SET_LOOK':
      return { ...s, player: { ...s.player, look: sanitizeLook(a.look, s.player.look) } }

    case 'SET_GOAL':
      return { ...s, player: { ...s.player, goal: a.goal } }

    case 'LESSON_DONE': {
      const today = dayStr()
      const srs = { ...s.srs }
      const missed = new Set(a.missedIds || [])
      for (const id of a.itemIds) {
        // คำที่ตอบผิดในบทเรียนจะกลับมาให้ทบทวนวันนี้เลย (box 1) ส่วนคำที่ตอบถูกค่อยทวนพรุ่งนี้
        if (!srs[id]) srs[id] = { box: 1, due: missed.has(id) ? today : addDays(today, 1), ok: 0, miss: missed.has(id) ? 1 : 0 }
        else if (missed.has(id)) srs[id] = { ...srs[id], box: 1, due: today, miss: srs[id].miss + 1 }
      }
      const hadBefore = !!s.lessons[a.lessonId]
      const prev = s.lessons[a.lessonId] || { times: 0, best: 0 }
      const pct = Math.round((a.correct / a.total) * 100)
      const paid = (s.daily.lessons || {})[a.lessonId]
      const r = lessonReward({ correct: a.correct, total: a.total, hadBefore, paid })
      s = { ...s, srs, lessons: { ...s.lessons, [a.lessonId]: { times: prev.times + 1, best: Math.max(prev.best, pct) } } }
      s = { ...s, stats: { answered: s.stats.answered + a.total, correct: s.stats.correct + a.correct } }
      const paidNow = { m: r.m, xp: (paid?.xp || 0) + r.xp, coins: (paid?.coins || 0) + r.coins, growth: (paid?.growth || 0) + r.growth }
      s = { ...s, daily: { ...s.daily, lessons: { ...(s.daily.lessons || {}), [a.lessonId]: paidNow } } }
      if (a.total > 0 && a.correct === a.total) s = { ...s, daily: { ...s.daily, perfect: (s.daily.perfect || 0) + 1 } }
      s = gain(s, r)
      return touchStreak(s) // เรียนซ้ำแม้ไม่ได้รางวัล ก็ยังนับ streak ของวันนี้
    }

    case 'REVIEW_ANSWER': {
      const today = dayStr()
      const cur = s.srs[a.itemId] || { box: 1, ok: 0, miss: 0 }
      const box = a.ok ? Math.min(cur.box + 1, SRS_DAYS.length - 1) : 1
      const due = a.ok ? addDays(today, SRS_DAYS[box]) : today
      s = { ...s, srs: { ...s.srs, [a.itemId]: { ...cur, box, due, ok: cur.ok + (a.ok ? 1 : 0), miss: cur.miss + (a.ok ? 0 : 1) } } }
      s = { ...s, stats: { answered: s.stats.answered + 1, correct: s.stats.correct + (a.ok ? 1 : 0) } }
      const reviewed = s.daily.reviewed || []
      if (a.ok && !reviewed.includes(a.itemId)) {
        s = { ...s, daily: { ...s.daily, reviewed: [...reviewed, a.itemId] } } // จ่ายรางวัลคำละครั้งต่อวัน
        s = gain(s, REVIEW_REWARD)
      }
      return touchStreak(s)
    }

    case 'SYLLABLE_DONE': {
      const paid = s.daily.syllable || 0
      const r = syllableReward({ correct: a.correct, paid })
      s = { ...s, daily: { ...s.daily, syllable: paid + r.n } }
      s = { ...s, stats: { answered: s.stats.answered + a.total, correct: s.stats.correct + a.correct } }
      return touchStreak(r.n ? gain(s, r) : s) // เล่นซ้ำแม้ไม่ได้รางวัลก็นับ streak
    }

    case 'TOGGLE_ROUTINE': {
      if (!ROUTINE.some((r) => r.id === a.id)) return s
      const off = s.player.routineOff || []
      if (off.includes(a.id)) return { ...s, player: { ...s.player, routineOff: off.filter((x) => x !== a.id) } }
      if (ROUTINE.length - off.length <= 3) return s // ต้องเหลือกิจวัตรอย่างน้อย 3 ข้อ (ภารกิจประจำวันอ้างอิง)
      return { ...s, player: { ...s.player, routineOff: [...off, a.id] } }
    }

    case 'SPEAK_DONE': {
      const paid = s.daily.speaking || 0
      const r = speakReward({ passed: a.passed, paid })
      s = { ...s, daily: { ...s.daily, speaking: paid + r.n } }
      s = { ...s, stats: { ...s.stats, spoken: (s.stats.spoken || 0) + a.passed } }
      return touchStreak(r.n ? gain(s, r) : s) // ฝึกซ้ำแม้ไม่ได้รางวัลก็นับ streak
    }

    case 'ROUTINE_CHECK': {
      if (s.daily.routine.includes(a.id) || (s.player.routineOff || []).includes(a.id)) return s
      s = { ...s, daily: { ...s.daily, routine: [...s.daily.routine, a.id] } }
      return touchStreak(gain(s, { xp: 5, coins: 2, growth: 3, happy: 3 }))
    }

    case 'BUY': {
      if (a.kind === 'special') {
        if (a.id !== STREAK_FREEZE.id || s.player.coins < STREAK_FREEZE.price || (s.player.freezes || 0) >= STREAK_FREEZE.max) return s
        return { ...s, player: { ...s.player, coins: s.player.coins - STREAK_FREEZE.price, freezes: (s.player.freezes || 0) + 1 } }
      }
      if (a.kind === 'food') {
        const f = FOOD_BY_ID[a.id]
        if (!f || s.player.coins < f.price) return s
        return {
          ...s,
          player: { ...s.player, coins: s.player.coins - f.price },
          inventory: { ...s.inventory, [f.id]: (s.inventory[f.id] || 0) + 1 },
        }
      }
      const g = GEAR_BY_ID[a.id]
      const price = g ? salePrice(g, s.daily.featured) : 0 // ของเด่นประจำวันลด 30%
      if (!g || g.achv || s.player.owned.includes(g.id) || s.player.coins < price) return s
      if (levelInfo(s.player.xp).level < g.level) return s
      s = { ...s, player: { ...s.player, coins: s.player.coins - price, owned: [...s.player.owned, g.id], wish: (s.player.wish || []).filter((x) => x !== g.id) } }
      // ของ epic / legendary: ฉลองด้วยหน้าต่างพิเศษ
      if (g.rarity === 'epic' || g.rarity === 'legendary') s = { ...s, notices: [...s.notices, { type: 'loot', loot: { kind: 'item', id: g.id, rarity: g.rarity, source: 'buy' } }] }
      return equipItem(s, g, false) // ซื้อแล้วสวม/วางให้ทันที
    }

    case 'OPEN_BOX': {
      const kind = a.kind === 'paid' ? 'paid' : 'free'
      if (kind === 'free' && (s.daily.boxOpened || s.daily.xp <= 0)) return s // กล่องฟรีต้องทำกิจกรรมวันนี้ก่อน และเปิดได้วันละครั้ง
      if (kind === 'paid' && s.player.coins < BOX_PRICE) return s
      const loot = rollBox({ kind, seed: `${dayStr()}-${s.player.boxes || 0}-${kind}`, owned: s.player.owned, freeCount: s.player.freeBoxes || 0 })
      let player = { ...s.player, boxes: (s.player.boxes || 0) + 1, freeBoxes: (s.player.freeBoxes || 0) + (kind === 'free' ? 1 : 0), coins: s.player.coins - (kind === 'paid' ? BOX_PRICE : 0) }
      let inventory = s.inventory
      if (loot.kind === 'coins' || loot.kind === 'refund') player = { ...player, coins: player.coins + loot.coins }
      if (loot.kind === 'food') inventory = { ...inventory, [loot.id]: (inventory[loot.id] || 0) + 1 }
      if (loot.kind === 'item') player = { ...player, owned: [...player.owned, loot.id], wish: (player.wish || []).filter((x) => x !== loot.id) }
      const daily = kind === 'free' ? { ...s.daily, boxOpened: true } : s.daily
      return { ...s, player, inventory, daily, notices: [...s.notices, { type: 'loot', loot: { ...loot, source: kind } }] }
    }

    case 'WISH': {
      if (!GEAR_BY_ID[a.id]) return s
      const wish = s.player.wish || []
      return { ...s, player: { ...s.player, wish: wish.includes(a.id) ? wish.filter((x) => x !== a.id) : [...wish, a.id].slice(-30) } }
    }

    case 'EQUIP': {
      const g = GEAR_BY_ID[a.id]
      if (!g || !s.player.owned.includes(g.id)) return s
      return equipItem(s, g, true)
    }

    case 'FEED': {
      const f = FOOD_BY_ID[a.id]
      if (!f || !s.inventory[f.id] || s.pet.asleep) return s
      const want = s.pet.want
      const hit = !!want && want.foodId === f.id && s.pet.wantDone !== want.slot // ตรงที่ 범이 ขอ
      s = { ...s, inventory: { ...s.inventory, [f.id]: s.inventory[f.id] - 1 } }
      s = { ...s, pet: { ...s.pet, full: clamp(s.pet.full + f.full), wantDone: hit ? want.slot : s.pet.wantDone } }
      s = { ...s, daily: { ...s.daily, care: (s.daily.care || 0) + 1 } }
      const fav = (SPECIES[s.pet.species] || SPECIES[DEFAULT_SPECIES]).fav === f.id // อาหารโปรดของสายพันธุ์ → ดีใจเพิ่ม
      s = bondGain(s, fav ? 3 : 2)
      return gain(s, { xp: hit ? 3 : 0, growth: 4 + (hit ? 3 : 0), happy: f.happy + (hit ? 10 : 0) + (fav ? 6 : 0), care: true })
    }

    case 'PLAY': {
      if (s.pet.asleep || s.pet.energy < 10) return s
      s = { ...s, pet: { ...s.pet, energy: clamp(s.pet.energy - 10), full: clamp(s.pet.full - 3), clean: clamp((s.pet.clean ?? 80) - 4) } }
      s = { ...s, daily: { ...s.daily, care: (s.daily.care || 0) + 1 } }
      s = bondGain(s, 3)
      return gain(s, { growth: 2, happy: 12, care: true })
    }

    case 'WASH': {
      if (s.pet.asleep || (s.pet.clean ?? 80) >= 90) return s // สะอาดอยู่แล้ว กดรัวไม่ได้
      s = { ...s, pet: { ...s.pet, clean: 100 } }
      s = { ...s, daily: { ...s.daily, care: (s.daily.care || 0) + 1 } }
      s = bondGain(s, 2)
      return gain(s, { growth: 2, happy: 6, care: true })
    }

    case 'QUEST_CLAIM': {
      const qs = (s.daily.quests || []).map((id) => QUEST_BY_ID[id]).filter(Boolean)
      const q = qs.find((x) => x.id === a.id)
      const claimed = s.daily.claimed || []
      if (!q || claimed.includes(q.id) || questProgress(q, s) < q.target) return s
      const now = [...claimed, q.id]
      s = { ...s, daily: { ...s.daily, claimed: now } }
      s = gain(s, { xp: q.xp, coins: q.coins, growth: 2, happy: 3 })
      if (qs.every((x) => now.includes(x.id))) s = gain(s, { coins: QUEST_ALL_BONUS, happy: 6 })
      return touchStreak(s)
    }

    case 'PET_TAP': { // แตะสัตว์เลี้ยง: อารมณ์ดีขึ้นนิดหน่อย + ความผูกพัน (วันละ 10 ครั้ง)
      const taps = s.daily.petTaps || 0
      if (s.pet.asleep || taps >= 10) return s
      s = { ...s, pet: { ...s.pet, happy: clamp(s.pet.happy + 2) }, daily: { ...s.daily, petTaps: taps + 1 } }
      return bondGain(s, 1)
    }

    case 'HUG': { // กอด: ดีใจมาก มีคูลดาวน์ 45 วินาที (เวลามาจากฝั่ง UI เพื่อให้ reducer บริสุทธิ์)
      const t = a.now || 0
      if (s.pet.asleep || t - (s.pet.lastHug || 0) < 45000) return s
      s = { ...s, pet: { ...s.pet, happy: clamp(s.pet.happy + 8), lastHug: t }, daily: { ...s.daily, care: (s.daily.care || 0) + 1 } }
      s = bondGain(s, 3)
      return gain(s, { growth: 1, care: true })
    }

    case 'TRICK': { // สอนคำสั่งภาษาเกาหลี: ท่าละครั้งต่อวันที่ได้รางวัล (ท่ายังเล่นซ้ำดูได้) ต้องมีความผูกพันถึงระดับที่กำหนด
      const t = TRICK_BY_ID[a.id]
      const done = s.daily.tricks || []
      if (!t || s.pet.asleep || s.pet.growth < 30 || s.pet.energy < 5 || done.includes(t.id) || bondInfo(s.pet.bond || 0).level < t.level) return s
      s = { ...s, pet: { ...s.pet, energy: clamp(s.pet.energy - 5), happy: clamp(s.pet.happy + 4) }, daily: { ...s.daily, tricks: [...done, t.id], care: (s.daily.care || 0) + 1 } }
      s = bondGain(s, 2)
      return gain(s, { xp: 2, growth: 1, care: true })
    }

    case 'ADOPT': { // รับเลี้ยงสายพันธุ์ใหม่ (เริ่มเป็นไข่) เก็บไว้ในบ้านสัตว์เลี้ยง
      const sp = SPECIES[a.species]
      const box = s.petBox || {}
      if (!sp || sp.id === s.pet.species || box[sp.id]) return s
      if (levelInfo(s.player.xp).level < sp.level || s.player.coins < sp.price) return s
      return { ...s, player: { ...s.player, coins: s.player.coins - sp.price }, petBox: { ...box, [sp.id]: freshPet(sp.id) }, notices: [...s.notices, { type: 'adopt', species: sp.id }] }
    }

    case 'SWITCH_PET': { // สลับตัวที่เลี้ยงอยู่: ตัวเดิมไปพักในบ้าน (ไม่ลดค่าสถานะระหว่างพัก)
      const box = s.petBox || {}
      const target = box[a.species]
      if (!target || a.species === s.pet.species) return s
      const now = Date.now()
      const { [a.species]: _taken, ...rest } = box
      return { ...s, pet: { ...target, lastTick: now }, petBox: { ...rest, [s.pet.species || DEFAULT_SPECIES]: { ...s.pet, lastTick: now } } }
    }

    case 'SLEEP':
      return { ...s, pet: { ...decayPet(s.pet), asleep: !s.pet.asleep } }

    case 'RENAME':
      return { ...s, [a.who]: { ...s[a.who], name: a.name } }

    case 'STORY_SEEN': { // ดูจบช่วงเรื่องครั้งแรก: ได้เหรียญครั้งเดียว (ดูซ้ำได้แต่ไม่ได้เพิ่ม)
      if (!PART_BY_ID[a.id] || s.story?.seen?.[a.id]) return s
      return { ...s, story: { seen: { ...(s.story?.seen || {}), [a.id]: Date.now() } }, player: { ...s.player, coins: s.player.coins + STORY_REWARD } }
    }

    case 'DISMISS':
      return { ...s, notices: s.notices.slice(1) }

    case 'RESET':
      return freshState()

    case 'REPLACE': // เซฟจากคลาวด์มาแทนที่ทั้งก้อน (ผ่าน hydrate เพื่อเติมฟิลด์ใหม่และกันค่าเพี้ยน)
      return a.data && typeof a.data === 'object' ? hydrate(a.data) : s

    default:
      return s
  }
}

// ปลดล็อกความสำเร็จหลังทุก action: จ่ายเหรียญ/ไอเทม + แจ้งเตือน (ทำงานซ้ำไม่ได้เพราะบันทึก achv ไว้)
function checkAch(s) {
  if (!s.onboarded) return s
  const got = ACHIEVEMENTS.filter((a) => !s.achv[a.id] && a.check(s))
  if (!got.length) return s
  const today = dayStr()
  const achv = { ...s.achv }
  const owned = [...s.player.owned]
  let coins = s.player.coins
  const notices = [...s.notices]
  for (const a of got) {
    achv[a.id] = today
    coins += a.coins
    if (a.item && !owned.includes(a.item)) owned.push(a.item)
    notices.push({ type: 'achv', id: a.id })
  }
  return { ...s, achv, notices, player: { ...s.player, coins, owned } }
}

function reducer(state, a) {
  return checkAch(step(state, a))
}

const Ctx = createContext(null)

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, () => reducer(load(), { type: 'TICK' }))

  useEffect(() => {
    try {
      const { notices, ...save } = state
      localStorage.setItem(KEY, JSON.stringify(save))
    } catch { /* storage unavailable */ }
  }, [state])

  useEffect(() => {
    const t = setInterval(() => dispatch({ type: 'TICK' }), 60_000)
    const vis = () => document.visibilityState === 'visible' && dispatch({ type: 'TICK' })
    document.addEventListener('visibilitychange', vis)
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', vis) }
  }, [])

  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>
}

export const useGame = () => useContext(Ctx)

export function dueItems(srs, today = dayStr()) {
  return Object.entries(srs).filter(([, v]) => v.due <= today).map(([id]) => id)
}
