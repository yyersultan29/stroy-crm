import { useEffect, useMemo, useState } from 'react'
import { ArrowDownRight, ArrowLeft, ArrowRight, Bell, Building2, Check, CheckCheck, ChevronDown, ChevronRight, CircleHelp, ClipboardList, Clock3, Filter, LayoutGrid, MapPin, Menu, MoreHorizontal, Plus, Search, SlidersHorizontal, X } from 'lucide-react'
import { formatDate, formatDateTime, getUser, loadStore, statusLabel, statusOrder, users, type ObjectItem, type Status, type Store, type Task } from './data'

type View = 'overview' | 'objects' | 'tasks' | 'my-tasks'
type Modal = 'object' | 'task' | null
type TaskForm = { title: string; description: string; objectId: string; assigneeId: string }

const blankTask = (objectId = ''): TaskForm => ({ title: '', description: '', objectId, assigneeId: 'u2' })
const taskWord = (count: number) => count % 10 === 1 && count % 100 !== 11 ? 'задача' : count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 12 || count % 100 > 14) ? 'задачи' : 'задач'
const objectWord = (count: number) => count % 10 === 1 && count % 100 !== 11 ? 'объект' : count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 12 || count % 100 > 14) ? 'объекта' : 'объектов'

function Avatar({ userId, size = 'normal' }: { userId: string; size?: 'normal' | 'small' }) {
  const user = getUser(userId)
  return <span className={`avatar avatar--${user.color} avatar--${size}`} title={user.name}>{user.initials}</span>
}

function StatusBadge({ status }: { status: Status }) {
  return <span className={`status status--${status}`}><span className="status__dot" />{statusLabel[status]}</span>
}

