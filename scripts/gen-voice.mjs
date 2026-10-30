// สร้างเสียงพากย์สำเร็จรูปของฉากเรื่องราวด้วย Supertonic 2 (โอเพนซอร์ส รันในเครื่อง ฟรี ไม่ต้องสมัคร) → public/voice/*.m4a + manifest.json
// ใช้: npm run voice            (นับจำนวนบรรทัด ไม่สร้าง)
//      npm run voice -- --run   (สร้างเฉพาะบรรทัดที่ยังไม่มีไฟล์) · เพิ่ม --prune เพื่อลบไฟล์ที่ไม่ใช้แล้ว · --force = สร้างใหม่ทั้งหมด
// ครั้งแรกจะสร้าง .voice-venv และติดตั้ง supertonic ให้เอง (ต้องมี python3) แล้วโหลดโมเดลครั้งเดียว ~260MB
// เสียงของแต่ละตัวละครกำหนดที่ VOICE_PROFILES[...].st ใน src/game/voices.js
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { ALL_PARTS, linesOf } from '../src/data/story.js'
import { SPECIES_LIST } from '../src/pixel/pets.js'
import { VOICE_PROFILES, TEACHERS } from '../src/game/voices.js'
import { voiceKey, voiceText } from '../src/game/voiceKey.js'
import { ALL_ITEMS } from '../src/data/lessons.js'
import { ROUTINE } from '../src/data/routine.js'
import { FOODS, GEAR } from '../src/data/shop.js'
import { TRICKS } from '../src/data/tricks.js'
import { MOOD_TEXT } from '../src/game/logic.js'

const OUT = path.resolve('public/voice')
const VENV = path.resolve('.voice-venv')
const PY = path.join(VENV, 'bin', 'python')
const run = process.argv.includes('--run')
const prune = process.argv.includes('--prune')
const onlyArg = process.argv.find((a) => a.startsWith('--only='))?.split('=')[1]?.split(',') // จำกัดเฉพาะ speaker เหล่านี้ เช่น --only=narr,gran
const resume = process.argv.includes('--resume') // เก็บงานระหว่างทางไว้ที่ .voice-staging แล้วรันซ้ำคำสั่งเดิมเพื่อทำต่อจากจุดที่ค้าง (ใช้กับงานยาว ๆ เช่น --force)
const force = process.argv.includes('--force') // สร้างใหม่ทุกไฟล์ (เช่น หลังปรับการคัดเทค/ความดัง)

const fill = (t, sp) => t.replaceAll('{pet}', sp.name).replaceAll('{sound}', sp.sound.ko)
const jobs = new Map() // key → { speaker, text }
for (const part of ALL_PARTS) {
  for (const sp of SPECIES_LIST) {
    const scenes = typeof part.scenes === 'function' ? part.scenes(sp.id) : part.scenes
    for (const sc of scenes) {
      for (const ln of linesOf(sc)) { // รวมตัวเลือก (พูดด้วยเสียงผู้เล่น) และคำตอบของคู่สนทนา
        if (ln.who === 'pet') continue // เสียงสัตว์เลี้ยงใช้เสียงร้องสังเคราะห์
        if (ln.ko.includes('{name}')) { console.warn('ข้าม (มีชื่อผู้เล่น):', ln.ko); continue }
        const text = voiceText(fill(ln.ko, sp))
        for (const speaker of ln.who === 'me' ? ['me_f', 'me_m'] : [ln.who]) {
          if (!VOICE_PROFILES[speaker]?.st) { console.error('ยังไม่ได้กำหนดเสียงของ', speaker); process.exit(1) }
          jobs.set(voiceKey(speaker, text), { speaker, text })
        }
      }
    }
  }
}
// ── เสียงครู: เนื้อหาบทเรียนและข้อความภาษาเกาหลีที่แอปอ่านออกเสียง (ปกติ + ช้า สำหรับบทเรียน) ──
const addJob = (speaker, text, extra = {}) => {
  const t = voiceText(text)
  if (!t) return
  jobs.set(voiceKey(speaker, t), { speaker, text: t, single: /^[가-힣]$/.test(t), ...extra })
}
const lessonTexts = new Set()
for (const it of ALL_ITEMS) {
  lessonTexts.add(it.speak || it.ko)
  if (it.kind === 'letter') { // ตัวอักษรเล่นเป็นชุด: ชื่อ → พยางค์ → คำตัวอย่าง
    const name = /\(([^)]+)\)/.exec(it.th || '')?.[1]
    if (name) lessonTexts.add(name)
    if (it.ex) lessonTexts.add(it.ex.ko)
  }
}
for (const r of ROUTINE) lessonTexts.add(r.ko)
for (const t of lessonTexts) for (const { speaker } of Object.values(TEACHERS)) { addJob(speaker, t); addJob(`${speaker}_slow`, t) }
const otherTexts = new Set([...FOODS.map((f) => f.ko), ...GEAR.map((g) => g.ko), ...TRICKS.map((t) => t.ko), ...Object.values(MOOD_TEXT).map((m) => m.ko), '행복해요', '사랑해', '스트릭 보호'])
for (const t of otherTexts) for (const { speaker } of Object.values(TEACHERS)) addJob(speaker, t, { takes: 5 })

