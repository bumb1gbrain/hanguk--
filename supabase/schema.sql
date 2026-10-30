-- 형범 · ตารางเก็บเซฟของผู้เล่น (หนึ่งแถวต่อหนึ่งบัญชี)
-- วิธีใช้: Supabase Dashboard ▸ SQL Editor ▸ New query ▸ วางทั้งไฟล์นี้ ▸ Run (รันซ้ำได้ ไม่ทำให้ข้อมูลหาย)

create table if not exists public.saves (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb  not null,                 -- เซฟทั้งก้อน (ไม่รวมข้อความแจ้งเตือนชั่วคราว)
  client_ts  bigint not null default 0,       -- เวลา (ms) ที่เซฟนี้ถูกแก้ล่าสุดบนเครื่องผู้เล่น ใช้ตัดสินว่าอันไหนใหม่กว่า
  updated_at timestamptz not null default now(),
  constraint saves_data_size check (pg_column_size(data) < 200000)  -- กันข้อมูลใหญ่ผิดปกติ (เซฟจริงราว 2–10 KB)
);

-- เปิด Row Level Security: ผู้ใช้เห็น/แก้ได้เฉพาะแถวของตัวเอง (anon key ฝั่งเว็บจึงไม่มีทางอ่านเซฟคนอื่น)
alter table public.saves enable row level security;

drop policy if exists "saves: read own"   on public.saves;
drop policy if exists "saves: insert own" on public.saves;
drop policy if exists "saves: update own" on public.saves;
drop policy if exists "saves: delete own" on public.saves;

create policy "saves: read own"   on public.saves for select to authenticated using ((select auth.uid()) = user_id);
create policy "saves: insert own" on public.saves for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "saves: update own" on public.saves for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "saves: delete own" on public.saves for delete to authenticated using ((select auth.uid()) = user_id);

-- อัปเดต updated_at อัตโนมัติทุกครั้งที่แก้แถว
create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists saves_touch on public.saves;
create trigger saves_touch before update on public.saves
for each row execute function public.touch_updated_at();
