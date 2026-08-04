-- Support the distributed guestbook write limiter without scanning the table.
create index if not exists dx3xb_guestbook_ip_created_at_idx
  on public.dx3xb_guestbook (ip, created_at desc)
  where ip is not null;
