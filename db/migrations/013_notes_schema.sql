-- Migration 013: notes schema
-- Rich note storage with Plate editor JSON content, tags, pinning

begin;

-- ===================== TABLES =====================

create table if not exists content.note (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references core.workspace(id) on delete cascade,

  title           text not null default '',
  content         jsonb not null default '[]'::jsonb,

  status          text not null default 'active'
    check (status in ('active', 'archived', 'deleted')),

  tags            text[] not null default '{}',
  color           text,
  is_pinned       boolean not null default false,

  created_by      uuid references core."user"(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ===================== TRIGGERS =====================

create trigger set_note_updated_at
  before update on content.note
  for each row execute function core.trigger_set_updated_at();

-- ===================== INDEXES =====================

create index if not exists note_workspace_idx
  on content.note (workspace_id);

create index if not exists note_workspace_status_idx
  on content.note (workspace_id, status);

create index if not exists note_workspace_created_idx
  on content.note (workspace_id, created_at desc);

create index if not exists note_pinned_idx
  on content.note (workspace_id, is_pinned, created_at desc)
  where is_pinned = true;

-- ===================== RLS =====================

alter table content.note enable row level security;

create policy "note_select"
  on content.note for select
  using (core.is_workspace_member(workspace_id));

create policy "note_insert"
  on content.note for insert
  with check (
    core.is_workspace_member(workspace_id)
    and created_by = core.current_user_id()
  );

create policy "note_update"
  on content.note for update
  using (core.is_workspace_member(workspace_id))
  with check (core.is_workspace_member(workspace_id));

create policy "note_delete"
  on content.note for delete
  using (core.is_workspace_member(workspace_id));

commit;
