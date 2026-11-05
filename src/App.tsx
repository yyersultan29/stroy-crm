import { X } from "lucide-react";
import { supabase } from "./backend";
import { useCrm } from "./features/workspace/useCrm";
import { LoginScreen } from "./features/auth/LoginScreen";
import { Sidebar } from "./features/workspace/Sidebar";
import { WorkspaceView } from "./features/workspace/WorkspaceView";
import { TaskDrawer } from "./features/tasks/TaskDrawer";
import { EntityModal } from "./features/workspace/EntityModal";

function App() {
  const crm = useCrm();
  const {
    authChecked,
    sessionUserId,
    dataReady,
    loadError,
    actionError,
    setActionError,
    mobileNavOpen,
    setMobileNavOpen,
  } = crm;
  if (supabase && !authChecked)
    return <div className="app-loading">Подключаемся к Контур…</div>;
  if (supabase && !sessionUserId) return <LoginScreen />;
  if (supabase && !dataReady)
    return <div className="app-loading">Загружаем рабочее пространство…</div>;
  if (supabase && loadError)
    return (
      <div className="app-loading app-loading--error">
        <strong>Не удалось открыть рабочее пространство</strong>
        <p>{loadError}</p>
        <button
          className="button button--outline"
          onClick={() => supabase?.auth.signOut()}
        >
          Выйти
        </button>
      </div>
    );

  return (
    <div className="app-shell">
      {actionError && (
        <div className="error-toast" role="alert">
          <span>{actionError}</span>
          <button
            onClick={() => setActionError("")}
            aria-label="Закрыть ошибку"
          >
            <X size={16} />
          </button>
        </div>
      )}
      <div
        className={`mobile-scrim ${mobileNavOpen ? "is-visible" : ""}`}
        onClick={() => setMobileNavOpen(false)}
      />
      <Sidebar crm={crm} />
      <WorkspaceView crm={crm} />
      <TaskDrawer crm={crm} />
      <EntityModal crm={crm} />
    </div>
  );
}

export default App;
