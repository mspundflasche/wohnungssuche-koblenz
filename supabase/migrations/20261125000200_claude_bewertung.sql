-- Claudes eigene Bewertung je Angebot (gleiche Skala wie das Familien-Feedback)
-- und ein Abgleich, wie oft Claude mit der Familie übereinstimmt.

alter table public.listings
  add column claude_rating smallint check (claude_rating in (-1, 1, 2)),
  add column claude_note text check (char_length(claude_note) <= 1000);

-- upsert_listings: zusätzlich claude_rating / claude_note
create or replace function public.upsert_listings(items jsonb)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  it jsonb;
  c_lat double precision;
  c_lng double precision;
  v_lat double precision;
  v_lng double precision;
  v_price numeric;
  was_insert boolean;
  n_ins int := 0;
  n_upd int := 0;
  ids jsonb := '[]'::jsonb;
  v_id uuid;
begin
  select center_lat, center_lng into c_lat, c_lng from public.search_profile where id = 1;

  for it in select value from jsonb_array_elements(items) loop
    v_lat := nullif(it ->> 'lat', '')::double precision;
    v_lng := nullif(it ->> 'lng', '')::double precision;
    v_price := nullif(it ->> 'price', '')::numeric;

    insert into public.listings as l (
      url, source, external_id, title, offer_type, property_type,
      price, price_warm, area_m2, plot_m2, rooms, home_office,
      city, district, postal_code, address, lat, lng, distance_km,
      year_built, energy_class, features, description, image_url,
      available_from, provider, score, score_reasons, ai_summary, scored_at,
      claude_rating, claude_note, raw
    ) values (
      it ->> 'url',
      coalesce(nullif(it ->> 'source', ''), 'unbekannt'),
      nullif(it ->> 'external_id', ''),
      coalesce(nullif(it ->> 'title', ''), 'Ohne Titel'),
      it ->> 'offer_type',
      it ->> 'property_type',
      v_price,
      nullif(it ->> 'price_warm', '')::numeric,
      nullif(it ->> 'area_m2', '')::numeric,
      nullif(it ->> 'plot_m2', '')::numeric,
      nullif(it ->> 'rooms', '')::numeric,
      coalesce(nullif(it ->> 'home_office', ''), 'unklar'),
      nullif(it ->> 'city', ''),
      nullif(it ->> 'district', ''),
      nullif(it ->> 'postal_code', ''),
      nullif(it ->> 'address', ''),
      v_lat,
      v_lng,
      coalesce(
        nullif(it ->> 'distance_km', '')::numeric,
        case when v_lat is not null and v_lng is not null
          then public.distance_km(c_lat, c_lng, v_lat, v_lng) end
      ),
      nullif(it ->> 'year_built', '')::int,
      nullif(it ->> 'energy_class', ''),
      coalesce((select array_agg(lower(x)) from jsonb_array_elements_text(coalesce(it -> 'features', '[]'::jsonb)) x), '{}'),
      nullif(it ->> 'description', ''),
      nullif(it ->> 'image_url', ''),
      nullif(it ->> 'available_from', ''),
      nullif(it ->> 'provider', ''),
      nullif(it ->> 'score', '')::int,
      coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(it -> 'score_reasons', '[]'::jsonb)) x), '{}'),
      nullif(it ->> 'ai_summary', ''),
      case when nullif(it ->> 'score', '') is not null then now() end,
      nullif(it ->> 'claude_rating', '')::smallint,
      nullif(it ->> 'claude_note', ''),
      it
    )
    on conflict (url) do update set
      last_seen_at = now(),
      status = 'aktiv',
      previous_price = case
        when excluded.price is not null and l.price is not null and excluded.price <> l.price
          then l.price else l.previous_price end,
      price_changed_at = case
        when excluded.price is not null and l.price is not null and excluded.price <> l.price
          then now() else l.price_changed_at end,
      price = coalesce(excluded.price, l.price),
      price_warm = coalesce(excluded.price_warm, l.price_warm),
      title = coalesce(nullif(excluded.title, 'Ohne Titel'), l.title),
      area_m2 = coalesce(excluded.area_m2, l.area_m2),
      plot_m2 = coalesce(excluded.plot_m2, l.plot_m2),
      rooms = coalesce(excluded.rooms, l.rooms),
      home_office = case when excluded.home_office <> 'unklar' then excluded.home_office else l.home_office end,
      city = coalesce(excluded.city, l.city),
      district = coalesce(excluded.district, l.district),
      postal_code = coalesce(excluded.postal_code, l.postal_code),
      address = coalesce(excluded.address, l.address),
      lat = coalesce(excluded.lat, l.lat),
      lng = coalesce(excluded.lng, l.lng),
      distance_km = coalesce(excluded.distance_km, l.distance_km),
      year_built = coalesce(excluded.year_built, l.year_built),
      energy_class = coalesce(excluded.energy_class, l.energy_class),
      features = case when cardinality(excluded.features) > 0 then excluded.features else l.features end,
      description = coalesce(excluded.description, l.description),
      image_url = coalesce(excluded.image_url, l.image_url),
      available_from = coalesce(excluded.available_from, l.available_from),
      provider = coalesce(excluded.provider, l.provider),
      score = coalesce(excluded.score, l.score),
      score_reasons = case when cardinality(excluded.score_reasons) > 0 then excluded.score_reasons else l.score_reasons end,
      ai_summary = coalesce(excluded.ai_summary, l.ai_summary),
      scored_at = coalesce(excluded.scored_at, l.scored_at),
      claude_rating = coalesce(excluded.claude_rating, l.claude_rating),
      claude_note = coalesce(excluded.claude_note, l.claude_note),
      raw = excluded.raw
    returning (xmax = 0), id into was_insert, v_id;

    if was_insert then
      n_ins := n_ins + 1;
    else
      n_upd := n_upd + 1;
    end if;
    ids := ids || jsonb_build_object('id', v_id, 'url', it ->> 'url', 'neu', was_insert);
  end loop;

  return jsonb_build_object('inserted', n_ins, 'updated', n_upd, 'items', ids);
