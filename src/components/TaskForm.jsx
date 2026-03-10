import { useState } from "react";
import axios from "axios";
import { buildApiUrl } from "../api";

const PRIORITIES = ["low", "medium", "high"];

const PRIORITY_CONFIG = {
  low:    { color: "#64748b", bg: "rgba(100,116,139,0.1)", border: "rgba(100,116,139,0.3)" },
  medium: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.3)"  },
  high:   { color: "#ef4444", bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.3)"   },
};

// Format date as "Mon, 10 Mar 2026"
const formatDisplayDate = (value) => {
  if (!value) return null;
  const date = new Date(value + "T00:00:00");
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// Days until due date
const getDaysLeft = (value) => {
  if (!value) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(value + "T00:00:00");
  const diff = Math.round((due - today) / (1000 * 60 * 60 * 24));
  return diff;
};

function TaskForm({ fetchTasks, employees }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [assignedEmployeeEmails, setAssignedEmployeeEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchEmp, setSearchEmp] = useState("");
  const [datePickerOpen, setDatePickerOpen] = useState(false);

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
    } finally {
      setLoading(false);
      fetchTasks();
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

  const daysLeft = getDaysLeft(dueDate);
  const dueDateColor =
    daysLeft === null ? "var(--text-faint)"
    : daysLeft < 0   ? "#ef4444"
    : daysLeft <= 2  ? "#f59e0b"
    : "#22c55e";

  return (
    <>
      {/* Responsive style injection */}
      <style>{`
        .tf-inline-fields {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }
        .tf-inline-field {
          flex: 1;
          min-width: 140px;
        }
        .tf-date-trigger {
          overflow: hidden;
          position: relative;
          cursor: pointer;
        }
        .tf-date-trigger input[type="date"] {
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
          opacity: 0;
          cursor: pointer;
          z-index: 10;
          inset: 0;
          min-height: 100%;
          margin: 0;
          padding: 0;
          border: none;
          font-size: 16px;
          -webkit-appearance: none;
          appearance: none;
        }
        .tf-priority-row {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .tf-priority-chip {
          flex: 1;
          min-width: 60px;
        }
        .tf-emp-row:hover {
          background: var(--bg-elevated) !important;
        }
        .tf-select-all:hover {
          background: var(--bg-elevated);
        }
        @media (max-width: 480px) {
          .tf-inline-fields {
            flex-direction: column;
          }
          .tf-inline-field {
            min-width: 100%;
          }
          .tf-priority-row {
            gap: 6px;
          }
        }
      `}</style>

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
        <div className="tf-inline-fields">

          {/* Priority */}
          <div className="tf-inline-field">
            <label style={styles.label}>PRIORITY</label>
            <div className="tf-priority-row">
              {PRIORITIES.map((p) => {
                const cfg = PRIORITY_CONFIG[p];
                const active = priority === p;
                return (
                  <button
                    key={p}
                    type="button"
                    className="tf-priority-chip"
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

          {/* Due Date — styled card trigger */}
          <div className="tf-inline-field">
            <label style={styles.label}>DUE DATE</label>
            <div className="tf-date-trigger" style={{
              ...styles.dateTrigger,
              borderColor: dueDate ? dueDateColor + "60" : "var(--border)",
              background: dueDate ? dueDateColor + "08" : "var(--bg-input)",
            }}>
              {/* Hidden native date input */}
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />

              {/* Visual display */}
              <div style={styles.dateFace}>
                {dueDate ? (
                  <>
                    {/* Calendar icon area */}
                    <div style={{ ...styles.dateIconBox, background: dueDateColor + "20", color: dueDateColor }}>
                      📅
                    </div>
                    <div style={styles.dateTextBlock}>
                      <span style={{ ...styles.datePrimary, color: dueDateColor }}>
                        {formatDisplayDate(dueDate)}
                      </span>
                      <span style={{ ...styles.dateSub, color: dueDateColor + "bb" }}>
                        {daysLeft === 0
                          ? "Due today"
                          : daysLeft < 0
                          ? `${Math.abs(daysLeft)}d overdue`
                          : `${daysLeft}d left`}
                      </span>
                    </div>
                    {/* Clear button */}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setDueDate(""); }}
                      style={styles.dateClear}
                      title="Clear date"
                    >
                      ✕
                    </button>
                  </>
                ) : (
                  <>
                    <div style={styles.dateIconBox}>📅</div>
                    <span style={styles.datePlaceholder}>Pick a due date</span>
                    <span style={styles.dateArrow}>›</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Assign To */}
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
                  <div className="tf-select-all" style={styles.selectAllRow} onClick={toggleAll}>
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
                        className="tf-emp-row"
                        style={{
                          ...styles.empRow,
                          background:      checked ? "var(--accent-row-bg)" : "transparent",
                          borderLeftColor: checked ? "var(--accent)"        : "transparent",
                        }}
                        onClick={() => toggleEmployee(emp.email)}
                      >
                        <div style={{
                          ...styles.checkbox,
                          background:  checked ? "var(--accent)" : "transparent",
                          borderColor: checked ? "var(--accent)" : "var(--border-soft)",
                        }}>
                          {checked && <span style={styles.checkMark}>✓</span>}
                        </div>
                        <div style={styles.avatar}>
                          {emp.name.charAt(0).toUpperCase()}
                        </div>
                        <div style={styles.empInfo}>
                          <span style={{ ...styles.empName, color: checked ? "var(--accent)" : "var(--text)" }}>
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
    </>
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
    width: "100%",
    boxSizing: "border-box",
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
    flexShrink: 0,
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
    justifyContent: "center",
  },
  priorityDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    flexShrink: 0,
  },

  /* ── Date picker card ── */
  dateTrigger: {
    borderRadius: "10px",
    border: "1px solid",
    padding: "10px 12px",
    cursor: "pointer",
    position: "relative",
    transition: "all 0.2s",
    minHeight: "48px",
    boxSizing: "border-box",
  },
  dateFace: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    pointerEvents: "none",
  },
  dateIconBox: {
    width: "30px",
    height: "30px",
    borderRadius: "8px",
    background: "var(--bg-elevated)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    flexShrink: 0,
    transition: "all 0.2s",
  },
  dateTextBlock: {
    display: "flex",
    flexDirection: "column",
    gap: "1px",
    flex: 1,
    minWidth: 0,
  },
  datePrimary: {
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: "0.78rem",
    fontWeight: "700",
    letterSpacing: "0.02em",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  dateSub: {
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: "0.6rem",
    letterSpacing: "0.04em",
  },
  datePlaceholder: {
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: "0.78rem",
    color: "var(--text-faint)",
    flex: 1,
  },
  dateArrow: {
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: "1.1rem",
    color: "var(--text-faint)",
    lineHeight: 1,
  },
  dateClear: {
    background: "transparent",
    border: "none",
    color: "var(--text-faint)",
    cursor: "pointer",
    fontSize: "0.7rem",
    padding: "2px 4px",
    borderRadius: "4px",
    pointerEvents: "all",
    flexShrink: 0,
    zIndex: 20,
    position: "relative",
  },

  /* ── Assign To ── */
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
    transition: "background 0.15s",
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
    boxSizing: "border-box",
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