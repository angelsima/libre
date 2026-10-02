-- =====================================================================
-- Rato — esquema completo del backend (Supabase / Postgres)
-- Es la unión exacta de las 3 migraciones aplicadas en el proyecto libre-app.
-- Para recrear el backend en un proyecto nuevo: SQL Editor → pega esto → Run.
-- =====================================================================

-- ######## Migración 1: tablas_y_privacidad ########

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  city text check (char_length(city) <= 60),
  emoji text not null default '🙂',
  color text not null default 'blue' check (color in ('blue','coral','mint','lilac','sun','pink')),
  onboarded boolean not null default false,
  created_at timestamptz not null default now()
);

-- Datos privados: solo los ve su dueño. El WhatsApp solo sale por available_friends().
create table public.profile_private (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  whatsapp text check (whatsapp is null or whatsapp ~ '^[0-9]{8,15}$'),
  invite_code text not null unique default substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)
);

-- Cada fila es "mi" visión de otra persona (mutua por construcción: siempre hay dos filas).
create table public.contacts (
  owner_id uuid not null references public.profiles(id) on delete cascade,
  friend_id uuid not null references public.profiles(id) on delete cascade,
  nickname text check (char_length(nickname) <= 40),
  is_close boolean not null default false,
  hide_my_status boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (owner_id, friend_id),
  check (owner_id <> friend_id)
);
create index contacts_friend_idx on public.contacts(friend_id);

-- Los grupos son etiquetas: sin chat, sin notificaciones.
create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 40),
  emoji text not null default '👯',
  invite_code text not null unique default substr(replace(gen_random_uuid()::text, '-', ''), 1, 10),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
create index group_members_user_idx on public.group_members(user_id);

create table public.statuses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  note text check (char_length(note) <= 80),
  city text check (char_length(city) <= 60),
  audience text not null default 'all' check (audience in ('all','close','group')),
  audience_group_id uuid references public.groups(id) on delete cascade,
  excluded_ids uuid[] not null default '{}',
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at),
  check (ends_at <= starts_at + interval '30 hours'),
  check (audience <> 'group' or audience_group_id is not null)
);
create index statuses_user_idx on public.statuses(user_id, ends_at);
create index statuses_ends_idx on public.statuses(ends_at);

alter table public.profiles enable row level security;
alter table public.profile_private enable row level security;
alter table public.contacts enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.statuses enable row level security;

create function public.is_group_member(p_group uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.group_members gm
    where gm.group_id = p_group and gm.user_id = (select auth.uid())
  );
$$;

create function public.can_see_status(p_owner uuid, p_audience text, p_group uuid, p_excluded uuid[])
returns boolean language sql stable security definer set search_path = ''
as $$
  select
    (select auth.uid()) is not null
    and p_owner <> (select auth.uid())
    and not ((select auth.uid()) = any(p_excluded))
    and exists (
      select 1 from public.contacts c
      where c.owner_id = p_owner
        and c.friend_id = (select auth.uid())
        and not c.hide_my_status
        and (
          p_audience = 'all'
          or (p_audience = 'close' and c.is_close)
          or (p_audience = 'group' and p_group is not null and exists (
                select 1 from public.group_members gm
                where gm.group_id = p_group and gm.user_id = (select auth.uid())))
        )
    );
$$;

revoke all on function public.is_group_member(uuid) from public, anon;
revoke all on function public.can_see_status(uuid, text, uuid, uuid[]) from public, anon;
grant execute on function public.is_group_member(uuid) to authenticated;
grant execute on function public.can_see_status(uuid, text, uuid, uuid[]) to authenticated;

create policy profiles_select on public.profiles for select to authenticated
using (
  id = (select auth.uid())
  or exists (select 1 from public.contacts c where c.owner_id = (select auth.uid()) and c.friend_id = profiles.id)
);
create policy profiles_update_own on public.profiles for update to authenticated
using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy profile_private_select_own on public.profile_private for select to authenticated
using (user_id = (select auth.uid()));
create policy profile_private_update_own on public.profile_private for update to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy contacts_select_own on public.contacts for select to authenticated
using (owner_id = (select auth.uid()));
create policy contacts_update_own on public.contacts for update to authenticated
using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

create policy groups_select_member on public.groups for select to authenticated
using (public.is_group_member(id));
create policy group_members_select_member on public.group_members for select to authenticated
using (public.is_group_member(group_id));

create policy statuses_select_own on public.statuses for select to authenticated
using (user_id = (select auth.uid()));
create policy statuses_insert_own on public.statuses for insert to authenticated
with check (
  user_id = (select auth.uid())
  and (audience_group_id is null or public.is_group_member(audience_group_id))
);
create policy statuses_update_own on public.statuses for update to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy statuses_delete_own on public.statuses for delete to authenticated
using (user_id = (select auth.uid()));

