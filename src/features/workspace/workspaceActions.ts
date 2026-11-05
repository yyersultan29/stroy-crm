import type {
  Dispatch,
  FormEvent,
  MutableRefObject,
  SetStateAction,
} from "react";
import type { ObjectItem, Status, Store, Task } from "../../data";
import {
  createObject,
  createTask,
  deleteObject as deleteRemoteObject,
  deleteTask as deleteRemoteTask,
  supabase,
  transitionTask,
  updateObject,
  updateTask,
} from "../../backend";
import type { Modal, TaskForm } from "./types";

type WorkspaceActionsOptions = {
  setStore: Dispatch<SetStateAction<Store>>;
  currentUserId: string;
  editingObjectId: string | null;
  objectForm: { name: string; address: string };
  editingTaskId: string | null;
  taskForm: TaskForm;
  revisionComment: string;
  refreshWorkspace: () => Promise<void>;
  setModal: Dispatch<SetStateAction<Modal>>;
  setSelectedTaskId: Dispatch<SetStateAction<string | null>>;
  setSelectedObjectId: Dispatch<SetStateAction<string | null>>;
  setMenuOpen: Dispatch<SetStateAction<boolean>>;
  setRevisionComment: Dispatch<SetStateAction<string>>;
  setActionError: Dispatch<SetStateAction<string>>;
  busyRef: MutableRefObject<boolean>;
  setPending: Dispatch<SetStateAction<string | null>>;
};

export function createWorkspaceActions({
  setStore,
  currentUserId,
  editingObjectId,
  objectForm,
  editingTaskId,
  taskForm,
  revisionComment,
  refreshWorkspace,
  setModal,
  setSelectedTaskId,
  setSelectedObjectId,
  setMenuOpen,
  setRevisionComment,
  setActionError,
  busyRef,
  setPending,
}: WorkspaceActionsOptions) {
  function reportError(error: unknown) {
    setActionError(error instanceof Error ? error.message : String(error));
  }

  function begin(action: string) {
    if (busyRef.current) return false;
    busyRef.current = true;
    setPending(action);
    return true;
  }

  function end() {
    busyRef.current = false;
    setPending(null);
  }

  async function saveObject(event: FormEvent) {
    event.preventDefault();
    const name = objectForm.name.trim();
    const address = objectForm.address.trim();
    if (!name || !address || !begin("object")) return;
    try {
      if (supabase) {
        if (editingObjectId)
          await updateObject(editingObjectId, { name, address });
        else await createObject({ name, address });
        await refreshWorkspace();
      } else if (editingObjectId)
        setStore((previous) => ({
          ...previous,
          objects: previous.objects.map((object) =>
            object.id === editingObjectId
              ? { ...object, name, address }
              : object,
          ),
        }));
      else
        setStore((previous) => ({
          ...previous,
          objects: [
            {
              id: crypto.randomUUID(),
              name,
              address,
              createdAt: new Date().toISOString(),
            },
            ...previous.objects,
          ],
        }));
      setModal(null);
    } catch (error) {
      reportError(error);
    } finally {
      end();
    }
  }

  async function saveTask(event: FormEvent) {
    event.preventDefault();
    const title = taskForm.title.trim();
    const description = taskForm.description.trim();
    if (!title || !taskForm.objectId || !taskForm.assigneeId || !begin("task"))
      return;
    try {
      if (supabase) {
        if (editingTaskId)
          await updateTask(editingTaskId, {
            title,
            description,
            objectId: taskForm.objectId,
            assigneeId: taskForm.assigneeId,
          });
        else
          await createTask({
            title,
            description,
            objectId: taskForm.objectId,
            assigneeId: taskForm.assigneeId,
            authorId: currentUserId,
          });
        await refreshWorkspace();
      } else if (editingTaskId)
        setStore((previous) => ({
          ...previous,
          tasks: previous.tasks.map((task) =>
            task.id === editingTaskId
              ? {
                  ...task,
                  title,
                  description,
                  objectId: taskForm.objectId,
                  assigneeId: taskForm.assigneeId,
                }
              : task,
          ),
        }));
      else {
        const now = new Date().toISOString();
        const task: Task = {
          id: crypto.randomUUID(),
          title,
          description,
          objectId: taskForm.objectId,
          assigneeId: taskForm.assigneeId,
          authorId: currentUserId,
          status: "new",
          createdAt: now,
          history: [
            {
              id: crypto.randomUUID(),
              from: null,
              to: "new",
              actorId: currentUserId,
              at: now,
            },
          ],
        };
        setStore((previous) => ({
          ...previous,
          tasks: [task, ...previous.tasks],
        }));
      }
      setModal(null);
    } catch (error) {
      reportError(error);
    } finally {
      end();
    }
  }

  async function deleteTask(task: Task) {
    if (!window.confirm(`Удалить задачу «${task.title}»?`)) return;
    if (!begin("delete-task")) return;
    try {
      if (supabase) {
        await deleteRemoteTask(task.id);
        await refreshWorkspace();
      } else
        setStore((previous) => ({
          ...previous,
          tasks: previous.tasks.filter((item) => item.id !== task.id),
        }));
      setSelectedTaskId(null);
    } catch (error) {
      reportError(error);
    } finally {
      end();
    }
  }

  async function deleteObject(object: ObjectItem) {
    if (!window.confirm(`Удалить объект «${object.name}» и все его задачи?`))
      return;
    if (!begin("delete-object")) return;
    try {
      if (supabase) {
        await deleteRemoteObject(object.id);
        await refreshWorkspace();
      } else
        setStore((previous) => ({
          objects: previous.objects.filter((item) => item.id !== object.id),
          tasks: previous.tasks.filter((task) => task.objectId !== object.id),
        }));
      setSelectedObjectId(null);
      setMenuOpen(false);
    } catch (error) {
      reportError(error);
    } finally {
      end();
    }
  }

  async function transition(task: Task, to: Status) {
    if (to === "revision" && !revisionComment.trim()) return;
    if (!begin(`transition:${to}`)) return;
    try {
      if (supabase) {
        await transitionTask(task.id, to, revisionComment.trim());
        await refreshWorkspace();
      } else {
        const now = new Date().toISOString();
        setStore((previous) => ({
          ...previous,
          tasks: previous.tasks.map((item) =>
            item.id === task.id
              ? {
                  ...item,
                  status: to,
                  history: [
                    ...item.history,
                    {
                      id: crypto.randomUUID(),
                      from: item.status,
                      to,
                      actorId: currentUserId,
                      at: now,
                      ...(to === "revision"
                        ? { comment: revisionComment.trim() }
                        : {}),
                    },
                  ],
                }
              : item,
          ),
        }));
      }
      setRevisionComment("");
    } catch (error) {
      reportError(error);
    } finally {
      end();
    }
  }

  return { saveObject, saveTask, deleteTask, deleteObject, transition };
}
