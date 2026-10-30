# 형범 (Hanguk Hyeong-Bum) — Korean learning PWA

Progressive web app for Thai speakers learning Korean from zero, built around **daily-life routines**,
with a **pixel-art player avatar** that levels up and a **Tamagotchi-style tiger pet (범이)** that hatches and grows.
UI language: Thai + Korean. Owner: อีบุ๋ม (giszlozz@gmail.com). Started in a Claude Cowork session on 2026-10-28.

## Stack
- Vite 5 + React 18 (plain JSX, no router, no state lib) + `vite-plugin-pwa` (generateSW, autoUpdate, offline precache)
- Pixel font: Galmuri11 (OFL), bundled in `src/assets/fonts/`. Thai falls back to system fonts.
- Audio: Web Speech API `ko-KR` (`src/game/tts.js`) — no audio files.
- Save data: `localStorage` key `hyeongbum-save-v1` (device-local only).

```bash
npm install
npm run dev       # http://localhost:5173 (use --host to test on phone in same Wi-Fi)
npm run build     # -> dist/ (static; deploy to GitHub Pages / Netlify / Vercel)
npm run preview
npm run icons     # regenerate PWA icons from the tiger pixel grid (needs Python + Pillow)
```

## Layout
```
src/
  main.jsx            SW registration + GameProvider
  App.jsx             top bar, bottom nav (홈/배우기/루틴/복습/상점), notices (level-up/evolve/streak), onboarding, settings
  game/store.jsx      reducer + persistence + 1-min pet tick. All game rules live here.
  game/logic.js       balance numbers: XP curve, SRS intervals, pet decay/mood, pet stages, quiz builder
  game/hangul.js      Unicode compose/decompose of syllables (초성/중성/종성 tables) + distractor helpers for the syllable game
  game/stt.js         SpeechRecognition wrapper (ko-KR): interim results for the live transcript, stop on speech end, one silent auto-restart on 'no-speech', Thai error messages · canListen()
  game/speech_score.js evaluateSpeech(text, alts, level): syllable alignment (Needleman–Wunsch) → ops match/sub/miss/extra with per-part diffs (lead/vowel/tail) + Thai explanations & articulation tips; score = 0.6·jamo similarity (ortho vs phonetic, 연음·구개음화) + 0.4·syllable-match − extra/miss penalties; numerals 3시→세 시; repeats contained → 95. Levels: standard pass 80 / strict pass 90 (pref in localStorage 'hb-speak-level')
  game/loot.js        pure seeded RNG: free daily box (`rollBox kind=free`, pity: every 5th free box = rare+ item), paid box (90 coins, always a NEW item, odds in ODDS), `featuredPick` (daily featured item, −30%, stored in `daily.featured`), `salePrice`
  sync/               Supabase sync (optional): supabase.js (lazy client, env VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY; dead-code-eliminated when unset), syncCore.js (pure: syncKey, decide, summarize — unit-tested), SyncProvider.jsx (Google sign-in, debounced upload, pull on focus/online, conflict modal)
  game/tts.js         speak(text) + speakSeq(parts,{slow,gap}) (paced sequence) + speakFor(item,{slow,quiz}) — letters play as 이름 → syllable → example word (quiz mode skips the name); user prefs {voice, rate 0.65/0.85/1.0} in localStorage 'hb-tts', slow = rate×0.62; cancel+retry watchdog; dispatches window event 'tts-problem' ('stuck'|'no-voice') -> toast in App.jsx
  data/lessons.js     Hangul (vowels, consonants×2) + 'basics' group (받침 ×2, Sino/native numbers, time) + 9 daily-life scenes; each item {ko, rom, read(Thai reading), th, speak?, ex?, kind} (letters carry `ex` = example word starting with that sound, e.g. ㄱ→가방, used on flashcards and by speakFor so close sounds like 가/카, 자/차, 어/오 get context)
  data/routine.js     12 daily habits phrased in past tense (-았/었어요) — tick in real life for XP
  data/shop.js        foods (feed pet) + gear (hat/glasses/neck/top/room) with price & level lock
  pixel/items.js      THE collectible catalogue (sprites + shop data in one place): ITEMS (avatar+pet gear), ROOM_ITEMS (spots), WALLS, FLOORS, SETS. Validate widths with a quick node script after editing (all avatar rows = 16 chars)
  pixel/sprites.js    base avatar/pet/room sprites + palettes; merges items.js overlays
  pixel/Sprite.jsx    grid -> crisp SVG (run-length rects, optional auto-outline, overlay layers)
  pixel/Characters.jsx Avatar (bald base + layered hair/top/bottom/shoes/back/neck/glasses/hat, driven by player.look + outfit), Pet (stage + mood eyes), RoomItem
  components/         PreviewModal (zoom + try-on before buying, shows set progress), RoomScene (mini room for previews), LookEditor (gender/skin/hair/colour/eyes), CharacterModal (look · wardrobe · achievements), GearPreview, Quiz, ui
  data/achievements.js 16 auto-unlocked achievements (coins + exclusive items), checked after every action by `checkAch` in store.jsx
  pages/              Home (room + pet care), Learn, SpeakingGame (🎤 말하기 연습: say-it-back with Web Speech API), SyllableGame (글자 만들기 — build 초성+중성+받침 for single-syllable words, 6 rounds, opened from Learn), LessonView (flashcards -> quiz -> rewards), Routine, Review (SRS), Shop
```

