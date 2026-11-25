-- Wohnungssuche Koblenz – Grundschema
-- Tabellen: app_members, search_profile, listings, feedback, learned_preferences, search_runs
-- Zugriff: nur eingeloggte Nutzer, deren E-Mail in app_members steht.
-- Schreiben von Angeboten/Läufen/Lernständen erfolgt ausschließlich durch die tägliche Aufgabe
-- (Supabase-Connector, Rolle postgres) – nicht über die Webseite.

-- ---------------------------------------------------------------------------
-- Hilfsfunktionen
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.distance_km(
  lat1 double precision, lng1 double precision,
  lat2 double precision, lng2 double precision
)
returns numeric
language sql
immutable
set search_path = ''
as $$
  select round((6371 * 2 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2) +
    cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)
  )))::numeric, 1)
$$;

-- ---------------------------------------------------------------------------
-- Mitglieder (Allowlist für den Zugriff)
-- ---------------------------------------------------------------------------
create table public.app_members (
  email text primary key check (email = lower(email)),
  display_name text,
  added_at timestamptz not null default now()
);

create or replace function public.is_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.app_members m
    where m.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- ---------------------------------------------------------------------------
-- Suchprofil (genau eine Zeile)
-- ---------------------------------------------------------------------------
create table public.search_profile (
  id smallint primary key default 1 check (id = 1),
  center_name text not null default 'Koblenz',
  center_lat double precision not null default 50.3597,
  center_lng double precision not null default 7.5978,
  radius_km numeric not null default 20 check (radius_km > 0),
  offer_types text[] not null default '{miete,kauf}',
  property_types text[] not null default '{wohnung,haus}',
  rent_max_warm numeric default 2200,
  buy_max_price numeric default 650000,
  min_rooms numeric not null default 4,
  min_area_m2 numeric default 95,
  require_home_office boolean not null default true,
  household text not null default '4-köpfige Familie (2 Erwachsene, 2 Kinder), ein Erwachsener arbeitet im Home-Office',
  must_haves text[] not null default '{}',
  nice_to_haves text[] not null default '{garten,balkon,stellplatz,keller}',
  search_places text[] not null default '{Koblenz,Lahnstein,Vallendar,Bendorf,Neuwied,Mülheim-Kärlich,Weißenthurm,Urmitz,Kaltenengers,Bassenheim,Kobern-Gondorf,Winningen,Rhens,Waldesch,Braubach,Bad Ems,Höhr-Grenzhausen,Andernach,Plaidt}',
  excluded_places text[] not null default '{}',
  notes text,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null,
  constraint offer_types_valid check (offer_types <@ array['miete', 'kauf']::text[]),
  constraint property_types_valid check (property_types <@ array['wohnung', 'haus']::text[])
);

create trigger search_profile_updated_at
  before update on public.search_profile
  for each row execute function public.set_updated_at();

insert into public.search_profile (id) values (1);

-- ---------------------------------------------------------------------------
-- Angebote
-- ---------------------------------------------------------------------------
create table public.listings (
  id uuid primary key default gen_random_uuid(),
  url text not null unique,
  source text not null,
  external_id text,
  title text not null,
  offer_type text not null check (offer_type in ('miete', 'kauf')),
  property_type text not null check (property_type in ('wohnung', 'haus')),
  price numeric check (price >= 0),          -- Kaltmiete (miete) bzw. Kaufpreis (kauf)
  price_warm numeric check (price_warm >= 0), -- Warmmiete, falls bekannt
  previous_price numeric,
  price_changed_at timestamptz,
  area_m2 numeric check (area_m2 > 0),
  plot_m2 numeric check (plot_m2 >= 0),
  rooms numeric check (rooms > 0),
  price_per_m2 numeric generated always as (
    case when area_m2 > 0 and price is not null then round(price / area_m2, 2) end
  ) stored,
  home_office text not null default 'unklar'
    check (home_office in ('ja', 'moeglich', 'unklar', 'nein')),
  city text,
  district text,
  postal_code text,
  address text,
  lat double precision,
  lng double precision,
  distance_km numeric,
  year_built int,
  energy_class text,
  features text[] not null default '{}',
  description text,
  image_url text,
  available_from text,
  provider text,
  score int check (score between 0 and 100),
  score_reasons text[] not null default '{}',
  ai_summary text,
  status text not null default 'aktiv' check (status in ('aktiv', 'weg')),
  pipeline text not null default 'neu'
    check (pipeline in ('neu', 'gemerkt', 'angefragt', 'besichtigung', 'aussortiert')),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  scored_at timestamptz,
  raw jsonb
);

create index listings_status_idx on public.listings (status);
create index listings_first_seen_idx on public.listings (first_seen_at desc);
create index listings_score_idx on public.listings (score desc nulls last);

-- ---------------------------------------------------------------------------
-- Feedback (pro Person und Angebot)
-- ---------------------------------------------------------------------------
create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  user_email text default lower(auth.jwt() ->> 'email'),
  rating smallint not null check (rating in (-1, 1, 2)), -- -1 passt nicht, 1 interessant, 2 Favorit
  reasons text[] not null default '{}',
  comment text check (char_length(comment) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (listing_id, user_id)
);

