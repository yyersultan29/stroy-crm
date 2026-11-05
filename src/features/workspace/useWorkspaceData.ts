import { useEffect, useState } from "react";
import { loadWorkspace, supabase } from "../../backend";
import { loadStore, setUserDirectory, type Store } from "../../data";

export function useWorkspaceData(onSignedOut: () => void) {
  const [store, setStore] = useState<Store>(loadStore);
  const [currentUserId, setCurrentUserId] = useState("u1");
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(!supabase);
  const [dataReady, setDataReady] = useState(!supabase);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!supabase)
      localStorage.setItem("kontur-demo-v1", JSON.stringify(store));
  }, [store]);
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) setLoadError(error.message);
      setSessionUserId(data.session?.user.id ?? null);
      setAuthChecked(true);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSessionUserId(session?.user.id ?? null);
      setAuthChecked(true);
      if (event === "SIGNED_OUT") {
        onSignedOut();
      }
    });
    return () => subscription.unsubscribe();
  }, [onSignedOut]);
  useEffect(() => {
    if (!supabase || !sessionUserId) return;
    let cancelled = false;
    setDataReady(false);
    loadWorkspace()
      .then(({ store: nextStore, users: directory }) => {
        if (cancelled) return;
        if (!directory.some((user) => user.id === sessionUserId))
          throw new Error(
            "Для этого пользователя не назначена роль. Добавьте его в таблицу profiles.",
          );
        setUserDirectory(directory);
        setStore(nextStore);
        setCurrentUserId(sessionUserId);
        setLoadError("");
        setDataReady(true);
      })
      .catch((error) => {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : String(error));
          setDataReady(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [sessionUserId]);

  async function refreshWorkspace() {
    const { store: nextStore, users: directory } = await loadWorkspace();
    setUserDirectory(directory);
    setStore(nextStore);
  }

  return {
    store,
    setStore,
    currentUserId,
    setCurrentUserId,
    sessionUserId,
    authChecked,
    dataReady,
    loadError,
    refreshWorkspace,
  };
}