## Collections (188 items)
- Slots: top, bottom, shoes, hat, glasses, face, neck, back, hand (avatar) · pet_hat, pet_face, pet_neck (범이) · room spots wallC/wallR/floorL/floorR/rug + wall & floor styles (CSS variables, classes in styles.css).
- Rarity from price (`rarityOf`): ≤55 common, ≤100 rare, ≤200 epic, else legendary; `achv` items always legendary. Shop cards/wardrobe/book show rarity glow.
- `player.room = {wallC, wallR, floorL, floorR, rug, wall, floor}` (migrated from old owned room items); `pet.outfit = {pet_hat, pet_face, pet_neck}`; buying auto-equips/places (`equipItem` in store).
- 14 SETS give a one-time coin bonus when complete (auto achievements `set_*`); Collection Book (Character ▸ 📕 สะสม) shows totals, rarity counts, set progress and silhouettes for missing items. Level-1 starter items (STARTER overrides in data/shop.js, ~23 cheap items across 13 slots; start coins 60). Shop cards are 3 columns; tap the preview to open PreviewModal. Whole catalogue ≈14k coins, so it's a months-long goal at ~80–100 coins/day.

## Cloud sync (Supabase) — see supabase/README.md for setup
- Local `localStorage` stays the source of truth; cloud (`public.saves`, 1 row/user, RLS) is backup + cross-device sync. Without env vars the whole feature (and the supabase-js chunk) disappears from the build.
- Versioning: `meta` in localStorage `hyeongbum-sync-v1` = {uid, localTs, syncedTs, lastKey}. `localTs` is forced > `syncedTs` on every local change (clock-skew safe); uploads are conditional (`update … eq client_ts = syncedTs`) so concurrent devices can't silently overwrite each other; anything ambiguous (both sides changed, or new device/account with local progress) → user picks cloud vs this device. `REPLACE` action applies a cloud save via `hydrate()`.
- `syncKey()` ignores pet vitals/notices so an idle open tab doesn't upload every minute. Dev-only test seam: `window.__syncAttach(fakeClient)`.
- Never ship the service_role key; only the publishable/anon key belongs in the client.

## Surprise & wishlist (collection retention)
- Home 🎁 card: free daily box (needs `daily.xp>0`, once/day via `OPEN_BOX`) → coins 10–35 / a food / an item; featured item (−30%) opens PreviewModal; banner when a wished item becomes affordable.
- Shop: ⭐ featured banner on every gear tab with strike-through price, ☆/★ wishlist (`player.wish`, auto-cleared on purchase) + "★ อยากได้" tab with progress bars, set tags on cards ("ชิ้นสุดท้าย!" when 1 away), mystery box in "특별" tab.
- Buying an epic/legendary item, or opening any box, queues a `loot` notice (App.jsx `LootNotice`): shaking gift box → tap to open → reveal with rarity glow (+confetti for epic/legendary).
- Collection Book sorts sets by fewest missing, flags ≤2 missing (🔥), shows remaining coin cost per set and for the whole catalogue (~12.9k at the time of writing).
- Round eyes have a white sparkle pixel (`w` in AVATAR_PAL).

