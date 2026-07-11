create table if not exists public.dx3xb_ai_daily_usage (
  user_id uuid not null,
  usage_date date not null default (timezone('utc', now()))::date,
  scope text not null check (scope in ('generate', 'workshop')),
  used integer not null default 0 check (used >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, usage_date, scope)
);

create table if not exists public.dx3xb_ai_requests (
  request_id uuid primary key,
  user_id uuid not null,
  scope text not null check (scope in ('generate', 'workshop')),
  microapp_id uuid null references public.dx3xb_microapps(id) on delete cascade,
  input_hash text not null check (length(input_hash) = 64),
  status text not null check (status in ('running', 'succeeded', 'failed')),
  reserved_at timestamptz not null default now(),
  expires_at timestamptz not null,
  finished_at timestamptz null
);

create index if not exists dx3xb_ai_requests_user_reserved_idx
  on public.dx3xb_ai_requests (user_id, reserved_at desc);
create unique index if not exists dx3xb_ai_requests_one_running_per_user
  on public.dx3xb_ai_requests (user_id) where status = 'running';

create table if not exists public.dx3xb_workshop_turns (
  microapp_id uuid primary key references public.dx3xb_microapps(id) on delete cascade,
  count integer not null default 0 check (count >= 0),
  updated_at timestamptz not null default now()
);
create unique index if not exists dx3xb_workshop_turns_microapp_idx
  on public.dx3xb_workshop_turns (microapp_id);

alter table public.dx3xb_ai_daily_usage enable row level security;
alter table public.dx3xb_ai_requests enable row level security;
alter table public.dx3xb_workshop_turns enable row level security;

revoke all on public.dx3xb_ai_daily_usage from anon, authenticated;
revoke all on public.dx3xb_ai_requests from anon, authenticated;
revoke all on public.dx3xb_workshop_turns from anon, authenticated;
grant all on public.dx3xb_ai_daily_usage to service_role;
grant all on public.dx3xb_ai_requests to service_role;
grant all on public.dx3xb_workshop_turns to service_role;

create or replace function public.dx3xb_reserve_ai_request(
  p_request_id uuid,
  p_user_id uuid,
  p_scope text,
  p_input_hash text,
  p_daily_limit integer,
  p_microapp_id uuid default null,
  p_app_limit integer default null
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_today date := (timezone('utc', now()))::date;
  v_daily_used integer := 0;
  v_app_used integer := null;
begin
  if p_scope not in ('generate', 'workshop') or p_daily_limit < 1 or length(p_input_hash) <> 64 then
    return jsonb_build_object('ok', false, 'status', 'invalid');
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 873221));

  if exists(select 1 from public.dx3xb_ai_requests where request_id = p_request_id) then
    return jsonb_build_object('ok', false, 'status', 'duplicate');
  end if;

  update public.dx3xb_ai_requests
     set status = 'failed', finished_at = now()
   where user_id = p_user_id and status = 'running' and expires_at <= now();

  if exists(select 1 from public.dx3xb_ai_requests where user_id = p_user_id and status = 'running') then
    return jsonb_build_object('ok', false, 'status', 'busy');
  end if;

  select used into v_daily_used
    from public.dx3xb_ai_daily_usage
   where user_id = p_user_id and usage_date = v_today and scope = p_scope;
  v_daily_used := coalesce(v_daily_used, 0);
  if v_daily_used >= p_daily_limit then
    return jsonb_build_object('ok', false, 'status', 'daily_limit', 'dailyUsed', v_daily_used, 'dailyRemaining', 0);
  end if;

  if p_microapp_id is not null and p_app_limit is not null then
    select count into v_app_used from public.dx3xb_workshop_turns where microapp_id = p_microapp_id;
    v_app_used := coalesce(v_app_used, 0);
    if v_app_used >= p_app_limit then
      return jsonb_build_object('ok', false, 'status', 'app_limit', 'dailyUsed', v_daily_used, 'dailyRemaining', p_daily_limit - v_daily_used, 'appUsed', v_app_used);
    end if;
    insert into public.dx3xb_workshop_turns (microapp_id, count, updated_at)
      values (p_microapp_id, 1, now())
      on conflict (microapp_id) do update set count = public.dx3xb_workshop_turns.count + 1, updated_at = now()
      returning count into v_app_used;
  end if;

  insert into public.dx3xb_ai_daily_usage (user_id, usage_date, scope, used, updated_at)
    values (p_user_id, v_today, p_scope, 1, now())
    on conflict (user_id, usage_date, scope)
    do update set used = public.dx3xb_ai_daily_usage.used + 1, updated_at = now()
    returning used into v_daily_used;

  insert into public.dx3xb_ai_requests (request_id, user_id, scope, microapp_id, input_hash, status, expires_at)
    values (p_request_id, p_user_id, p_scope, p_microapp_id, p_input_hash, 'running', now() + interval '2 minutes');

  return jsonb_build_object(
    'ok', true,
    'status', 'reserved',
    'dailyUsed', v_daily_used,
    'dailyRemaining', greatest(0, p_daily_limit - v_daily_used),
    'appUsed', v_app_used
  );
end;
$$;

create or replace function public.dx3xb_finish_ai_request(
  p_request_id uuid,
  p_user_id uuid,
  p_status text
) returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_status not in ('succeeded', 'failed') then
    return false;
  end if;
  update public.dx3xb_ai_requests
     set status = p_status, finished_at = now(), expires_at = now()
   where request_id = p_request_id and user_id = p_user_id and status = 'running';
  return found;
end;
$$;

revoke all on function public.dx3xb_reserve_ai_request(uuid, uuid, text, text, integer, uuid, integer) from public, anon, authenticated;
revoke all on function public.dx3xb_finish_ai_request(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.dx3xb_reserve_ai_request(uuid, uuid, text, text, integer, uuid, integer) to service_role;
grant execute on function public.dx3xb_finish_ai_request(uuid, uuid, text) to service_role;
