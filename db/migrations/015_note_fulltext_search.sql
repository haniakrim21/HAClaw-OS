-- Migration 015: Full-text search for notes
-- Adds tsvector column with GIN index and auto-update trigger

begin;

-- Add search vector column
alter table content.note
  add column if not exists search_vector tsvector;

-- Populate existing rows
update content.note set search_vector =
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(content::text, '')), 'B');

-- GIN index for fast full-text search
create index if not exists note_search_idx
  on content.note using gin(search_vector);

-- Auto-update trigger function
create or replace function content.note_search_update() returns trigger as $$
begin
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.content::text, '')), 'B');
  return NEW;
end $$ language plpgsql;

-- Trigger: auto-update search_vector on insert/update
drop trigger if exists note_search_vector_update on content.note;
create trigger note_search_vector_update
  before insert or update on content.note
  for each row execute function content.note_search_update();

commit;
