-- Keep the RLS helper outside PostgREST's exposed public schema.
create schema if not exists app_private;
revoke all on schema app_private from public, anon;
grant usage on schema app_private to authenticated;
alter function public.is_manager() set schema app_private;

create or replace function public.transition_task(
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

  v_manager := app_private.is_manager();
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
