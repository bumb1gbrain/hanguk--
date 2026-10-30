// คีย์ของเสียงพากย์สำเร็จรูป: ใช้ร่วมกันทั้งในเบราว์เซอร์และสคริปต์สร้างเสียง (scripts/gen-voice.mjs)
// speaker = narr | gran | me_m | me_f · text = ข้อความเกาหลีที่แทนค่าตัวแปรแล้ว
export function voiceKey(speaker, text) {
  const s = `${speaker}|${text}`
  let h1 = 0xdeadbeef
  let h2 = 0x41c6ce57
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i)
    h1 = Math.imul(h1 ^ c, 2654435761)
    h2 = Math.imul(h2 ^ c, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0')
}

// ข้อความที่ส่งไปอ่านจริง: ตัดเครื่องหมายที่ไม่ควรอ่านออก (ต้องใช้ฟังก์ชันเดียวกันทั้งตอนสร้างและตอนเล่น)
export const voiceText = (ko) => ko.replace(/[“”?!~…]/g, '').trim()
