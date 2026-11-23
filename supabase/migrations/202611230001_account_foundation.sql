-- Prepared for review. Not applied. Target: development project aghsipccmufzdtqwzxey.
-- Requires Clerk session claim: "email_verified": "{{user.email_verified}}".
begin;

create function public.account_owner() returns text
language sql stable security invoker set search_path = ''
as $$ select case when (auth.jwt() ->> 'email_verified') = 'true' then auth.jwt() ->> 'sub' else null end $$;
revoke all on function public.account_owner() from public;
grant execute on function public.account_owner() to authenticated;

create function public.account_timezone_valid(value text) returns boolean
language sql stable security invoker set search_path = ''
as $$ select exists (select 1 from pg_catalog.pg_timezone_names where name = value) $$;
revoke all on function public.account_timezone_valid(text) from public;
grant execute on function public.account_timezone_valid(text) to authenticated;

create table public.account_profiles (
  owner_id text primary key default public.account_owner() check (left(owner_id, 5) = 'user_'),
  timezone text not null check (public.account_timezone_valid(timezone)),
  created_at timestamptz not null default now()
);
create table public.wardrobe_items (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null default public.account_owner() references public.account_profiles(owner_id),
  name text not null check (char_length(trim(name)) between 1 and 80),
  type_id text not null check (type_id in ('tshirt','shirt','sweater','jeans','chinos','shorts','sneakers','jacket')),
  color text not null check (color in ('white','off-white','black','navy','grey','dark-grey','olive','beige','burgundy','light-blue','pink','oatmeal','brown','indigo','khaki')),
  formality text not null check (formality in ('Casual','Smart-casual','Formal')),
  seasons text[] not null check (cardinality(seasons) between 1 and 4 and seasons <@ array['Spring','Summer','Autumn','Winter']::text[]),
  pattern text not null check (pattern in ('Solid','Striped','Checked','Printed')),
  neckline text check (neckline in ('Crew neck','V-neck','Polo collar','Collared')),
  sleeves text check (sleeves in ('Sleeveless','Short sleeves','Long sleeves')),
  removed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(owner_id, id)
);
create index wardrobe_items_owner_active on public.wardrobe_items(owner_id) where removed_at is null;

create table public.visitor_imports (
  owner_id text not null default public.account_owner() references public.account_profiles(owner_id),
  id uuid not null,
  payload_hash text not null check (payload_hash ~ '^[0-9a-f]{64}$'),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (owner_id, id)
);
create table public.visitor_import_items (
  owner_id text not null default public.account_owner(),
  import_id uuid not null,
  selection_id text not null check (char_length(selection_id) between 1 and 200),
  item_id uuid not null,
  primary key (owner_id, import_id, selection_id),
  foreign key (owner_id, import_id) references public.visitor_imports(owner_id, id),
  foreign key (owner_id, item_id) references public.wardrobe_items(owner_id, id)
);

alter table public.account_profiles enable row level security;
alter table public.account_profiles force row level security;
alter table public.wardrobe_items enable row level security;
alter table public.wardrobe_items force row level security;
alter table public.visitor_imports enable row level security;
alter table public.visitor_imports force row level security;
alter table public.visitor_import_items enable row level security;
alter table public.visitor_import_items force row level security;

revoke all on public.account_profiles, public.wardrobe_items, public.visitor_imports, public.visitor_import_items from public, anon, authenticated;
grant select, insert, update, delete on public.account_profiles, public.wardrobe_items, public.visitor_imports, public.visitor_import_items to authenticated;
create policy account_profiles_owner on public.account_profiles for all to authenticated
  using ((select public.account_owner()) = owner_id) with check ((select public.account_owner()) = owner_id);
create policy wardrobe_items_owner on public.wardrobe_items for all to authenticated
  using ((select public.account_owner()) = owner_id) with check ((select public.account_owner()) = owner_id);
create policy visitor_imports_owner on public.visitor_imports for all to authenticated
  using ((select public.account_owner()) = owner_id) with check ((select public.account_owner()) = owner_id);
create policy visitor_import_items_owner on public.visitor_import_items for all to authenticated
  using ((select public.account_owner()) = owner_id) with check ((select public.account_owner()) = owner_id);

commit;
