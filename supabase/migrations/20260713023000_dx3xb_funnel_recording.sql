create or replace function public.dx3xb_record_funnel_event(
  p_event text,
  p_user_id uuid default null,
  p_microapp_id uuid default null,
  p_request_id uuid default null
) returns boolean
language plpgsql security definer set search_path = public, dx3xb_private, pg_temp as $$
begin
  if p_event not in ('workshop_enter','generation_start','generation_success') then return false; end if;
  insert into dx3xb_private.funnel_events(user_id, microapp_id, event, request_id)
    values (p_user_id, p_microapp_id, p_event, p_request_id);
  return true;
end;
$$;
revoke all on function public.dx3xb_record_funnel_event(text,uuid,uuid,uuid) from public, anon, authenticated;
grant execute on function public.dx3xb_record_funnel_event(text,uuid,uuid,uuid) to service_role;

create or replace function dx3xb_private.record_first_player_or_share() returns trigger
language plpgsql security definer set search_path = public, dx3xb_private, pg_temp as $$
declare
  v_event text;
  v_owner uuid;
begin
  v_event := case when new.event = 'start' then 'first_player' when new.event = 'share' then 'first_share' else null end;
  if v_event is null then return new; end if;
  select owner_id into v_owner from public.dx3xb_microapps where id = new.microapp_id;
  insert into dx3xb_private.funnel_events(user_id, microapp_id, event)
    values (v_owner, new.microapp_id, v_event) on conflict do nothing;
  if found then
    insert into public.dx3xb_creator_notifications(user_id, kind, microapp_id)
      values (v_owner, v_event, new.microapp_id);
  end if;
  return new;
end;
$$;
drop trigger if exists dx3xb_record_first_player_or_share on public.dx3xb_microapp_events;
create trigger dx3xb_record_first_player_or_share after insert on public.dx3xb_microapp_events
for each row execute function dx3xb_private.record_first_player_or_share();
