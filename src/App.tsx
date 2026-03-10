import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import axios from "axios";
import AuthPanel from "./components/AuthPanel.jsx";
import TaskForm from "./components/TaskForm.jsx";
import TaskList from "./components/TaskList.jsx";
import { buildApiUrl } from "./api";

interface Task {
  id: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  employeeNote: string | null;
  createdAt: string;
  updatedAt: string;
  assignedEmployeeName: string;
  assignedEmployeeEmail: string;
  createdByName: string;
  createdByEmail: string;
}

interface Employee {
  id: number;
  name: string;
  email: string;
}

interface AuthUser {
  token: string;
  name: string;
  email: string;
  role: string;
}

const AUTH_STORAGE_KEY = "task-manager-auth";
const THEME_STORAGE_KEY = "task-manager-theme";

function getInitialTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [authError, setAuthError] = useState("");
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [theme, setTheme] = useState(getInitialTheme);

  const clearSession = (message = "") => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    delete axios.defaults.headers.common.Authorization;
    setAuthUser(null);
    setTasks([]);
    setEmployees([]);
    setSearchQuery("");
    setAuthError(message);
    setCheckingSession(false);
  };

  const hydrateUserFromToken = async (token: string) => {
    axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    const response = await axios.get(buildApiUrl("/auth/me"));

    const nextUser: AuthUser = {
      token,
      name: response.data.name,
      email: response.data.email,
      role: response.data.role,
    };

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser));
    setAuthUser(nextUser);
    setAuthError("");
    return nextUser;
  };

  const fetchTasks = async () => {
    const res = await axios.get(buildApiUrl("/tasks"));
    setTasks(res.data);
  };

  const fetchEmployees = async (role: string) => {
    if (role !== "MANAGER") {
      setEmployees([]);
      return;
    }

    const res = await axios.get(buildApiUrl("/users/employees"));
    setEmployees(res.data);
  };

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      const savedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!savedAuth) {
        setCheckingSession(false);
        return;
      }

      try {
        const parsedAuth: AuthUser = JSON.parse(savedAuth);
        await hydrateUserFromToken(parsedAuth.token);
      } catch (error) {
        if (!cancelled) {
          clearSession("Your session is no longer valid. Please log in again.");
        }
        return;
      }

      if (!cancelled) {
        setCheckingSession(false);
      }
    };

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!authUser?.token) {
      return;
    }

    let cancelled = false;

    const loadProtectedData = async () => {
      try {
        await fetchTasks();
        if (!cancelled) {
          await fetchEmployees(authUser.role);
        }
      } catch (error) {
        if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
          if (!cancelled) {
            clearSession("Your session is no longer valid. Please log in again.");
          }
          return;
        }
        throw error;
      }
    };

    loadProtectedData();

    return () => {
      cancelled = true;
    };
  }, [authUser]);

  const done = tasks.filter((t) => t.status === "done").length;
  const progress = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;
  const filteredTasks = tasks.filter((task) =>
    `${task.title} ${task.description ?? ""}`.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  const handleAuthenticated = async (user: AuthUser) => {
    setCheckingSession(true);
    try {
      await hydrateUserFromToken(user.token);
    } catch (error) {
      clearSession("Login failed. Please try again.");
      return;
    }
    setCheckingSession(false);
  };

  const handleLogout = () => {
    clearSession("");
  };

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap');
        :root {
          color-scheme: dark;
          --bg: #0f1117;
          --bg-elevated: #1a1f2e;
          --bg-soft: #141927;
          --bg-input: #0f1117;
          --bg-accent-soft: rgba(245,158,11,0.08);
          --bg-accent-strong: linear-gradient(135deg, #f59e0b, #d97706);
          --bg-page: radial-gradient(ellipse at 20% 10%, rgba(245,158,11,0.04) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 90%, rgba(99,102,241,0.04) 0%, transparent 50%);
          --text: #e2e8f0;
          --text-strong: #f8fafc;
          --text-muted: #94a3b8;
          --text-soft: #64748b;
          --text-faint: #475569;
          --text-placeholder: #334155;
          --border: #2d3548;
          --border-strong: #3d4a6a;
          --border-accent: rgba(245,158,11,0.35);
          --shadow: 0 4px 24px rgba(0,0,0,0.3);
          --shadow-soft: 0 4px 16px rgba(0,0,0,0.25);
          --accent: #f59e0b;
          --accent-contrast: #0f1117;
          --danger-bg: rgba(239,68,68,0.12);
          --danger-border: rgba(239,68,68,0.28);
          --danger-text: #fca5a5;
          --empty-border: #2d3548;
          --scroll-track: #0f1117;
          --scroll-thumb: #2d3548;
        }
        :root[data-theme="light"] {
          color-scheme: light;
          --bg: #f3f4f6;
          --bg-elevated: rgba(255,255,255,0.94);
          --bg-soft: #f8fafc;
          --bg-input: #ffffff;
          --bg-accent-soft: rgba(245,158,11,0.12);
          --bg-accent-strong: linear-gradient(135deg, #f59e0b, #ea580c);
          --bg-page: radial-gradient(ellipse at 20% 10%, rgba(245,158,11,0.12) 0%, transparent 45%),
            radial-gradient(ellipse at 80% 90%, rgba(59,130,246,0.12) 0%, transparent 40%);
          --text: #0f172a;
          --text-strong: #020617;
          --text-muted: #334155;
          --text-soft: #475569;
          --text-faint: #64748b;
          --text-placeholder: #94a3b8;
          --border: #d7dee9;
          --border-strong: #c4cfdd;
          --border-accent: rgba(245,158,11,0.45);
          --shadow: 0 18px 50px rgba(15,23,42,0.08);
          --shadow-soft: 0 12px 30px rgba(15,23,42,0.08);
          --accent: #c2410c;
          --accent-contrast: #fff7ed;
          --danger-bg: rgba(239,68,68,0.08);
          --danger-border: rgba(239,68,68,0.2);
          --danger-text: #b91c1c;
          --empty-border: #cbd5e1;
          --scroll-track: #e2e8f0;
          --scroll-thumb: #94a3b8;
        }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; width: 100%; }
        body {
          background: var(--bg);
          min-height: 100vh;
          font-family: 'DM Mono', 'Courier New', monospace;
          color: var(--text);
          transition: background-color 0.25s ease, color 0.25s ease;
        }
        #root { min-height: 100vh; width: 100%; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: var(--scroll-track); }
        ::-webkit-scrollbar-thumb { background: var(--scroll-thumb); border-radius: 3px; }
        input::placeholder, textarea::placeholder { color: var(--text-placeholder); }
        input, select, textarea, button {
          transition: border-color 0.2s, box-shadow 0.2s, background-color 0.2s, color 0.2s;
        }
      `}</style>

      <div style={styles.page}>
        <div style={styles.shell}>
          <div style={styles.utilityBar}>
            <button type="button" onClick={toggleTheme} style={styles.themeToggle}>
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </button>
          </div>
          {checkingSession ? (
            <div style={styles.loadingPanel}>Checking session...</div>
          ) : !authUser ? (
            <>
              {authError && <div style={styles.authAlert}>{authError}</div>}
              <AuthPanel onAuthenticated={handleAuthenticated} />
            </>
          ) : (
            <>
              <div style={styles.topBar}>
                <div style={styles.logoArea}>
                  <div style={styles.logoBox}>TF</div>
                  <div>
                    <div style={styles.appName}>TaskFlow</div>
                    <div style={styles.appSub}>
                      {authUser.role === "MANAGER"
                        ? "assign detailed work and track progress"
                        : "update progress and share blockers"}
                    </div>
                  </div>
                </div>

                <div style={styles.topBarMeta}>
                  <div style={styles.userPanel}>
                    <span style={styles.userName}>{authUser.name}</span>
                    <span style={styles.userRole}>{authUser.role.toLowerCase()}</span>
                  </div>
                  <button type="button" onClick={handleLogout} style={styles.logoutButton}>
                    Logout
                  </button>
                </div>
              </div>

              <div style={styles.statsRow}>
                <div style={styles.statItem}>
                  <span style={styles.statNum}>{tasks.length}</span>
                  <span style={styles.statLabel}>{authUser.role === "MANAGER" ? "assigned" : "my tasks"}</span>
                </div>
                <div style={styles.statDivider} />
                <div style={styles.statItem}>
                  <span style={{ ...styles.statNum, color: "#22c55e" }}>{done}</span>
                  <span style={styles.statLabel}>done</span>
                </div>
                <div style={styles.statDivider} />
                <div style={styles.statItem}>
                  <span style={{ ...styles.statNum, color: "#f59e0b" }}>{progress}%</span>
                  <span style={styles.statLabel}>complete</span>
                </div>
              </div>

              {tasks.length > 0 && (
                <div style={styles.progressTrack}>
                  <div style={{ ...styles.progressFill, width: `${progress}%` }} />
                </div>
              )}

              <div style={styles.content}>
                {authUser.role === "MANAGER" && (
                  <TaskForm fetchTasks={fetchTasks} employees={employees} />
                )}

                <div style={styles.searchPanel}>
                  <label style={styles.searchLabel}>Find Task</label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by title or description"
                    style={styles.searchInput}
                  />
                </div>

                <TaskList
                  tasks={filteredTasks}
                  fetchTasks={fetchTasks}
                  searchQuery={searchQuery}
                  canDelete={authUser.role === "MANAGER"}
                  canUpdateStatus={authUser.role === "EMPLOYEE"}
                  emptyMessage={
                    authUser.role === "MANAGER"
                      ? "No assigned tasks yet. Assign one above."
                      : "No tasks assigned to you yet."
                  }
                />
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    width: "100%",
    minHeight: "100vh",
    backgroundColor: "var(--bg)",
    backgroundImage: "var(--bg-page)",
    padding: "60px 16px 80px",
  },
  shell: {
    width: "100%",
    maxWidth: "560px",
    margin: "0 auto",
  },
  utilityBar: {
    display: "flex",
    justifyContent: "flex-end",
    marginBottom: "18px",
  },
  themeToggle: {
    background: "var(--bg-elevated)",
    border: "1px solid var(--border)",
    borderRadius: "999px",
    color: "var(--text)",
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: "0.72rem",
    letterSpacing: "0.06em",
    padding: "10px 14px",
    cursor: "pointer",
    boxShadow: "var(--shadow-soft)",
  },
  loadingPanel: {
    background: "var(--bg-elevated)",
    border: "1px solid var(--border)",
    borderRadius: "16px",
    padding: "28px",
    color: "var(--text-muted)",
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: "0.82rem",
    textAlign: "center",
    boxShadow: "var(--shadow)",
  },
  authAlert: {
    background: "var(--danger-bg)",
    border: "1px solid var(--danger-border)",
    borderRadius: "12px",
    color: "var(--danger-text)",
    padding: "12px 14px",
    marginBottom: "16px",
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: "0.72rem",
  },
  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "14px",
    flexWrap: "wrap",
    gap: "12px",
  },
  logoArea: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  logoBox: {
    width: "38px",
    height: "38px",
    background: "var(--bg-accent-strong)",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.8rem",
    color: "var(--accent-contrast)",
    fontWeight: "700",
    flexShrink: 0,
    boxShadow: "0 4px 14px rgba(245,158,11,0.3)",
  },
  appName: {
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: "1.1rem",
    fontWeight: "700",
    color: "var(--text)",
    letterSpacing: "0.04em",
    lineHeight: 1.2,
  },
  appSub: {
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: "0.65rem",
    color: "var(--text-faint)",
    letterSpacing: "0.06em",
  },
  topBarMeta: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
  userPanel: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "2px",
  },
  userName: {
    color: "var(--text)",
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: "0.8rem",
    fontWeight: "700",
  },
  userRole: {
    color: "var(--accent)",
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: "0.62rem",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  logoutButton: {
    background: "transparent",
    border: "1px solid var(--border)",
    borderRadius: "10px",
    color: "var(--text)",
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: "0.75rem",
    padding: "10px 14px",
    cursor: "pointer",
  },
  statsRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    background: "var(--bg-elevated)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    padding: "8px 16px",
    marginBottom: "6px",
    boxShadow: "var(--shadow-soft)",
  },
  statItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "1px",
  },
  statNum: {
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: "1rem",
    fontWeight: "700",
    color: "var(--text)",
    lineHeight: 1,
  },
  statLabel: {
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: "0.6rem",
    color: "var(--text-faint)",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  statDivider: {
    width: "1px",
    height: "24px",
    background: "var(--border)",
  },
  progressTrack: {
    height: "3px",
    background: "var(--bg-elevated)",
    borderRadius: "2px",
    overflow: "hidden",
    marginBottom: "28px",
    marginTop: "16px",
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #f59e0b, #22c55e)",
    borderRadius: "2px",
    transition: "width 0.5s ease",
  },
  content: {
    marginTop: "24px",
  },
  searchPanel: {
    background: "var(--bg-elevated)",
    border: "1px solid var(--border)",
    borderRadius: "14px",
    padding: "16px",
    marginBottom: "24px",
    boxShadow: "var(--shadow-soft)",
  },
  searchLabel: {
    display: "block",
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: "0.65rem",
    fontWeight: "700",
    color: "var(--text-soft)",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    marginBottom: "8px",
  },
  searchInput: {
    width: "100%",
    background: "var(--bg-input)",
    border: "1px solid var(--border)",
    borderRadius: "10px",
    padding: "12px 14px",
    color: "var(--text)",
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: "0.88rem",
    outline: "none",
  },
};

export default App;