function App() {
  const [store, setStore] = useState<Store>(loadStore)
  const [currentUserId, setCurrentUserId] = useState('u1')
  const [view, setView] = useState<View>('overview')
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all')
  const [modal, setModal] = useState<Modal>(null)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editingObjectId, setEditingObjectId] = useState<string | null>(null)
  const [taskForm, setTaskForm] = useState<TaskForm>(blankTask)
  const [objectForm, setObjectForm] = useState({ name: '', address: '' })
  const [revisionComment, setRevisionComment] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useEffect(() => { localStorage.setItem('kontur-demo-v1', JSON.stringify(store)) }, [store])

  const currentUser = getUser(currentUserId)
  const isManager = currentUser.role === 'manager'
  const visibleTasks = useMemo(() => isManager ? store.tasks : store.tasks.filter(task => task.assigneeId === currentUserId), [store.tasks, isManager, currentUserId])
  const visibleObjects = useMemo(() => isManager ? store.objects : store.objects.filter(object => visibleTasks.some(task => task.objectId === object.id)), [store.objects, visibleTasks, isManager])
  const selectedObject = visibleObjects.find(object => object.id === selectedObjectId)
  const selectedTask = visibleTasks.find(task => task.id === selectedTaskId)
  const pageTasks = visibleTasks.filter(task => {
    if (selectedObjectId && task.objectId !== selectedObjectId) return false
    if (view === 'my-tasks' && task.assigneeId !== currentUserId) return false
    if (statusFilter !== 'all' && task.status !== statusFilter) return false
    const haystack = `${task.title} ${task.description} ${store.objects.find(object => object.id === task.objectId)?.name ?? ''}`.toLowerCase()
    return haystack.includes(query.toLowerCase())
  })
  const filteredObjects = visibleObjects.filter(object => `${object.name} ${object.address}`.toLowerCase().includes(query.toLowerCase()))
  const activeCount = visibleTasks.filter(task => ['new', 'progress', 'revision'].includes(task.status)).length
  const reviewCount = visibleTasks.filter(task => task.status === 'review').length
  const acceptedCount = visibleTasks.filter(task => task.status === 'accepted').length

  function navigate(nextView: View) {
    setView(nextView); setSelectedObjectId(null); setSelectedTaskId(null); setQuery(''); setStatusFilter('all'); setMobileNavOpen(false)
  }

  function openTaskCreate(objectId = '') {
    setEditingTaskId(null); setTaskForm(blankTask(objectId || store.objects[0]?.id)); setModal('task')
  }

  function openTaskEdit(task: Task) {
    setEditingTaskId(task.id)
    setTaskForm({ title: task.title, description: task.description, objectId: task.objectId, assigneeId: task.assigneeId })
    setSelectedTaskId(null); setModal('task')
  }

  function openObjectCreate() { setEditingObjectId(null); setObjectForm({ name: '', address: '' }); setModal('object') }
  function openObjectEdit(object: ObjectItem) { setEditingObjectId(object.id); setObjectForm({ name: object.name, address: object.address }); setMenuOpen(false); setModal('object') }

  function saveObject(event: React.FormEvent) {
    event.preventDefault()
    const name = objectForm.name.trim(); const address = objectForm.address.trim()
    if (!name || !address) return
    if (editingObjectId) setStore(previous => ({ ...previous, objects: previous.objects.map(object => object.id === editingObjectId ? { ...object, name, address } : object) }))
    else setStore(previous => ({ ...previous, objects: [{ id: crypto.randomUUID(), name, address, createdAt: new Date().toISOString() }, ...previous.objects] }))
    setModal(null)
  }

  function saveTask(event: React.FormEvent) {
    event.preventDefault()
    const title = taskForm.title.trim(); const description = taskForm.description.trim()
    if (!title || !taskForm.objectId || !taskForm.assigneeId) return
    if (editingTaskId) setStore(previous => ({ ...previous, tasks: previous.tasks.map(task => task.id === editingTaskId ? { ...task, title, description, objectId: taskForm.objectId, assigneeId: taskForm.assigneeId } : task) }))
    else {
      const now = new Date().toISOString()
      const task: Task = { id: crypto.randomUUID(), title, description, objectId: taskForm.objectId, assigneeId: taskForm.assigneeId, authorId: currentUserId, status: 'new', createdAt: now, history: [{ id: crypto.randomUUID(), from: null, to: 'new', actorId: currentUserId, at: now }] }
      setStore(previous => ({ ...previous, tasks: [task, ...previous.tasks] }))
    }
    setModal(null)
  }

  function deleteTask(task: Task) {
    if (!window.confirm(`Удалить задачу «${task.title}»?`)) return
    setStore(previous => ({ ...previous, tasks: previous.tasks.filter(item => item.id !== task.id) }))
    setSelectedTaskId(null)
  }

  function deleteObject(object: ObjectItem) {
    if (!window.confirm(`Удалить объект «${object.name}» и все его задачи?`)) return
    setStore(previous => ({ objects: previous.objects.filter(item => item.id !== object.id), tasks: previous.tasks.filter(task => task.objectId !== object.id) }))
    setSelectedObjectId(null); setMenuOpen(false)
  }

  function transition(task: Task, to: Status) {
    if (to === 'revision' && !revisionComment.trim()) return
    const now = new Date().toISOString()
    setStore(previous => ({ ...previous, tasks: previous.tasks.map(item => item.id === task.id ? {
      ...item, status: to, history: [...item.history, { id: crypto.randomUUID(), from: item.status, to, actorId: currentUserId, at: now, ...(to === 'revision' ? { comment: revisionComment.trim() } : {}) }],
    } : item) }))
    setRevisionComment('')
  }

  const transitions: { to: Status; label: string; primary?: boolean }[] = !selectedTask ? [] : isManager
    ? selectedTask.status === 'review' ? [{ to: 'accepted', label: 'Принять задачу', primary: true }, { to: 'revision', label: 'Вернуть на доработку' }] : []
    : selectedTask.assigneeId === currentUserId ? selectedTask.status === 'new' || selectedTask.status === 'revision'
      ? [{ to: 'progress', label: 'Взять в работу', primary: true }]
      : selectedTask.status === 'progress' ? [{ to: 'review', label: 'Отправить на проверку', primary: true }] : [] : []

  const title = selectedObject ? selectedObject.name : view === 'overview' ? 'Обзор' : view === 'objects' ? 'Объекты' : view === 'my-tasks' ? 'Мои задачи' : 'Все задачи'
  const subtitle = selectedObject ? selectedObject.address : view === 'overview' ? 'Что происходит на ваших объектах' : view === 'objects' ? 'Все строительные объекты в одном месте' : 'Контроль выполнения и проверка работ'

  return <div className="app-shell">
    <div className={`mobile-scrim ${mobileNavOpen ? 'is-visible' : ''}`} onClick={() => setMobileNavOpen(false)} />
    <aside className={`sidebar ${mobileNavOpen ? 'sidebar--open' : ''}`}>
      <div className="brand"><span className="brand__mark"><span /></span><span>контур<span className="brand__period">.</span></span></div>
      <div className="sidebar__label">РАБОЧЕЕ ПРОСТРАНСТВО</div>
      <nav className="nav" aria-label="Основная навигация">
        <button className={`nav__item ${view === 'overview' && !selectedObject ? 'is-active' : ''}`} onClick={() => navigate('overview')}><LayoutGrid size={18} strokeWidth={1.8} />Обзор</button>
        <button className={`nav__item ${view === 'objects' || selectedObject ? 'is-active' : ''}`} onClick={() => navigate('objects')}><Building2 size={18} strokeWidth={1.8} />Объекты<span className="nav__count">{visibleObjects.length}</span></button>
        <button className={`nav__item ${view === 'tasks' ? 'is-active' : ''}`} onClick={() => navigate('tasks')}><ClipboardList size={18} strokeWidth={1.8} />Все задачи</button>
        {!isManager && <button className={`nav__item ${view === 'my-tasks' ? 'is-active' : ''}`} onClick={() => navigate('my-tasks')}><CheckCheck size={18} strokeWidth={1.8} />Мои задачи</button>}
      </nav>
      <div className="sidebar__spacer" />
      <div className="sidebar__help"><CircleHelp size={17} />Демо интерфейса</div>
      <div className="account">
        <Avatar userId={currentUserId} />
        <div className="account__copy"><strong>{currentUser.name}</strong><span>{isManager ? 'Постановщик' : 'Исполнитель'}</span></div>
        <button className="account__switch" onClick={() => setMenuOpen(!menuOpen)} aria-label="Сменить пользователя" aria-expanded={menuOpen}><ChevronDown size={17} /></button>
        {menuOpen && <div className="user-menu"><div className="user-menu__title">Просмотр роли</div>{users.map(user => <button key={user.id} onClick={() => { setCurrentUserId(user.id); setSelectedObjectId(null); setSelectedTaskId(null); setView('overview'); setMenuOpen(false); setMobileNavOpen(false) }}><Avatar userId={user.id} size="small" /><span><strong>{user.name}</strong><small>{user.role === 'manager' ? 'Постановщик' : 'Исполнитель'}</small></span>{user.id === currentUserId && <Check size={16} />}</button>)}</div>}
      </div>
    </aside>

    <main className="main">
      <header className="topbar"><button className="icon-button mobile-menu" onClick={() => setMobileNavOpen(true)} aria-label="Открыть меню"><Menu size={21} /></button><div className="breadcrumbs"><span>Рабочее пространство</span><ChevronRight size={14} /><strong>{selectedObject ? 'Объекты' : title}</strong>{selectedObject && <><ChevronRight size={14} /><strong>{selectedObject.name}</strong></>}</div><div className="topbar__right"><span className="topbar__date">{new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}</span><span className="topbar__divider" /><button className="icon-button" aria-label="Уведомления" title="Уведомления появятся позже"><Bell size={18} /></button><Avatar userId={currentUserId} size="small" /></div></header>

      <div className="workspace">
        {selectedObject && <button className="back-link" onClick={() => { setSelectedObjectId(null); setView('objects') }}><ArrowLeft size={15} />Все объекты</button>}
        <div className="page-heading"><div><div className="eyebrow">{selectedObject ? 'ОБЪЕКТ' : 'РАБОЧАЯ ПАНЕЛЬ'}</div><h1>{title}</h1><p>{subtitle}</p></div>{isManager && <button className="button button--primary page-heading__action" onClick={() => selectedObject || view === 'tasks' ? openTaskCreate(selectedObjectId ?? '') : openObjectCreate()}><Plus size={18} />{selectedObject || view === 'tasks' ? 'Новая задача' : 'Новый объект'}</button>}</div>

        {selectedObject ? <>
          <div className="object-meta"><div><MapPin size={16} />{selectedObject.address}</div><span>Создан {formatDate(selectedObject.createdAt)}</span>{isManager && <div className="object-meta__actions"><button onClick={() => openObjectEdit(selectedObject)}>Редактировать</button><button className="danger-text" onClick={() => deleteObject(selectedObject)}>Удалить</button></div>}</div>
          <TaskSection tasks={pageTasks} title="Задачи объекта" query={query} setQuery={setQuery} statusFilter={statusFilter} setStatusFilter={setStatusFilter} onSelect={setSelectedTaskId} store={store} showObject={false} isManager={isManager} onCreate={() => openTaskCreate(selectedObject.id)} />
        </> : view === 'overview' ? <>
          <section className="metrics" aria-label="Сводка"><div className="metric"><span>Активные задачи</span><strong>{activeCount.toString().padStart(2, '0')}</strong><small><ArrowDownRight size={15} />Новые, в работе, на доработке</small></div><div className="metric"><span>На проверке</span><strong>{reviewCount.toString().padStart(2, '0')}</strong><small><span className="metric__pulse" />Ожидают решения</small></div><div className="metric"><span>Принято</span><strong>{acceptedCount.toString().padStart(2, '0')}</strong><small><Check size={14} />Завершенные работы</small></div><div className="metric metric--last"><span>Объекты</span><strong>{visibleObjects.length.toString().padStart(2, '0')}</strong><small><Building2 size={14} />В вашем пространстве</small></div></section>
          <div className="section-heading"><div><h2>Объекты</h2><p>Быстрый переход к задачам по каждой стройке</p></div><button className="text-button" onClick={() => navigate('objects')}>Все объекты <ArrowRight size={16} /></button></div>
          <ObjectList objects={visibleObjects} tasks={visibleTasks} onSelect={id => { setSelectedObjectId(id); setView('objects'); setQuery('') }} />
          <div className="section-heading section-heading--tasks"><div><h2>{isManager ? 'Требуют внимания' : 'Мои задачи'}</h2><p>{isManager ? 'Задачи на проверке и в работе' : 'Последние задачи по вашим объектам'}</p></div><button className="text-button" onClick={() => navigate(isManager ? 'tasks' : 'my-tasks')}>Все задачи <ArrowRight size={16} /></button></div>
          <TaskTable tasks={[...visibleTasks].filter(task => isManager ? task.status === 'review' || task.status === 'revision' : task.status !== 'accepted').slice(0, 4)} onSelect={setSelectedTaskId} store={store} />
        </> : view === 'objects' ? <><div className="list-toolbar"><div className="search"><Search size={18} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Поиск по названию или адресу" aria-label="Поиск объектов" />{query && <button onClick={() => setQuery('')} aria-label="Очистить поиск"><X size={16} /></button>}</div><span className="result-count">{filteredObjects.length} {objectWord(filteredObjects.length)}</span></div><ObjectList objects={filteredObjects} tasks={visibleTasks} onSelect={id => { setSelectedObjectId(id); setQuery('') }} /></> : <TaskSection tasks={pageTasks} title="Список задач" query={query} setQuery={setQuery} statusFilter={statusFilter} setStatusFilter={setStatusFilter} onSelect={setSelectedTaskId} store={store} showObject isManager={isManager} onCreate={() => openTaskCreate()} />}
      </div>
    </main>

    {selectedTask && <><div className="drawer-scrim" onClick={() => setSelectedTaskId(null)} /><aside className="task-drawer" aria-label="Карточка задачи"><div className="drawer__top"><span>ЗАДАЧА <span className="drawer__id">#{selectedTask.id.slice(0, 6).toUpperCase()}</span></span><button className="icon-button" onClick={() => { setSelectedTaskId(null); setRevisionComment('') }} aria-label="Закрыть"><X size={20} /></button></div><div className="drawer__content"><div className="drawer__status"><StatusBadge status={selectedTask.status} />{isManager && <div className="drawer__tools"><button className="icon-button" onClick={() => openTaskEdit(selectedTask)} title="Редактировать задачу"><SlidersHorizontal size={18} /></button><button className="icon-button danger-text" onClick={() => deleteTask(selectedTask)} title="Удалить задачу"><MoreHorizontal size={20} /></button></div>}</div><h2>{selectedTask.title}</h2><p className="drawer__description">{selectedTask.description || 'Описание не добавлено'}</p><div className="drawer__fields"><div><span>Объект</span><strong>{store.objects.find(object => object.id === selectedTask.objectId)?.name ?? '—'}</strong></div><div><span>Исполнитель</span><strong><Avatar userId={selectedTask.assigneeId} size="small" />{getUser(selectedTask.assigneeId).name}</strong></div><div><span>Постановщик</span><strong><Avatar userId={selectedTask.authorId} size="small" />{getUser(selectedTask.authorId).name}</strong></div><div><span>Создана</span><strong>{formatDateTime(selectedTask.createdAt)}</strong></div></div><div className="history"><h3>История изменений <span>{selectedTask.history.length}</span></h3><div className="history__list">{[...selectedTask.history].reverse().map(item => <div className="history__item" key={item.id}><div className="history__marker" /><div><div className="history__event"><strong>{item.from ? `${statusLabel[item.from]} → ${statusLabel[item.to]}` : 'Задача создана'}</strong><span>{formatDateTime(item.at)}</span></div><p>{getUser(item.actorId).name}</p>{item.comment && <blockquote>{item.comment}</blockquote>}</div></div>)}</div></div></div><div className="drawer__footer">{transitions.some(item => item.to === 'revision') && <label className="revision-field">Комментарий для доработки<textarea value={revisionComment} onChange={event => setRevisionComment(event.target.value)} placeholder="Что нужно исправить?" rows={3} /></label>}{transitions.length ? transitions.map(item => <button key={item.to} className={`button ${item.primary ? 'button--primary' : 'button--outline'}`} onClick={() => transition(selectedTask, item.to)} disabled={item.to === 'revision' && !revisionComment.trim()}>{item.primary && <Check size={17} />}{item.label}</button>) : <p>Доступных действий в этом статусе нет</p>}</div></aside></>}

    {modal && <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setModal(null) }}><div className="modal" role="dialog" aria-modal="true" aria-label={modal === 'object' ? 'Форма объекта' : 'Форма задачи'}><div className="modal__head"><div><span className="eyebrow">{editingObjectId || editingTaskId ? 'РЕДАКТИРОВАНИЕ' : 'СОЗДАНИЕ'}</span><h2>{modal === 'object' ? editingObjectId ? 'Редактировать объект' : 'Новый объект' : editingTaskId ? 'Редактировать задачу' : 'Новая задача'}</h2></div><button className="icon-button" onClick={() => setModal(null)} aria-label="Закрыть"><X size={20} /></button></div>{modal === 'object' ? <form onSubmit={saveObject}><label>Название объекта<input required autoFocus value={objectForm.name} onChange={event => setObjectForm({ ...objectForm, name: event.target.value })} placeholder="Например, ЖК «Горизонт»" /></label><label>Адрес<input required value={objectForm.address} onChange={event => setObjectForm({ ...objectForm, address: event.target.value })} placeholder="Город, улица и номер здания" /></label><div className="modal__actions"><button type="button" className="button button--ghost" onClick={() => setModal(null)}>Отмена</button><button className="button button--primary" type="submit">{editingObjectId ? 'Сохранить' : 'Создать объект'}</button></div></form> : <form onSubmit={saveTask}><label>Название задачи<input required autoFocus value={taskForm.title} onChange={event => setTaskForm({ ...taskForm, title: event.target.value })} placeholder="Что нужно сделать?" /></label><label>Описание<textarea rows={4} value={taskForm.description} onChange={event => setTaskForm({ ...taskForm, description: event.target.value })} placeholder="Детали и ожидаемый результат" /></label><div className="form-grid"><label>Объект<select required value={taskForm.objectId} onChange={event => setTaskForm({ ...taskForm, objectId: event.target.value })}>{store.objects.map(object => <option key={object.id} value={object.id}>{object.name}</option>)}</select></label><label>Исполнитель<select required value={taskForm.assigneeId} onChange={event => setTaskForm({ ...taskForm, assigneeId: event.target.value })}>{users.filter(user => user.role === 'executor').map(user => <option key={user.id} value={user.id}>{user.name}</option>)}</select></label></div><div className="modal__actions"><button type="button" className="button button--ghost" onClick={() => setModal(null)}>Отмена</button><button className="button button--primary" type="submit">{editingTaskId ? 'Сохранить' : 'Создать задачу'}</button></div></form>}</div></div>}
  </div>
}

