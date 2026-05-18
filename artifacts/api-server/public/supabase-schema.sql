create table if not exists public.app_state (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.app_state enable row level security;

drop policy if exists "public app_state read" on public.app_state;
drop policy if exists "public app_state insert" on public.app_state;
drop policy if exists "public app_state update" on public.app_state;
drop policy if exists "public app_state delete" on public.app_state;
drop policy if exists "authenticated app_state insert" on public.app_state;
drop policy if exists "authenticated app_state update" on public.app_state;
drop policy if exists "admin app_state delete" on public.app_state;

create policy "public app_state read"
on public.app_state for select
using (true);

create policy "authenticated app_state insert"
on public.app_state for insert
to authenticated
with check (auth.uid() is not null);

create policy "authenticated app_state update"
on public.app_state for update
to authenticated
using (auth.uid() is not null)
with check (auth.uid() is not null);

create policy "admin app_state delete"
on public.app_state for delete
to authenticated
using (
  lower(auth.jwt() ->> 'email') = 'un1quebmgo@gmail.com'
  or auth.uid()::text in (
    '1fb0ffb1-fa06-4d10-874f-a1cf98fcd38e',
    'd1fb0ffb1-fa06-4d10-874f-a1cf98fcd38e'
  )
);
