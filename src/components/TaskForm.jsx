import { useState } from "react";
import axios from "axios";
import { buildApiUrl } from "../api";

const PRIORITIES = ["low", "medium", "high"];

const PRIORITY_CONFIG = {
  low:    { color: "#64748b", bg: "rgba(100,116,139,0.1)", border: "rgba(100,116,139,0.3)" },
  medium: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.3)"  },
  high:   { color: "#ef4444", bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.3)"   },
};

function TaskForm({ fetchTasks, employees }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [assignedEmployeeEmails, setAssignedEmployeeEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchEmp, setSearchEmp] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || assignedEmployeeEmails.length === 0) return;
    setLoading(true);
    try {
      await Promise.all(
        assignedEmployeeEmails.map((assignedEmployeeEmail) =>
          axios.post(buildApiUrl("/tasks"), {
            title,
            description,
            priority,
            dueDate: dueDate || null,
            assignedEmployeeEmail,
          })
        )
      );
      setTitle("");
      setDescription("");
      setPriority("medium");
      setDueDate("");
      setAssignedEmployeeEmails([]);
      setSearchEmp("");
      fetchTasks();
    } finally {
      setLoading(false);
    }
  };

  const toggleEmployee = (email) => {
    setAssignedEmployeeEmails((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
  };

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchEmp.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchEmp.toLowerCase())
  );

  const allFilteredSelected =
    filteredEmployees.length > 0 &&
    filteredEmployees.every((e) => assignedEmployeeEmails.includes(e.email));

  const toggleAll = () => {
    const filtered = filteredEmployees.map((e) => e.email);
    if (allFilteredSelected) {
      setAssignedEmployeeEmails((prev) => prev.filter((e) => !filtered.includes(e)));
    } else {
      setAssignedEmployeeEmails((prev) => [...new Set([...prev, ...filtered])]);
    }
  };

  const isDisabled =
    loading || !title.trim() || assignedEmployeeEmails.length === 0 || employees.length === 0;

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      {/* Header */}
      <div style={styles.formHeader}>
        <span style={styles.formIcon}>+</span>
        <span style={styles.formTitle}>Assign Task</span>
      </div>

      {/* Title */}
      <div style={styles.fieldGroup}>
        <label style={styles.label}>TASK TITLE</label>
        <input
          type="text"
          placeholder="What should the employee work on?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          style={styles.input}
          onFocus={(e) => Object.assign(e.target.style, { borderColor: "var(--accent)", boxShadow: "0 0 0 3px var(--accent-glow)" })}
          onBlur={(e)  => Object.assign(e.target.style, { borderColor: "var(--border)", boxShadow: "none" })}
        />
      </div>

      {/* Description */}
      <div style={styles.fieldGroup}>
        <label style={styles.label}>DESCRIPTION</label>
        <textarea
          placeholder="Add the task details, context, and expected outcome"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          style={styles.textarea}
          onFocus={(e) => Object.assign(e.target.style, { borderColor: "var(--accent)", boxShadow: "0 0 0 3px var(--accent-glow)" })}
          onBlur={(e)  => Object.assign(e.target.style, { borderColor: "var(--border)", boxShadow: "none" })}
        />
      </div>

      {/* Priority + Due Date */}
      <div style={styles.inlineFields}>
        <div style={styles.inlineField}>
          <label style={styles.label}>PRIORITY</label>
          <div style={styles.priorityRow}>
            {PRIORITIES.map((p) => {
              const cfg = PRIORITY_CONFIG[p];
              const active = priority === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  style={{
                    ...styles.priorityChip,
                    color:      active ? cfg.color : "var(--text-faint)",
                    background: active ? cfg.bg    : "var(--bg-input)",
                    border:     active ? `1.5px solid ${cfg.border}` : "1.5px solid var(--border)",
                  }}
                >
                  <span style={{ ...styles.priorityDot, background: cfg.color }} />
                  {p}
                </button>
              );
            })}
          </div>
        </div>

        <div style={styles.inlineField}>
          <label style={styles.label}>DUE DATE</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            style={styles.input}
            onFocus={(e) => Object.assign(e.target.style, { borderColor: "var(--accent)", boxShadow: "0 0 0 3px var(--accent-glow)" })}
            onBlur={(e)  => Object.assign(e.target.style, { borderColor: "var(--border)", boxShadow: "none" })}
          />
        </div>
      </div>

      {/* ── Assign To ── */}
      <div style={styles.fieldGroup}>
        <div style={styles.assignHeader}>
          <label style={{ ...styles.label, marginBottom: 0 }}>ASSIGN TO</label>
          {assignedEmployeeEmails.length > 0 && (
            <span style={styles.selectedBadge}>
              {assignedEmployeeEmails.length} selected
            </span>
          )}
        </div>

        {employees.length === 0 ? (
          <div style={styles.emptyEmployees}>No employees registered yet.</div>
        ) : (
          <div style={styles.assignBox}>

            {/* Search */}
            <div style={styles.empSearchWrapper}>
              <input
                type="text"
                placeholder="Search employees..."
                value={searchEmp}
                onChange={(e) => setSearchEmp(e.target.value)}
                style={styles.empSearch}
              />
            </div>

            {/* Select all */}
            {filteredEmployees.length > 1 && (
              <>
                <div style={styles.selectAllRow} onClick={toggleAll}>
                  <div style={{
                    ...styles.checkbox,
                    background:  allFilteredSelected ? "var(--accent)" : "transparent",
                    borderColor: allFilteredSelected ? "var(--accent)" : "var(--border-soft)",
                  }}>
                    {allFilteredSelected && <span style={styles.checkMark}>✓</span>}
                  </div>
                  <span style={styles.selectAllLabel}>
                    {allFilteredSelected ? "Deselect all" : "Select all"}
                  </span>
                </div>
                <div style={styles.divider} />
              </>
            )}

            {/* Employee rows */}
            <div style={styles.empList}>
              {filteredEmployees.length === 0 ? (
                <div style={styles.noResults}>No employees match your search.</div>
              ) : (
                filteredEmployees.map((emp) => {
                  const checked = assignedEmployeeEmails.includes(emp.email);
                  return (
                    <div
                      key={emp.email}
                      style={{
                        ...styles.empRow,
                        background:  checked ? "var(--accent-row-bg)"     : "transparent",
                        borderLeftColor: checked ? "var(--accent)" : "transparent",
                      }}
                      onClick={() => toggleEmployee(emp.email)}
                    >
                      {/* Checkbox */}
                      <div style={{
                        ...styles.checkbox,
                        background:  checked ? "var(--accent)" : "transparent",
                        borderColor: checked ? "var(--accent)" : "var(--border-soft)",
                      }}>
                        {checked && <span style={styles.checkMark}>✓</span>}
                      </div>

                      {/* Avatar */}
                      <div style={styles.avatar}>
                        {emp.name.charAt(0).toUpperCase()}
                      </div>

                      {/* Name + email */}
                      <div style={styles.empInfo}>
                        <span style={{
                          ...styles.empName,
                          color: checked ? "var(--accent)" : "var(--text)",
                        }}>
                          {emp.name}
                        </span>
                        <span style={styles.empEmail}>{emp.email}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isDisabled}
        style={{ ...styles.submitBtn, ...(isDisabled ? styles.submitBtnDisabled : {}) }}
        onMouseEnter={(e) => { if (!isDisabled) Object.assign(e.target.style, { ...styles.submitBtn, transform: "translateY(-1px)", boxShadow: "0 4px 16px var(--accent-glow)" }); }}
        onMouseLeave={(e) => { Object.assign(e.target.style, { ...styles.submitBtn, ...(isDisabled ? styles.submitBtnDisabled : {}) }); }}
      >
        {employees.length === 0
          ? "Register employees first"
          : loading
          ? "Assigning..."
          : `Assign to ${assignedEmployeeEmails.length || ""} Employee${assignedEmployeeEmails.length !== 1 ? "s" : ""} →`}
      </button>
    </form>
  );
}

const styles = {
  form: {
    background: "var(--bg-elevated)",
    border: "1px solid var(--border)",
    borderRadius: "16px",
    padding: "24px",
    marginBottom: "28px",
    boxShadow: "var(--shadow)",
  },
  formHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "20px",
    paddingBottom: "16px",
    borderBottom: "1px solid var(--border)",
  },
  formIcon: {
    width: "28px",
    height: "28px",
    background: "var(--bg-accent-strong)",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    fontWeight: "700",
    color: "var(--accent-contrast)",
    lineHeight: "28px",
    textAlign: "center",
  },
  formTitle: {
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: "0.85rem",
    fontWeight: "700",
    color: "var(--text)",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  fieldGroup: {
    marginBottom: "16px",
  },
  inlineFields: {
    display: "flex",
    gap: "12px",
    marginBottom: "16px",
    flexWrap: "wrap",
  },
  inlineField: {
    flex: 1,
    minWidth: "160px",
  },
  label: {
    display: "block",
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: "0.65rem",
    fontWeight: "700",
    color: "var(--text-soft)",
    letterSpacing: "0.12em",
    marginBottom: "8px",
  },
  input: {
    width: "100%",
    background: "var(--bg-input)",
    border: "1px solid var(--border)",
    borderRadius: "10px",
    padding: "12px 14px",
    color: "var(--text)",
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: "0.88rem",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s, box-shadow 0.2s",
  },
  textarea: {
    width: "100%",
    background: "var(--bg-input)",
    border: "1px solid var(--border)",
    borderRadius: "10px",
    padding: "12px 14px",
    color: "var(--text)",
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: "0.82rem",
    outline: "none",
    boxSizing: "border-box",
    resize: "vertical",
    transition: "border-color 0.2s, box-shadow 0.2s",
  },
  priorityRow: {
    display: "flex",
    gap: "8px",
  },
  priorityChip: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    borderRadius: "8px",
    padding: "8px 10px",
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: "0.72rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.15s",
    flex: 1,
    justifyContent: "center",
  },
  priorityDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    flexShrink: 0,
  },
  assignHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "8px",
  },
  selectedBadge: {
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: "0.65rem",
    fontWeight: "700",
    color: "var(--accent)",
    background: "var(--accent-row-bg)",
    border: "1px solid var(--accent-row-border)",
    borderRadius: "6px",
    padding: "2px 8px",
  },
  assignBox: {
    border: "1px solid var(--border)",
    borderRadius: "12px",
    overflow: "hidden",
    background: "var(--bg-input)",
  },
  empSearchWrapper: {
    padding: "10px",
    borderBottom: "1px solid var(--border)",
  },
  empSearch: {
    width: "100%",
    background: "var(--bg-elevated)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    padding: "8px 12px",
    color: "var(--text)",
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: "0.78rem",
    outline: "none",
    boxSizing: "border-box",
  },
  selectAllRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 14px",
    cursor: "pointer",
    userSelect: "none",
  },
  selectAllLabel: {
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: "0.72rem",
    fontWeight: "700",
    color: "var(--text-soft)",
    letterSpacing: "0.04em",
  },
  divider: {
    height: "1px",
    background: "var(--border)",
    margin: "0 14px",
  },
  empList: {
    maxHeight: "220px",
    overflowY: "auto",
  },
  empRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 14px",
    cursor: "pointer",
    borderLeft: "2px solid transparent",
    transition: "all 0.15s",
    userSelect: "none",
  },
  checkbox: {
    width: "17px",
    height: "17px",
    borderRadius: "5px",
    border: "2px solid",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.15s",
  },
  checkMark: {
    fontSize: "10px",
    color: "var(--accent-contrast)",
    fontWeight: "700",
    lineHeight: 1,
  },
  avatar: {
    width: "28px",
    height: "28px",
    borderRadius: "8px",
    background: "var(--bg-accent-strong)",
    color: "var(--accent-contrast)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: "0.78rem",
    fontWeight: "700",
    flexShrink: 0,
  },
  empInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "1px",
    minWidth: 0,
    flex: 1,
  },
  empName: {
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: "0.82rem",
    fontWeight: "600",
    transition: "color 0.15s",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  empEmail: {
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: "0.68rem",
    color: "var(--text-faint)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  emptyEmployees: {
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: "0.78rem",
    color: "var(--text-faint)",
    padding: "16px",
    textAlign: "center",
    border: "1px dashed var(--border)",
    borderRadius: "10px",
  },
  noResults: {
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: "0.75rem",
    color: "var(--text-faint)",
    padding: "16px",
    textAlign: "center",
  },
  submitBtn: {
    width: "100%",
    background: "var(--bg-accent-strong)",
    border: "none",
    borderRadius: "10px",
    padding: "13px",
    color: "var(--accent-contrast)",
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: "0.85rem",
    fontWeight: "700",
    letterSpacing: "0.05em",
    cursor: "pointer",
    marginTop: "8px",
    transition: "all 0.2s",
  },
  submitBtnDisabled: {
    background: "var(--border)",
    color: "var(--text-faint)",
    cursor: "not-allowed",
    transform: "none",
    boxShadow: "none",
  },
};

export default TaskForm;