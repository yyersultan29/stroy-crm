import { Check, Pencil, Trash2, X } from "lucide-react";
import { formatDateTime, getUser, statusLabel } from "../../data";
import { Avatar, StatusBadge } from "../../components/common";
import type { Crm } from "../workspace/useCrm";

export function TaskDrawer({ crm }: { crm: Crm }) {
  const {
    selectedTask,
    setSelectedTaskId,
    setRevisionComment,
    isManager,
    openTaskEdit,
    deleteTask,
    store,
    transitions,
    revisionComment,
    transition,
  } = crm;
  if (!selectedTask) return null;
  return (
    <>
      <div className="drawer-scrim" onClick={() => setSelectedTaskId(null)} />
      <aside className="task-drawer" aria-label="Карточка задачи">
        <div className="drawer__top">
          <span>
            ЗАДАЧА{" "}
            <span className="drawer__id">
              #{selectedTask.id.slice(0, 6).toUpperCase()}
            </span>
          </span>
          <button
            className="icon-button"
            onClick={() => {
              setSelectedTaskId(null);
              setRevisionComment("");
            }}
            aria-label="Закрыть"
          >
            <X size={20} />
          </button>
        </div>
        <div className="drawer__content">
          <div className="drawer__status">
            <StatusBadge status={selectedTask.status} />
            {isManager && (
              <div className="drawer__tools">
                <button
                  className="icon-button"
                  onClick={() => openTaskEdit(selectedTask)}
                  aria-label="Редактировать задачу"
                  title="Редактировать задачу"
                >
                  <Pencil size={18} />
                </button>
                <button
                  className="icon-button danger-text"
                  onClick={() => deleteTask(selectedTask)}
                  aria-label="Удалить задачу"
                  title="Удалить задачу"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            )}
          </div>
          <h2>{selectedTask.title}</h2>
          <p className="drawer__description">
            {selectedTask.description || "Описание не добавлено"}
          </p>
          <div className="drawer__fields">
            <div>
              <span>Объект</span>
              <strong>
                {store.objects.find(
                  (object) => object.id === selectedTask.objectId,
                )?.name ?? "—"}
              </strong>
            </div>
            <div>
              <span>Исполнитель</span>
              <strong>
                <Avatar userId={selectedTask.assigneeId} size="small" />
                {getUser(selectedTask.assigneeId).name}
              </strong>
            </div>
            <div>
              <span>Постановщик</span>
              <strong>
                <Avatar userId={selectedTask.authorId} size="small" />
                {getUser(selectedTask.authorId).name}
              </strong>
            </div>
            <div>
              <span>Создана</span>
              <strong>{formatDateTime(selectedTask.createdAt)}</strong>
            </div>
          </div>
          <div className="history">
            <h3>
              История изменений <span>{selectedTask.history.length}</span>
            </h3>
            <div className="history__list">
              {[...selectedTask.history].reverse().map((item) => (
                <div className="history__item" key={item.id}>
                  <div className="history__marker" />
                  <div>
                    <div className="history__event">
                      <strong>
                        {item.from
                          ? `${statusLabel[item.from]} → ${statusLabel[item.to]}`
                          : "Задача создана"}
                      </strong>
                      <span>{formatDateTime(item.at)}</span>
                    </div>
                    <p>{getUser(item.actorId).name}</p>
                    {item.comment && <blockquote>{item.comment}</blockquote>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="drawer__footer">
          {transitions.some((item) => item.to === "revision") && (
            <label className="revision-field">
              Комментарий для доработки
              <textarea
                value={revisionComment}
                onChange={(event) => setRevisionComment(event.target.value)}
                placeholder="Что нужно исправить?"
                rows={3}
              />
            </label>
          )}
          {transitions.length ? (
            transitions.map((item) => (
              <button
                key={item.to}
                className={`button ${item.primary ? "button--primary" : "button--outline"}`}
                onClick={() => transition(selectedTask, item.to)}
                disabled={item.to === "revision" && !revisionComment.trim()}
              >
                {item.primary && <Check size={17} />}
                {item.label}
              </button>
            ))
          ) : (
            <p>Доступных действий в этом статусе нет</p>
          )}
        </div>
      </aside>
    </>
  );
}
