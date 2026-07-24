import React, { useState, useEffect, useMemo } from "react";
import { Card, Button, Input } from "@takt/design-system";
import {
  LogOut,
  Clock,
  Calendar,
  Timer,
  Sparkles,
  FolderPlus,
  Plus,
  AlertCircle,
  Sun,
  Moon,
  X,
} from "lucide-react";
import { api, Category, Activity, User } from "./services/api";
import { StopwatchPanel } from "./components/StopwatchPanel";
import { CalendarView } from "./components/CalendarView";
import { toLocalDateStr } from "./utils/dates";
import "@takt/design-system/theme.css";

const DASHBOARD_SCALE = 1.1;
const AUTH_CARD_MIN_HEIGHT = 560;
type AuthFieldErrors = Partial<Record<"username" | "email" | "password", string>>;

export default function App() {
  const [user, setUser] = useState<User | null>(null);

  // Theme toggle
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("takt-theme");
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("takt-theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));
  const [categories, setCategories] = useState<Category[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  // Auth Inputs
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authFieldErrors, setAuthFieldErrors] = useState<AuthFieldErrors>({});

  // Category Inputs
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState("#10b981");
  const [catError, setCatError] = useState("");
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState(toLocalDateStr(new Date()));
  const [retroCategoryId, setRetroCategoryId] = useState("");
  const [openRetroRequest, setOpenRetroRequest] = useState(0);
  const [activeSession, setActiveSession] = useState<{
    categoryName: string;
    categoryColor: string;
    startTime: Date;
  } | null>(null);

  const greetingBlock = useMemo(() => {
    const firstName = user?.name?.trim().split(" ")[0] || "por aqui";
    const hour = new Date().getHours();

    if (hour < 12) {
      const lines = [
        "Pronta para medir a produtividade de hoje?",
        "Vamos começar com um bloco focado agora cedo?",
        "Que tal abrir o dia com uma sessão de foco clara?",
      ];
      return {
        title: `Bom dia, ${firstName}`,
        line: lines[Math.floor(Math.random() * lines.length)],
      };
    }

    if (hour < 18) {
      const lines = [
        "Bora registrar o que importa nesta tarde?",
        "Vamos transformar o ritmo de hoje em progresso?",
        "Que tal marcar um bloco produtivo agora?",
      ];
      return {
        title: `Boa tarde, ${firstName}`,
        line: lines[Math.floor(Math.random() * lines.length)],
      };
    }

    const lines = [
      "Vamos fechar o dia com mais um bloco bem definido?",
      "Que tal registrar a reta final da sua produtividade?",
      "Vamos encerrar o dia registrando seus últimos blocos?",
    ];
    return {
      title: `Boa noite, ${firstName}`,
      line: lines[Math.floor(Math.random() * lines.length)],
    };
  }, [user?.name]);

  useEffect(() => {
    const loggedUser = api.getCurrentUser();
    if (loggedUser) {
      setUser(loggedUser);
      loadDashboardData();
    }
  }, []);

  const loadDashboardData = async () => {
    try {
      const cats = await api.getCategories();
      setCategories(cats);
      const acts = await api.getActivities();
      setActivities(acts);
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    }
  };

  const validateAuthForm = () => {
    const cleanUsername = username.trim();
    const cleanEmail = registerEmail.trim();
    const nextErrors: AuthFieldErrors = {};

    if (!cleanUsername) {
      nextErrors.username = "Informe seu usuário.";
    } else if (authMode === "register" && cleanUsername.length < 3) {
      nextErrors.username = "Use pelo menos 3 caracteres.";
    }

    if (!password.trim()) {
      nextErrors.password = "Informe sua senha.";
    }

    if (authMode === "register") {
      if (!cleanEmail) {
        nextErrors.email = "Informe seu e-mail.";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        nextErrors.email = "Digite um e-mail válido.";
      }

      if (!password.trim()) {
        nextErrors.password = "Crie uma senha.";
      } else if (password.length < 6) {
        nextErrors.password = "Use pelo menos 6 caracteres.";
      } else if (!/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/.test(password)) {
        nextErrors.password = "Inclua uma letra maiúscula, um número e um símbolo.";
      }
    }

    setAuthFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setAuthError("Revise os campos destacados.");
      return false;
    }

    return true;
  };

  const clearAuthFieldError = (field: keyof AuthFieldErrors) => {
    setAuthError("");
    setAuthFieldErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    if (!validateAuthForm()) {
      return;
    }

    const cleanUsername = username.trim();
    const cleanEmail = registerEmail.trim();

    try {
      const data =
        authMode === "register"
          ? await api.register(cleanUsername, cleanEmail, password.trim())
          : await api.login(cleanUsername, password.trim());
      setUser(data.user);
      loadDashboardData();
    } catch (err: any) {
      setAuthError(
        err.message ||
          (authMode === "register"
            ? "Falha ao cadastrar. Verifique os dados."
            : "Falha na autenticação. Verifique os dados."),
      );
    }
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setCategories([]);
    setActivities([]);
    setUsername("");
    setRegisterEmail("");
    setPassword("");
  };

  const handleAddCategory = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setCatError("");

    if (!newCatName.trim()) {
      setCatError("O nome da categoria é obrigatório.");
      return;
    }

    if (newCatName.trim().length > 50) {
      setCatError("O nome da categoria deve ter no máximo 50 caracteres.");
      return;
    }

    try {
      const created = await api.createCategory(newCatName.trim(), newCatColor);
      setCategories((prev) => [...prev, created]);
      setNewCatName("");
    } catch (err: any) {
      setCatError(err.message || "Erro ao criar categoria.");
    }
  };

  const toggleBulkCategory = (id: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleBulkDeleteCategories = async () => {
    const removableIds = selectedCategoryIds.filter((id) =>
      categories.some((c) => c.id === id && c.isCustom),
    );

    if (removableIds.length === 0) {
      setCatError("Selecione ao menos uma categoria customizada para remover.");
      return;
    }

    setCatError("");
    const results = await Promise.allSettled(
      removableIds.map((id) => api.deleteCategory(id)),
    );

    const failedCount = results.filter((r) => r.status === "rejected").length;
    const succeededIds = removableIds.filter(
      (_, index) => results[index].status === "fulfilled",
    );

    if (succeededIds.length > 0) {
      setCategories((prev) => prev.filter((c) => !succeededIds.includes(c.id)));
    }

    setSelectedCategoryIds([]);

    if (failedCount > 0) {
      setCatError(`Não foi possível remover ${failedCount} categoria(s).`);
    }
  };

  const handleActivityLogged = (newActivity: Activity) => {
    setActivities((prev) => [...prev, newActivity]);
  };

  const handleActivityDeleted = async (id: string) => {
    try {
      await api.deleteActivity(id);
      setActivities((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Failed to delete activity", err);
    }
  };

  const handleActivityUpdated = (updated: Activity) => {
    setActivities((prev) =>
      prev.map((a) => (a.id === updated.id ? updated : a)),
    );
  };

  useEffect(() => {
    if (categories.length === 0) {
      setRetroCategoryId("");
      return;
    }

    const stillExists = categories.some((c) => c.id === retroCategoryId);
    if (!retroCategoryId || !stillExists) {
      setRetroCategoryId(categories[0].id);
    }
  }, [categories, retroCategoryId]);

  useEffect(() => {
    if (showCategoriesModal) {
      setSelectedCategoryIds([]);
      setCatError("");
    }
  }, [showCategoriesModal]);

  // If not logged in, render Login Page
  if (!user) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at 8% 10%, color-mix(in srgb, var(--color-primary) 20%, transparent) 0%, transparent 40%), radial-gradient(circle at 92% 82%, color-mix(in srgb, var(--color-secondary) 22%, transparent) 0%, transparent 38%), var(--bg-main)",
          padding: "20px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.11,
            backgroundImage:
              "repeating-linear-gradient(115deg, transparent 0 18px, color-mix(in srgb, var(--text-muted) 24%, transparent) 18px 19px)",
            pointerEvents: "none",
          }}
        />
        <section
          className="login-shell"
          style={{
            width: "100%",
            maxWidth: "980px",
            display: "grid",
            gridTemplateColumns: "1.1fr 0.9fr",
            gap: "36px",
            position: "relative",
            zIndex: 1,
            alignItems: "center",
          }}
        >
          <div
            className="login-static-panel"
            style={{
              padding: "14px 8px",
              minHeight: `${AUTH_CARD_MIN_HEIGHT}px`,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "1.2px",
                color: "var(--text-secondary)",
                marginBottom: "18px",
              }}
            >
              Caderno de foco
            </span>
            <h1
              style={{
                fontSize: "clamp(38px, 8vw, 70px)",
                fontWeight: 600,
                fontFamily: "var(--font-heading)",
                margin: "0 0 16px 0",
                lineHeight: 0.98,
                letterSpacing: "-1px",
              }}
            >
              Takt
            </h1>
            <p
              style={{
                margin: "0 0 18px 0",
                fontSize: "17px",
                color: "var(--text-primary)",
                maxWidth: "42ch",
                lineHeight: 1.55,
              }}
            >
              Entenda como seu tempo se distribui no dia e transforme rotina em
              insights para melhorar foco, organizacao e performance.
            </p>
            <div style={{ display: "grid", gap: "8px", marginBottom: "16px" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                }}
              >
                <Timer size={14} />
                Registre atividades em tempo real ou manualmente
              </div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                }}
              >
                <Calendar size={14} />
                Visualize padroes no calendario com categorias personalizadas
              </div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                }}
              >
                <Sparkles size={14} />
                Avalie produtividade e melhore suas decisoes da semana
              </div>
            </div>
          </div>

          <div
            className="auth-card"
            style={{
              background:
                theme === "dark"
                  ? "color-mix(in srgb, var(--bg-card) 88%, white 12%)"
                  : "color-mix(in srgb, white 92%, var(--bg-card) 8%)",
              border: "none",
              borderRadius: "26px 12px 22px 14px",
              padding: "34px 30px",
              minHeight: `${AUTH_CARD_MIN_HEIGHT}px`,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              backdropFilter: "var(--backdrop-blur)",
              WebkitBackdropFilter: "var(--backdrop-blur)",
              boxShadow:
                "0 18px 36px color-mix(in srgb, var(--color-primary) 12%, transparent), inset 0 1px 0 color-mix(in srgb, var(--text-primary) 8%, transparent)",
              transition: "background var(--transition-fast), box-shadow var(--transition-fast)",
            }}
          >
            <div style={{ marginBottom: "22px" }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: "22px",
                  fontFamily: "var(--font-heading)",
                  fontWeight: 600,
                }}
              >
                {authMode === "register" ? "Criar conta" : "Entrar"}
              </h2>
              <p
                style={{
                  margin: "6px 0 0 0",
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                }}
              >
                {authMode === "register"
                  ? "Crie seu acesso inicial para salvar categorias e blocos de tempo"
                  : "Seu historico de tempo, categorias e produtividade em um so lugar"}
              </p>
            </div>

            {authError && (
              <div
                style={{
                  padding: "12px",
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid var(--color-nada)",
                  borderRadius: "var(--border-radius-md)",
                  color: "var(--color-nada)",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "20px",
                }}
              >
                <AlertCircle size={16} />
                <span>{authError}</span>
              </div>
            )}

            <form
              onSubmit={handleAuthSubmit}
              noValidate
              style={{ display: "flex", flexDirection: "column", gap: "20px" }}
            >
              <Input
                id="login-username-input"
                label="Usuário"
                placeholder="seu_usuario"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  clearAuthFieldError("username");
                }}
                error={authFieldErrors.username}
                aria-invalid={Boolean(authFieldErrors.username)}
                autoComplete="username"
              />

              {authMode === "register" && (
                <Input
                  id="register-email-input"
                  label="E-mail"
                  placeholder="seu-email@empresa.com"
                  type="email"
                  value={registerEmail}
                  onChange={(e) => {
                    setRegisterEmail(e.target.value);
                    clearAuthFieldError("email");
                  }}
                  error={authFieldErrors.email}
                  aria-invalid={Boolean(authFieldErrors.email)}
                  autoComplete="email"
                />
              )}

              <Input
                id="login-password-input"
                label="Senha de acesso"
                placeholder="Digite sua senha"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearAuthFieldError("password");
                }}
                error={authFieldErrors.password}
                aria-invalid={Boolean(authFieldErrors.password)}
                autoComplete={
                  authMode === "register" ? "new-password" : "current-password"
                }
              />

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "13px",
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    style={{ accentColor: "var(--color-primary)" }}
                  />{" "}
                  Lembrar de mim
                </label>
                {authMode === "login" && (
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      alert(
                        "Recuperação via e-mail em desenvolvimento. Vamos integrar esse fluxo depois do MVP de login/cadastro.",
                      );
                    }}
                    style={{
                      color: "var(--color-primary)",
                      textDecoration: "none",
                      fontWeight: 500,
                    }}
                  >
                    Esqueceu a senha?
                  </a>
                )}
              </div>

              <Button
                id="btn-login-submit"
                type="submit"
                variant="primary"
                style={{ width: "100%", marginTop: "8px" }}
              >
                {authMode === "register" ? "Criar conta no Takt" : "Entrar no Takt"}
              </Button>
            </form>

            <div
              style={{
                marginTop: "24px",
                textAlign: "center",
                fontSize: "13px",
                color: "var(--text-secondary)",
              }}
            >
              {authMode === "register"
                ? "Já tem uma conta?"
                : "Não tem uma conta?"}{" "}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setAuthError("");
                  setAuthFieldErrors({});
                  setAuthMode((mode) =>
                    mode === "login" ? "register" : "login",
                  );
                }}
                style={{
                  color: "var(--color-primary)",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                {authMode === "register" ? "Entrar" : "Cadastre-se"}
              </a>
            </div>
          </div>
        </section>
        <style>{`
          @media (max-width: 880px) {
            .login-shell {
              grid-template-columns: 1fr !important;
              gap: 20px !important;
            }
            .login-static-panel {
              min-height: auto !important;
              justify-content: flex-start !important;
            }
            .auth-card {
              min-height: auto !important;
            }
          }
        `}</style>
      </main>
    );
  }

  // If logged in, render main application Dashboard
  return (
    <div
      className="app-shell-logged"
      style={{
        flex: 1,
        height: "100%",
        minHeight: "100dvh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background:
          theme === "dark"
            ? "radial-gradient(circle at -12% -18%, color-mix(in srgb, var(--color-primary) 10%, transparent) 0%, transparent 50%), color-mix(in srgb, var(--bg-main) 92%, white 8%)"
            : "radial-gradient(circle at -12% -18%, color-mix(in srgb, var(--color-primary) 10%, transparent) 0%, transparent 52%), color-mix(in srgb, var(--bg-main) 84%, white 16%)",
      }}
    >
      <header
        style={{
          background: "var(--surface-elevated)",
          backdropFilter: "var(--backdrop-blur)",
          WebkitBackdropFilter: "var(--backdrop-blur)",
          borderBottom: "1px solid var(--border-color)",
          position: "sticky",
          top: 0,
          zIndex: 100,
          padding: "clamp(12px, 1.8vh, 18px) clamp(14px, 2.6vw, 28px)",
        }}
      >
        <div
          className="app-header-inner"
          style={{
            width: "100%",
            maxWidth: "1320px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              minWidth: 0,
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background:
                  "linear-gradient(135deg, var(--color-primary), var(--color-secondary))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px var(--color-primary-glow)",
              }}
            >
              <Clock size={20} style={{ color: "var(--bg-main)" }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <h1
                style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  margin: 0,
                  letterSpacing: "-0.3px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                Takt App
              </h1>
              <p
                style={{
                  margin: "2px 0 0 0",
                  fontSize: "12px",
                  color: "var(--text-muted)",
                  letterSpacing: "0.2px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                Menos correria, mais clareza no seu dia
              </p>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
              justifyContent: "flex-end",
            }}
          >
            <Button
              onClick={() => setShowCategoriesModal(true)}
              variant="secondary"
              style={{ padding: "8px 12px" }}
            >
              <FolderPlus size={16} /> Categorias
            </Button>
            <Button
              onClick={toggleTheme}
              variant="ghost"
              style={{
                padding: "8px 10px",
                border: "1px solid var(--border-color)",
              }}
              aria-label="Trocar tema"
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </Button>
            <Button
              onClick={handleLogout}
              variant="ghost"
              style={{
                padding: "8px 12px",
                border: "1px solid var(--border-color)",
              }}
            >
              <LogOut size={16} /> Sair
            </Button>
          </div>
        </div>
      </header>

      <div
        className="app-content-scale"
        style={{
          flex: 1,
          minHeight: 0,
          height: `calc(100% / ${DASHBOARD_SCALE})`,
          width: `calc(100% / ${DASHBOARD_SCALE})`,
          zoom: DASHBOARD_SCALE,
          padding: "clamp(12px, 1.9vh, 24px) clamp(14px, 2.2vw, 24px)",
          maxWidth: "1140px",
          margin: "0 auto",
          boxSizing: "border-box",
        }}
      >
        <main
          style={{
            display: "grid",
            height: "100%",
            minHeight: 0,
            gridTemplateColumns: "minmax(420px, 1.1fr) minmax(320px, 0.9fr)",
            alignItems: "stretch",
            gap: "clamp(12px, 1.7vh, 22px)",
          }}
          className="app-main-grid"
        >
          <div
            className="dashboard-left-col"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "clamp(10px, 1.4vh, 18px)",
              minHeight: 0,
              height: "100%",
              maxWidth: "560px",
              width: "100%",
              margin: "0 auto",
            }}
          >
            <Card
              style={{
                background: "var(--surface-elevated)",
                paddingBottom: "12px",
                width: "100%",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "2px",
                  marginBottom: "12px",
                }}
              >
                <h3 style={{ fontSize: "15px", fontWeight: 600, margin: 0 }}>
                  {greetingBlock.title}
                </h3>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  {greetingBlock.line}
                </span>
              </div>
            </Card>
            <StopwatchPanel
              categories={categories}
              onActivityLogged={handleActivityLogged}
              onSessionChange={setActiveSession}
            />

            <Card
              style={{ background: "var(--surface-elevated)", width: "100%" }}
            >
              <h3
                style={{
                  fontSize: "15px",
                  fontWeight: 600,
                  margin: "0 0 10px 0",
                }}
              >
                Lançamento Retroativo
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
                  gap: "10px",
                  alignItems: "end",
                }}
                className="retro-compact-grid"
              >
                <div>
                  <label
                    htmlFor="retro-category-picker"
                    style={{
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "var(--text-secondary)",
                      display: "block",
                      marginBottom: "8px",
                    }}
                  >
                    Categoria
                  </label>
                  <select
                    id="retro-category-picker"
                    value={retroCategoryId}
                    onChange={(e) => setRetroCategoryId(e.target.value)}
                    style={{
                      fontFamily: "var(--font-family)",
                      fontSize: "15px",
                      background: "var(--bg-input)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "var(--border-radius-md)",
                      color: "var(--text-primary)",
                      padding: "12px 16px",
                      width: "100%",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                    disabled={categories.length === 0}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="retro-date-picker"
                    style={{
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "var(--text-secondary)",
                      display: "block",
                      marginBottom: "8px",
                    }}
                  >
                    Data
                  </label>
                  <input
                    id="retro-date-picker"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    style={{
                      fontFamily: "var(--font-family)",
                      fontSize: "15px",
                      background: "var(--bg-input)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "var(--border-radius-md)",
                      color: "var(--text-primary)",
                      padding: "12px 16px",
                      width: "100%",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <Button
                  onClick={() => setOpenRetroRequest((v) => v + 1)}
                  variant="primary"
                  style={{ gridColumn: "1 / -1" }}
                  disabled={categories.length === 0}
                >
                  <Plus size={15} /> Lançar bloco
                </Button>
              </div>
            </Card>
          </div>

          <div
            className="dashboard-right-col"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "clamp(10px, 1.4vh, 18px)",
              minWidth: 0,
              minHeight: 0,
              height: "100%",
              maxWidth: "620px",
              width: "100%",
              margin: "0 auto",
            }}
          >
            <CalendarView
              categories={categories}
              activities={activities}
              onActivityLogged={handleActivityLogged}
              onActivityUpdated={handleActivityUpdated}
              onActivityDeleted={handleActivityDeleted}
              dateStr={selectedDate}
              retroCategoryId={retroCategoryId}
              openRetroRequest={openRetroRequest}
              activeSession={activeSession}
            />
          </div>
        </main>
      </div>

      {showCategoriesModal && (
        <div
          onClick={() => setShowCategoriesModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(16, 14, 12, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 200,
          }}
        >
          <Card
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "560px",
              maxHeight: "min(84vh, 760px)",
              overflow: "auto",
              background: "var(--surface-elevated)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "16px",
              }}
            >
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: 600,
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <FolderPlus
                  size={17}
                  style={{ color: "var(--color-primary)" }}
                />
                Gerenciar Categorias
              </h3>
              <Button
                onClick={() => setShowCategoriesModal(false)}
                variant="ghost"
                style={{
                  width: "34px",
                  height: "34px",
                  padding: 0,
                  border: "1px solid var(--border-color)",
                  borderRadius: "10px",
                }}
                aria-label="Fechar modal de categorias"
              >
                <X size={16} />
              </Button>
            </div>

            {catError && (
              <div
                style={{
                  padding: "8px",
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid var(--color-nada)",
                  borderRadius: "var(--border-radius-sm)",
                  color: "var(--color-nada)",
                  fontSize: "12px",
                  marginBottom: "12px",
                }}
              >
                {catError}
              </div>
            )}

            <form
              onSubmit={handleAddCategory}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                marginBottom: "20px",
              }}
            >
              <Input
                id="category-name-input"
                placeholder="Nome (max 50 chars)"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value.slice(0, 50))}
              />

              <div
                style={{ display: "flex", gap: "12px", alignItems: "center" }}
              >
                <label
                  htmlFor="category-color-input"
                  style={{
                    fontSize: "13px",
                    color: "var(--text-secondary)",
                    flexShrink: 0,
                  }}
                >
                  Cor:
                </label>
                <input
                  id="category-color-input"
                  type="color"
                  value={newCatColor}
                  onChange={(e) => setNewCatColor(e.target.value)}
                  style={{
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    width: "40px",
                    height: "30px",
                  }}
                />
                <Button
                  id="btn-add-category"
                  type="submit"
                  variant="primary"
                  style={{
                    padding: "8px 12px",
                    fontSize: "13px",
                    whiteSpace: "nowrap",
                  }}
                >
                  <Plus size={14} /> Adicionar
                </Button>
              </div>
            </form>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
                maxHeight: "340px",
                overflowY: "auto",
              }}
              className="custom-scroll"
            >
              {categories.map((cat) => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => cat.isCustom && toggleBulkCategory(cat.id)}
                  disabled={!cat.isCustom}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "7px 11px",
                    borderRadius: "999px",
                    background: selectedCategoryIds.includes(cat.id)
                      ? "color-mix(in srgb, var(--color-primary) 14%, var(--bg-input))"
                      : "var(--bg-input)",
                    border: selectedCategoryIds.includes(cat.id)
                      ? "1px solid var(--color-primary)"
                      : "1px solid var(--border-color)",
                    color: "var(--text-primary)",
                    fontSize: "13px",
                    cursor: cat.isCustom ? "pointer" : "default",
                    opacity: cat.isCustom ? 1 : 0.85,
                  }}
                >
                  <span
                    style={{
                      width: "9px",
                      height: "9px",
                      borderRadius: "50%",
                      background: cat.color,
                    }}
                  />
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "14px",
                gap: "10px",
              }}
            >
              <Button
                type="button"
                variant="secondary"
                onClick={() => void handleBulkDeleteCategories()}
                disabled={
                  selectedCategoryIds.filter((id) =>
                    categories.some((c) => c.id === id && c.isCustom),
                  ).length === 0
                }
                style={{ whiteSpace: "nowrap" }}
              >
                Remover selecionadas
              </Button>
            </div>
          </Card>
        </div>
      )}
      <style>{`
        .dashboard-left-col {
          overflow: hidden;
        }

        .dashboard-right-col {
          min-width: 0;
          overflow: hidden;
        }

        @media (max-width: 980px) {
          .app-shell-logged {
            height: auto !important;
            min-height: 100dvh;
            overflow: visible !important;
          }

          .app-content-scale {
            zoom: 1 !important;
            width: 100% !important;
            height: auto !important;
          }

          .app-header-inner {
            flex-wrap: wrap;
            align-items: flex-start;
          }

          .app-main-grid {
            height: auto !important;
            grid-template-columns: 1fr !important;
            justify-content: stretch !important;
          }

          .dashboard-left-col {
            overflow: visible;
          }

          .dashboard-right-col {
            overflow: visible;
          }
        }

        @media (max-width: 720px) {
          .app-header-inner button {
            flex: 1 1 auto;
          }
        }

        @media (max-width: 760px) {
          .retro-compact-grid {
            grid-template-columns: 1fr !important;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
}