function ObjectList({ objects, tasks, onSelect }: { objects: ObjectItem[]; tasks: Task[]; onSelect: (id: string) => void }) {
  if (!objects.length) return <EmptyState title="Объекты не найдены" text="Попробуйте изменить поисковый запрос" />
  return <div className="object-list"><div className="object-list__head"><span>ОБЪЕКТ</span><span>ЗАДАЧИ</span><span>ПРОГРЕСС</span><span /></div>{objects.map((object, index) => { const objectTasks = tasks.filter(task => task.objectId === object.id); const accepted = objectTasks.filter(task => task.status === 'accepted').length; const percent = objectTasks.length ? accepted / objectTasks.length * 100 : 0; return <button className="object-row" key={object.id} onClick={() => onSelect(object.id)}><div className="object-row__identity"><span className="object-row__number">{(index + 1).toString().padStart(2, '0')}</span><div><strong>{object.name}</strong><small><MapPin size={13} />{object.address}</small></div></div><span className="object-row__count">{objectTasks.length} <span>{taskWord(objectTasks.length)}</span></span><div className="object-row__progress"><span className="progress-track"><span style={{ width: `${percent}%` }} /></span><small>{Math.round(percent)}%</small></div><ChevronRight className="object-row__arrow" size={19} /></button> })}</div>
}

