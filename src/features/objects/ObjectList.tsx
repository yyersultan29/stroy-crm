import { ChevronRight, MapPin } from "lucide-react";
import { type ObjectItem, type Task } from "../../data";
import { EmptyState, taskWord } from "../../components/common";

export function ObjectList({
  objects,
  tasks,
  onSelect,
}: {
  objects: ObjectItem[];
  tasks: Task[];
  onSelect: (id: string) => void;
}) {
  if (!objects.length)
    return (
      <EmptyState
        title="Объекты не найдены"
        text="Попробуйте изменить поисковый запрос"
      />
    );
  return (
    <div className="object-list">
      <div className="object-list__head">
        <span>ОБЪЕКТ</span>
        <span>ЗАДАЧИ</span>
        <span>ПРОГРЕСС</span>
        <span />
      </div>
      {objects.map((object, index) => {
        const objectTasks = tasks.filter((task) => task.objectId === object.id);
        const accepted = objectTasks.filter(
          (task) => task.status === "accepted",
        ).length;
        const percent = objectTasks.length
          ? (accepted / objectTasks.length) * 100
          : 0;
        return (
          <button
            className="object-row"
            key={object.id}
            onClick={() => onSelect(object.id)}
          >
            <div className="object-row__identity">
              <span className="object-row__number">
                {(index + 1).toString().padStart(2, "0")}
              </span>
              <div>
                <strong>{object.name}</strong>
                <small>
                  <MapPin size={13} />
                  {object.address}
                </small>
              </div>
            </div>
            <span className="object-row__count">
              {objectTasks.length} <span>{taskWord(objectTasks.length)}</span>
            </span>
            <div className="object-row__progress">
              <span className="progress-track">
                <span style={{ width: `${percent}%` }} />
              </span>
              <small>{Math.round(percent)}%</small>
            </div>
            <ChevronRight className="object-row__arrow" size={19} />
          </button>
        );
      })}
    </div>
  );
}
