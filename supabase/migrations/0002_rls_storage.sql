-- Storage 버킷
insert into storage.buckets (id, name, public)
values
  ('public-assets', 'public-assets', true),
  ('products', 'products', true)
on conflict (id) do nothing;

-- RLS 활성화
alter table site_settings enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;

-- 공개 읽기
create policy "public read settings" on site_settings for select using (true);
create policy "public read categories" on categories for select using (true);
create policy "public read products" on products for select using (true);
create policy "public read product_images" on product_images for select using (true);

-- 인증 사용자(관리자) 쓰기
create policy "admin write settings" on site_settings for all
  to authenticated using (true) with check (true);
create policy "admin write categories" on categories for all
  to authenticated using (true) with check (true);
create policy "admin write products" on products for all
  to authenticated using (true) with check (true);
create policy "admin write product_images" on product_images for all
  to authenticated using (true) with check (true);

-- Storage: 공개 읽기, 인증 사용자 쓰기
create policy "public read assets" on storage.objects for select
  using (bucket_id in ('public-assets', 'products'));
create policy "admin write assets" on storage.objects for all
  to authenticated using (bucket_id in ('public-assets', 'products'))
  with check (bucket_id in ('public-assets', 'products'));
