import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useGame, hydrate } from '../game/store.jsx'
import { Modal } from '../components/ui.jsx'
import { isConfigured, getClient } from './supabase.js'
import { readMeta, writeMeta, syncKey, summarize, decide } from './syncCore.js'

// ซิงก์เซฟกับ Supabase: ล็อกอินด้วย Google → เซฟอยู่ในตาราง saves (หนึ่งแถวต่อผู้ใช้, RLS)
// - เล่นออฟไลน์ได้ตามปกติ: localStorage ยังเป็นที่เก็บหลัก คลาวด์คือการสำรอง/ซิงก์ข้ามเครื่อง
// - ถ้าเซฟต่างกันทั้งสองฝั่ง จะให้ผู้เล่นเลือกเสมอ ไม่เขียนทับเงียบ ๆ
const Ctx = createContext({ configured: false })
export const useSync = () => useContext(Ctx)

const UPLOAD_DELAY = 4000

const fmtDate = (ts) => (ts ? new Date(ts).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' }) : '—')
const levelOf = (xp) => { let L = 1; let rest = xp; while (rest >= 60 + 25 * (L - 1)) { rest -= 60 + 25 * (L - 1); L++ } return L }

function SaveCard({ title, sum, note }) {
  return (
    <div className="save-card pixel-box">
      <b>{title}</b>
      <div className="ko">{sum.name} · Lv.{levelOf(sum.xp)}</div>
      <small>XP {sum.xp} · 🪙 {sum.coins} · 🔥 {sum.streak} วัน · ไอเทม {sum.items} · คำศัพท์ {sum.words}</small>
      <small className="muted">{note}</small>
    </div>
  )
}

export function SyncProvider({ children }) {
  const { state, dispatch } = useGame()
  const [configured, setConfigured] = useState(isConfigured())
  const [client, setClient] = useState(null)
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false) // ดึง/เทียบกับคลาวด์ครั้งแรกเสร็จแล้ว (ก่อนหน้านั้นห้ามอัปโหลด)
  const [status, setStatus] = useState('idle') // idle | syncing | error | offline | paused
  const [error, setError] = useState(null)
  const [lastSync, setLastSync] = useState(null)
  const [conflict, setConflict] = useState(null)
  const stateRef = useRef(state)
  stateRef.current = state
  const userRef = useRef(null)
  userRef.current = user
  const clientRef = useRef(null)
  const busy = useRef(false)
  const again = useRef(false)
  const timer = useRef(null)

  // ช่องทดสอบสำหรับ dev: ฉีด client ปลอมเข้ามา
  useEffect(() => {
    if (!import.meta.env.DEV) return
    window.__syncAttach = (c) => { window.__sbTest = c; setConfigured(true) }
  }, [])

  // เริ่ม client + ฟังสถานะล็อกอิน
  useEffect(() => {
    if (!configured) return undefined
    let alive = true
    let sub
    ;(async () => {
      const c = await getClient()
      if (!alive || !c) return
      clientRef.current = c
      setClient(c)
      const { data } = await c.auth.getSession()
      if (alive) setUser(data?.session?.user ?? null)
      sub = c.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null))?.data?.subscription
    })()
    return () => { alive = false; sub?.unsubscribe?.() }
  }, [configured])

  const fail = useCallback((e) => {
    setError(e?.message || String(e))
    setStatus(typeof navigator !== 'undefined' && navigator.onLine === false ? 'offline' : 'error')
  }, [])

  const applyCloud = useCallback((row) => {
    const u = userRef.current
    writeMeta({ uid: u.id, localTs: row.client_ts, syncedTs: row.client_ts, lastKey: syncKey(hydrate(row.data)) })
    dispatch({ type: 'REPLACE', data: row.data })
    setLastSync(Date.now())
    setStatus('idle')
    setError(null)
  }, [dispatch])

  const upload = useCallback(async () => {
    const c = clientRef.current
    const u = userRef.current
    if (!c || !u) return
    if (busy.current) { again.current = true; return }
    busy.current = true
    setStatus('syncing')
    try {
      const meta = readMeta()
      const { notices, ...data } = stateRef.current
      const ts = meta.localTs || Date.now()
      let ok
      if (meta.uid === u.id && meta.syncedTs > 0) {
        // อัปเดตเฉพาะเมื่อคลาวด์ยังเป็นเวอร์ชันที่เราเห็นล่าสุด (กันเขียนทับเซฟที่อีกเครื่องเพิ่งส่งมา)
        const { data: rows, error: err } = await c.from('saves').update({ data, client_ts: ts }).eq('user_id', u.id).eq('client_ts', meta.syncedTs).select('client_ts')
        if (err) throw err
        ok = rows.length === 1
      } else {
        const { error: err } = await c.from('saves').insert({ user_id: u.id, data, client_ts: ts })
        if (err && err.code !== '23505') throw err
        ok = !err
      }
      if (ok) {
        writeMeta({ ...readMeta(), uid: u.id, syncedTs: ts })
        setLastSync(Date.now())
        setStatus('idle')
        setError(null)
      } else {
        busy.current = false
        await pull() // คลาวด์เปลี่ยนไปแล้ว: เทียบใหม่ (อาจเกิด conflict)
      }
    } catch (e) {
      fail(e)
    } finally {
      busy.current = false
      if (again.current) { again.current = false; schedule(500) }
    }
    // eslint-disable-next-line
  }, [fail])

  const schedule = useCallback((ms = UPLOAD_DELAY) => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => upload(), ms)
  }, [upload])

  const pull = useCallback(async () => {
    const c = clientRef.current
    const u = userRef.current
    if (!c || !u) return
    setStatus('syncing')
    try {
      const { data: row, error: err } = await c.from('saves').select('data, client_ts, updated_at').eq('user_id', u.id).maybeSingle()
      if (err) throw err
      const meta = readMeta()
      const local = stateRef.current
      const act = decide({ hasRow: !!row, rowTs: row?.client_ts, localOnboarded: !!local.onboarded, meta, uid: u.id })
      if (act === 'apply-cloud') applyCloud(row)
      else if (act === 'upload' || act === 'upload-new') await upload()
      else if (act === 'conflict') {
        setConflict({ row, cloud: summarize(hydrate(row.data), row.client_ts), local: summarize(local, meta.localTs) })
        setStatus('paused')
      } else { setStatus('idle'); setLastSync(Date.now()) }
    } catch (e) {
      fail(e)
    }
  }, [applyCloud, upload, fail])

  // ล็อกอินแล้ว (หรือเปิดแอปด้วยเซสชันเดิม): เทียบกับคลาวด์ก่อน แล้วค่อยเปิดให้อัปโหลดอัตโนมัติ
  useEffect(() => {
    if (!client || !user) { setReady(false); return undefined }
    let alive = true
    pull().finally(() => { if (alive) setReady(true) })
    return () => { alive = false }
    // eslint-disable-next-line
  }, [client, user?.id])

  // ติดตามการเปลี่ยนแปลงของเซฟในเครื่อง → ตั้งเวลาอัปโหลด
  useEffect(() => {
    if (!configured) return
    const key = syncKey(state)
    const meta = readMeta()
    if (meta.lastKey !== key) {
      // ตัวนับเวอร์ชันต้องเพิ่มขึ้นเสมอต่อจากเวอร์ชันที่ซิงก์ล่าสุด แม้นาฬิกาในเครื่องจะเดินช้ากว่าเครื่องอื่น
      // (ไม่งั้นการแก้บนเครื่องนี้อาจถูกมองว่า "ไม่ใหม่กว่า" แล้วโดนเซฟคลาวด์ทับเงียบ ๆ)
      writeMeta({ ...meta, lastKey: key, localTs: Math.max(Date.now(), (meta.syncedTs || 0) + 1) })
      if (ready && user && !conflict) schedule()
    }
  }, [state, configured, ready, user, conflict, schedule])

  // กลับมาเปิดแอป / ได้เน็ตคืน: ซิงก์ใหม่ · ปิดหน้าจอ: ส่งของที่ค้างทันที
  useEffect(() => {
    if (!configured) return undefined
    const vis = () => {
      if (!userRef.current || !ready) return
      if (document.visibilityState === 'visible') pull()
      else if (readMeta().localTs > (readMeta().syncedTs || 0)) { clearTimeout(timer.current); upload() }
    }
    const online = () => userRef.current && ready && pull()
    document.addEventListener('visibilitychange', vis)
    window.addEventListener('online', online)
    return () => { document.removeEventListener('visibilitychange', vis); window.removeEventListener('online', online) }
  }, [configured, ready, pull, upload])

  const signIn = useCallback(async () => {
    const c = clientRef.current
    if (!c) return
    setError(null)
    const { error: err } = await c.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + window.location.pathname } })
    if (err) fail(err)
  }, [fail])

  const signOut = useCallback(async () => {
    clearTimeout(timer.current)
    await clientRef.current?.auth.signOut()
    setUser(null)
    setStatus('idle')
    setConflict(null)
  }, [])

  const resolveConflict = useCallback(async (choice) => {
    const row = conflict?.row
    setConflict(null)
    if (!row) return
    if (choice === 'cloud') applyCloud(row)
    else if (choice === 'local') {
      // ใช้เซฟเครื่องนี้ทับคลาวด์: รับรู้เวอร์ชันของคลาวด์ก่อน แล้วอัปโหลดให้ใหม่กว่า
      const m = readMeta()
      writeMeta({ ...m, uid: userRef.current.id, syncedTs: row.client_ts, localTs: Math.max(m.localTs || 0, row.client_ts) + 1 })
      await upload()
    } else setStatus('paused') // ตัดสินใจทีหลัง: ไม่ซิงก์จนกว่าจะกด "ซิงก์ตอนนี้"
  }, [conflict, applyCloud, upload])

  const value = { configured, user, status, error, lastSync, conflict: !!conflict, signIn, signOut, syncNow: pull }

  return (
    <Ctx.Provider value={value}>
      {children}
      {conflict && (
        <Modal onClose={() => {}}>
          <h3>☁ พบเซฟสองที่ที่ไม่เหมือนกัน</h3>
          <p className="muted small">เลือกเซฟที่จะใช้ต่อ — อีกอันจะถูกแทนที่ (ตัดสินใจแล้วย้อนกลับไม่ได้)</p>
          <SaveCard title="☁ บนคลาวด์ (บัญชีของคุณ)" sum={conflict.cloud} note={`แก้ไขล่าสุด ${fmtDate(conflict.cloud.ts)}`} />
          <SaveCard title="📱 ในเครื่องนี้" sum={conflict.local} note={conflict.local.onboarded ? `แก้ไขล่าสุด ${fmtDate(conflict.local.ts)}` : 'ยังไม่ได้เริ่มเล่น'} />
          <div className="col gap conflict-actions">
            <button className="pixel-btn primary" onClick={() => resolveConflict('cloud')}>ใช้เซฟบนคลาวด์</button>
            <button className="pixel-btn" onClick={() => resolveConflict('local')}>ใช้เซฟเครื่องนี้ (ทับคลาวด์)</button>
            <button className="link" onClick={() => resolveConflict('later')}>ตัดสินใจทีหลัง</button>
          </div>
        </Modal>
      )}
    </Ctx.Provider>
  )
}
