alter table site_settings
  add column if not exists kakao_label text,
  add column if not exists phone_label text,
  add column if not exists instagram_label text;
