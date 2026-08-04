-- AI Adventure phases 2-4: aggregate game stats, classroom challenges and four new official games.
create table if not exists public.dx3xb_classrooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z2-9]{6}$'),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 60),
  pack text not null check (pack in ('ai-foundations','algorithms-and-society','full-adventure')),
  status text not null default 'active' check (status in ('active','closed')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '14 days')
);

create index if not exists dx3xb_classrooms_owner_created_idx
  on public.dx3xb_classrooms(owner_id, created_at desc);
create index if not exists dx3xb_classrooms_active_code_idx
  on public.dx3xb_classrooms(code) where status = 'active';
create index if not exists dx3xb_runs_class_code_idx
  on public.dx3xb_runs using gin (stats jsonb_path_ops)
  where stats ? 'classCode';
create index if not exists dx3xb_runs_ai_game_created_idx
  on public.dx3xb_runs(game, created_at desc)
  where game in ('ai-truth-detective','data-monster','prompt-commander','recommendation-tamer','ai-court');

alter table public.dx3xb_classrooms enable row level security;
revoke all on public.dx3xb_classrooms from anon, authenticated;
grant all on public.dx3xb_classrooms to service_role;

create or replace function public.dx3xb_ai_game_stats(p_game text)
returns table(play_count bigint, avg_mastery integer, daily_count bigint)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_game not in ('ai-truth-detective','data-monster','prompt-commander','recommendation-tamer','ai-court') then
    raise exception 'unsupported game';
  end if;
  return query
    select
      count(*)::bigint,
      coalesce(round(avg(greatest(0, least(100, r.pct)))), 0)::integer,
      count(*) filter (
        where r.stats->>'dailyDate' = ((now() at time zone 'Asia/Shanghai')::date)::text
      )::bigint
    from public.dx3xb_runs r
    where r.game = p_game;
end;
$$;

revoke all on function public.dx3xb_ai_game_stats(text) from public, anon;
grant execute on function public.dx3xb_ai_game_stats(text) to authenticated, service_role;

insert into public.dx3xb_toys (
  slug, title_zh, title_en, desc_zh, desc_en, icon, type, url, status, sort_order
) values
  ('data-monster','数据怪兽训练营','Data Monster Camp','给怪兽贴标签，真实训练并测试一个分类器','Label monsters, then train and test a real classifier','🧬','internal','https://data-monster.dx3xb.com','live',41),
  ('prompt-commander','提示词指挥官','Prompt Commander','把模糊要求变成可执行、可检验的任务指令','Turn vague wishes into executable, testable instructions','⌨️','internal','https://prompt-commander.dx3xb.com','live',42),
  ('recommendation-tamer','推荐算法驯兽师','Recommendation Tamer','观察反馈循环，再主动拓宽你的信息流','Watch a feedback loop form, then widen your feed','🧭','internal','https://recommendation-tamer.dx3xb.com','live',43),
  ('ai-court','AI 法庭','AI Court','在准确率之外审理算法的公平与责任','Judge algorithmic fairness and responsibility beyond accuracy','⚖️','internal','https://ai-court.dx3xb.com','live',44)
on conflict (slug) do update set
  title_zh = excluded.title_zh,
  title_en = excluded.title_en,
  desc_zh = excluded.desc_zh,
  desc_en = excluded.desc_en,
  icon = excluded.icon,
  type = excluded.type,
  url = excluded.url,
  status = excluded.status,
  sort_order = excluded.sort_order;
