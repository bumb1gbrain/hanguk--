import { speak, speakFor } from '../game/lessonVoice.js'

export function Bar({ value, max = 100, color = 'var(--accent)', label, icon }) {
  const pct = Math.round((value / max) * 100)
  return (
    <div className="bar">
      {label && (
        <div className="bar-label">
          <span>{icon} {label}</span>
          <span className="mono">{Math.round(value)}{max === 100 ? '' : `/${max}`}</span>
        </div>
      )}
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

export function SpeakBtn({ text, small, item }) {
  return (
    <button
      className={`speak ${small ? 'small' : ''}`}
      onClick={(e) => { e.stopPropagation(); item ? speakFor(item) : speak(text) }}
      aria-label="ฟังเสียง"
    >
      🔊
    </button>
  )
}

export function Modal({ children, onClose }) {
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal pixel-box" onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  )
}

export function Coins({ n }) {
  return <span className="coins"><span className="coin" />{n}</span>
}
