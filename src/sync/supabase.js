// ตัวเชื่อม Supabase: โหลดไลบรารีแบบ lazy (เฉพาะเมื่อตั้งค่า env แล้ว) เพื่อไม่ให้เว็บหนักขึ้นสำหรับคนที่ไม่ใช้ซิงก์
// ใช้เฉพาะ Project URL + publishable (anon) key — ความปลอดภัยของข้อมูลอยู่ที่ Row Level Security ใน supabase/schema.sql
const URL = import.meta.env.VITE_SUPABASE_URL
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isConfigured = () => !!(URL && KEY)

let client = null
export async function getClient() {
  // ช่องทดสอบ (ใช้ได้เฉพาะตอน dev): ฉีด client ปลอมเข้ามาแทนของจริง
  if (import.meta.env.DEV && typeof window !== 'undefined' && window.__sbTest) return window.__sbTest
  if (!isConfigured()) return null
  if (!client) {
    const { createClient } = await import('@supabase/supabase-js')
    client = createClient(URL, KEY, {
      auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  }
  return client
}
