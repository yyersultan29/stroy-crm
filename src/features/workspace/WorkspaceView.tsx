import { lazy, Suspense } from "react";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  Bell,
  Building2,
  Check,
  ChevronRight,
  MapPin,
  Menu,
  Plus,
  Search,
  X,
} from "lucide-react";
import { formatDate } from "../../data";
import { Avatar, objectWord } from "../../components/common";
import { ObjectList } from "../objects/ObjectList";
import { TaskSection, TaskTable } from "../tasks/TaskLists";
import type { Crm } from "./useCrm";

const ObjectMap = lazy(() => import("../objects/ObjectMap"));

export function WorkspaceView({ crm }: { crm: Crm }) {
  const {
    setMobileNavOpen,
    selectedObject,
    title,
    currentUserId,
    setSelectedObjectId,
    setView,
    subtitle,
    isManager,
    view,
    openTaskCreate,
    selectedObjectId,
    openObjectCreate,
    openObjectEdit,
    deleteObject,
    pageTasks,
    query,
    setQuery,
    statusFilter,
    setStatusFilter,
    setSelectedTaskId,
    store,
    activeCount,
    reviewCount,
    acceptedCount,
    visibleObjects,
    navigate,
    visibleTasks,
    filteredObjects,
    pending,
  } = crm;
  return (
    <main className="main">
      <header className="topbar">
        <button
          className="icon-button mobile-menu"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Открыть меню"
        >
          <Menu size={21} />
        </button>
        <div className="breadcrumbs">
          <span>Рабочее пространство</span>
          <ChevronRight size={14} />
          <strong>{selectedObject ? "Объекты" : title}</strong>
          {selectedObject && (
            <>
              <ChevronRight size={14} />
              <strong>{selectedObject.name}</strong>
            </>
          )}
        </div>
        <div className="topbar__right">
          <span className="topbar__date">
            {new Intl.DateTimeFormat("ru-RU", {
              day: "numeric",
              month: "long",
              year: "numeric",
            }).format(new Date())}
          </span>
          <span className="topbar__divider" />
          <button
            className="icon-button"
            aria-label="Уведомления"
            title="Уведомления появятся позже"
          >
            <Bell size={18} />
          </button>
          <Avatar userId={currentUserId} size="small" />
        </div>
      </header>

      <div className="workspace">
        {selectedObject && (
          <button
            className="back-link"
            onClick={() => {
              setSelectedObjectId(null);
              setView("objects");
            }}
          >
            <ArrowLeft size={15} />
            Все объекты
          </button>
        )}
        <div className="page-heading">
          <div>
            <div className="eyebrow">
              {selectedObject ? "ОБЪЕКТ" : "РАБОЧАЯ ПАНЕЛЬ"}
            </div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          {isManager && (
            <button
              className="button button--primary page-heading__action"
              onClick={() =>
                selectedObject || view === "tasks"
                  ? openTaskCreate(selectedObjectId ?? "")
                  : openObjectCreate()
              }
            >
              <Plus size={18} />
              {selectedObject || view === "tasks"
                ? "Новая задача"
                : "Новый объект"}
            </button>
          )}
        </div>

        {selectedObject ? (
          <>
            <div className="object-meta">
              <div>
                <MapPin size={16} />
                {selectedObject.address}
              </div>
              <span>Создан {formatDate(selectedObject.createdAt)}</span>
              {isManager && (
                <div className="object-meta__actions">
                  <button
                    onClick={() => openObjectEdit(selectedObject)}
                    disabled={Boolean(pending)}
                  >
                    Редактировать
                  </button>
                  <button
                    className="danger-text"
                    onClick={() => deleteObject(selectedObject)}
                    disabled={Boolean(pending)}
                    aria-busy={pending === "delete-object"}
                  >
                    {pending === "delete-object" ? "Удаляем…" : "Удалить"}
                  </button>
                </div>
              )}
            </div>
            <Suspense
              fallback={
                <div className="object-map">
                  <div className="object-map__status">Загружаем карту…</div>
                </div>
              }
            >
              <ObjectMap address={selectedObject.address} />
            </Suspense>
            <TaskSection
              tasks={pageTasks}
              title="Задачи объекта"
              query={query}
              setQuery={setQuery}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              onSelect={setSelectedTaskId}
              store={store}
              showObject={false}
              isManager={isManager}
              onCreate={() => openTaskCreate(selectedObject.id)}
            />
          </>
        ) : view === "overview" ? (
          <>
            <section className="metrics" aria-label="Сводка">
              <div className="metric">
                <span>Активные задачи</span>
                <strong>{activeCount.toString().padStart(2, "0")}</strong>
                <small>
                  <ArrowDownRight size={15} />
                  Новые, в работе, на доработке
                </small>
              </div>
              <div className="metric">
                <span>На проверке</span>
                <strong>{reviewCount.toString().padStart(2, "0")}</strong>
                <small>
                  <span className="metric__pulse" />
                  Ожидают решения
                </small>
              </div>
              <div className="metric">
                <span>Принято</span>
                <strong>{acceptedCount.toString().padStart(2, "0")}</strong>
                <small>
                  <Check size={14} />
                  Завершенные работы
                </small>
              </div>
              <div className="metric metric--last">
                <span>Объекты</span>
                <strong>
                  {visibleObjects.length.toString().padStart(2, "0")}
                </strong>
                <small>
                  <Building2 size={14} />В вашем пространстве
                </small>
              </div>
            </section>
            <div className="section-heading">
              <div>
                <h2>Объекты</h2>
                <p>Быстрый переход к задачам по каждой стройке</p>
              </div>
              <button
                className="text-button"
                onClick={() => navigate("objects")}
              >
                Все объекты <ArrowRight size={16} />
              </button>
            </div>
            <ObjectList
              objects={visibleObjects}
              tasks={visibleTasks}
              onSelect={(id) => {
                setSelectedObjectId(id);
                setView("objects");
                setQuery("");
              }}
            />
            <div className="section-heading section-heading--tasks">
              <div>
                <h2>{isManager ? "Требуют внимания" : "Мои задачи"}</h2>
                <p>
                  {isManager
                    ? "Задачи на проверке и в работе"
                    : "Последние задачи по вашим объектам"}
                </p>
              </div>
              <button
                className="text-button"
                onClick={() => navigate(isManager ? "tasks" : "my-tasks")}
              >
                Все задачи <ArrowRight size={16} />
              </button>
            </div>
            <TaskTable
              tasks={[...visibleTasks]
                .filter((task) =>
                  isManager
                    ? task.status === "review" || task.status === "revision"
                    : task.status !== "accepted",
                )
                .slice(0, 4)}
              onSelect={setSelectedTaskId}
              store={store}
            />
          </>
        ) : view === "objects" ? (
          <>
            <div className="list-toolbar">
              <div className="search">
                <Search size={18} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Поиск по названию или адресу"
                  aria-label="Поиск объектов"
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    aria-label="Очистить поиск"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <span className="result-count">
                {filteredObjects.length} {objectWord(filteredObjects.length)}
              </span>
            </div>
            <ObjectList
              objects={filteredObjects}
              tasks={visibleTasks}
              onSelect={(id) => {
                setSelectedObjectId(id);
                setQuery("");
              }}
            />
          </>
        ) : (
          <TaskSection
            tasks={pageTasks}
            title="Список задач"
            query={query}
            setQuery={setQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            onSelect={setSelectedTaskId}
            store={store}
            showObject
            isManager={isManager}
            onCreate={() => openTaskCreate()}
          />
        )}
      </div>
    </main>
  );
}
