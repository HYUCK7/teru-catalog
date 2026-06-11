-- 예약 가능 설정: 정기 휴무 요일 / 특정 휴무일 / 날짜별 제외 시간

-- 정기 휴무 요일 (0=일 ... 6=토)
alter table site_settings
  add column if not exists closed_weekdays int[] not null default '{}';

-- 특정 휴무 날짜 (하루 종일)
create table closed_dates (
  closed_date date primary key
);

-- 날짜별 제외 시간 슬롯
create table blocked_times (
  id uuid primary key default gen_random_uuid(),
  block_date date not null,
  block_time text not null,
  unique (block_date, block_time)
);

create index on blocked_times (block_date);

-- RLS: 공개 읽기 / 관리자 쓰기
alter table closed_dates enable row level security;
alter table blocked_times enable row level security;

create policy "public read closed_dates" on closed_dates for select using (true);
create policy "admin write closed_dates" on closed_dates for all
  to authenticated using (true) with check (true);

create policy "public read blocked_times" on blocked_times for select using (true);
create policy "admin write blocked_times" on blocked_times for all
  to authenticated using (true) with check (true);