function TaskSection({ tasks, title, query, setQuery, statusFilter, setStatusFilter, onSelect, store, showObject, isManager, onCreate }: { tasks: Task[]; title: string; query: string; setQuery: (value: string) => void; statusFilter: Status | 'all'; setStatusFilter: (value: Status | 'all') => void; onSelect: (id: string) => void; store: Store; showObject: boolean; isManager: boolean; onCreate: () => void }) {
  return <section className="task-section"><div className="section-heading"><div><h2>{title}</h2><p>{tasks.length} {taskWord(tasks.length)} в списке</p></div></div><div className="list-toolbar list-toolbar--tasks"><div className="search"><Search size={18} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Поиск задачи" aria-label="Поиск задач" />{query && <button onClick={() => setQuery('')} aria-label="Очистить поиск"><X size={16} /></button>}</div><div className="filter-control"><Filter size={16} /><select value={statusFilter} onChange={event => setStatusFilter(event.target.value as Status | 'all')} aria-label="Фильтр по статусу"><option value="all">Все статусы</option>{statusOrder.map(status => <option key={status} value={status}>{statusLabel[status]}</option>)}</select><ChevronDown size={14} /></div></div><TaskTable tasks={tasks} onSelect={onSelect} store={store} showObject={showObject} />{!tasks.length && isManager && <button className="empty-create" onClick={onCreate}><Plus size={16} />Создать задачу</button>}</section>
}

