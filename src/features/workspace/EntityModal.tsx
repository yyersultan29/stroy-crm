import { X } from "lucide-react";
import { users } from "../../data";
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
  } = crm;
  if (!modal) return null;
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
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
              >
                Отмена
              </button>
              <button className="button button--primary" type="submit">
                {editingObjectId ? "Сохранить" : "Создать объект"}
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
              >
                Отмена
              </button>
              <button className="button button--primary" type="submit">
                {editingTaskId ? "Сохранить" : "Создать задачу"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
