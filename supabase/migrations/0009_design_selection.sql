alter table categories
  add column if not exists design_enabled boolean not null default false;

alter table orders
  add column if not exists design_image_url text not null default '';
