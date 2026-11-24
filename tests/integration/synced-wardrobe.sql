create function public.reject_mutation_fixture() returns trigger language plpgsql as $$ begin
  if new.id='66666666-6666-4666-8666-666666666666' then raise exception 'fixture receipt failure' using errcode='23514'; end if;
  return new;
end $$;
create trigger reject_mutation_fixture before insert on public.wardrobe_mutations for each row execute function public.reject_mutation_fixture();
set role authenticated;
select set_config('request.jwt.claims','{"sub":"user_crud_a","email_verified":true}',false);
do $$
declare
  item jsonb := '{"id":"22222222-2222-4222-8222-222222222222","typeId":"tshirt","name":"Original shirt","color":"white","formality":"Casual","seasons":["Summer"],"pattern":"Solid","neckline":"Crew neck","sleeves":"Short sleeves"}';
  op uuid := gen_random_uuid(); result jsonb; replay jsonb; other jsonb;
begin
  result := public.mutate_wardrobe_item(op,'add',item,null,false,'Europe/Berlin');
  if result->>'matched'<>'false' or (select count(*) from public.wardrobe_items)<>1 then raise exception 'add failed'; end if;
  replay := public.mutate_wardrobe_item(op,'add',item,null,false,'Europe/Berlin');
  if replay<>result then raise exception 'replay changed result'; end if;
  begin
    perform public.mutate_wardrobe_item(op,'add',item || '{"name":"Changed"}',null,false,'Europe/Berlin');
    raise exception 'changed replay accepted';
  exception when sqlstate 'P0001' then if sqlerrm<>'wardrobe_payload_conflict' then raise; end if; end;
  other := item || jsonb_build_object('id',gen_random_uuid());
  replay := public.mutate_wardrobe_item(gen_random_uuid(),'add',other,null,false,'UTC');
  if replay->>'matched'<>'true' or replay->>'itemId'<>result->>'itemId' then raise exception 'exact match duplicated'; end if;
  replay := public.mutate_wardrobe_item(gen_random_uuid(),'add',other,null,true,'UTC');
  if (select count(*) from public.wardrobe_items)<>2 then raise exception 'distinct garment collapsed'; end if;
  begin
    perform public.mutate_wardrobe_item(gen_random_uuid(),'add',other || jsonb_build_object('id',gen_random_uuid(),'pattern','Striped'),null,false,'UTC');
    raise exception 'broader match skipped warning';
  exception when sqlstate 'P0001' then if sqlerrm<>'wardrobe_similarity' then raise; end if; end;
  item := item || '{"name":"Updated shirt"}'; op := gen_random_uuid();
  replay := public.mutate_wardrobe_item(op,'update',item,1,false,'UTC');
  perform public.mutate_wardrobe_item(op,'update',item,1,false,'UTC');
  if (select revision from public.wardrobe_items where id=(item->>'id')::uuid)<>2 then raise exception 'retry incremented revision'; end if;
  begin
    perform public.mutate_wardrobe_item(gen_random_uuid(),'update',item || '{"name":"Stale edit"}',1,false,'UTC');
    raise exception 'stale edit accepted';
  exception when sqlstate 'P0001' then if sqlerrm<>'wardrobe_changed' then raise; end if; end;
  op := gen_random_uuid();
  perform public.mutate_wardrobe_item(op,'remove',jsonb_build_object('id',item->>'id'),2,false,'UTC');
  perform public.mutate_wardrobe_item(op,'remove',jsonb_build_object('id',item->>'id'),2,false,'UTC');
  if (select revision from public.wardrobe_items where id=(item->>'id')::uuid)<>3
    or not exists(select 1 from public.wardrobe_items where id=(item->>'id')::uuid and removed_at is not null) then
    raise exception 'removal deleted identity or repeated side effects'; end if;
  begin
    perform public.mutate_wardrobe_item('66666666-6666-4666-8666-666666666666','add',other || jsonb_build_object('id',gen_random_uuid()),null,true,'UTC');
    raise exception 'receipt failure did not occur';
  exception when check_violation then null; end;
  if (select count(*) from public.wardrobe_items)<>2 then raise exception 'receipt failure left item'; end if;
  if (select timezone from public.account_profiles)<>'Europe/Berlin' then raise exception 'timezone overwritten'; end if;
  replay := public.list_wardrobe_items();
  if replay->>'ownerId'<>'user_crud_a' or jsonb_array_length(replay->'items')<>1 then raise exception 'active list includes removed clothing'; end if;
end $$;
select set_config('request.jwt.claims','{"sub":"user_crud_b","email_verified":true}',false);
do $$ begin
  if exists(select 1 from public.wardrobe_items) or exists(select 1 from public.wardrobe_mutations) then raise exception 'cross-owner read'; end if;
  if public.list_wardrobe_items()->'items'<>'[]'::jsonb then raise exception 'foreign clothing in list'; end if;
  begin
    perform public.mutate_wardrobe_item(gen_random_uuid(),'remove','{"id":"22222222-2222-4222-8222-222222222222"}',3,false,'UTC');
    raise exception 'cross-owner remove';
  exception when no_data_found then null; end;
  begin
    perform public.mutate_wardrobe_item(gen_random_uuid(),'add','{"id":"33333333-3333-4333-8333-333333333333","typeId":"sneakers","name":"Own shoes","color":"white","formality":"Casual","seasons":["Summer"],"pattern":"Solid"}',null,false,'UTC');
    insert into public.wardrobe_mutations(owner_id,id,payload_hash,item_id) values('user_crud_b',gen_random_uuid(),repeat('a',64),'22222222-2222-4222-8222-222222222222');
    raise exception 'cross-owner receipt mapping';
  exception when foreign_key_violation then null; end;
end $$;
select set_config('request.jwt.claims','{"sub":"user_crud_b","email_verified":false}',false);
do $$ begin
  begin perform public.mutate_wardrobe_item(gen_random_uuid(),'remove','{"id":"22222222-2222-4222-8222-222222222222"}',3,false,'UTC');
    raise exception 'unverified mutation'; exception when insufficient_privilege then null; end;
end $$;
reset role;
set role anon;
do $$ begin
  begin perform public.mutate_wardrobe_item(gen_random_uuid(),'remove','{"id":"22222222-2222-4222-8222-222222222222"}',3,false,'UTC');
    raise exception 'anonymous mutation'; exception when insufficient_privilege then null; end;
end $$;
