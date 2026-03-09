import { useEffect, useState } from "react";
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

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [authError, setAuthError] = useState("");
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

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

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; width: 100%; }
        body {
          background: #0f1117;
          min-height: 100vh;
          font-family: 'DM Mono', 'Courier New', monospace;
        }
        #root { min-height: 100vh; width: 100%; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0f1117; }
        ::-webkit-scrollbar-thumb { background: #2d3548; border-radius: 3px; }
        input::placeholder, textarea::placeholder { color: #334155; }
        input, select, textarea { transition: border-color 0.2s, box-shadow 0.2s; }
      `}</style>

      <div style={styles.page}>
        <div style={styles.shell}>
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

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    width: "100%",
    minHeight: "100vh",
    background: "#0f1117",
    backgroundImage: `
      radial-gradient(ellipse at 20% 10%, rgba(245,158,11,0.04) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 90%, rgba(99,102,241,0.04) 0%, transparent 50%)
    `,
    padding: "60px 16px 80px",
  },
  shell: {
    width: "100%",
    maxWidth: "560px",
    margin: "0 auto",
  },
  loadingPanel: {
    background: "#1a1f2e",
    border: "1px solid #2d3548",
    borderRadius: "16px",
    padding: "28px",
    color: "#94a3b8",
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: "0.82rem",
    textAlign: "center",
  },
  authAlert: {
    background: "rgba(239,68,68,0.12)",
    border: "1px solid rgba(239,68,68,0.28)",
    borderRadius: "12px",
    color: "#fca5a5",
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
    background: "linear-gradient(135deg, #f59e0b, #d97706)",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.8rem",
    color: "#0f1117",
    fontWeight: "700",
    flexShrink: 0,
    boxShadow: "0 4px 14px rgba(245,158,11,0.3)",
  },
  appName: {
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: "1.1rem",
    fontWeight: "700",
    color: "#e2e8f0",
    letterSpacing: "0.04em",
    lineHeight: 1.2,
  },
  appSub: {
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: "0.65rem",
    color: "#475569",
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
    color: "#e2e8f0",
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: "0.8rem",
    fontWeight: "700",
  },
  userRole: {
    color: "#f59e0b",
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: "0.62rem",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  logoutButton: {
    background: "transparent",
    border: "1px solid #2d3548",
    borderRadius: "10px",
    color: "#cbd5e1",
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: "0.75rem",
    padding: "10px 14px",
    cursor: "pointer",
  },
  statsRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    background: "#1a1f2e",
    border: "1px solid #2d3548",
    borderRadius: "12px",
    padding: "8px 16px",
    marginBottom: "6px",
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
    color: "#e2e8f0",
    lineHeight: 1,
  },
  statLabel: {
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: "0.6rem",
    color: "#475569",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  statDivider: {
    width: "1px",
    height: "24px",
    background: "#2d3548",
  },
  progressTrack: {
    height: "3px",
    background: "#1a1f2e",
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
    background: "#1a1f2e",
    border: "1px solid #2d3548",
    borderRadius: "14px",
    padding: "16px",
    marginBottom: "24px",
  },
  searchLabel: {
    display: "block",
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: "0.65rem",
    fontWeight: "700",
    color: "#64748b",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    marginBottom: "8px",
  },
  searchInput: {
    width: "100%",
    background: "#0f1117",
    border: "1px solid #2d3548",
    borderRadius: "10px",
    padding: "12px 14px",
    color: "#e2e8f0",
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: "0.88rem",
    outline: "none",
  },
};

export default App;
