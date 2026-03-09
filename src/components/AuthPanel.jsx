import { useState } from "react";
import axios from "axios";
import { buildApiUrl } from "../api";

const DEFAULT_REGISTER = {
  name: "",
  email: "",
  password: "",
  role: "EMPLOYEE",
};

const DEFAULT_LOGIN = {
  email: "",
  password: "",
};

function AuthPanel({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [registerForm, setRegisterForm] = useState(DEFAULT_REGISTER);
  const [loginForm, setLoginForm] = useState(DEFAULT_LOGIN);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const url = mode === "login"
        ? buildApiUrl("/auth/login")
        : buildApiUrl("/auth/register");
      const payload = mode === "login" ? loginForm : registerForm;
      const response = await axios.post(url, payload);
      onAuthenticated(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.hero}>
        <div style={styles.heroBadge}>TaskFlow</div>
        <h1 style={styles.title}>Organization task assigner</h1>
        <p style={styles.subtitle}>
          Managers assign and track work. Employees update task progress from their own workspace.
        </p>
      </div>

      <form onSubmit={submit} style={styles.card}>
        <div style={styles.toggleRow}>
          <button
            type="button"
            onClick={() => setMode("login")}
            style={{
              ...styles.toggleButton,
              ...(mode === "login" ? styles.toggleButtonActive : {}),
            }}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            style={{
              ...styles.toggleButton,
              ...(mode === "register" ? styles.toggleButtonActive : {}),
            }}
          >
            Register
          </button>
        </div>

        {mode === "register" && (
          <>
            <label style={styles.label}>Name</label>
            <input
              value={registerForm.name}
              onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
              placeholder="Employee or manager name"
              style={styles.input}
              required
            />

            <label style={styles.label}>Role</label>
            <div style={styles.roleRow}>
              {["MANAGER", "EMPLOYEE"].map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setRegisterForm({ ...registerForm, role })}
                  style={{
                    ...styles.roleButton,
                    ...(registerForm.role === role ? styles.roleButtonActive : {}),
                  }}
                >
                  {role.toLowerCase()}
                </button>
              ))}
            </div>
          </>
        )}

        <label style={styles.label}>Email</label>
        <input
          type="email"
          value={mode === "login" ? loginForm.email : registerForm.email}
          onChange={(e) =>
            mode === "login"
              ? setLoginForm({ ...loginForm, email: e.target.value })
              : setRegisterForm({ ...registerForm, email: e.target.value })
          }
          placeholder="name@company.com"
          style={styles.input}
          required
        />

        <label style={styles.label}>Password</label>
        <input
          type="password"
          value={mode === "login" ? loginForm.password : registerForm.password}
          onChange={(e) =>
            mode === "login"
              ? setLoginForm({ ...loginForm, password: e.target.value })
              : setRegisterForm({ ...registerForm, password: e.target.value })
          }
          placeholder="Enter password"
          style={styles.input}
          required
        />

        {error && <p style={styles.error}>{error}</p>}

        <button type="submit" disabled={submitting} style={styles.submitButton}>
          {submitting ? "Please wait..." : mode === "login" ? "Login" : "Create account"}
        </button>
      </form>
    </div>
  );
}

const styles = {
  wrapper: {
    display: "grid",
    gap: "22px",
  },
  hero: {
    paddingTop: "12px",
  },
  heroBadge: {
    display: "inline-block",
    color: "#f59e0b",
    border: "1px solid rgba(245,158,11,0.35)",
    background: "rgba(245,158,11,0.08)",
    borderRadius: "999px",
    padding: "6px 10px",
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: "0.68rem",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    marginBottom: "14px",
  },
  title: {
    color: "#f8fafc",
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: "1.7rem",
    lineHeight: 1.2,
    marginBottom: "10px",
  },
  subtitle: {
    color: "#94a3b8",
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: "0.8rem",
    lineHeight: 1.7,
  },
  card: {
    background: "#1a1f2e",
    border: "1px solid #2d3548",
    borderRadius: "18px",
    padding: "24px",
    display: "grid",
    gap: "10px",
  },
  toggleRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
    marginBottom: "6px",
  },
  toggleButton: {
    background: "#0f1117",
    border: "1px solid #2d3548",
    borderRadius: "10px",
    color: "#94a3b8",
    fontFamily: "'DM Mono', 'Courier New', monospace",
    padding: "10px 14px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  toggleButtonActive: {
    border: "1px solid #f59e0b",
    color: "#f59e0b",
    background: "rgba(245,158,11,0.08)",
  },
  label: {
    color: "#64748b",
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: "0.65rem",
    fontWeight: "700",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    marginTop: "6px",
  },
  input: {
    width: "100%",
    background: "#0f1117",
    border: "1px solid #2d3548",
    borderRadius: "10px",
    padding: "12px 14px",
    color: "#e2e8f0",
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: "0.88rem",
    outline: "none",
    boxSizing: "border-box",
  },
  roleRow: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  roleButton: {
    background: "#0f1117",
    border: "1px solid #2d3548",
    borderRadius: "10px",
    color: "#cbd5e1",
    fontFamily: "'DM Mono', 'Courier New', monospace",
    padding: "10px 14px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  roleButtonActive: {
    border: "1px solid #f59e0b",
    color: "#f59e0b",
    background: "rgba(245,158,11,0.08)",
  },
  error: {
    color: "#f87171",
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: "0.72rem",
    marginTop: "2px",
  },
  submitButton: {
    width: "100%",
    background: "linear-gradient(135deg, #f59e0b, #d97706)",
    border: "none",
    borderRadius: "10px",
    color: "#0f1117",
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: "0.82rem",
    fontWeight: "700",
    letterSpacing: "0.06em",
    padding: "13px 16px",
    marginTop: "10px",
  },
};

export default AuthPanel;
