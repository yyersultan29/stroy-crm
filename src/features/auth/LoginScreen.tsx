import { useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";
import { supabase } from "../../backend";

export function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function signIn(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setPending(true);
    setError("");
    const result = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (result.error)
      setError(
        result.error.message === "Invalid login credentials"
          ? "Неверный email или пароль"
          : result.error.message,
      );
    setPending(false);
  }

  return (
    <main className="login-screen">
      <section className="login-panel">
        <div className="login-brand">
          <span className="brand__mark">
            <span />
          </span>
          <span>
            контур<span className="brand__period">.</span>
          </span>
        </div>
        <div className="login-panel__middle">
          <div className="eyebrow">РАБОЧЕЕ ПРОСТРАНСТВО</div>
          <h1>
            Объекты и задачи
            <br />
            под контролем.
          </h1>
          <p>Войдите, чтобы продолжить работу с проектами.</p>
          <form onSubmit={signIn}>
            <label>
              Email
              <input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@company.com"
                required
              />
            </label>
            <label>
              Пароль
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Введите пароль"
                required
              />
            </label>
            {error && (
              <div className="login-error" role="alert">
                {error}
              </div>
            )}
            <button
              className="button button--primary"
              type="submit"
              disabled={pending}
            >
              {pending ? "Входим…" : "Войти в систему"}
              <ArrowRight size={17} />
            </button>
          </form>
        </div>
        <div className="login-panel__foot">
          Доступ выдается руководителем проекта
        </div>
      </section>
      <aside className="login-art">
        <div className="login-art__grid" />
        <div className="login-art__top">
          СИСТЕМА УПРАВЛЕНИЯ СТРОИТЕЛЬСТВОМ <span>01 / 03</span>
        </div>
        <div className="login-art__shape login-art__shape--one" />
        <div className="login-art__shape login-art__shape--two" />
        <div className="login-art__caption">
          <span>ПОРЯДОК В КАЖДОЙ ДЕТАЛИ</span>
          <strong>
            От задачи
            <br />к результату.
          </strong>
        </div>
      </aside>
    </main>
  );
}
