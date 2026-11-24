-- Prepared for separate approval; do not run against production.
begin;
alter table public.wardrobe_items add column revision integer not null default 1 check (revision > 0);
create table public.wardrobe_mutations (
  owner_id text not null default public.account_owner() references public.account_profiles(owner_id),
  id uuid not null,
  payload_hash text not null check (payload_hash ~ '^[0-9a-f]{64}$'),
  item_id uuid not null,
  matched boolean not null default false,
  created_at timestamptz not null default now(),
  primary key(owner_id,id),
  foreign key(owner_id,item_id) references public.wardrobe_items(owner_id,id)
);
alter table public.wardrobe_mutations enable row level security;
alter table public.wardrobe_mutations force row level security;
revoke all on public.wardrobe_mutations from public,anon,authenticated;
grant select,insert,delete on public.wardrobe_mutations to authenticated;
create policy wardrobe_mutations_owner on public.wardrobe_mutations for all to authenticated
  using ((select public.account_owner()) = owner_id) with check ((select public.account_owner()) = owner_id);

create function public.list_wardrobe_items() returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare account_id text := public.account_owner(); result jsonb;
begin
  if account_id is null then raise exception 'verified_identity_required' using errcode='42501'; end if;
  select coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object('id',id,'typeId',type_id,'name',name,
    'color',color,'formality',formality,'seasons',seasons,'pattern',pattern,'neckline',neckline,'sleeves',sleeves,
    'revision',revision)) order by created_at,id),'[]'::jsonb) into result
    from public.wardrobe_items where owner_id=account_id and removed_at is null;
  return jsonb_build_object('ownerId',account_id,'items',result);
end $$;
revoke all on function public.list_wardrobe_items() from public,anon;
grant execute on function public.list_wardrobe_items() to authenticated;

create function public.mutate_wardrobe_item(p_operation_id uuid,p_action text,p_item jsonb,p_expected_revision integer,p_separate boolean,p_timezone text) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare
  account_id text := public.account_owner(); canonical jsonb; digest text;
  receipt public.wardrobe_mutations%rowtype; target public.wardrobe_items%rowtype;
  requested_id uuid; target_id uuid; item_seasons text[]; matched boolean := false;
begin
  if account_id is null then raise exception 'verified_identity_required' using errcode='42501'; end if;
  if p_operation_id is null or p_action is null or p_action not in ('add','update','remove')
    or p_separate is null or p_timezone is null or not public.account_timezone_valid(p_timezone)
    or jsonb_typeof(p_item) is distinct from 'object' then raise exception 'invalid_wardrobe_mutation' using errcode='22023'; end if;
  begin requested_id := (p_item->>'id')::uuid;
  exception when invalid_text_representation then raise exception 'invalid_wardrobe_mutation' using errcode='22023'; end;
  if requested_id is null then raise exception 'invalid_wardrobe_mutation' using errcode='22023'; end if;
  if p_action='remove' then
    if (select count(*) from jsonb_object_keys(p_item)) <> 1 then raise exception 'invalid_wardrobe_mutation' using errcode='22023'; end if;
    canonical := jsonb_build_object('id',requested_id);
  else canonical := public.valid_import_item(p_item);
  end if;
  if (p_action='add' and p_expected_revision is not null)
    or (p_action<>'add' and (p_expected_revision is null or p_expected_revision<1 or p_separate)) then
    raise exception 'invalid_wardrobe_mutation' using errcode='22023'; end if;
  digest := encode(sha256(convert_to(jsonb_build_object('action',p_action,'item',canonical,'revision',p_expected_revision,'separate',p_separate,'timezone',p_timezone)::text,'UTF8')),'hex');
  perform pg_advisory_xact_lock(hashtextextended(account_id,12));
  select * into receipt from public.wardrobe_mutations where owner_id=account_id and id=p_operation_id;
  if found then
    if receipt.payload_hash<>digest then raise exception 'wardrobe_payload_conflict' using errcode='P0001'; end if;
    return jsonb_build_object('ownerId',account_id,'operationId',p_operation_id,'itemId',receipt.item_id,'matched',receipt.matched);
  end if;
  if p_action='add' then
    insert into public.account_profiles(owner_id,timezone) values(account_id,p_timezone) on conflict(owner_id) do nothing;
    if exists(select 1 from public.wardrobe_items where owner_id=account_id and id=requested_id) then
      raise exception 'wardrobe_payload_conflict' using errcode='P0001'; end if;
    select array_agg(value) into item_seasons from jsonb_array_elements_text(canonical->'seasons');
    if not p_separate then
      select w.id into target_id from public.wardrobe_items w where w.owner_id=account_id and w.removed_at is null
        and w.type_id=canonical->>'typeId' and w.color=canonical->>'color' and w.formality=canonical->>'formality'
        and w.pattern=canonical->>'pattern' and w.neckline is not distinct from (canonical->>'neckline')
        and w.sleeves is not distinct from (canonical->>'sleeves')
        and cardinality(w.seasons)=cardinality(item_seasons) and w.seasons @> item_seasons and w.seasons <@ item_seasons
        order by w.created_at,w.id limit 1 for update;
      matched := target_id is not null;
      if not matched and exists(select 1 from public.wardrobe_items where owner_id=account_id and removed_at is null
        and type_id=canonical->>'typeId' and color=canonical->>'color') then
        raise exception 'wardrobe_similarity' using errcode='P0001'; end if;
    end if;
    if target_id is null then
      insert into public.wardrobe_items(id,owner_id,name,type_id,color,formality,seasons,pattern,neckline,sleeves)
        values(requested_id,account_id,canonical->>'name',canonical->>'typeId',canonical->>'color',canonical->>'formality',item_seasons,
          canonical->>'pattern',canonical->>'neckline',canonical->>'sleeves') returning id into target_id;
    end if;
  else
    select * into target from public.wardrobe_items where owner_id=account_id and id=requested_id for update;
    if not found then raise exception 'wardrobe_item_unavailable' using errcode='P0002'; end if;
    target_id := target.id;
    if p_action='remove' and target.removed_at is not null then null;
    elsif target.removed_at is not null or target.revision<>p_expected_revision then
      raise exception 'wardrobe_changed' using errcode='P0001';
    elsif p_action='remove' then
      update public.wardrobe_items set removed_at=now(),revision=revision+1 where owner_id=account_id and id=target_id;
    else
      select array_agg(value) into item_seasons from jsonb_array_elements_text(canonical->'seasons');
      if target.type_id<>canonical->>'typeId' then raise exception 'invalid_wardrobe_mutation' using errcode='22023'; end if;
      update public.wardrobe_items set name=canonical->>'name',color=canonical->>'color',formality=canonical->>'formality',
        seasons=item_seasons,pattern=canonical->>'pattern',neckline=canonical->>'neckline',sleeves=canonical->>'sleeves',revision=revision+1
        where owner_id=account_id and id=target_id;
    end if;
  end if;
  insert into public.wardrobe_mutations(owner_id,id,payload_hash,item_id,matched) values(account_id,p_operation_id,digest,target_id,matched);
  return jsonb_build_object('ownerId',account_id,'operationId',p_operation_id,'itemId',target_id,'matched',matched);
end $$;
revoke all on function public.mutate_wardrobe_item(uuid,text,jsonb,integer,boolean,text) from public,anon;
grant execute on function public.mutate_wardrobe_item(uuid,text,jsonb,integer,boolean,text) to authenticated;
commit;
