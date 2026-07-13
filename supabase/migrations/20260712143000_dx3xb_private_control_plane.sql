create schema if not exists dx3xb_private;
revoke all on schema dx3xb_private from public, anon, authenticated;
grant usage on schema dx3xb_private to service_role;

do $$
begin
  if to_regclass('public.dx3xb_ai_daily_usage') is not null then
    alter table public.dx3xb_ai_daily_usage set schema dx3xb_private;
  end if;
  if to_regclass('public.dx3xb_ai_requests') is not null then
    alter table public.dx3xb_ai_requests set schema dx3xb_private;
  end if;
  if to_regclass('public.dx3xb_workshop_turns') is not null then
    alter table public.dx3xb_workshop_turns set schema dx3xb_private;
  end if;
end;
$$;

create table if not exists dx3xb_private.play_sessions (
  session_id uuid primary key,
  microapp_id uuid not null references public.dx3xb_microapps(id) on delete cascade,
  fingerprint_hash text not null check (length(fingerprint_hash) = 64),
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null,
  completed_at timestamptz null
);
create index if not exists play_sessions_app_issued_idx
  on dx3xb_private.play_sessions (microapp_id, issued_at desc);
create index if not exists play_sessions_expiry_idx
  on dx3xb_private.play_sessions (expires_at);

alter table public.dx3xb_microapp_events
  add column if not exists play_session_id uuid null references dx3xb_private.play_sessions(session_id) on delete set null;
create unique index if not exists dx3xb_events_one_per_play_session
  on public.dx3xb_microapp_events (play_session_id, event)
  where play_session_id is not null and event in ('start', 'complete', 'share');

alter table public.dx3xb_play_results
  add column if not exists play_session_id uuid null references dx3xb_private.play_sessions(session_id) on delete set null;
create unique index if not exists dx3xb_results_one_per_play_session
  on public.dx3xb_play_results (play_session_id)
  where play_session_id is not null;

alter table public.dx3xb_microapp_reports
  add column if not exists fingerprint_hash text null;
create unique index if not exists dx3xb_reports_app_fingerprint_day
  on public.dx3xb_microapp_reports (microapp_id, fingerprint_hash, ((created_at at time zone 'utc')::date))
  where fingerprint_hash is not null;

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
set search_path = public, dx3xb_private, pg_temp
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
  if exists(select 1 from dx3xb_private.dx3xb_ai_requests where request_id = p_request_id) then
    return jsonb_build_object('ok', false, 'status', 'duplicate');
  end if;
  update dx3xb_private.dx3xb_ai_requests
     set status = 'failed', finished_at = now()
   where user_id = p_user_id and status = 'running' and expires_at <= now();
  if exists(select 1 from dx3xb_private.dx3xb_ai_requests where user_id = p_user_id and status = 'running') then
    return jsonb_build_object('ok', false, 'status', 'busy');
  end if;
  select used into v_daily_used
    from dx3xb_private.dx3xb_ai_daily_usage
   where user_id = p_user_id and usage_date = v_today and scope = p_scope;
  v_daily_used := coalesce(v_daily_used, 0);
  if v_daily_used >= p_daily_limit then
    return jsonb_build_object('ok', false, 'status', 'daily_limit', 'dailyUsed', v_daily_used, 'dailyRemaining', 0);
  end if;
  if p_microapp_id is not null and p_app_limit is not null then
    select count into v_app_used from dx3xb_private.dx3xb_workshop_turns where microapp_id = p_microapp_id;
    v_app_used := coalesce(v_app_used, 0);
    if v_app_used >= p_app_limit then
      return jsonb_build_object('ok', false, 'status', 'app_limit', 'dailyUsed', v_daily_used, 'dailyRemaining', p_daily_limit - v_daily_used, 'appUsed', v_app_used);
    end if;
    insert into dx3xb_private.dx3xb_workshop_turns (microapp_id, count, updated_at)
      values (p_microapp_id, 1, now())
      on conflict (microapp_id) do update set count = dx3xb_private.dx3xb_workshop_turns.count + 1, updated_at = now()
      returning count into v_app_used;
  end if;
  insert into dx3xb_private.dx3xb_ai_daily_usage (user_id, usage_date, scope, used, updated_at)
    values (p_user_id, v_today, p_scope, 1, now())
    on conflict (user_id, usage_date, scope)
    do update set used = dx3xb_private.dx3xb_ai_daily_usage.used + 1, updated_at = now()
    returning used into v_daily_used;
  insert into dx3xb_private.dx3xb_ai_requests (request_id, user_id, scope, microapp_id, input_hash, status, expires_at)
    values (p_request_id, p_user_id, p_scope, p_microapp_id, p_input_hash, 'running', now() + interval '2 minutes');
  return jsonb_build_object('ok', true, 'status', 'reserved', 'dailyUsed', v_daily_used,
    'dailyRemaining', greatest(0, p_daily_limit - v_daily_used), 'appUsed', v_app_used);
end;
$$;

create or replace function public.dx3xb_finish_ai_request(
  p_request_id uuid,
  p_user_id uuid,
  p_status text
) returns boolean
language plpgsql
security definer
set search_path = public, dx3xb_private, pg_temp
as $$
declare
  v_scope text;
  v_microapp_id uuid;