revoke all on public.profiles, public.profile_private, public.contacts,
              public.groups, public.group_members, public.statuses from anon, authenticated;

grant select on public.profiles to authenticated;
grant update (display_name, city, emoji, color, onboarded) on public.profiles to authenticated;
grant select on public.profile_private to authenticated;
grant update (whatsapp) on public.profile_private to authenticated;
grant select on public.contacts to authenticated;
grant update (nickname, is_close, hide_my_status) on public.contacts to authenticated;
grant select on public.groups, public.group_members to authenticated;
grant select, insert, delete on public.statuses to authenticated;
grant update (confirmed_at) on public.statuses to authenticated;

-- ######## Migración 2: funciones_y_rpc ########

create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  v_name text;
  v_emojis text[] := array['🦊','🐙','🌵','🍋','🦄','🐸','🍉','🦔','🐝','🌻','🍒','🐳','🥑','🪩','🛼'];
  v_colors text[] := array['blue','coral','mint','lilac','sun','pink'];
begin
  v_name := coalesce(
    nullif(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'name', ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Amig@'
  );
  insert into public.profiles (id, display_name, emoji, color)
  values (
    new.id,
    left(v_name, 40),
    v_emojis[1 + floor(random() * array_length(v_emojis, 1))::int],
    v_colors[1 + floor(random() * array_length(v_colors, 1))::int]
  );
  insert into public.profile_private (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

revoke all on function public.handle_new_user() from public, anon, authenticated;

create function public.statuses_guard()
returns trigger language plpgsql set search_path = ''
as $$
begin
  if new.ends_at <= now() then
    raise exception 'Ese rato ya ha terminado';
  end if;
  if new.starts_at > now() + interval '8 days' then
    raise exception 'Solo puedes marcar ratos hasta con 8 días de antelación';
  end if;
  if (select count(*) from public.statuses s where s.user_id = new.user_id and s.ends_at > now()) >= 40 then
    raise exception 'Tienes demasiados ratos activos. Borra alguno';
  end if;
  return new;
end;
$$;

create trigger statuses_guard_trg
before insert on public.statuses
for each row execute function public.statuses_guard();

revoke all on function public.statuses_guard() from public, anon, authenticated;

create function public.preview_invite(p_code text)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare r jsonb;
begin
  select jsonb_build_object('kind', 'person', 'name', p.display_name, 'emoji', p.emoji, 'color', p.color)
    into r
  from public.profile_private pp
  join public.profiles p on p.id = pp.user_id
  where pp.invite_code = lower(trim(p_code));
  if r is not null then return r; end if;

  select jsonb_build_object('kind', 'group', 'name', g.name, 'emoji', g.emoji,
           'members', (select count(*) from public.group_members gm where gm.group_id = g.id))
    into r
  from public.groups g
  where g.invite_code = lower(trim(p_code));
  return r;
end;
$$;

create function public.connect_by_code(p_code text)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  v_me uuid := auth.uid();
  v_friend uuid;
  v_name text;
begin
  if v_me is null then raise exception 'Inicia sesión primero'; end if;

  select pp.user_id, p.display_name into v_friend, v_name
  from public.profile_private pp
  join public.profiles p on p.id = pp.user_id
  where pp.invite_code = lower(trim(p_code));

  if v_friend is null then raise exception 'Este enlace no es válido'; end if;
  if v_friend = v_me then raise exception 'Ese es tu propio enlace'; end if;

  insert into public.contacts (owner_id, friend_id)
  values (v_me, v_friend), (v_friend, v_me)
  on conflict do nothing;

  return jsonb_build_object('id', v_friend, 'name', v_name);
end;
$$;

create function public.create_group(p_name text, p_emoji text default '👯')
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  v_me uuid := auth.uid();
  v_id uuid;
  v_code text;
begin
  if v_me is null then raise exception 'Inicia sesión primero'; end if;
  if char_length(trim(coalesce(p_name, ''))) < 1 then raise exception 'Ponle nombre al grupo'; end if;
  if (select count(*) from public.group_members gm where gm.user_id = v_me) >= 30 then
    raise exception 'Has llegado al máximo de 30 grupos';
  end if;

  insert into public.groups (name, emoji, created_by)
  values (left(trim(p_name), 40), coalesce(nullif(trim(p_emoji), ''), '👯'), v_me)
  returning id, invite_code into v_id, v_code;

  insert into public.group_members (group_id, user_id) values (v_id, v_me);
  return jsonb_build_object('id', v_id, 'invite_code', v_code);
end;
$$;

create function public.join_group_by_code(p_code text)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  v_me uuid := auth.uid();
  v_gid uuid;
  v_name text;
begin
  if v_me is null then raise exception 'Inicia sesión primero'; end if;

  select g.id, g.name into v_gid, v_name from public.groups g where g.invite_code = lower(trim(p_code));
  if v_gid is null then raise exception 'Este enlace de grupo no es válido'; end if;

  if not exists (select 1 from public.group_members gm where gm.group_id = v_gid and gm.user_id = v_me)
     and (select count(*) from public.group_members gm where gm.group_id = v_gid) >= 100 then
    raise exception 'El grupo está lleno (máximo 100 personas)';
  end if;

  insert into public.group_members (group_id, user_id) values (v_gid, v_me) on conflict do nothing;

  insert into public.contacts (owner_id, friend_id)
  select v_me, gm.user_id from public.group_members gm
  where gm.group_id = v_gid and gm.user_id <> v_me
  on conflict do nothing;

  insert into public.contacts (owner_id, friend_id)
  select gm.user_id, v_me from public.group_members gm
  where gm.group_id = v_gid and gm.user_id <> v_me
  on conflict do nothing;

  return jsonb_build_object('id', v_gid, 'name', v_name);
end;
$$;

create function public.leave_group(p_group uuid)
returns void language plpgsql security definer set search_path = ''
as $$
declare v_me uuid := auth.uid();
begin
  if v_me is null then raise exception 'Inicia sesión primero'; end if;
  delete from public.statuses s where s.user_id = v_me and s.audience_group_id = p_group;
  delete from public.group_members gm where gm.group_id = p_group and gm.user_id = v_me;
  if not exists (select 1 from public.group_members gm where gm.group_id = p_group) then
    delete from public.groups g where g.id = p_group;
  end if;
end;
$$;

create function public.remove_contact(p_friend uuid)
returns void language plpgsql security definer set search_path = ''
as $$
declare v_me uuid := auth.uid();
begin
  if v_me is null then raise exception 'Inicia sesión primero'; end if;
  delete from public.contacts c
  where (c.owner_id = v_me and c.friend_id = p_friend)
     or (c.owner_id = p_friend and c.friend_id = v_me);
end;
$$;

create function public.available_friends(
  p_from timestamptz default now(),
  p_to timestamptz default now() + interval '8 days'
)
returns table (
  status_id uuid, user_id uuid, display_name text, emoji text, color text, city text,
  starts_at timestamptz, ends_at timestamptz, note text, whatsapp text, is_close boolean, shared_groups text[]
)
language sql stable security definer set search_path = ''
as $$
  select
    s.id,
    s.user_id,
    coalesce(nullif(mine.nickname, ''), p.display_name),
    p.emoji,
    p.color,
    coalesce(s.city, p.city),
    s.starts_at,
    s.ends_at,
    s.note,
    pp.whatsapp,
    mine.is_close,
    coalesce((
      select array_agg(g.name order by g.name)
      from public.groups g
      join public.group_members a on a.group_id = g.id and a.user_id = s.user_id
      join public.group_members b on b.group_id = g.id and b.user_id = (select auth.uid())
    ), '{}'::text[])
  from public.statuses s
  join public.profiles p on p.id = s.user_id
  join public.profile_private pp on pp.user_id = s.user_id
  join public.contacts mine on mine.owner_id = (select auth.uid()) and mine.friend_id = s.user_id
  where s.ends_at > greatest(p_from, now())
    and s.starts_at < p_to
    and public.can_see_status(s.user_id, s.audience, s.audience_group_id, s.excluded_ids)
  order by s.starts_at, p.display_name;
$$;

create function public.delete_my_account()
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'Inicia sesión primero'; end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.preview_invite(text) from public, anon;
revoke all on function public.connect_by_code(text) from public, anon;
revoke all on function public.create_group(text, text) from public, anon;
revoke all on function public.join_group_by_code(text) from public, anon;
revoke all on function public.leave_group(uuid) from public, anon;
revoke all on function public.remove_contact(uuid) from public, anon;
revoke all on function public.available_friends(timestamptz, timestamptz) from public, anon;
revoke all on function public.delete_my_account() from public, anon;

grant execute on function public.preview_invite(text) to anon, authenticated;
grant execute on function public.connect_by_code(text) to authenticated;
grant execute on function public.create_group(text, text) to authenticated;
grant execute on function public.join_group_by_code(text) to authenticated;
grant execute on function public.leave_group(uuid) to authenticated;
grant execute on function public.remove_contact(uuid) to authenticated;
grant execute on function public.available_friends(timestamptz, timestamptz) to authenticated;
grant execute on function public.delete_my_account() to authenticated;

-- ######## Migración 3: cerrar_can_see_status ########
-- can_see_status es interno: solo lo usa available_friends() (que corre como propietario).
-- Si los usuarios pudieran llamarlo, podrían deducir que alguien les ha ocultado su estado.
revoke execute on function public.can_see_status(uuid, text, uuid, uuid[]) from authenticated;
