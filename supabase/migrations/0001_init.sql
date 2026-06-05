-- 가게 설정 (단일 행)
create table site_settings (
  id int primary key default 1,
  shop_name text not null default '',
  intro text not null default '',
  logo_url text,
  banner_url text,
  kakao_channel_url text,
  phone text,
  instagram text,
  updated_at timestamptz not null default now(),
  constraint single_row check (id = 1)
);

insert into site_settings (id) values (1);

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id) on delete restrict,
  name text not null,
  price int not null default 0,
  description text not null default '',
  is_visible boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  image_url text not null,
  sort_order int not null default 0
);

create index on products (category_id);
create index on product_images (product_id);
