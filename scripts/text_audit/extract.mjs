globalThis.window = { speechSynthesis: { getVoices: () => [] } }
import fs from 'node:fs'
const R = '' + process.cwd() + '/src/'
const { LESSONS } = await import(R + 'data/lessons.js')
const { ROUTINE } = await import(R + 'data/routine.js')
const { FOODS, GEAR } = await import(R + 'data/shop.js')
const { QUESTS } = await import(R + 'data/quests.js').catch(() => ({}))
const quests = await import(R + 'data/quests.js')
const { ACHIEVEMENTS } = await import(R + 'data/achievements.js')
const { TRICKS } = await import(R + 'data/tricks.js')
const { MOOD_TEXT } = await import(R + 'game/logic.js')
const { SPECIES_LIST } = await import(R + 'pixel/pets.js')
const { ALL_PARTS } = await import(R + 'data/story.js')
const out = []
const add = (src, id, o) => out.push({ src, id, ko: o.ko || '', read: o.read || '', rom: o.rom || '', th: o.th || '', extra: o.extra || '' })
for (const l of LESSONS) {
  add('lesson-title', l.id, { ko: l.title, th: l.titleTh, extra: l.note || '' })
  for (const it of l.items) {
    add('lesson-' + it.kind, l.id, it)
    if (it.ex) add('lesson-example', l.id + ':' + it.ko, it.ex)
  }
}
for (const r of ROUTINE) add('routine', r.id, r)
for (const f of FOODS) add('food', f.id, f)
for (const g of GEAR) add('gear', g.id, g)
for (const q of Object.values(quests).flatMap((v) => (Array.isArray(v) ? v : []))) if (q.ko) add('quest', q.id, q)
for (const a of ACHIEVEMENTS) add('achievement', a.id, a)
for (const t of TRICKS) add('trick', t.id, t)
for (const [k, m] of Object.entries(MOOD_TEXT)) add('mood', k, m)
for (const s of SPECIES_LIST) { add('species', s.id, s); add('species-sound', s.id, { ko: s.sound.ko, read: s.sound.read, th: s.sound.th }) }
const seen = new Set()
for (const part of ALL_PARTS) for (const sp of SPECIES_LIST) {
  const scenes = typeof part.scenes === 'function' ? part.scenes(sp.id) : part.scenes
  scenes.forEach((sc, i) => {
    const fill = (t) => t.replaceAll('{pet}', sp.name).replaceAll('{sound}', sp.sound.ko).replaceAll('{soundRead}', sp.sound.read)
    const push = (kind, o) => { const key = kind + '|' + o.ko; if (seen.has(key)) return; seen.add(key); add('story-' + kind, part.id + '#' + i, { ko: fill(o.ko), read: fill(o.read || ''), th: fill(o.th || '') }) }
    push('line', sc)
    for (const v of sc.vocab || []) push('vocab', { ko: v.ko, th: v.th })
    for (const o of sc.options || []) { push('option', o); push('reply', o.reply); for (const v of o.vocab || []) push('vocab', { ko: v.ko, th: v.th }) }
  })
}
fs.writeFileSync(process.argv[2], out.map((o) => JSON.stringify(o)).join('\n'))
const counts = {}; out.forEach((o) => (counts[o.src] = (counts[o.src] || 0) + 1)); console.log(out.length, counts)
