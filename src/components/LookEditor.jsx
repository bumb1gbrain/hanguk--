import { SKIN_TONES, HAIR_COLORS, HAIR_STYLES, EYE_STYLES, GENDER_DEFAULTS } from '../pixel/sprites.js'

// ตัวแก้ไขหน้าตา: เพศ / สีผิว / ทรงผม / สีผม / ตา — ควบคุมจากภายนอก (look, onChange)
export default function LookEditor({ look, onChange }) {
  const set = (patch) => onChange({ ...look, ...patch })
  return (
    <div className="look-editor">
      <div className="look-row">
        <small>เพศ</small>
        <div className="look-opts">
          {[['m', '👦 ชาย'], ['f', '👧 หญิง']].map(([g, label]) => (
            <button
              key={g}
              className={`choice ${look.gender === g ? 'on' : ''}`}
              onClick={() => set({ gender: g, hair: GENDER_DEFAULTS[g].hair, eyes: GENDER_DEFAULTS[g].eyes })}
            >{label}</button>
          ))}
        </div>
      </div>
      <div className="look-row">
        <small>สีผิว</small>
        <div className="look-opts">
          {SKIN_TONES.map((t) => (
            <button key={t.id} aria-label={t.th} title={t.th} className={`swatch ${look.skin === t.id ? 'on' : ''}`} style={{ background: t.c }} onClick={() => set({ skin: t.id })} />
          ))}
        </div>
      </div>
      <div className="look-row">
        <small>ทรงผม</small>
        <div className="look-opts">
          {Object.entries(HAIR_STYLES).map(([id, h]) => (
            <button key={id} className={`choice ${look.hair === id ? 'on' : ''}`} onClick={() => set({ hair: id })}>{h.th}</button>
          ))}
        </div>
      </div>
      <div className="look-row">
        <small>สีผม</small>
        <div className="look-opts">
          {HAIR_COLORS.map((t) => (
            <button key={t.id} aria-label={t.th} title={t.th} className={`swatch ${look.hairColor === t.id ? 'on' : ''}`} style={{ background: t.c }} onClick={() => set({ hairColor: t.id })} />
          ))}
        </div>
      </div>
      <div className="look-row">
        <small>ดวงตา</small>
        <div className="look-opts">
          {Object.entries(EYE_STYLES).map(([id, e]) => (
            <button key={id} className={`choice ${look.eyes === id ? 'on' : ''}`} onClick={() => set({ eyes: id })}>{e.th}</button>
          ))}
        </div>
      </div>
    </div>
  )
}
