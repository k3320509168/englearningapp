-- 雲端存檔：每個玩家一筆，整份遊戲存檔以 JSON 存放。
-- 在 Supabase 的 SQL Editor 貼上整份執行一次即可（重複執行也安全）。

create table if not exists public.saves (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,               -- 遊戲存檔（localStorage 的 english-rpg-save 內容）
  save_version int not null,         -- 存檔格式版本（SAVE_VERSION）
  updated_at timestamptz not null default now()
);

-- 權限：開啟 RLS，每個人只能讀寫自己的那一筆
alter table public.saves enable row level security;

drop policy if exists "read own save" on public.saves;
create policy "read own save" on public.saves
  for select using (auth.uid() = user_id);

drop policy if exists "insert own save" on public.saves;
create policy "insert own save" on public.saves
  for insert with check (auth.uid() = user_id);

drop policy if exists "update own save" on public.saves;
create policy "update own save" on public.saves
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "delete own save" on public.saves;
create policy "delete own save" on public.saves
  for delete using (auth.uid() = user_id);
