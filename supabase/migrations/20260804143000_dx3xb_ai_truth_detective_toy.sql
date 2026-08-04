-- Register the first AI Adventure mission after its independent subdomain is deployed.
insert into public.dx3xb_toys (
  slug,
  title_zh,
  title_en,
  desc_zh,
  desc_en,
  icon,
  type,
  url,
  status,
  sort_order
) values (
  'ai-truth-detective',
  'AI 侦探社：谁在胡说',
  'AI Detective: Who Is Bluffing?',
  '5 个案件，找出 AI 最不可靠的那句话',
  'Crack five cases and catch the weakest AI claim',
  '🔎',
  'internal',
  'https://ai-detective.dx3xb.com',
  'live',
  40
)
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