## Character progression
- `player.look = {gender m|f, skin 0-5, hair short|spiky|buzz|long|bob|ponytail, hairColor 0-7, eyes dot|round|calm}` chosen at onboarding, editable any time from Home ▸ 👤 ตัวละคร (`SET_LOOK`, sanitised in store).
- Gear slots: top, bottom, shoes, hat, glasses, neck, back (+ room). `GEAR` in data/shop.js; shop tabs 음식/옷/소품/방/특별 via `SLOT_GROUPS`; `achv:true` items are never sold (only granted by achievements). Level-up modal lists the gear unlocked at that level.
- Ranks by level (`RANKS`/`rankFor`): 새내기 → 학생 → 열공러 → 한국어 러버 → 통역사 지망생 → 한글 마스터 → 한국 통, shown on the room nametag and in the character modal.

## Game rules (current)
- Lesson done reward (`lessonReward` in logic.js) scales with accuracy `acc=correct/total`: XP 8+42·acc, coins 3+9·acc, growth 6+8·acc (perfect = 50 XP). Full only the first time a lesson is ever finished; later days ×0.5.
  Same-day repeats pay only the *difference* vs what was already paid for that lesson today (`daily.lessons[id]`), so equal/lower scores earn 0. Repeating still counts toward streak. Items enter SRS: answered-right → due tomorrow, **answered-wrong → box 1, due today** (`missedIds`).