end;
$$;

-- set_scores: Passung und/oder Claudes Bewertung aktualisieren (fehlende Felder bleiben unverändert)
create or replace function public.set_scores(items jsonb)
returns int
language plpgsql
set search_path = ''
as $$
declare
  n int;
begin
  update public.listings l set
    score = coalesce(nullif(x ->> 'score', '')::int, l.score),
    score_reasons = case
      when x ? 'score_reasons'
        then coalesce((select array_agg(r) from jsonb_array_elements_text(x -> 'score_reasons') r), '{}')
      else l.score_reasons end,
    ai_summary = coalesce(nullif(x ->> 'ai_summary', ''), l.ai_summary),
    claude_rating = coalesce(nullif(x ->> 'claude_rating', '')::smallint, l.claude_rating),
    claude_note = coalesce(nullif(x ->> 'claude_note', ''), l.claude_note),
    scored_at = now()
  from jsonb_array_elements(items) x
  where l.id = (x ->> 'id')::uuid;
  get diagnostics n = row_count;
  return n;
end;
$$;

-- Abgleich: Wie oft liegt Claude mit der Familie auf einer Linie?
create or replace function public.claude_abgleich()
returns jsonb
language sql
stable
set search_path = ''
as $$
  with fam as (
    select
      f.listing_id,
      bool_or(f.rating > 0) as pos,
      bool_or(f.rating < 0) as neg,
      array_agg(distinct r) filter (where r is not null) as gruende,
      string_agg(distinct nullif(f.comment, ''), ' | ') as kommentare,
      max(f.updated_at) as zuletzt
    from public.feedback f
    left join lateral unnest(f.reasons) r on true
    group by f.listing_id
  ),
  v as (
    select
      l.id, l.title, l.city, l.offer_type, l.claude_rating, l.claude_note, fam.*,
      case
        when fam.pos and fam.neg then 'familie_uneinig'
        when l.claude_rating > 0 and fam.pos then 'einig'
        when l.claude_rating < 0 and fam.neg then 'einig'
        when l.claude_rating > 0 and fam.neg then 'claude_zu_optimistisch'
        else 'claude_zu_kritisch'
      end as ergebnis
    from public.listings l
    join fam on fam.listing_id = l.id
    where l.claude_rating is not null
  )
  select jsonb_build_object(
    'verglichen', (select count(*) from v where ergebnis <> 'familie_uneinig'),
    'einig', (select count(*) from v where ergebnis = 'einig'),
    'claude_zu_optimistisch', (select count(*) from v where ergebnis = 'claude_zu_optimistisch'),
    'claude_zu_kritisch', (select count(*) from v where ergebnis = 'claude_zu_kritisch'),
    'familie_uneinig', (select count(*) from v where ergebnis = 'familie_uneinig'),
    'abweichungen', coalesce((
      select jsonb_agg(jsonb_build_object(
        'titel', title, 'ort', city, 'angebot', offer_type, 'ergebnis', ergebnis,
        'claude', claude_rating, 'claude_notiz', claude_note,
        'gruende_familie', gruende, 'kommentare_familie', kommentare
      ) order by zuletzt desc)
      from (select * from v where ergebnis in ('claude_zu_optimistisch', 'claude_zu_kritisch') order by zuletzt desc limit 20) a
    ), '[]'::jsonb)
  );
$$;

revoke execute on function public.claude_abgleich() from public, anon;
grant execute on function public.claude_abgleich() to authenticated;
revoke execute on function public.upsert_listings(jsonb) from public, anon, authenticated;
revoke execute on function public.set_scores(jsonb) from public, anon, authenticated;
