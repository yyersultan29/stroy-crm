import {
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Filter,
  Plus,
  Search,
  X,
} from "lucide-react";
import {
  formatDate,
  getUser,
  statusLabel,
  statusOrder,
  type Status,
  type Store,
  type Task,
} from "../../data";
import {
  Avatar,
  EmptyState,
  StatusBadge,
  taskWord,
} from "../../components/common";

export function TaskSection({
  tasks,
  title,
  query,
  setQuery,
  statusFilter,
  setStatusFilter,
  onSelect,
  store,
  showObject,
  isManager,
  onCreate,
}: {
  tasks: Task[];
  title: string;
  query: string;
  setQuery: (value: string) => void;
  statusFilter: Status | "all";
  setStatusFilter: (value: Status | "all") => void;
  onSelect: (id: string) => void;
  store: Store;
  showObject: boolean;
  isManager: boolean;
  onCreate: () => void;
}) {
  return (
    <section className="task-section">
      <div className="section-heading">
        <div>
          <h2>{title}</h2>
          <p>
            {tasks.length} {taskWord(tasks.length)} в списке
          </p>
        </div>
      </div>
      <div className="list-toolbar list-toolbar--tasks">
        <div className="search">
          <Search size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Поиск задачи"
            aria-label="Поиск задач"
          />
          {query && (
            <button onClick={() => setQuery("")} aria-label="Очистить поиск">
              <X size={16} />
            </button>
          )}
        </div>
        <div className="filter-control">
          <Filter size={16} />
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as Status | "all")
            }
            aria-label="Фильтр по статусу"
          >
            <option value="all">Все статусы</option>
            {statusOrder.map((status) => (
              <option key={status} value={status}>
                {statusLabel[status]}
              </option>
            ))}
          </select>
          <ChevronDown size={14} />
        </div>
      </div>
      <TaskTable
        tasks={tasks}
        onSelect={onSelect}
        store={store}
        showObject={showObject}
      />
      {!tasks.length && isManager && (
        <button className="empty-create" onClick={onCreate}>
          <Plus size={16} />
          Создать задачу
        </button>
      )}
    </section>
  );
}

export function TaskTable({
  tasks,
  onSelect,
  store,
  showObject = true,
}: {
  tasks: Task[];
  onSelect: (id: string) => void;
  store: Store;
  showObject?: boolean;
}) {
  if (!tasks.length)
    return (
      <EmptyState title="Задач пока нет" text="Новые задачи появятся здесь" />
    );
  return (
    <div className={`task-table ${showObject ? "" : "task-table--compact"}`}>
      <div className="task-table__head">
        <span>ЗАДАЧА</span>
        {showObject && <span>ОБЪЕКТ</span>}
        <span>СТАТУС</span>
        <span>ИСПОЛНИТЕЛЬ</span>
        <span>СОЗДАНА</span>
        <span />
      </div>
      {tasks.map((task) => (
        <button
          className="task-row"
          key={task.id}
          onClick={() => onSelect(task.id)}
        >
          <div className="task-row__title">
            <span className="task-row__icon">
              <ClipboardList size={17} strokeWidth={1.7} />
            </span>
            <span>
              <strong>{task.title}</strong>
              <small>#{task.id.slice(0, 6).toUpperCase()}</small>
            </span>
          </div>
          {showObject && (
            <span className="task-row__object">
              {store.objects.find((object) => object.id === task.objectId)
                ?.name ?? "—"}
            </span>
          )}
          <StatusBadge status={task.status} />
          <span className="task-row__assignee">
            <Avatar userId={task.assigneeId} size="small" />
            <span>{getUser(task.assigneeId).name}</span>
          </span>
          <span className="task-row__date">{formatDate(task.createdAt)}</span>
          <ChevronRight className="task-row__arrow" size={18} />
        </button>
      ))}
    </div>
  );
}