- Lesson result shows the missed words + "ลองเฉพาะคำที่ผิด" retry quiz (no reward). Quiz distractors prefer the same lesson, then same kind, then anything.
- Beginner path: `suggestLesson(date, state.lessons, player.skipHangul)` returns the first unfinished Hangul lesson until done (unless onboarding said "อ่านฮันกึลได้แล้ว"), then the time-of-day scene.
- Onboarding asks level (skipHangul) + daily time → `player.goal` XP (30/50/80), then opens the first suggested lesson; goal changeable in Settings (`SET_GOAL`).
- Review correct: +4 XP +1 coin +2 growth, **once per item per day** (`daily.reviewed`); SRS boxes 1–6 → 1,2,4,7,15,30 days; wrong → box 1, due today. Extra practice mode pays nothing.
- Speaking practice (🎤): 5 sentences/round (learned items first), ≤3 tries each, pass ≥80 (standard) / ≥90 (strict); result screen = score ring (count-up), what the system heard, per-syllable compare board (✓ match · ≈ same sound · ✗ wrong · ∅ not heard · + extra; tap a cell to hear it), problem cards with Thai explanation + tips; Space/Enter shortcuts → +4 XP +1 coin +1 growth per passed sentence, capped at 6 sentences/day (`daily.speaking`, `speakReward`); `speak` daily quest only picked when `canListen()`; achievements first_speak / speak50 (`stats.spoken`).
- Syllable game: +3 XP +1 coin +1 growth per solved round (≤2 tries), capped at 6 rounds/day total (`daily.syllable`, `syllableReward`); replays free but unpaid; still counts toward streak.
- Routine tick: +5 XP +2 coins (once per item per day, resets at local midnight). Items can be switched off in the Routine tab (✎ ปรับ, `player.routineOff`, min 3 active); current time-of-day group is listed first with a "ตอนนี้" badge.
- Flashcards (words ≤4 syllables) show each syllable split into 초성+중성+받침; Hangul/basics lessons link to the syllable game.
- Level L→L+1 needs `60 + 25*(L-1)` XP; level-up bonus 30 coins. Daily goal = `player.goal` XP (default 50). Streak = consecutive days with any activity (lesson/review/routine/quest/syllable); **streak freeze** (🧊 60 coins in Shop ▸ พิเศษ, hold ≤2, `player.freezes`) is consumed automatically for each missed day (`touchStreak`, `liveStreak(st, today, freezes)`), gaps larger than the freezes cover reset to 1 and keep the freezes; `liveStreak()` shows 0 once a day is missed; `streak.best` kept; coin bonus at 3/7/14/30/60/100 days (`STREAK_BONUS`).
- Pet stats 0–100 decay hourly (awake: full −4, clean −2, happy −3/−5 if hungry (+2 more if clean<25), energy −3; asleep: clean −1, energy +15, auto-wakes at 100). `WASH` (씻기) sets clean 100, only when clean<90.
- Neglect: if full/happy/clean <25, growth from *learning* actions is halved (`growthMult`); care actions (feed/play/wash) are exempt. Moods: sleep > hungry > tired > dirty > sad > happy.
- Pet wants: 3 time slots/day (05–11, 11–17, 17–05, `wantSlot`); at slot start `ensureWant` stores `pet.want = {slot, foodId}` chosen by `chooseWant` so it's always satisfiable (food in inventory → else affordable → else milk). Korean "X 먹고 싶어요"; feeding it once per slot gives +3 XP, +3 growth, +10 happy (`pet.wantDone` = fulfilled slot). The banner has one-tap "ให้เลย"/"ซื้อ" buttons.
- First hatch (egg→baby) shows a special hatch modal. Egg growth bar reads "ใกล้ฟักเป็น …".
- Daily quests (`data/quests.js`, `pickQuestIds`): 3 per day picked at day-open and stored in `daily.quests` (the `review` quest is only picked if ≥5 words are due, so it's never impossible); progress derives from existing daily counters (lessons/reviewed/syllable/routine/perfect/care) so replays can't farm; claim once each via `QUEST_CLAIM` (+XP/coins), +15 coins when all 3 claimed. Reaching the daily XP goal pays +10 coins once (`daily.goalPaid`).
- Pet stages by growth: egg 0 → baby 30 → teen 150 → adult 400.
- Time-of-day suggestion: `suggestLesson()` picks the daily scene whose `hours` cover the current hour.

## Ideas / next steps (not done yet)
- More content: weather, hospital/pharmacy, phone/chat slang, double consonants/diphthongs; syllable game extensions (multi-syllable words, double final consonants)
- Speaking level 2: Azure AI Speech pronunciation assessment (ko-KR is in its supported-locale list; accuracy/fluency/completeness, no phoneme names or prosody for Korean) behind a Supabase edge function. Level 1 (Web Speech API) is done; it only compares recognised TEXT, not accent.
- Collection ideas from the persona review: try-on before buying, wishlist, daily mystery box / featured item rotation, purchase fanfare for epic/legendary
- Pet mini-games (e.g. catch falling Hangul), more evolutions/outfits, room furniture placement
- Push/notification reminders for routine & reviews; export/import save (JSON) or cloud sync
- Native Korean review of Thai readings (`read`) — they are approximations

## Conventions
- Keep all user-facing text bilingual (Korean + Thai). Korean in `.ko` class (pixel font).
- New sprites: rows must all be the same width; avatar overlays are 16 wide and keyed by row index. Overlay '.' = pass-through (layers can only add/recolour pixels, never erase); `s` (skin) is injected into every overlay palette so shorts/skirt legs follow the skin tone. The base avatar has NO hair and NO legs: hair comes from `HAIR_STYLES`, legs from the bottom overlay (default pants_navy / skirt_navy by gender).
- Reducer must stay pure (React StrictMode double-invokes it).

## สัตว์เลี้ยงหลายสายพันธุ์ & ปฏิสัมพันธ์
- `src/pixel/pets.js`: 7 สายพันธุ์ (tiger/chick/cat/dog/bunny/fox/panda) → `speciesSprite(id, stage, mood)` คืน `{grid, pal, dy}` (dy = แถวเสริมด้านบน เช่นหู ต้องเลื่อนของที่สวมตาม)
- state: `pet.species`, `pet.bond`, `state.petBox` (ตัวที่พักในบ้าน ไม่ลดค่าสถานะ); actions `ADOPT`/`SWITCH_PET`/`PET_TAP`/`HUG`/`TRICK`
- ความผูกพัน (`src/data/tricks.js`): เพดาน 30/วัน (`daily.bondGain`) เลื่อนระดับได้เหรียญ; คำสั่ง (앉아, 점프, 손, …) ปลดล็อกตามระดับ ได้รางวัลท่าละครั้ง/วัน
- แอนิเมชันอยู่ใน `styles.css` (`.pa-*` บน `.pet-spot`, `.avatar-spot.hug/cheer/cmd`, `.fx-part`)

## เนื้อเรื่อง (Story)
- เนื้อหาอยู่ใน `src/data/story.js` (CHAPTERS → parts → scenes) · เพิ่มตอนใหม่ได้โดยไม่ต้องแตะโค้ด UI · `pendingPart(state)` คืนช่วงถัดไปที่เงื่อนไข `when` ครบและ `after` ดูแล้ว
- `src/components/StoryScene.jsx`: ฉาก visual-novel (typewriter, อ่านออกเสียงเกาหลี, คำที่ได้เจอ) + `StoryBook` (เล่นซ้ำจาก Home ▸ 📖 เรื่องราว) · App เล่นอัตโนมัติเมื่อไม่มี notice ค้าง
- state `story.seen` + action `STORY_SEEN` (ได้ 🪙15 ครั้งแรกเท่านั้น) · ข้อความรองรับ `{name}`, `{pet}`, `{sound}`, `{soundRead}`
- Chapter 1: c1_intro (หลังสร้างตัวละคร) → c1_hatch (ไข่ฟัก) → c1_tale (ผูกพัน Lv.1, นิทาน 곶감)
- ไข่ตัวแรกเลือกได้ตอน Onboarding (`ONBOARD.species`, ทุกสายพันธุ์ฟรี) · สีไข่ต่อสายพันธุ์อยู่ใน `EGG_PAL` (pets.js) · c1_tale เป็นฟังก์ชัน `scenes(species)` ได้นิทานประจำสายพันธุ์
- ฉากหลังเรื่อง: `StoryBackdrop.jsx` (shop/room/night) · เรื่องเล่นก่อนป๊อปอัปแจ้งเตือนเสมอ · แถบเตือนเสียงย้ายขึ้นบนขณะดูเรื่อง (`body:has(.story)`)
- ตัวละครแยกเพศ: `avatarBase(gender)` (ฐานชาย/หญิง) · `fitToBody()` ตัดเสื้อที่ล้นลำตัวหญิง · `hipFit()` ขยายสะโพกกางเกง/กระโปรงหญิง · ทรงผมมี `g: m|f|any` (`hairFor`) · ไอเทมเฉพาะเพศใส่ `{ gender: 'm'|'f' }` ใน items.js (ใส่ข้ามเพศได้ มีป้าย ♂/♀)

## เสียงพากย์ในฉากเรื่อง
- `src/game/voices.js` → `playLine({who,text,gender,species})`: ผู้พูดแต่ละคนเสียงต่างกัน — narr/gran/me_f/me_m มีโปรไฟล์ (ระดับเสียง/ความเร็ว/ลำดับเสียงในเครื่อง) · pet ใช้เสียงร้องสังเคราะห์ `src/game/cry.js` (Web Audio ต่อสายพันธุ์) · ผู้เล่นใช้เสียงตามเพศตัวละคร
- เสียงสำเร็จรูป (Supertonic 2 — โอเพนซอร์ส ฟรี รันในเครื่อง): `npm run voice -- --run` → สร้าง `public/voice/*.m4a` + `manifest.json` (คีย์จาก `voiceKey.js`) · ครั้งแรกสร้าง `.voice-venv` + โหลดโมเดล ~260MB เอง · เสียงของตัวละครกำหนดที่ `VOICE_PROFILES[...].st` ใน `voices.js` (`'M3'` หรือผสม `'M1+F5@0.5'`) · เพิ่มตัวละครใหม่ = เพิ่มบรรทัดเดียว
- ถ้ามีไฟล์ เกมเล่นไฟล์ก่อน ไม่มีก็ถอยไปใช้ Web Speech · แก้บทพูดแล้วรัน `npm run voice -- --run --prune` (สร้างเฉพาะบรรทัดที่เปลี่ยน)
- สัญญาอนุญาตโมเดล OpenRAIL-M: ต้องแจ้งว่าเสียงสร้างด้วย AI (มีข้อความในตั้งค่าและสมุดเรื่องราวแล้ว — ห้ามลบ) · ห้ามใช้เลียนเสียงคนจริงโดยไม่ได้รับอนุญาต หรือใช้ผิดกฎหมาย/หลอกลวง
- ตัวอย่างเทียบเสียงอยู่ใน `voice-lab/` (ไม่ commit)

## Chapter 2 & ตัวเลือกในเรื่อง
- ฉากแบบมีตัวเลือก: `L(..., { options: [O(ko, read, th, R(who, ko, read, th), ok, vocab, give)] })` · `ok:false` = คู่สนทนาแก้ให้แล้วถามใหม่ (ฝึกฟัง/ตอบ) · `give: 'tteok'` = ได้อาหารตอนดูจบครั้งแรก (`STORY_SEEN.give`) · คำศัพท์ของตัวเลือกที่ถูกขึ้นในการ์ดสรุป
- ผู้พูดเพิ่ม: `vendor` (คุณป้าแม่ค้า) · ฉากหลังเพิ่ม: `market` · c2 ปลดล็อกเมื่อดู c1_tale แล้ว + เรียนครบ 3 บท
- `linesOf(scene)` ใช้ร่วมกับ `scripts/gen-voice.mjs` (ตอนนี้ 126 บรรทัด/1,554 ตัวอักษร)
- ฉากโจทย์ทดสอบ: ใส่ `quiz: true` ในฉากที่มี `options` → ซ่อนคำอ่าน/คำแปลของโจทย์และตัวเลือกไว้ (มีปุ่ม 💡 ขอคำใบ้) และสลับลำดับตัวเลือกทุกครั้ง · อย่าใส่คำตอบไว้ในตัวโจทย์ และควรมีบรรทัดคั่นระหว่างบทที่สอนกับโจทย์ที่ถาม
- เสียงครู (เนื้อหาบทเรียน + ข้อความเกาหลีทั่วแอป): `src/game/lessonVoice.js` (`speak`/`speakFor`/`speakSeq` — ใช้ import แทน tts.js ในคอมโพเนนต์) · ใช้ไฟล์ `teacher`/`teacher_slow` ใน manifest ถ้ามีครบ ไม่งั้นถอยไป Web Speech · ผู้เล่นเลือกแหล่งเสียงที่ ⚙ ตั้งค่า (`hb-tts.source` = ai | device)
- ครูผู้สอนมี 2 คน (`TEACHERS` ใน voices.js): ฮานา (F1) และมินจุน (M4) — เลือกที่ ⚙ ตั้งค่า (`hb-tts.teacher`) · เพิ่มครูใหม่ = เพิ่มโปรไฟล์ `<id>` + `<id>_slow` และใส่ใน `TEACHERS` แล้วรัน `npm run voice -- --run`
- ข้อความใหม่ที่ต้องมีเสียงครู: เพิ่มในรายการของ `scripts/gen-voice.mjs` (ตอนนี้ครอบคลุมบทเรียน/กิจวัตร/อาหาร/ไอเทม/คำสั่งสัตว์/ข้อความอารมณ์) แล้วรัน `npm run voice -- --run` · ความเร็ว Supertonic ต่ำสุด 0.7
- เกมประกอบพยางค์ที่สร้างพยางค์เอง (ถ้ามีข้อความนอกรายการ) จะถอยไปใช้เสียงในเครื่อง
