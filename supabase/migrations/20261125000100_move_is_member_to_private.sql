-- is_member() aus dem öffentlich erreichbaren API-Schema herausnehmen.
-- Die Policies referenzieren die Funktion per OID und funktionieren unverändert weiter.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;
alter function public.is_member() set schema private;
revoke execute on function private.is_member() from public, anon;
grant execute on function private.is_member() to authenticated;