// คำศัพท์ในหน้าสรุปหลังจบฉาก (ปุ่ม 🔊 ใช้เสียงครู) — เฉพาะความเร็วปกติ
const storyVocab = new Set()
for (const part of ALL_PARTS) for (const sp of SPECIES_LIST) {
  const scenes = typeof part.scenes === 'function' ? part.scenes(sp.id) : part.scenes
  for (const sc of scenes) for (const v of [...(sc.vocab || []), ...(sc.options || []).flatMap((o) => o.vocab || [])]) if (!v.ko.includes('{')) storyVocab.add(v.ko)
}
for (const t of storyVocab) for (const { speaker } of Object.values(TEACHERS)) addJob(speaker, t)

const chars = [...jobs.values()].reduce((n, j) => n + j.text.length, 0)
console.log(`บรรทัดเสียง ${jobs.size} ไฟล์ · ${chars} ตัวอักษร`)
const dump = process.argv.find((a) => a.startsWith('--dump-jobs='))?.split('=')[1] // ส่งรายการ {คีย์: {speaker, text}} ให้สคริปต์ตรวจเสียง
if (dump) fs.writeFileSync(dump, JSON.stringify(Object.fromEntries(jobs)))
if (!run) { console.log('ยังไม่ได้สร้าง (เพิ่ม --run เพื่อสร้างจริง)'); process.exit(0) }

const sh = (cmd, args, opts = {}) => {
  const r = spawnSync(cmd, args, { stdio: 'inherit', ...opts })
  if (r.status !== 0) { console.error('คำสั่งล้มเหลว:', cmd, args.join(' ')); process.exit(1) }
}
if (!fs.existsSync(PY)) {
  console.log('สร้างสภาพแวดล้อม Python (ครั้งแรกเท่านั้น)…')
  sh('python3', ['-m', 'venv', VENV])
  sh(PY, ['-m', 'pip', 'install', '-q', 'supertonic'])
}

fs.mkdirSync(OUT, { recursive: true })
const hasAac = spawnSync('afconvert', ['-h'], { stdio: 'ignore' }).error == null // macOS: บีบอัดเป็น m4a ให้ไฟล์เล็ก
const ext = hasAac ? 'm4a' : 'wav'
const todo = [...jobs].filter(([k, j]) => (!onlyArg || onlyArg.includes(j.speaker)) && (force || !fs.existsSync(path.join(OUT, `${k}.${ext}`))))
console.log(`ต้องสร้างใหม่ ${todo.length} บรรทัด (มีอยู่แล้ว ${jobs.size - todo.length})`)

if (todo.length) {
  const tmp = resume ? path.resolve('.voice-staging') : fs.mkdtempSync(path.join(os.tmpdir(), 'hb-voice-'))
  fs.mkdirSync(tmp, { recursive: true })
  const list = todo.map(([key, j]) => ({ key, speaker: j.speaker, text: j.text, voice: VOICE_PROFILES[j.speaker].st.voice, speed: VOICE_PROFILES[j.speaker].st.speed, single: !!j.single, takes: j.takes }))
  fs.writeFileSync(path.join(tmp, 'jobs.json'), JSON.stringify(list))
  sh(PY, [path.resolve('scripts/supertonic_synth.py'), path.join(tmp, 'jobs.json'), tmp, ...(resume ? ['--resume'] : [])])
  for (const { key } of list) {
    const wav = path.join(tmp, `${key}.wav`)
    if (hasAac) sh('afconvert', ['-f', 'm4af', '-d', 'aac', '-b', '56000', wav, path.join(OUT, `${key}.m4a`)])
    else fs.copyFileSync(wav, path.join(OUT, `${key}.wav`))
  }
  const rp = path.join(tmp, '_report.json') // รายงานความครบของแต่ละไฟล์ (Whisper) รวมเก็บไว้ที่ voice-lab/
  if (fs.existsSync(rp)) {
    fs.mkdirSync('voice-lab', { recursive: true })
    const dst = path.resolve('voice-lab/voice_report.json')
    const old = fs.existsSync(dst) ? JSON.parse(fs.readFileSync(dst, 'utf8')) : {}
    fs.writeFileSync(dst, JSON.stringify({ ...old, ...JSON.parse(fs.readFileSync(rp, 'utf8')) }, null, 1))
  }
  fs.rmSync(tmp, { recursive: true, force: true })
}

const manifest = Object.fromEntries([...jobs.keys()].map((k) => [k, `/voice/${k}.${ext}`]))
if (prune) for (const f of fs.readdirSync(OUT)) if (/\.(m4a|wav)$/.test(f) && !manifest[f.replace(/\.\w+$/, '')]) { fs.unlinkSync(path.join(OUT, f)); console.log('ลบ', f) }
fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 1))
console.log('manifest', Object.keys(manifest).length, 'รายการ → public/voice/')
