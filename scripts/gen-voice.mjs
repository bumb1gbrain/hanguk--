// สร้างเสียงพากย์สำเร็จรูปของฉากเรื่องราวด้วย Azure AI Speech (เสียงประสาทเกาหลี) → public/voice/*.mp3 + manifest.json
// ใช้: AZURE_SPEECH_KEY=... AZURE_SPEECH_REGION=koreacentral node scripts/gen-voice.mjs --run   (ไม่ใส่ --run = แค่นับจำนวน/ตัวอักษร ไม่เสียเงิน)
// ข้ามบรรทัดที่มีไฟล์อยู่แล้ว · เปลี่ยนบทพูด/เสียง → รันซ้ำเพื่อสร้างเฉพาะที่ขาด (ลบไฟล์เก่าที่ไม่ใช้แล้วด้วย --prune)
import fs from 'node:fs'
import path from 'node:path'
import { ALL_PARTS } from '../src/data/story.js'
import { SPECIES_LIST } from '../src/pixel/pets.js'
import { VOICE_PROFILES } from '../src/game/voices.js'
import { voiceKey, voiceText } from '../src/game/voiceKey.js'

const OUT = path.resolve('public/voice')
const PROSODY = { narr: { rate: '-5%', pitch: '-2%' }, gran: { rate: '-18%', pitch: '-8%' }, me_f: { rate: '0%', pitch: '0%' }, me_m: { rate: '0%', pitch: '0%' } }
const run = process.argv.includes('--run')
const prune = process.argv.includes('--prune')

const fill = (t, sp) => t.replaceAll('{pet}', sp.name).replaceAll('{sound}', sp.sound.ko)
const jobs = new Map() // key → { speaker, text }
for (const part of ALL_PARTS) {
  for (const sp of SPECIES_LIST) {
    const scenes = typeof part.scenes === 'function' ? part.scenes(sp.id) : part.scenes
    for (const sc of scenes) {
      if (sc.who === 'pet') continue // เสียงสัตว์เลี้ยงใช้เสียงร้องสังเคราะห์
      if (sc.ko.includes('{name}')) { console.warn('ข้าม (มีชื่อผู้เล่น):', sc.ko); continue }
      const text = voiceText(fill(sc.ko, sp))
      for (const speaker of sc.who === 'me' ? ['me_f', 'me_m'] : [sc.who]) jobs.set(voiceKey(speaker, text), { speaker, text })
    }
  }
}
const chars = [...jobs.values()].reduce((n, j) => n + j.text.length, 0)
console.log(`บรรทัดเสียง ${jobs.size} ไฟล์ · ${chars} ตัวอักษร (ฟรี 500,000 ตัวอักษร/เดือน ของ Azure F0 — ตรวจเงื่อนไขล่าสุดที่หน้า pricing)`)
if (!run) { console.log('ยังไม่ได้สร้าง (เพิ่ม --run เพื่อสร้างจริง)'); process.exit(0) }

const { AZURE_SPEECH_KEY: key, AZURE_SPEECH_REGION: region } = process.env
if (!key || !region) { console.error('ต้องตั้ง AZURE_SPEECH_KEY และ AZURE_SPEECH_REGION'); process.exit(1) }
fs.mkdirSync(OUT, { recursive: true })
const manifestPath = path.join(OUT, 'manifest.json')
const manifest = {}
const esc = (s) => s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c])

for (const [k, { speaker, text }] of jobs) {
  const file = `${k}.mp3`
  const dest = path.join(OUT, file)
  if (!fs.existsSync(dest)) {
    const p = PROSODY[speaker]
    const ssml = `<speak version="1.0" xml:lang="ko-KR"><voice name="${VOICE_PROFILES[speaker].azure}"><prosody rate="${p.rate}" pitch="${p.pitch}">${esc(text)}</prosody></voice></speak>`
    const res = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: 'POST',
      headers: { 'Ocp-Apim-Subscription-Key': key, 'Content-Type': 'application/ssml+xml', 'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3', 'User-Agent': 'hanguk-gen-voice' },
      body: ssml,
    })
    if (!res.ok) { console.error('ล้มเหลว', res.status, text); process.exit(1) }
    fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()))
    console.log('สร้าง', speaker, text)
  }
  manifest[k] = `/voice/${file}`
}
if (prune) for (const f of fs.readdirSync(OUT)) if (f.endsWith('.mp3') && !manifest[f.slice(0, -4)]) { fs.unlinkSync(path.join(OUT, f)); console.log('ลบ', f) }
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 1))
console.log('manifest', Object.keys(manifest).length, 'รายการ')