begin
  if p_status not in ('succeeded', 'failed') then return false; end if;
  update dx3xb_private.dx3xb_ai_requests
     set status = p_status, finished_at = now(), expires_at = now()
   where request_id = p_request_id and user_id = p_user_id and status = 'running'
   returning scope, microapp_id into v_scope, v_microapp_id;
  if not found then return false; end if;
  if p_status = 'failed' then
    update dx3xb_private.dx3xb_ai_daily_usage
       set used = greatest(0, used - 1), updated_at = now()
     where user_id = p_user_id and usage_date = (timezone('utc', now()))::date and scope = v_scope;
    if v_microapp_id is not null then
      update dx3xb_private.dx3xb_workshop_turns
         set count = greatest(0, count - 1), updated_at = now()
       where microapp_id = v_microapp_id;
    end if;
  end if;
  return true;
end;
$$;

create or replace function dx3xb_private.cleanup_expired_data() returns void
language plpgsql
security definer
set search_path = public, dx3xb_private, pg_temp
as $$
begin
  delete from public.dx3xb_play_results where created_at < now() - interval '24 hours';
  delete from dx3xb_private.play_sessions where expires_at < now() - interval '24 hours';
  delete from dx3xb_private.dx3xb_ai_requests where reserved_at < now() - interval '30 days';
  delete from dx3xb_private.dx3xb_ai_daily_usage where usage_date < (timezone('utc', now()))::date - 90;
end;
$$;

create or replace function public.dx3xb_create_play_session(
  p_session_id uuid,
  p_microapp_id uuid,
  p_fingerprint_hash text,
  p_expires_at timestamptz
) returns boolean
language plpgsql
security definer
set search_path = public, dx3xb_private, pg_temp
as $$
begin
  if length(p_fingerprint_hash) <> 64 or p_expires_at <= now() or p_expires_at > now() + interval '3 hours' then
    return false;
  end if;
  insert into dx3xb_private.play_sessions(session_id, microapp_id, fingerprint_hash, expires_at)
    values (p_session_id, p_microapp_id, p_fingerprint_hash, p_expires_at);
  insert into public.dx3xb_microapp_events(microapp_id, event, session_id, play_session_id)
    values (p_microapp_id, 'start', p_session_id::text, p_session_id);
  update public.dx3xb_microapps set plays = plays + 1 where id = p_microapp_id;
  return found;
exception when unique_violation then
  return false;
end;
$$;

create or replace function public.dx3xb_accept_play_event(
  p_session_id uuid,
  p_microapp_id uuid,
  p_event text
) returns boolean
language plpgsql
security definer
set search_path = public, dx3xb_private, pg_temp
as $$
begin
  if p_event not in ('complete', 'share') or not exists (
    select 1 from dx3xb_private.play_sessions
     where session_id = p_session_id and microapp_id = p_microapp_id and expires_at > now()
  ) then return false; end if;
  insert into public.dx3xb_microapp_events(microapp_id, event, session_id, play_session_id)
    values (p_microapp_id, p_event, p_session_id::text, p_session_id);
  if p_event = 'complete' then
    update dx3xb_private.play_sessions set completed_at = coalesce(completed_at, now()) where session_id = p_session_id;
  end if;
  return true;
exception when unique_violation then
  return true;
end;
$$;

create or replace function public.dx3xb_save_play_result(
  p_session_id uuid,
  p_microapp_id uuid,
  p_label text,
  p_score integer
) returns boolean
language plpgsql
security definer
set search_path = public, dx3xb_private, pg_temp
as $$
begin
  if not exists (
    select 1 from dx3xb_private.play_sessions
     where session_id = p_session_id and microapp_id = p_microapp_id and expires_at > now()
  ) then return false; end if;
  insert into public.dx3xb_play_results(microapp_id, label, score, play_session_id)
    values (p_microapp_id, left(p_label, 60), p_score, p_session_id);
  return true;
exception when unique_violation then
  return true;
end;
$$;

create extension if not exists pg_cron with schema pg_catalog;
do $$
begin
  if not exists (select 1 from cron.job where jobname = 'dx3xb-expired-data-cleanup') then
    perform cron.schedule('dx3xb-expired-data-cleanup', '17 * * * *', 'select dx3xb_private.cleanup_expired_data()');
  end if;
end;
$$;

revoke all on all tables in schema dx3xb_private from public, anon, authenticated;
revoke all on all functions in schema dx3xb_private from public, anon, authenticated;
grant all on all tables in schema dx3xb_private to service_role;
grant execute on function dx3xb_private.cleanup_expired_data() to service_role;
revoke all on function public.dx3xb_reserve_ai_request(uuid, uuid, text, text, integer, uuid, integer) from public, anon, authenticated;
revoke all on function public.dx3xb_finish_ai_request(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.dx3xb_reserve_ai_request(uuid, uuid, text, text, integer, uuid, integer) to service_role;
grant execute on function public.dx3xb_finish_ai_request(uuid, uuid, text) to service_role;
revoke all on function public.dx3xb_create_play_session(uuid, uuid, text, timestamptz) from public, anon, authenticated;
revoke all on function public.dx3xb_accept_play_event(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.dx3xb_save_play_result(uuid, uuid, text, integer) from public, anon, authenticated;
grant execute on function public.dx3xb_create_play_session(uuid, uuid, text, timestamptz) to service_role;
grant execute on function public.dx3xb_accept_play_event(uuid, uuid, text) to service_role;
grant execute on function public.dx3xb_save_play_result(uuid, uuid, text, integer) to service_role;
revoke all on function public.dx3xb_bump_play(text) from public, anon, authenticated;
grant execute on function public.dx3xb_bump_play(text) to service_role;
drop policy if exists "microapp events insert any" on public.dx3xb_microapp_events;
drop policy if exists "report insert any" on public.dx3xb_microapp_reports;
revoke insert on public.dx3xb_microapp_events from anon, authenticated;
revoke insert on public.dx3xb_microapp_reports from anon, authenticated;
