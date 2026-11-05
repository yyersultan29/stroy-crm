import { useCallback, useMemo, useRef, useState } from "react";
import {
  getUser,
  users,
  type ObjectItem,
  type Status,
  type Task,
} from "../../data";
import { useWorkspaceData } from "./useWorkspaceData";
import { createWorkspaceActions } from "./workspaceActions";
import type { Modal, TaskForm, View } from "./types";

const blankTask = (objectId = ""): TaskForm => ({
  title: "",
  description: "",
  objectId,
  assigneeId: users.find((user) => user.role === "executor")?.id ?? "",
});

export function useCrm() {
  const [view, setView] = useState<View>("overview");
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [modal, setModal] = useState<Modal>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingObjectId, setEditingObjectId] = useState<string | null>(null);
  const [taskForm, setTaskForm] = useState<TaskForm>(blankTask);
  const [objectForm, setObjectForm] = useState({ name: "", address: "" });
  const [revisionComment, setRevisionComment] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [actionError, setActionError] = useState("");
  const busyRef = useRef(false);
  const [pending, setPending] = useState<string | null>(null);

  const resetNavigation = useCallback(() => {
    setView("overview");
    setSelectedObjectId(null);
    setSelectedTaskId(null);
    setQuery("");
    setStatusFilter("all");
  }, []);
  const {
    store,
    setStore,
    currentUserId,
    setCurrentUserId,
    sessionUserId,
    authChecked,
    dataReady,
    loadError,
    refreshWorkspace,
  } = useWorkspaceData(resetNavigation);

  const currentUser = getUser(currentUserId);
  const isManager = currentUser.role === "manager";
  const visibleTasks = useMemo(
    () =>
      isManager
        ? store.tasks
        : store.tasks.filter((task) => task.assigneeId === currentUserId),
    [store.tasks, isManager, currentUserId],
  );
  const visibleObjects = useMemo(
    () =>
      isManager
        ? store.objects
        : store.objects.filter((object) =>
            visibleTasks.some((task) => task.objectId === object.id),
          ),
    [store.objects, visibleTasks, isManager],
  );
  const selectedObject = visibleObjects.find(
    (object) => object.id === selectedObjectId,
  );
  const selectedTask = visibleTasks.find((task) => task.id === selectedTaskId);
  const pageTasks = visibleTasks.filter((task) => {
    if (selectedObjectId && task.objectId !== selectedObjectId) return false;
    if (view === "my-tasks" && task.assigneeId !== currentUserId) return false;
    if (statusFilter !== "all" && task.status !== statusFilter) return false;
    const haystack =
      `${task.title} ${task.description} ${store.objects.find((object) => object.id === task.objectId)?.name ?? ""}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });
  const filteredObjects = visibleObjects.filter((object) =>
    `${object.name} ${object.address}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const activeCount = visibleTasks.filter((task) =>
    ["new", "progress", "revision"].includes(task.status),
  ).length;
  const reviewCount = visibleTasks.filter(
    (task) => task.status === "review",
  ).length;
  const acceptedCount = visibleTasks.filter(
    (task) => task.status === "accepted",
  ).length;

  function navigate(nextView: View) {
    setView(nextView);
    setSelectedObjectId(null);
    setSelectedTaskId(null);
    setQuery("");
    setStatusFilter("all");
    setMobileNavOpen(false);
  }

  function openTaskCreate(objectId = "") {
    setEditingTaskId(null);
    setTaskForm(blankTask(objectId || store.objects[0]?.id));
    setModal("task");
  }

  function openTaskEdit(task: Task) {
    setEditingTaskId(task.id);
    setTaskForm({
      title: task.title,
      description: task.description,
      objectId: task.objectId,
      assigneeId: task.assigneeId,
    });
    setSelectedTaskId(null);
    setModal("task");
  }

  function openObjectCreate() {
    setEditingObjectId(null);
    setObjectForm({ name: "", address: "" });
    setModal("object");
  }
  function openObjectEdit(object: ObjectItem) {
    setEditingObjectId(object.id);
    setObjectForm({ name: object.name, address: object.address });
    setMenuOpen(false);
    setModal("object");
  }

  const { saveObject, saveTask, deleteTask, deleteObject, transition } =
    createWorkspaceActions({
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
    });

  const transitions: { to: Status; label: string; primary?: boolean }[] =
    !selectedTask
      ? []
      : isManager
        ? selectedTask.status === "review"
          ? [
              { to: "accepted", label: "Принять задачу", primary: true },
              { to: "revision", label: "Вернуть на доработку" },
            ]
          : []
        : selectedTask.assigneeId === currentUserId
          ? selectedTask.status === "new" || selectedTask.status === "revision"
            ? [{ to: "progress", label: "Взять в работу", primary: true }]
            : selectedTask.status === "progress"
              ? [
                  {
                    to: "review",
                    label: "Отправить на проверку",
                    primary: true,
                  },
                ]
              : []
          : [];

  const title = selectedObject
    ? selectedObject.name
    : view === "overview"
      ? "Обзор"
      : view === "objects"
        ? "Объекты"
        : view === "my-tasks"
          ? "Мои задачи"
          : "Все задачи";
  const subtitle = selectedObject
    ? selectedObject.address
    : view === "overview"
      ? "Что происходит на ваших объектах"
      : view === "objects"
        ? "Все строительные объекты в одном месте"
        : "Контроль выполнения и проверка работ";

  return {
    store,
    currentUserId,
    setCurrentUserId,
    view,
    setView,
    selectedObjectId,
    setSelectedObjectId,
    selectedTaskId,
    setSelectedTaskId,
    query,
    setQuery,
    statusFilter,
    setStatusFilter,
    modal,
    setModal,
    editingTaskId,
    editingObjectId,
    taskForm,
    setTaskForm,
    objectForm,
    setObjectForm,
    revisionComment,
    setRevisionComment,
    menuOpen,
    setMenuOpen,
    mobileNavOpen,
    setMobileNavOpen,
    sessionUserId,
    authChecked,
    dataReady,
    loadError,
    actionError,
    setActionError,
    pending,
    currentUser,
    isManager,
    visibleTasks,
    visibleObjects,
    selectedObject,
    selectedTask,
    pageTasks,
    filteredObjects,
    activeCount,
    reviewCount,
    acceptedCount,
    navigate,
    openTaskCreate,
    openTaskEdit,
    openObjectCreate,
    openObjectEdit,
    saveObject,
    saveTask,
    deleteTask,
    deleteObject,
    transition,
    transitions,
    title,
    subtitle,
  };
}

export type Crm = ReturnType<typeof useCrm>;
