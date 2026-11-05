import { Clock3, Loader2 } from "lucide-react";
import { getUser, statusLabel, type Status } from "../data";

export const taskWord = (count: number) =>
  count % 10 === 1 && count % 100 !== 11
    ? "задача"
    : count % 10 >= 2 &&
        count % 10 <= 4 &&
        (count % 100 < 12 || count % 100 > 14)
      ? "задачи"
      : "задач";
export const objectWord = (count: number) =>
  count % 10 === 1 && count % 100 !== 11
    ? "объект"
    : count % 10 >= 2 &&
        count % 10 <= 4 &&
        (count % 100 < 12 || count % 100 > 14)
      ? "объекта"
      : "объектов";

export function Avatar({
  userId,
  size = "normal",
}: {
  userId: string;
  size?: "normal" | "small";
}) {
  const user = getUser(userId);
  return (
    <span
      className={`avatar avatar--${user.color} avatar--${size}`}
      title={user.name}
    >
      {user.initials}
    </span>
  );
}

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`status status--${status}`}>
      <span className="status__dot" />
      {statusLabel[status]}
    </span>
  );
}

export function Spinner({ size = 16 }: { size?: number }) {
  return <Loader2 className="spin" size={size} aria-hidden="true" />;
}

export function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="empty-state">
      <span>
        <Clock3 size={23} />
      </span>
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}
