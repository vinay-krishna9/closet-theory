-- REVIEW ONLY: not applied. Intended only for development project aghsipccmufzdtqwzxey.
-- Adds one isolated test table and owner policies. No existing tables/rows are changed.
begin;

create table public.spike_access_items (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null default (auth.jwt() ->> 'sub'),
  label text not null check (char_length(label) between 1 and 100),
  created_at timestamptz not null default now(),
  constraint spike_owner_is_clerk check (left(owner_id, 5) = 'user_' and length(owner_id) > 5)
);

create index spike_access_items_owner_idx on public.spike_access_items(owner_id);
alter table public.spike_access_items enable row level security;
alter table public.spike_access_items force row level security;

revoke all on public.spike_access_items from public, anon, authenticated;
grant select, insert, update, delete on public.spike_access_items to authenticated;

create policy "Owners read their probe items" on public.spike_access_items
  for select to authenticated using ((select auth.jwt() ->> 'sub') = owner_id);
create policy "Owners insert their probe items" on public.spike_access_items
  for insert to authenticated with check ((select auth.jwt() ->> 'sub') = owner_id);
create policy "Owners update their probe items" on public.spike_access_items
  for update to authenticated
  using ((select auth.jwt() ->> 'sub') = owner_id)
  with check ((select auth.jwt() ->> 'sub') = owner_id);
create policy "Owners delete their probe items" on public.spike_access_items
  for delete to authenticated using ((select auth.jwt() ->> 'sub') = owner_id);

commit;
