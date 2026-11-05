export type Status = "new" | "progress" | "review" | "revision" | "accepted";
export type Role = "manager" | "executor";
export type User = {
  id: string;
  name: string;
  initials: string;
  role: Role;
  color: string;
};
export type ObjectItem = {
  id: string;
  name: string;
  address: string;
  createdAt: string;
};
export type HistoryItem = {
  id: string;
  from: Status | null;
  to: Status;
  actorId: string;
  at: string;
  comment?: string;
};
export type Task = {
  id: string;
  title: string;
  description: string;
  objectId: string;
  assigneeId: string;
  authorId: string;
  status: Status;
  createdAt: string;
  history: HistoryItem[];
};
export type Store = { objects: ObjectItem[]; tasks: Task[] };

export let users: User[] = [
  {
    id: "u1",
    name: "Александр Морозов",
    initials: "АМ",
    role: "manager",
    color: "sand",
  },
  {
    id: "u2",
    name: "Мария Ким",
    initials: "МК",
    role: "executor",
    color: "lavender",
  },
  {
    id: "u3",
    name: "Илья Соколов",
    initials: "ИС",
    role: "executor",
    color: "mint",
  },
];

export function setUserDirectory(directory: User[]) {
  users = directory;
}

export const statusLabel: Record<Status, string> = {
  new: "Новая",
  progress: "В работе",
  review: "На проверке",
  revision: "На доработке",
  accepted: "Принята",
};

export const statusOrder: Status[] = [
  "new",
  "progress",
  "review",
  "revision",
  "accepted",
];

export const initialStore: Store = {
  objects: [
    {
      id: "o1",
      name: "ЖК «Горизонт»",
      address: "Алматы, ул. Сатпаева, 21",
      createdAt: "2026-10-14T09:00:00",
    },
    {
      id: "o2",
      name: "Бизнес-центр «Астана»",
      address: "Астана, пр. Кабанбай батыра, 8",
      createdAt: "2026-10-18T09:00:00",
    },
    {
      id: "o3",
      name: "Школа № 42",
      address: "Алматы, мкр. Орбита-3, 15",
      createdAt: "2026-10-24T09:00:00",
    },
  ],
  tasks: [
    {
      id: "t1",
      title: "Проверить армирование перекрытия",
      description:
        "Проверить соответствие армирования проектной документации на 4 этаже. Приложить замечания перед заливкой.",
      objectId: "o1",
      assigneeId: "u2",
      authorId: "u1",
      status: "review",
      createdAt: "2026-10-28T09:20:00",
      history: [
        {
          id: "h1",
          from: null,
          to: "new",
          actorId: "u1",
          at: "2026-10-28T09:20:00",
        },
        {
          id: "h2",
          from: "new",
          to: "progress",
          actorId: "u2",
          at: "2026-10-29T10:10:00",
        },
        {
          id: "h3",
          from: "progress",
          to: "review",
          actorId: "u2",
          at: "2026-11-03T16:35:00",
        },
      ],
    },
    {
      id: "t2",
      title: "Согласовать поставку окон",
      description:
        "Сверить спецификацию с поставщиком и подтвердить даты доставки.",
      objectId: "o1",
      assigneeId: "u3",
      authorId: "u1",
      status: "progress",
      createdAt: "2026-10-29T11:40:00",
      history: [
        {
          id: "h4",
          from: null,
          to: "new",
          actorId: "u1",
          at: "2026-10-29T11:40:00",
        },
        {
          id: "h5",
          from: "new",
          to: "progress",
          actorId: "u3",
          at: "2026-11-01T08:50:00",
        },
      ],
    },
    {
      id: "t3",
      title: "Обновить график отделочных работ",
      description:
        "Учесть новую дату поставки материалов и скорректировать этапы работ.",
      objectId: "o2",
      assigneeId: "u2",
      authorId: "u1",
      status: "revision",
      createdAt: "2026-10-27T14:00:00",
      history: [
        {
          id: "h6",
          from: null,
          to: "new",
          actorId: "u1",
          at: "2026-10-27T14:00:00",
        },
        {
          id: "h7",
          from: "new",
          to: "progress",
          actorId: "u2",
          at: "2026-10-28T09:10:00",
        },
        {
          id: "h8",
          from: "progress",
          to: "review",
          actorId: "u2",
          at: "2026-10-30T18:20:00",
        },
        {
          id: "h9",
          from: "review",
          to: "revision",
          actorId: "u1",
          at: "2026-11-02T11:15:00",
          comment: "Добавьте срок поставки дверей и отдельный этап приемки.",
        },
      ],
    },
    {
      id: "t4",
      title: "Подготовить акт скрытых работ",
      description: "Подготовить акт по электромонтажным работам в блоке Б.",
      objectId: "o2",
      assigneeId: "u3",
      authorId: "u1",
      status: "new",
      createdAt: "2026-11-03T10:00:00",
      history: [
        {
          id: "h10",
          from: null,
          to: "new",
          actorId: "u1",
          at: "2026-11-03T10:00:00",
        },
      ],
    },
    {
      id: "t5",
      title: "Принять монтаж вентиляции",
      description: "Проверить выполненные работы в спортивном зале.",
      objectId: "o3",
      assigneeId: "u3",
      authorId: "u1",
      status: "accepted",
      createdAt: "2026-10-20T08:30:00",
      history: [
        {
          id: "h11",
          from: null,
          to: "new",
          actorId: "u1",
          at: "2026-10-20T08:30:00",
        },
        {
          id: "h12",
          from: "new",
          to: "progress",
          actorId: "u3",
          at: "2026-10-21T09:00:00",
        },
        {
          id: "h13",
          from: "progress",
          to: "review",
          actorId: "u3",
          at: "2026-10-25T16:10:00",
        },
        {
          id: "h14",
          from: "review",
          to: "accepted",
          actorId: "u1",
          at: "2026-10-27T11:25:00",
        },
      ],
    },
    {
      id: "t6",
      title: "Проверить систему пожарной сигнализации",
      description: "Проверить датчики и передать результаты испытаний.",
      objectId: "o3",
      assigneeId: "u2",
      authorId: "u1",
      status: "progress",
      createdAt: "2026-11-01T13:15:00",
      history: [
        {
          id: "h15",
          from: null,
          to: "new",
          actorId: "u1",
          at: "2026-11-01T13:15:00",
        },
        {
          id: "h16",
          from: "new",
          to: "progress",
          actorId: "u2",
          at: "2026-11-02T09:30:00",
        },
      ],
    },
  ],
};

export function loadStore(): Store {
  try {
    const raw = localStorage.getItem("kontur-demo-v1");
    if (raw) {
      const value = JSON.parse(raw) as Store;
      if (Array.isArray(value.objects) && Array.isArray(value.tasks))
        return value;
    }
  } catch {
    /* use seeded data */
  }
  return initialStore;
}

export const formatDate = (date: string) =>
  new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" }).format(
    new Date(date),
  );
export const formatDateTime = (date: string) =>
  new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
export const getUser = (id: string) =>
  users.find((user) => user.id === id) ?? users[0];
