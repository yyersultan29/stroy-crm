-- Demo users must first be created in Supabase Auth by an administrator.
-- This script contains no passwords and can be run more than once.
do $$
begin
  if (select count(*) from auth.users where email in (
    'demo.manager@kontur.example', 'demo.maria@kontur.example', 'demo.ilya@kontur.example'
  )) <> 3 then
    raise exception 'Create the three demo Auth users before seeding';
  end if;
end;
$$;

insert into public.profiles(id, full_name, role)
select u.id, demo.full_name, demo.role
from (values
  ('demo.manager@kontur.example', 'Александр Морозов', 'manager'),
  ('demo.maria@kontur.example', 'Мария Ким', 'executor'),
  ('demo.ilya@kontur.example', 'Илья Соколов', 'executor')
) as demo(email, full_name, role)
join auth.users u on u.email = demo.email
on conflict (id) do update set full_name = excluded.full_name, role = excluded.role;

insert into public.objects(name, address)
select demo.name, demo.address
from (values
  ('ЖК «Горизонт»', 'Алматы, ул. Сатпаева, 21'),
  ('Бизнес-центр «Астана»', 'Астана, пр. Кабанбай батыра, 8'),
  ('Школа № 42', 'Алматы, мкр. Орбита-3, 15')
) as demo(name, address)
where not exists (select 1 from public.objects where name = demo.name);

with demo(title, description, object_name, assignee_email) as (values
  ('Проверить армирование перекрытия', 'Проверить соответствие армирования проектной документации на 4 этаже. Приложить замечания перед заливкой.', 'ЖК «Горизонт»', 'demo.maria@kontur.example'),
  ('Согласовать поставку окон', 'Сверить спецификацию с поставщиком и подтвердить даты доставки.', 'ЖК «Горизонт»', 'demo.ilya@kontur.example'),
  ('Обновить график отделочных работ', 'Учесть новую дату поставки материалов и скорректировать этапы работ.', 'Бизнес-центр «Астана»', 'demo.maria@kontur.example'),
  ('Подготовить акт скрытых работ', 'Подготовить акт по электромонтажным работам в блоке Б.', 'Бизнес-центр «Астана»', 'demo.ilya@kontur.example'),
  ('Принять монтаж вентиляции', 'Проверить выполненные работы в спортивном зале.', 'Школа № 42', 'demo.ilya@kontur.example'),
  ('Проверить систему пожарной сигнализации', 'Проверить датчики и передать результаты испытаний.', 'Школа № 42', 'demo.maria@kontur.example')
)
insert into public.tasks(title, description, object_id, assignee_id, author_id)
select demo.title, demo.description, o.id, assignee.id, manager.id
from demo
join public.objects o on o.name = demo.object_name
join auth.users assignee on assignee.email = demo.assignee_email
join auth.users manager on manager.email = 'demo.manager@kontur.example'
where not exists (select 1 from public.tasks where title = demo.title);

with steps(title, step, actor_email, from_status, to_status, comment) as (values
  ('Проверить армирование перекрытия', 1, 'demo.maria@kontur.example', 'new', 'progress', null),
  ('Проверить армирование перекрытия', 2, 'demo.maria@kontur.example', 'progress', 'review', null),
  ('Согласовать поставку окон', 1, 'demo.ilya@kontur.example', 'new', 'progress', null),
  ('Обновить график отделочных работ', 1, 'demo.maria@kontur.example', 'new', 'progress', null),
  ('Обновить график отделочных работ', 2, 'demo.maria@kontur.example', 'progress', 'review', null),
  ('Обновить график отделочных работ', 3, 'demo.manager@kontur.example', 'review', 'revision', 'Добавьте срок поставки дверей и отдельный этап приемки.'),
  ('Принять монтаж вентиляции', 1, 'demo.ilya@kontur.example', 'new', 'progress', null),
  ('Принять монтаж вентиляции', 2, 'demo.ilya@kontur.example', 'progress', 'review', null),
  ('Принять монтаж вентиляции', 3, 'demo.manager@kontur.example', 'review', 'accepted', null),
  ('Проверить систему пожарной сигнализации', 1, 'demo.maria@kontur.example', 'new', 'progress', null)
)
insert into public.task_status_history(task_id, actor_id, from_status, to_status, comment, created_at)
select t.id, u.id, steps.from_status, steps.to_status, steps.comment, now() + steps.step * interval '1 second'
from steps
join public.tasks t on t.title = steps.title
join auth.users u on u.email = steps.actor_email
where not exists (
  select 1 from public.task_status_history h
  where h.task_id = t.id and h.from_status = steps.from_status and h.to_status = steps.to_status
);

update public.tasks set status = case title
  when 'Проверить армирование перекрытия' then 'review'
  when 'Согласовать поставку окон' then 'progress'
  when 'Обновить график отделочных работ' then 'revision'
  when 'Принять монтаж вентиляции' then 'accepted'
  when 'Проверить систему пожарной сигнализации' then 'progress'
  else 'new'
end
where title in (
  'Проверить армирование перекрытия', 'Согласовать поставку окон',
  'Обновить график отделочных работ', 'Подготовить акт скрытых работ',
  'Принять монтаж вентиляции', 'Проверить систему пожарной сигнализации'
);