function TaskTable({ tasks, onSelect, store, showObject = true }: { tasks: Task[]; onSelect: (id: string) => void; store: Store; showObject?: boolean }) {
  if (!tasks.length) return <EmptyState title="Задач пока нет" text="Новые задачи появятся здесь" />
  return <div className={`task-table ${showObject ? '' : 'task-table--compact'}`}><div className="task-table__head"><span>ЗАДАЧА</span>{showObject && <span>ОБЪЕКТ</span>}<span>СТАТУС</span><span>ИСПОЛНИТЕЛЬ</span><span>СОЗДАНА</span><span /></div>{tasks.map(task => <button className="task-row" key={task.id} onClick={() => onSelect(task.id)}><div className="task-row__title"><span className="task-row__icon"><ClipboardList size={17} strokeWidth={1.7} /></span><span><strong>{task.title}</strong><small>#{task.id.slice(0, 6).toUpperCase()}</small></span></div>{showObject && <span className="task-row__object">{store.objects.find(object => object.id === task.objectId)?.name ?? '—'}</span>}<StatusBadge status={task.status} /><span className="task-row__assignee"><Avatar userId={task.assigneeId} size="small" /><span>{getUser(task.assigneeId).name}</span></span><span className="task-row__date">{formatDate(task.createdAt)}</span><ChevronRight className="task-row__arrow" size={18} /></button>)}</div>
}

function EmptyState({ title, text }: { title: string; text: string }) { return <div className="empty-state"><span><Clock3 size={23} /></span><strong>{title}</strong><p>{text}</p></div> }

export default App
