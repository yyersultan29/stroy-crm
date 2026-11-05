import {
  Building2,
  Check,
  CheckCheck,
  ChevronDown,
  CircleHelp,
  ClipboardList,
  LayoutGrid,
} from "lucide-react";
import { supabase } from "../../backend";
import { users } from "../../data";
import { Avatar } from "../../components/common";
import type { Crm } from "./useCrm";

export function Sidebar({ crm }: { crm: Crm }) {
  const {
    view,
    selectedObject,
    navigate,
    visibleObjects,
    isManager,
    currentUserId,
    currentUser,
    menuOpen,
    setMenuOpen,
    setCurrentUserId,
    setSelectedObjectId,
    setSelectedTaskId,
    setView,
    setMobileNavOpen,
    mobileNavOpen,
  } = crm;
  return (
    <aside className={`sidebar ${mobileNavOpen ? "sidebar--open" : ""}`}>
      <div className="brand">
        <span className="brand__mark">
          <span />
        </span>
        <span>
          контур<span className="brand__period">.</span>
        </span>
      </div>
      <div className="sidebar__label">РАБОЧЕЕ ПРОСТРАНСТВО</div>
      <nav className="nav" aria-label="Основная навигация">
        <button
          className={`nav__item ${view === "overview" && !selectedObject ? "is-active" : ""}`}
          onClick={() => navigate("overview")}
        >
          <LayoutGrid size={18} strokeWidth={1.8} />
          Обзор
        </button>
        <button
          className={`nav__item ${view === "objects" || selectedObject ? "is-active" : ""}`}
          onClick={() => navigate("objects")}
        >
          <Building2 size={18} strokeWidth={1.8} />
          Объекты<span className="nav__count">{visibleObjects.length}</span>
        </button>
        <button
          className={`nav__item ${view === "tasks" ? "is-active" : ""}`}
          onClick={() => navigate("tasks")}
        >
          <ClipboardList size={18} strokeWidth={1.8} />
          Все задачи
        </button>
        {!isManager && (
          <button
            className={`nav__item ${view === "my-tasks" ? "is-active" : ""}`}
            onClick={() => navigate("my-tasks")}
          >
            <CheckCheck size={18} strokeWidth={1.8} />
            Мои задачи
          </button>
        )}
      </nav>
      <div className="sidebar__spacer" />
      <div className="sidebar__help">
        <CircleHelp size={17} />
        Демо интерфейса
      </div>
      <div className="account">
        <Avatar userId={currentUserId} />
        <div className="account__copy">
          <strong>{currentUser.name}</strong>
          <span>{isManager ? "Постановщик" : "Исполнитель"}</span>
        </div>
        <button
          className="account__switch"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Сменить пользователя"
          aria-expanded={menuOpen}
        >
          <ChevronDown size={17} />
        </button>
        {menuOpen && (
          <div className="user-menu">
            {supabase ? (
              <>
                <div className="user-menu__title">АККАУНТ</div>
                <button
                  onClick={() => {
                    supabase?.auth.signOut();
                    setMenuOpen(false);
                  }}
                >
                  Выйти из системы
                </button>
              </>
            ) : (
              <>
                <div className="user-menu__title">Просмотр роли</div>
                {users.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => {
                      setCurrentUserId(user.id);
                      setSelectedObjectId(null);
                      setSelectedTaskId(null);
                      setView("overview");
                      setMenuOpen(false);
                      setMobileNavOpen(false);
                    }}
                  >
                    <Avatar userId={user.id} size="small" />
                    <span>
                      <strong>{user.name}</strong>
                      <small>
                        {user.role === "manager"
                          ? "Постановщик"
                          : "Исполнитель"}
                      </small>
                    </span>
                    {user.id === currentUserId && <Check size={16} />}
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
