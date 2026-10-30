import { useEffect } from 'react'
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

// closable = มีปุ่ม ✕ ลอยมุมขวาบน (ไม่เลื่อนหายตอนเนื้อหายาว) และกด Esc ปิดได้ · ล็อกการเลื่อนของหน้าด้านหลังระหว่างเปิด
export function Modal({ children, onClose, closable = false }) {
  useEffect(() => {
    document.body.classList.add('modal-open')
    const onKey = (e) => { if (closable && e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => { document.body.classList.remove('modal-open'); window.removeEventListener('keydown', onKey) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal pixel-box" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        {closable && <button className="modal-x" onClick={onClose} aria-label="ปิด">✕</button>}
        {children}
      </div>
    </div>
  )
}

export function Coins({ n }) {
  return <span className="coins"><span className="coin" />{n}</span>
}
