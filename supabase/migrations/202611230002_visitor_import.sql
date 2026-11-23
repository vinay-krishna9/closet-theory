-- Prepared, not applied. Requires separate approval for the named test project.
begin;

alter table public.visitor_imports
  add column imported_count integer not null default 0 check (imported_count >= 0),
  add column matched_count integer not null default 0 check (matched_count >= 0);

create function public.valid_import_item(item jsonb) returns jsonb
language plpgsql immutable security invoker set search_path = '' as $$
declare
  garment_type text; allowed_colors text[]; allowed_necklines text[];
  allowed_sleeves text[]; field text; season text; ordered_seasons jsonb := '[]';
begin
  if jsonb_typeof(item) is distinct from 'object' then
    raise exception 'invalid_import_item' using errcode = '22023';
  end if;
  for field in select jsonb_object_keys(item) loop
    if field not in ('id','typeId','name','color','formality','seasons','pattern','neckline','sleeves') then
      raise exception 'invalid_import_item' using errcode = '22023';
    end if;
  end loop;
  foreach field in array array['id','typeId','name','color','formality','pattern'] loop
    if jsonb_typeof(item->field) is distinct from 'string' then
      raise exception 'invalid_import_item' using errcode = '22023';
    end if;
  end loop;
  garment_type := item->>'typeId';
  allowed_colors := case garment_type
    when 'tshirt' then array['white','black','navy','grey','olive','beige','burgundy','light-blue']
    when 'shirt' then array['white','light-blue','navy','black','grey','beige','pink','olive']
    when 'sweater' then array['oatmeal','grey','navy','black','beige','brown','burgundy','olive']
    when 'jeans' then array['indigo','light-blue','black','grey','dark-grey','white','beige','brown']
    when 'chinos' then array['khaki','navy','olive','black','grey','beige','brown','white']
    when 'shorts' then array['khaki','navy','olive','black','grey','beige','white','light-blue']
    when 'sneakers' then array['white','off-white','black','grey','navy','beige','brown','burgundy']
    when 'jacket' then array['olive','navy','black','beige','grey','brown','khaki','burgundy'] end;
  allowed_necklines := case garment_type
    when 'tshirt' then array['Crew neck','V-neck','Polo collar']
    when 'shirt' then array['Collared'] when 'sweater' then array['Crew neck','V-neck']
    else array[]::text[] end;
  allowed_sleeves := case garment_type
    when 'tshirt' then array['Short sleeves','Long sleeves','Sleeveless']
    when 'shirt' then array['Long sleeves','Short sleeves']
    when 'sweater' then array['Long sleeves'] when 'jacket' then array['Long sleeves']
    else array[]::text[] end;
  if allowed_colors is null or not (item->>'color' = any(allowed_colors))
    or char_length(trim(item->>'id')) < 1 or char_length(item->>'id') > 200
    or char_length(trim(item->>'name')) not between 1 and 80
    or item->>'formality' not in ('Casual','Smart-casual','Formal')
    or item->>'pattern' not in ('Solid','Striped','Checked','Printed')
    or (garment_type = 'sneakers' and item->>'pattern' not in ('Solid','Printed')) then
    raise exception 'invalid_import_item' using errcode = '22023';
  end if;
  if cardinality(allowed_necklines) > 0 then
    if jsonb_typeof(item->'neckline') is distinct from 'string' or not (item->>'neckline' = any(allowed_necklines)) then
      raise exception 'invalid_import_item' using errcode = '22023';
    end if;
  elsif item ? 'neckline' then raise exception 'invalid_import_item' using errcode = '22023';
  end if;
  if cardinality(allowed_sleeves) > 0 then
    if jsonb_typeof(item->'sleeves') is distinct from 'string' or not (item->>'sleeves' = any(allowed_sleeves)) then
      raise exception 'invalid_import_item' using errcode = '22023';
    end if;
  elsif item ? 'sleeves' then raise exception 'invalid_import_item' using errcode = '22023';
  end if;
  if jsonb_typeof(item->'seasons') is distinct from 'array' then
    raise exception 'invalid_import_item' using errcode = '22023';
  end if;
  foreach season in array array['Spring','Summer','Autumn','Winter'] loop
    if (item->'seasons') ? season then ordered_seasons := ordered_seasons || jsonb_build_array(season); end if;
  end loop;
  if jsonb_array_length(ordered_seasons) = 0
    or jsonb_array_length(ordered_seasons) <> jsonb_array_length(item->'seasons') then
    raise exception 'invalid_import_item' using errcode = '22023';
  end if;
  return jsonb_strip_nulls(jsonb_build_object('id',item->>'id','typeId',garment_type,
    'name',trim(item->>'name'),'color',item->>'color','formality',item->>'formality',
    'seasons',ordered_seasons,'pattern',item->>'pattern','neckline',item->>'neckline','sleeves',item->>'sleeves'));
