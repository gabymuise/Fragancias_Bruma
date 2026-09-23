-- Ejecutar completo en SQL Editor de Supabase, como postgres.
-- Crea un negocio compartido vacío. Reejecutar no borra datos.
begin;
create table if not exists public.bruma_members (
 user_id uuid primary key references auth.users(id) on delete cascade,
 created_at timestamptz not null default now()
);
create table if not exists public.bruma_state (
 id integer primary key check (id=1),
 payload jsonb not null,
 revision bigint not null default 0 check(revision>=0),
 updated_by uuid references auth.users(id) on delete set null,
 updated_at timestamptz not null default now()
);
alter table public.bruma_members enable row level security;
alter table public.bruma_state enable row level security;
revoke all on public.bruma_members, public.bruma_state from public, anon, authenticated;
grant usage on schema public to authenticated;
grant select on public.bruma_members, public.bruma_state to authenticated;
drop policy if exists bruma_members_self on public.bruma_members;
create policy bruma_members_self on public.bruma_members for select to authenticated
 using (user_id=(select auth.uid()));
drop policy if exists bruma_read on public.bruma_state;
create policy bruma_read on public.bruma_state for select to authenticated
 using (exists(select 1 from public.bruma_members m where m.user_id=(select auth.uid())));
insert into public.bruma_state(id,payload) values (1,
 '{"app":"Fragancias Bruma","version":1,"updatedAt":null,"products":[],"purchases":[],"productions":[],"sales":[],"expenses":[],"adjustments":[]}'::jsonb)
on conflict(id) do nothing;

-- Escritura atómica: solo miembros y solo si no cambió la versión leída.
-- El frontend conserva la validación contable de la aplicación original.
create or replace function public.bruma_save(p_payload jsonb,p_expected_revision bigint)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
 k text;
 new_revision bigint;
 stamp timestamptz := clock_timestamp();
begin
 if auth.uid() is null or not exists(select 1 from public.bruma_members where user_id=auth.uid()) then
  raise exception 'BRUMA_FORBIDDEN' using errcode='42501';
 end if;
 if p_payload is null or jsonb_typeof(p_payload) is distinct from 'object'
  or (p_payload->>'app') is distinct from 'Fragancias Bruma'
  or (p_payload->>'version') is distinct from '1' then
  raise exception 'Respaldo incompatible';
 end if;
 if octet_length(p_payload::text)>20971520 then raise exception 'El respaldo supera 20 MB'; end if;
 foreach k in array array['products','purchases','productions','sales','expenses','adjustments'] loop
  if jsonb_typeof(p_payload->k) is distinct from 'array' then raise exception 'Sección inválida: %',k; end if;
  if jsonb_array_length(p_payload->k)>100000 then raise exception 'Demasiados registros: %',k; end if;
 end loop;
 update public.bruma_state set
  payload=jsonb_set(p_payload,'{updatedAt}',to_jsonb(stamp)),
  revision=revision+1,updated_at=stamp,updated_by=auth.uid()
 where id=1 and revision=p_expected_revision
 returning revision into new_revision;
 if not found then raise exception 'BRUMA_CONFLICT' using errcode='P0002'; end if;
 return jsonb_build_object('revision',new_revision,'updatedAt',stamp);
end;
$$;
revoke all on function public.bruma_save(jsonb,bigint) from public,anon,authenticated;
grant execute on function public.bruma_save(jsonb,bigint) to authenticated;
notify pgrst,'reload schema';
commit;
