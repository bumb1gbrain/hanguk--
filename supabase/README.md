# ตั้งค่า Supabase (ซิงก์เซฟ + ล็อกอิน Google)

แอปทำงานได้ปกติโดยไม่ต้องตั้งค่าอะไรเลย (เซฟอยู่ในเบราว์เซอร์) การตั้งค่านี้ใช้ **เฉพาะ** เมื่ออยากให้ผู้เล่นล็อกอินและเล่นต่อข้ามเครื่องได้
ถ้าไม่ได้ใส่ตัวแปร `VITE_SUPABASE_*` ปุ่มล็อกอินจะไม่ขึ้น และโค้ดซิงก์จะไม่ถูกรวมเข้าเว็บเลย

## 1) สร้างโปรเจกต์ Supabase (ฟรี)
1. เข้า https://supabase.com ▸ Sign in (ใช้ GitHub ได้) ▸ **New project**
2. ตั้งชื่อ เช่น `hanguk-hyeong-bum` · Region เลือก **Southeast Asia (Singapore)** · ตั้ง Database password (เก็บไว้ในที่ปลอดภัย แอปนี้ไม่ได้ใช้รหัสนี้)
3. รอประมาณ 2 นาทีให้สร้างเสร็จ

## 2) สร้างตารางเก็บเซฟ
Dashboard ▸ **SQL Editor** ▸ New query ▸ วางเนื้อหาไฟล์ [`schema.sql`](./schema.sql) ทั้งหมด ▸ **Run**
(รันซ้ำได้ ไม่ทำให้ข้อมูลหาย) ตารางจะเปิด Row Level Security ให้ผู้ใช้เห็น/แก้ได้เฉพาะเซฟของตัวเอง

## 3) เปิดล็อกอิน Google
**3.1 สร้าง OAuth client ใน Google Cloud** (https://console.cloud.google.com)
1. สร้าง Project ใหม่ (หรือเลือกอันที่มี)
2. **APIs & Services ▸ OAuth consent screen**: User Type = **External** · ใส่ชื่อแอป, อีเมลติดต่อ · Scopes ใช้ค่าเริ่มต้น (`email`, `profile`, `openid`)
   - สถานะ **Testing**: เฉพาะอีเมลที่เพิ่มไว้ใน *Test users* เท่านั้นที่ล็อกอินได้ (สูงสุด 100 คน) เหมาะกับเพื่อนไม่กี่คน
   - หรือกด **Publish app** เพื่อให้ใครก็ล็อกอินได้ (ใช้แค่ scope พื้นฐาน ไม่ต้องผ่านการตรวจสอบ แต่อาจเห็นข้อความเตือน)
3. **Credentials ▸ Create credentials ▸ OAuth client ID** · Application type = **Web application**
   - **Authorized redirect URIs**: `https://<PROJECT-REF>.supabase.co/auth/v1/callback`
     (`<PROJECT-REF>` ดูได้จาก Project URL ของ Supabase เช่น `abcdxyz.supabase.co`)
4. คัดลอก **Client ID** และ **Client secret**

**3.2 ใส่ใน Supabase**
- **Authentication ▸ Providers ▸ Google** ▸ เปิด Enable ▸ วาง Client ID / Client secret ▸ Save
- **Authentication ▸ URL Configuration**
  - **Site URL**: `https://hanguk-five.vercel.app`
  - **Redirect URLs** (เพิ่มทั้งสองบรรทัด):
    - `https://hanguk-five.vercel.app/**`
    - `http://localhost:5173/**`

## 4) ใส่ค่าให้แอป
เอาค่าจาก **Project Settings ▸ API**: `Project URL` และ `anon` / `publishable` key
(**ห้ามใช้ `service_role` / secret key** — key นั้นข้ามการป้องกันข้อมูลได้ทั้งหมด และห้ามแชร์ในแชทหรือ commit ลง git)

- **บนเว็บจริง (Vercel)**: Project ▸ Settings ▸ Environment Variables ▸ เพิ่ม
  - `VITE_SUPABASE_URL` = Project URL
  - `VITE_SUPABASE_ANON_KEY` = publishable (anon) key
  จากนั้น **Redeploy** (ตัวแปรกลุ่ม `VITE_*` ถูกฝังตอน build ต้อง deploy ใหม่ถึงมีผล)
- **รันในเครื่อง**: คัดลอก `.env.example` เป็น `.env.local` แล้วใส่ค่า (ไฟล์นี้ถูก git ignore ไว้แล้ว)

## 5) ทดสอบ
เปิดเว็บ ▸ ⚙ ตั้งค่า ▸ **เข้าสู่ระบบด้วย Google** · ล็อกอินแล้วควรเห็นอีเมลและ "✓ ซิงก์แล้ว" ·
ตรวจใน Supabase ▸ Table Editor ▸ `saves` ควรมีแถวของคุณ · ลองเปิดบนอีกเครื่อง/เบราว์เซอร์แล้วล็อกอินบัญชีเดียวกัน ควรได้ความคืบหน้าเดิม

## วิธีที่ซิงก์ทำงาน (สั้น ๆ)
- เซฟในเครื่อง (`localStorage`) ยังเป็นที่เก็บหลัก เล่นออฟไลน์ได้ ซิงก์เมื่อมีเน็ต
- หลังเปลี่ยนความคืบหน้า ~4 วินาที (หรือเมื่อปิด/ซ่อนหน้าจอ) แอปอัปโหลดเซฟขึ้น `saves` (หนึ่งแถวต่อผู้ใช้)
- เปิดแอป/กลับมาที่แอป: ดึงจากคลาวด์มาเทียบ ถ้าคลาวด์ใหม่กว่าและเครื่องนี้ไม่ได้แก้ → ใช้ของคลาวด์ ถ้าเครื่องนี้แก้และคลาวด์ไม่เปลี่ยน → อัปโหลด
- ถ้าแก้ทั้งสองฝั่ง หรือเป็นเครื่อง/บัญชีใหม่ที่มีความคืบหน้าอยู่แล้ว → ถามผู้เล่นให้เลือก **ไม่เขียนทับเงียบ ๆ**
- การอัปโหลดมีเงื่อนไขกันเขียนทับ (`client_ts` ต้องเท่ากับเวอร์ชันที่เห็นล่าสุด) ดังนั้นสองเครื่องแก้พร้อมกันจะไม่มีใครทับของอีกคนโดยไม่รู้ตัว

## ข้อจำกัดที่ควรรู้
- ตรรกะรางวัลทั้งหมดอยู่ฝั่งเบราว์เซอร์ ผู้ใช้ที่ตั้งใจแก้ข้อมูลของตัวเองยังทำได้ (ไม่มีผลกับคนอื่น เพราะ RLS จำกัดแต่ละคนเข้าถึงแถวของตัวเอง)
- ยังไม่มีอันดับ/เพื่อน (ต้องออกแบบฝั่งเซิร์ฟเวอร์เพิ่ม)
- iPhone: ถ้าติดตั้งแอปลงหน้าจอหลัก (PWA) ที่เก็บข้อมูลจะแยกจาก Safari การล็อกอิน Google ผ่าน redirect ในโหมดนั้นควรทดสอบให้แน่ใจ ถ้ามีปัญหาให้ล็อกอินในโหมด Safari ปกติ
