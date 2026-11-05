-- Mini-CRM: all client access is scoped to authenticated users and RLS.
create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (length(btrim(full_name)) > 0),
  role text not null check (role in ('manager', 'executor')),
  created_at timestamptz not null default now()
);

create table public.objects (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) > 0),
  address text not null check (length(btrim(address)) > 0),
  created_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(btrim(title)) > 0),
  description text not null default '',
  object_id uuid not null references public.objects(id) on delete cascade,
  assignee_id uuid not null references public.profiles(id),
  author_id uuid not null references public.profiles(id),
  status text not null default 'new' check (status in ('new', 'progress', 'review', 'revision', 'accepted')),
  created_at timestamptz not null default now()
);

create table public.task_status_history (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  actor_id uuid not null references public.profiles(id),
  from_status text check (from_status is null or from_status in ('new', 'progress', 'review', 'revision', 'accepted')),
  to_status text not null check (to_status in ('new', 'progress', 'review', 'revision', 'accepted')),
  comment text,
  created_at timestamptz not null default now()
);

create index tasks_assignee_id_idx on public.tasks(assignee_id);
create index tasks_object_id_idx on public.tasks(object_id);
create index task_status_history_task_id_created_at_idx on public.task_status_history(task_id, created_at);

alter table public.profiles enable row level security;
alter table public.objects enable row level security;
alter table public.tasks enable row level security;
alter table public.task_status_history enable row level security;

-- Supabase's SQL editor creates these as the table owner. SECURITY DEFINER
-- reads profiles without recursively evaluating its own RLS policy.
create function public.is_manager()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'manager'
  );
$$;

revoke all on function public.is_manager() from public, anon;
grant execute on function public.is_manager() to authenticated;

create policy profiles_read on public.profiles
  for select to authenticated
  using (true);

create policy objects_read on public.objects
  for select to authenticated
  using (
    (select public.is_manager())
    or exists (
      select 1 from public.tasks
      where object_id = objects.id and assignee_id = (select auth.uid())
    )
  );
create policy objects_insert on public.objects
  for insert to authenticated with check ((select public.is_manager()));
create policy objects_update on public.objects
  for update to authenticated
  using ((select public.is_manager())) with check ((select public.is_manager()));
create policy objects_delete on public.objects
  for delete to authenticated using ((select public.is_manager()));

create policy tasks_read on public.tasks
  for select to authenticated
  using ((select public.is_manager()) or assignee_id = (select auth.uid()));
create policy tasks_insert on public.tasks
  for insert to authenticated
  with check (
    (select public.is_manager())
    and author_id = (select auth.uid())
    and status = 'new'
    and exists (
      select 1 from public.profiles
      where id = assignee_id and role = 'executor'
    )
  );
create policy tasks_update on public.tasks
  for update to authenticated
  using ((select public.is_manager()))
  with check (
    (select public.is_manager())
    and exists (
      select 1 from public.profiles
      where id = assignee_id and role = 'executor'
    )
  );
create policy tasks_delete on public.tasks
  for delete to authenticated using ((select public.is_manager()));

create policy history_read on public.task_status_history
  for select to authenticated
  using (
    (select public.is_manager())
    or exists (
      select 1 from public.tasks
      where id = task_id and assignee_id = (select auth.uid())
    )
  );

-- Restrict columns as well as rows. Status, author, IDs, and timestamps are
-- never directly writable with the browser's authenticated role.
revoke all on public.profiles, public.objects, public.tasks, public.task_status_history from public, anon, authenticated;
grant select on public.profiles, public.objects, public.tasks, public.task_status_history to authenticated;
grant insert (name, address) on public.objects to authenticated;
grant update (name, address) on public.objects to authenticated;
grant delete on public.objects to authenticated;
grant insert (title, description, object_id, assignee_id, author_id) on public.tasks to authenticated;
grant update (title, description, object_id, assignee_id) on public.tasks to authenticated;
grant delete on public.tasks to authenticated;

-- Every newly created task gets one trusted initial history entry.
create function public.log_task_creation()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  insert into public.task_status_history(task_id, actor_id, from_status, to_status)
  values (new.id, new.author_id, null, new.status);
  return new;
end;
$$;

revoke all on function public.log_task_creation() from public, anon, authenticated;
create trigger task_creation_history
  after insert on public.tasks
  for each row execute function public.log_task_creation();

-- The only client entry point for status changes. The row lock makes the
-- transition check and status/history writes atomic under concurrent requests.
create function public.transition_task(
  p_task_id uuid,
  p_to_status text,
  p_comment text default null
)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_task public.tasks%rowtype;
  v_actor uuid := auth.uid();
  v_manager boolean;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select * into v_task from public.tasks where id = p_task_id for update;
  if not found then
    raise exception 'Task not found' using errcode = 'P0002';
  end if;

  v_manager := public.is_manager();
  if not (
    (v_manager and v_task.status = 'review' and p_to_status in ('accepted', 'revision'))
    or (not v_manager and v_task.assignee_id = v_actor and (
      (v_task.status = 'new' and p_to_status = 'progress')
      or (v_task.status = 'progress' and p_to_status = 'review')
      or (v_task.status = 'revision' and p_to_status = 'progress')
    ))
  ) then
    raise exception 'Transition not allowed' using errcode = '42501';
  end if;

  if p_to_status = 'revision' and coalesce(btrim(p_comment), '') = '' then
    raise exception 'Comment is required for revision' using errcode = '22023';
  end if;

  update public.tasks set status = p_to_status where id = p_task_id;
  insert into public.task_status_history(task_id, actor_id, from_status, to_status, comment)
  values (p_task_id, v_actor, v_task.status, p_to_status, nullif(btrim(p_comment), ''));
end;
$$;

revoke all on function public.transition_task(uuid, text, text) from public, anon;
grant execute on function public.transition_task(uuid, text, text) to authenticated;
