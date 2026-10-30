// ตรรกะล้วนของการซิงก์เซฟ (ไม่แตะ React/เครือข่าย) เพื่อให้ทดสอบได้ง่าย
//
// แนวคิด: ทุกเซฟมี "client_ts" = เวลาที่ถูกแก้ล่าสุดบนเครื่องผู้เล่น
//   meta.localTs  = "เวอร์ชัน" ที่เครื่องนี้แก้เซฟล่าสุด (ส่วนใหญ่เท่าเวลา ms แต่บังคับให้มากกว่า syncedTs เสมอ จึงไม่พึ่งพานาฬิกาที่ตรงกันของหลายเครื่อง)
//   meta.syncedTs = client_ts ของเซฟบนคลาวด์ ณ ครั้งสุดท้ายที่ซิงก์สำเร็จ
//   เครื่องนี้ "สกปรก" (dirty) เมื่อ localTs > syncedTs · คลาวด์ "ใหม่กว่า" เมื่อ client_ts ของคลาวด์ > syncedTs
export const META_KEY = 'hyeongbum-sync-v1'

export function readMeta() {
  try { return JSON.parse(localStorage.getItem(META_KEY)) || {} } catch { return {} }
}
export function writeMeta(meta) {
  try { localStorage.setItem(META_KEY, JSON.stringify(meta)) } catch { /* ignore */ }
}

// กุญแจเปรียบเทียบ "มีการเปลี่ยนแปลงที่ควรซิงก์ไหม": ตัดค่าที่เปลี่ยนเองตามเวลา (ความหิว/อารมณ์ ฯลฯ) และข้อความแจ้งเตือนออก
// เพื่อไม่ให้อัปโหลดทุกนาทีที่เปิดแอปทิ้งไว้ (ค่าพวกนี้จะถูกส่งไปพร้อมการเปลี่ยนแปลงครั้งถัดไป)
export function syncKey(state) {
  const { notices, ...rest } = state
  const pet = { ...rest.pet }
  for (const k of ['lastTick', 'full', 'happy', 'energy', 'clean']) delete pet[k]
  return JSON.stringify({ ...rest, pet })
}

// สรุปเซฟให้ผู้เล่นดูเวลาต้องเลือกว่าจะใช้อันไหน
export function summarize(state, ts) {
  return {
    name: state.player?.name || '—',
    xp: state.player?.xp || 0,
    coins: state.player?.coins || 0,
    streak: state.streak?.count || 0,
    items: state.player?.owned?.length || 0,
    words: Object.keys(state.srs || {}).length,
    onboarded: !!state.onboarded,
    ts: ts || null,
  }
}

// ตัดสินใจว่าต้องทำอะไรเมื่อเทียบเซฟในเครื่องกับบนคลาวด์
// คืนค่า: 'none' | 'upload-new' | 'upload' | 'apply-cloud' | 'conflict'
export function decide({ hasRow, rowTs, localOnboarded, meta, uid }) {
  if (!hasRow) return localOnboarded ? 'upload-new' : 'none'
  const linked = meta.uid === uid
  if (!linked) {
    // เครื่อง/เบราว์เซอร์นี้ยังไม่เคยผูกกับบัญชีนี้: ถ้าไม่มีความคืบหน้าในเครื่องก็ดึงจากคลาวด์เลย
    // แต่ถ้ามีทั้งสองฝั่ง ต้องให้ผู้เล่นเลือก (ห้ามเขียนทับเงียบ ๆ)
    return localOnboarded ? 'conflict' : 'apply-cloud'
  }
  const syncedTs = meta.syncedTs || 0
  const dirty = (meta.localTs || 0) > syncedTs
  const cloudNewer = (rowTs || 0) > syncedTs
  if (dirty && cloudNewer) return 'conflict'
  if (dirty) return 'upload'
  if (cloudNewer) return 'apply-cloud'
  return 'none'
}