end $$;
revoke all on function public.valid_import_item(jsonb) from public, anon;
grant execute on function public.valid_import_item(jsonb) to authenticated;

create function public.import_visitor_wardrobe(p_operation_id uuid, p_timezone text, p_items jsonb) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare
  account_id text := public.account_owner(); canonical jsonb; payload_digest text;
  existing public.visitor_imports%rowtype; garment jsonb; garment_seasons text[];
  matched_id uuid; consumed uuid[] := array[]::uuid[]; added integer := 0; reused integer := 0;
  result_mappings jsonb;
begin
  if account_id is null then raise exception 'verified_identity_required' using errcode = '42501'; end if;
  if p_operation_id is null or p_timezone is null or not public.account_timezone_valid(p_timezone)
    or jsonb_typeof(p_items) is distinct from 'array' then
    raise exception 'invalid_import' using errcode = '22023';
  end if;
  if jsonb_array_length(p_items) > 2000 or octet_length(p_items::text) > 1048576 then
    raise exception 'invalid_import' using errcode = '22023';
  end if;
  select coalesce(jsonb_agg(validated order by validated->>'id' collate "C"),'[]'::jsonb) into canonical
    from (select public.valid_import_item(value) validated from jsonb_array_elements(p_items)) items;
  if (select count(distinct value->>'id') from jsonb_array_elements(canonical)) <> jsonb_array_length(canonical) then
    raise exception 'invalid_import' using errcode = '22023';
  end if;
  payload_digest := encode(sha256(convert_to(jsonb_build_object('items',canonical,'timezone',p_timezone)::text,'UTF8')),'hex');
  -- Serialize imports for this owner, including batches arriving from other tabs.
  perform pg_advisory_xact_lock(hashtextextended(account_id,12));
  select * into existing from public.visitor_imports where owner_id = account_id and id = p_operation_id for update;
  if found and existing.payload_hash <> payload_digest then
    raise exception 'import_payload_conflict' using errcode = 'P0001';
  end if;
  if not found then
    insert into public.account_profiles(owner_id,timezone) values(account_id,p_timezone) on conflict(owner_id) do nothing;
    insert into public.visitor_imports(owner_id,id,payload_hash) values(account_id,p_operation_id,payload_digest);
  end if;
  if existing.completed_at is null then
    for garment in select value from jsonb_array_elements(canonical) loop
      select array_agg(value) into garment_seasons from jsonb_array_elements_text(garment->'seasons');
      select w.id into matched_id from public.wardrobe_items w
        where w.owner_id = account_id and w.removed_at is null and not (w.id = any(consumed))
          and w.type_id = garment->>'typeId' and w.color = garment->>'color'
          and w.formality = garment->>'formality' and w.pattern = garment->>'pattern'
          and w.neckline is not distinct from (garment->>'neckline')
          and w.sleeves is not distinct from (garment->>'sleeves')
          and cardinality(w.seasons) = cardinality(garment_seasons) and w.seasons @> garment_seasons and w.seasons <@ garment_seasons
        order by w.created_at,w.id limit 1 for update;
      if matched_id is null then
        insert into public.wardrobe_items(owner_id,name,type_id,color,formality,seasons,pattern,neckline,sleeves)
          values(account_id,garment->>'name',garment->>'typeId',garment->>'color',garment->>'formality',garment_seasons,
            garment->>'pattern',garment->>'neckline',garment->>'sleeves') returning id into matched_id;
        added := added + 1;
      else reused := reused + 1;
      end if;
      consumed := array_append(consumed,matched_id);
      insert into public.visitor_import_items(owner_id,import_id,selection_id,item_id)
        values(account_id,p_operation_id,garment->>'id',matched_id);
    end loop;
    update public.visitor_imports set completed_at = now(),imported_count = added,matched_count = reused
      where owner_id = account_id and id = p_operation_id;
  else added := existing.imported_count; reused := existing.matched_count;
  end if;
  select coalesce(jsonb_agg(jsonb_build_object('selectionId',selection_id,'itemId',item_id) order by selection_id collate "C"),'[]'::jsonb)
    into result_mappings from public.visitor_import_items where owner_id = account_id and import_id = p_operation_id;
  return jsonb_build_object('operationId',p_operation_id,'ownerId',account_id,'imported',added,'matched',reused,'mappings',result_mappings);
end $$;
revoke all on function public.import_visitor_wardrobe(uuid,text,jsonb) from public, anon;
grant execute on function public.import_visitor_wardrobe(uuid,text,jsonb) to authenticated;

commit;
