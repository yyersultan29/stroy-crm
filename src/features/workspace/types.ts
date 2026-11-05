export type View = "overview" | "objects" | "tasks" | "my-tasks";
export type Modal = "object" | "task" | null;
export type TaskForm = {
  title: string;
  description: string;
  objectId: string;
  assigneeId: string;
};
