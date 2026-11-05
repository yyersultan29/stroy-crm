import { X } from "lucide-react";
import { users } from "../../data";
import { Spinner } from "../../components/common";
import type { Crm } from "./useCrm";

export function EntityModal({ crm }: { crm: Crm }) {
  const {
    modal,
    setModal,
    editingObjectId,
    editingTaskId,
    saveObject,
    objectForm,
    setObjectForm,
    saveTask,
    taskForm,
    setTaskForm,
    store,
    pending,
  } = crm;
  if (!modal) return null;
  const savingObject = pending === "object";
  const savingTask = pending === "task";
  const locked = Boolean(pending);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (locked) return;
        if (event.target === event.currentTarget) setModal(null);
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={modal === "object" ? "Форма объекта" : "Форма задачи"}
      >
        <div className="modal__head">
          <div>
            <span className="eyebrow">
              {editingObjectId || editingTaskId ? "РЕДАКТИРОВАНИЕ" : "СОЗДАНИЕ"}
            </span>
            <h2>
              {modal === "object"
                ? editingObjectId
                  ? "Редактировать объект"
                  : "Новый объект"
                : editingTaskId
                  ? "Редактировать задачу"
                  : "Новая задача"}
            </h2>
          </div>
          <button
            className="icon-button"
            onClick={() => setModal(null)}
            aria-label="Закрыть"
            disabled={locked}
          >
            <X size={20} />
          </button>
        </div>
        {modal === "object" ? (
          <form onSubmit={saveObject}>
            <label>
              Название объекта
              <input
                required
                autoFocus
                disabled={savingObject}
                value={objectForm.name}
                onChange={(event) =>
                  setObjectForm({ ...objectForm, name: event.target.value })
                }
                placeholder="Например, ЖК «Горизонт»"
              />
            </label>
            <label>
              Адрес
              <input
                required
                disabled={savingObject}
                value={objectForm.address}
                onChange={(event) =>
                  setObjectForm({ ...objectForm, address: event.target.value })
                }
                placeholder="Город, улица и номер здания"
              />
            </label>
            <div className="modal__actions">
              <button
                type="button"
                className="button button--ghost"
                onClick={() => setModal(null)}
                disabled={savingObject}
              >
                Отмена
              </button>
              <button
                className="button button--primary"
                type="submit"
                disabled={savingObject}
                aria-busy={savingObject}
              >
                {savingObject && <Spinner />}
                {savingObject
                  ? editingObjectId
                    ? "Сохраняем…"
                    : "Создаём…"
                  : editingObjectId
                    ? "Сохранить"
                    : "Создать объект"}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={saveTask}>
            <label>
              Название задачи
              <input
                required
                autoFocus
                disabled={savingTask}
                value={taskForm.title}
                onChange={(event) =>
                  setTaskForm({ ...taskForm, title: event.target.value })
                }
                placeholder="Что нужно сделать?"
              />
            </label>
            <label>
              Описание
              <textarea
                rows={4}
                disabled={savingTask}
                value={taskForm.description}
                onChange={(event) =>
                  setTaskForm({ ...taskForm, description: event.target.value })
                }
                placeholder="Детали и ожидаемый результат"
              />
            </label>
            <div className="form-grid">
              <label>
                Объект
                <select
                  required
                  disabled={savingTask}
                  value={taskForm.objectId}
                  onChange={(event) =>
                    setTaskForm({ ...taskForm, objectId: event.target.value })
                  }
                >
                  {store.objects.map((object) => (
                    <option key={object.id} value={object.id}>
                      {object.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Исполнитель
                <select
                  required
                  disabled={savingTask}
                  value={taskForm.assigneeId}
                  onChange={(event) =>
                    setTaskForm({ ...taskForm, assigneeId: event.target.value })
                  }
                >
                  {users
                    .filter((user) => user.role === "executor")
                    .map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                </select>
              </label>
            </div>
            <div className="modal__actions">
              <button
                type="button"
                className="button button--ghost"
                onClick={() => setModal(null)}
                disabled={savingTask}
              >
                Отмена
              </button>
              <button
                className="button button--primary"
                type="submit"
                disabled={savingTask}
                aria-busy={savingTask}
              >
                {savingTask && <Spinner />}
                {savingTask
                  ? editingTaskId
                    ? "Сохраняем…"
                    : "Создаём…"
                  : editingTaskId
                    ? "Сохранить"
                    : "Создать задачу"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
