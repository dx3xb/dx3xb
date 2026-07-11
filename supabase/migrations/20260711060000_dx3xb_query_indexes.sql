create index if not exists dx3xb_microapps_owner_updated_idx
  on public.dx3xb_microapps (owner_id, updated_at desc);
create index if not exists dx3xb_microapps_status_plays_idx
  on public.dx3xb_microapps (status, plays desc, created_at desc);
create index if not exists dx3xb_microapp_events_app_event_idx
  on public.dx3xb_microapp_events (microapp_id, event);
create index if not exists dx3xb_microapp_reports_app_created_idx
  on public.dx3xb_microapp_reports (microapp_id, created_at desc);
create index if not exists dx3xb_runs_user_created_idx
  on public.dx3xb_runs (user_id, created_at desc);
create index if not exists dx3xb_play_results_app_created_idx
  on public.dx3xb_play_results (microapp_id, created_at desc);
create index if not exists dx3xb_profiles_handle_lower_idx
  on public.dx3xb_profiles (lower(handle)) where handle is not null;
