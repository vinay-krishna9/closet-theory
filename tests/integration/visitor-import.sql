-- Disposable local PostgreSQL only. Assertions exercise actual functions and RLS.
create function public.reject_fixture_insert() returns trigger language plpgsql as $$ begin
  if new.name = 'Force rollback' then raise exception 'fixture rollback' using errcode = '23514'; end if;
  return new;
end $$;
create trigger reject_fixture_insert before insert on public.wardrobe_items for each row execute function public.reject_fixture_insert();
set role authenticated;
select set_config('request.jwt.claims','{"sub":"user_import_a","email_verified":true}',false);
do $$
declare
  batch uuid := '11111111-1111-4111-8111-111111111111';
  clothes jsonb := '[{"id":"one","typeId":"tshirt","name":"My shirt","color":"white","formality":"Casual","seasons":["Summer","Spring"],"pattern":"Solid","neckline":"Crew neck","sleeves":"Short sleeves"},{"id":"two","typeId":"tshirt","name":"Another shirt","color":"white","formality":"Casual","seasons":["Spring","Summer"],"pattern":"Solid","neckline":"Crew neck","sleeves":"Short sleeves"}]';
  first_result jsonb; replay jsonb; changed jsonb; saved_id uuid;
begin
  first_result := public.import_visitor_wardrobe(batch,'Europe/Berlin',clothes);
  if first_result->>'imported' <> '2' or (select count(*) from public.wardrobe_items) <> 2 then
    raise exception 'intentional duplicates collapsed'; end if;
  replay := public.import_visitor_wardrobe(batch,'Europe/Berlin',clothes);
  if replay <> first_result or (select count(*) from public.wardrobe_items) <> 2 then
    raise exception 'replay duplicated or changed result'; end if;
  -- Order/default normalization is independent of identity and display naming.
  replay := public.import_visitor_wardrobe(batch,'Europe/Berlin',jsonb_build_array(clothes->1,clothes->0));
  if replay <> first_result then raise exception 'order changed payload identity'; end if;
  begin
    perform public.import_visitor_wardrobe(batch,'Europe/Berlin',jsonb_set(clothes,'{0,name}','"Changed"'));
    raise exception 'changed payload accepted';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'import_payload_conflict' then raise; end if;
  end;
  replay := public.import_visitor_wardrobe(gen_random_uuid(),'UTC',clothes);
  if replay->>'imported' <> '0' or replay->>'matched' <> '2' then raise exception 'exact matches not preserved'; end if;
  if (select timezone from public.account_profiles) <> 'Europe/Berlin' then raise exception 'existing timezone overwritten'; end if;
  if (select count(*) from public.wardrobe_items) <> 2 then raise exception 'new operation duplicated exact clothes'; end if;
  changed := jsonb_build_array(jsonb_set(clothes->0,'{pattern}','"Striped"'));
  replay := public.import_visitor_wardrobe(gen_random_uuid(),'UTC',changed);
  if replay->>'imported' <> '1' then raise exception 'broader similarity silently merged'; end if;
  select id into saved_id from public.wardrobe_items where name = 'My shirt' and pattern = 'Solid' limit 1;
  update public.wardrobe_items set removed_at = now() where pattern = 'Solid';
  replay := public.import_visitor_wardrobe(gen_random_uuid(),'UTC',jsonb_build_array(clothes->0));
  if replay->>'imported' <> '1' then raise exception 'removed garment matched'; end if;
  -- A failure after the first insertion must roll back all writes and metadata.
  batch := gen_random_uuid();
  begin
    perform public.import_visitor_wardrobe(batch,'UTC',jsonb_build_array(
      jsonb_set(clothes->0,'{pattern}','"Printed"'),
      jsonb_set(clothes->1,'{name}','"Force rollback"') || '{"pattern":"Printed"}'));
    raise exception 'fixture trigger did not fail';
  exception when check_violation then null;
  end;
  if exists(select 1 from public.visitor_imports where id = batch)
    or exists(select 1 from public.wardrobe_items where pattern = 'Printed') then
    raise exception 'failed transaction left writes'; end if;
  -- Invalid second item must not leave the first item or operation behind.
  batch := gen_random_uuid();
  begin
    perform public.import_visitor_wardrobe(batch,'UTC',clothes || jsonb_build_array(jsonb_set(clothes->0,'{id}','"invalid"') || '{"color":"pink"}'));
    raise exception 'invalid type/color accepted';
  exception when invalid_parameter_value then null;
  end;
  if exists(select 1 from public.visitor_imports where id = batch) then raise exception 'failed transaction left operation'; end if;
  begin
    perform public.import_visitor_wardrobe(batch,'UTC',jsonb_build_array(clothes->0,clothes->0));
    raise exception 'repeated selection identity accepted';
  exception when invalid_parameter_value then null;
  end;
  replay := public.import_visitor_wardrobe(batch,'UTC','[]');
  if replay->>'imported' <> '0' or replay->'mappings' <> '[]'::jsonb then raise exception 'empty batch invented clothes'; end if;
end $$;

select set_config('request.jwt.claims','{"sub":"user_import_b","email_verified":true}',false);
do $$
declare result jsonb;
begin
  if exists(select 1 from public.wardrobe_items) or exists(select 1 from public.visitor_imports) then raise exception 'foreign owner read'; end if;
  result := public.import_visitor_wardrobe('11111111-1111-4111-8111-111111111111','UTC','[]');
  if result->>'ownerId' <> 'user_import_b' then raise exception 'operation ID crossed owners'; end if;
  if exists(select 1 from public.wardrobe_items) then raise exception 'foreign mappings returned'; end if;
  begin
    insert into public.visitor_imports(owner_id,id,payload_hash) values('user_import_a',gen_random_uuid(),repeat('a',64));
    raise exception 'foreign owner write accepted';
  exception when insufficient_privilege then null;
  end;
end $$;
select set_config('request.jwt.claims','{"sub":"user_import_b","email_verified":false}',false);
do $$ begin
  begin
    perform public.import_visitor_wardrobe(gen_random_uuid(),'UTC','[]');
    raise exception 'unverified import accepted';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
set role anon;
do $$ begin
  begin
    perform public.import_visitor_wardrobe(gen_random_uuid(),'UTC','[]');
    raise exception 'anonymous import accepted';
  exception when insufficient_privilege then null;
  end;
end $$;