create index feedback_listing_idx on public.feedback (listing_id);
create index feedback_user_idx on public.feedback (user_id);

create trigger feedback_updated_at
  before update on public.feedback
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Lernstand (von der täglichen Aufgabe geschrieben)
-- ---------------------------------------------------------------------------
create table public.learned_preferences (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  feedback_count int not null default 0,
  summary text not null,
  rules jsonb not null default '{}'
);

-- ---------------------------------------------------------------------------
-- Suchläufe
-- ---------------------------------------------------------------------------
create table public.search_runs (
  id bigint generated always as identity primary key,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  sources jsonb not null default '[]',
  found_count int not null default 0,
  new_count int not null default 0,
  updated_count int not null default 0,
  gone_count int not null default 0,
  summary text
);

-- ---------------------------------------------------------------------------
-- Funktionen für die tägliche Aufgabe
-- ---------------------------------------------------------------------------

-- Fügt Angebote ein oder aktualisiert sie (Schlüssel: url).
-- items: JSON-Array von Objekten mit den Spaltennamen von public.listings.
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
      available_from, provider, score, score_reasons, ai_summary, scored_at, raw
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

-- Setzt Bewertungen neu. items: [{"id": "...", "score": 0-100, "score_reasons": [...], "ai_summary": "..."}]
create or replace function public.set_scores(items jsonb)
returns int
language plpgsql
set search_path = ''
as $$
declare
  n int;
begin
  update public.listings l set
    score = (x ->> 'score')::int,
    score_reasons = coalesce((select array_agg(r) from jsonb_array_elements_text(coalesce(x -> 'score_reasons', '[]'::jsonb)) r), '{}'),
    ai_summary = coalesce(nullif(x ->> 'ai_summary', ''), l.ai_summary),
    scored_at = now()
  from jsonb_array_elements(items) x
  where l.id = (x ->> 'id')::uuid;
  get diagnostics n = row_count;
  return n;
end;
$$;

-- Markiert Angebote als "weg", die seit p_days Tagen nicht mehr gesehen wurden.
create or replace function public.mark_stale_listings(p_days int default 14)
returns int
language plpgsql
set search_path = ''
as $$
declare
  n int;
begin
  update public.listings
  set status = 'weg'
  where status = 'aktiv' and last_seen_at < now() - make_interval(days => p_days);
  get diagnostics n = row_count;
  return n;
end;
$$;

-- Fasst das Feedback zusammen: Grundlage für das Lernen der Aufgabe und die Seite "Lernstand".
create or replace function public.learned_profile()
returns jsonb
language sql
stable
set search_path = ''
as $$
  with f as (
    select
      fb.rating, fb.reasons, fb.comment, fb.updated_at as rated_at, fb.user_email,
      l.id as listing_id, l.title, l.offer_type, l.property_type, l.price, l.price_warm,
      l.price_per_m2, l.area_m2, l.rooms, l.city, l.distance_km, l.features, l.home_office
    from public.feedback fb
    join public.listings l on l.id = fb.listing_id
  ),
  agg as (
    select listing_id, avg(rating)::numeric as avg_rating from f group by listing_id
  )
  select jsonb_build_object(
    'feedback_total', (select count(*) from f),
    'positiv', (select count(*) from f where rating > 0),
    'favoriten', (select count(*) from f where rating = 2),
    'negativ', (select count(*) from f where rating < 0),
    'bewertete_angebote', (select count(*) from agg),
    'nach_ort', coalesce((
      select jsonb_agg(jsonb_build_object('ort', city, 'positiv', pos, 'negativ', neg) order by pos + neg desc)
      from (
        select city, count(*) filter (where rating > 0) as pos, count(*) filter (where rating < 0) as neg
        from f where city is not null group by city
      ) s
    ), '[]'::jsonb),
    'nach_typ', coalesce((
      select jsonb_agg(jsonb_build_object('angebot', offer_type, 'objekt', property_type, 'positiv', pos, 'negativ', neg))
      from (
        select offer_type, property_type,
          count(*) filter (where rating > 0) as pos, count(*) filter (where rating < 0) as neg
        from f group by offer_type, property_type
      ) s
    ), '[]'::jsonb),
    'gruende_negativ', coalesce((
      select jsonb_agg(jsonb_build_object('grund', r, 'anzahl', n) order by n desc)
      from (select r, count(*) as n from f, unnest(f.reasons) r where rating < 0 group by r) s
    ), '[]'::jsonb),
    'gruende_positiv', coalesce((
      select jsonb_agg(jsonb_build_object('grund', r, 'anzahl', n) order by n desc)
      from (select r, count(*) as n from f, unnest(f.reasons) r where rating > 0 group by r) s
    ), '[]'::jsonb),
    'merkmale', coalesce((
      select jsonb_agg(jsonb_build_object('merkmal', m, 'positiv', pos, 'negativ', neg) order by pos + neg desc)
      from (
        select m, count(*) filter (where rating > 0) as pos, count(*) filter (where rating < 0) as neg
        from f, unnest(f.features) m group by m
      ) s
    ), '[]'::jsonb),
    'kennzahlen', coalesce((
      select jsonb_agg(jsonb_build_object(
        'angebot', offer_type,
        'bewertung', case when rating > 0 then 'positiv' else 'negativ' end,
        'anzahl', n,
        'preis_avg', preis_avg,
        'preis_max', preis_max,
        'preis_m2_avg', preis_m2_avg,
        'flaeche_avg', flaeche_avg,
        'zimmer_avg', zimmer_avg,
        'distanz_avg', distanz_avg
      ))
      from (
        select offer_type, sign(rating) as rating, count(*) as n,
          round(avg(coalesce(price_warm, price))) as preis_avg,
          max(coalesce(price_warm, price)) as preis_max,
          round(avg(price_per_m2), 2) as preis_m2_avg,
          round(avg(area_m2)) as flaeche_avg,
          round(avg(rooms), 1) as zimmer_avg,
          round(avg(distance_km), 1) as distanz_avg
        from f group by offer_type, sign(rating)
      ) s
    ), '[]'::jsonb),
    'kommentare', coalesce((
      select jsonb_agg(c order by (c ->> 'datum') desc)
      from (
        select jsonb_build_object(
          'datum', rated_at, 'bewertung', rating, 'titel', title, 'ort', city,
          'angebot', offer_type, 'gruende', reasons, 'kommentar', comment
        ) as c
        from f
        where comment is not null and comment <> ''
        order by rated_at desc
        limit 40
      ) s
    ), '[]'::jsonb)
  );
