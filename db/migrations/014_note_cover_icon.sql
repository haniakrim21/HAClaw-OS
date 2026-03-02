-- Migration 014: Add cover image and emoji icon to notes
-- Supports Notion-style cover banners and emoji icons

begin;

alter table content.note
  add column if not exists icon text,
  add column if not exists cover_image_url text;

commit;