$$;

-- ---------------------------------------------------------------------------
-- Rechte & Row Level Security
-- ---------------------------------------------------------------------------
alter table public.app_members enable row level security;
alter table public.search_profile enable row level security;
alter table public.listings enable row level security;
alter table public.feedback enable row level security;
alter table public.learned_preferences enable row level security;
alter table public.search_runs enable row level security;

-- Anonyme Nutzer bekommen nichts.
revoke all on public.app_members, public.search_profile, public.listings, public.feedback,
  public.learned_preferences, public.search_runs from anon;

-- Eingeloggte Nutzer: nur die nötigen Rechte.
revoke all on public.listings, public.learned_preferences, public.search_runs, public.search_profile,
  public.app_members from authenticated;
grant select on public.listings, public.learned_preferences, public.search_runs, public.search_profile,
  public.app_members to authenticated;
grant update (pipeline) on public.listings to authenticated;
grant update (
  radius_km, offer_types, property_types, rent_max_warm, buy_max_price, min_rooms, min_area_m2,
  require_home_office, household, must_haves, nice_to_haves, search_places, excluded_places, notes, updated_by
) on public.search_profile to authenticated;
grant insert, delete on public.app_members to authenticated;
grant select, insert, update, delete on public.feedback to authenticated;

-- Funktionen: Schreibfunktionen nur für die Aufgabe (postgres), Lesefunktionen für Mitglieder.
revoke execute on function public.upsert_listings(jsonb) from public, anon, authenticated;
revoke execute on function public.set_scores(jsonb) from public, anon, authenticated;
revoke execute on function public.mark_stale_listings(int) from public, anon, authenticated;
revoke execute on function public.is_member() from public, anon;
grant execute on function public.is_member() to authenticated;
revoke execute on function public.learned_profile() from public, anon;
grant execute on function public.learned_profile() to authenticated;

-- Policies
create policy "Mitglieder sehen Mitglieder" on public.app_members
  for select to authenticated using ((select public.is_member()));
create policy "Mitglieder laden Mitglieder ein" on public.app_members
  for insert to authenticated with check ((select public.is_member()));
create policy "Mitglieder entfernen Mitglieder" on public.app_members
  for delete to authenticated using ((select public.is_member()));

create policy "Mitglieder lesen Suchprofil" on public.search_profile
  for select to authenticated using ((select public.is_member()));
create policy "Mitglieder ändern Suchprofil" on public.search_profile
  for update to authenticated using ((select public.is_member())) with check ((select public.is_member()));

create policy "Mitglieder lesen Angebote" on public.listings
  for select to authenticated using ((select public.is_member()));
create policy "Mitglieder setzen Status" on public.listings
  for update to authenticated using ((select public.is_member())) with check ((select public.is_member()));

create policy "Mitglieder lesen Feedback" on public.feedback
  for select to authenticated using ((select public.is_member()));
create policy "Eigenes Feedback anlegen" on public.feedback
  for insert to authenticated
  with check ((select public.is_member()) and user_id = (select auth.uid()));
create policy "Eigenes Feedback ändern" on public.feedback
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check ((select public.is_member()) and user_id = (select auth.uid()));
create policy "Eigenes Feedback löschen" on public.feedback
  for delete to authenticated using (user_id = (select auth.uid()));

create policy "Mitglieder lesen Lernstand" on public.learned_preferences
  for select to authenticated using ((select public.is_member()));
create policy "Mitglieder lesen Suchläufe" on public.search_runs
  for select to authenticated using ((select public.is_member()));
