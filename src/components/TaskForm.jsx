import { useState } from "react";
import axios from "axios";
import { buildApiUrl } from "../api";

const PRIORITIES = ["low", "medium", "high"];

function TaskForm({ fetchTasks, employees }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [assignedEmployeeEmail, setAssignedEmployeeEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !assignedEmployeeEmail) return;
    setLoading(true);
    try {
      await axios.post(buildApiUrl("/tasks"), {
        title,
        description,
        priority,
        dueDate: dueDate || null,
        assignedEmployeeEmail,
      });
      setTitle("");
      setDescription("");
      setPriority("medium");
      setDueDate("");
      setAssignedEmployeeEmail("");
      fetchTasks();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <div style={styles.formHeader}>
        <span style={styles.formIcon}>+</span>
        <span style={styles.formTitle}>Assign Task</span>
      </div>

      <div style={styles.fieldGroup}>
        <label style={styles.label}>TASK TITLE</label>
        <input
          type="text"
          placeholder="What should the employee work on?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          style={styles.input}
        />
      </div>

      <div style={styles.fieldGroup}>
        <label style={styles.label}>DESCRIPTION</label>
        <textarea
          placeholder="Add the task details, context, and expected outcome"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          style={styles.textarea}
        />
      </div>

      <div style={styles.inlineFields}>
        <div style={styles.inlineField}>
          <label style={styles.label}>PRIORITY</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value)} style={styles.select}>
            {PRIORITIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.inlineField}>
          <label style={styles.label}>DUE DATE</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            style={styles.input}
          />
        </div>
      </div>

      <div style={styles.fieldGroup}>
        <label style={styles.label}>ASSIGN TO</label>
        <select
          value={assignedEmployeeEmail}
          onChange={(e) => setAssignedEmployeeEmail(e.target.value)}
          required
          style={styles.select}
        >
          <option value="">Select an employee</option>
          {employees.map((employee) => (
            <option key={employee.email} value={employee.email}>
              {employee.name} ({employee.email})
            </option>
          ))}
        </select>
        <div style={styles.employeePanel}>
          <div style={styles.employeePanelHeader}>
            <span style={styles.employeePanelTitle}>Registered Employees</span>
            <span style={styles.employeeCount}>{employees.length}</span>
          </div>

          {employees.length === 0 ? (
            <p style={styles.emptyEmployees}>No employees registered yet.</p>
          ) : (
            <div style={styles.employeeList}>
              {employees.map((employee) => {
                const selected = assignedEmployeeEmail === employee.email;
                return (
                  <button
                    key={employee.email}
                    type="button"
                    onClick={() => setAssignedEmployeeEmail(employee.email)}
                    style={{
                      ...styles.employeeItem,
                      ...(selected ? styles.employeeItemActive : {}),
                    }}
                  >
                    <span style={styles.employeeName}>{employee.name}</span>
                    <span style={styles.employeeEmail}>{employee.email}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !title.trim() || !assignedEmployeeEmail || employees.length === 0}
        style={{
          ...styles.submitBtn,
          ...(loading || !title.trim() || !assignedEmployeeEmail || employees.length === 0
            ? styles.submitBtnDisabled
            : {}),
        }}
      >
        {employees.length === 0
          ? "Register employees first"
          : loading
            ? "Assigning..."
            : "Assign Task ->"}
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
    minWidth: "180px",
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
  },
  select: {
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
  },
  employeePanel: {
    marginTop: "12px",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    background: "var(--bg-input)",
    padding: "12px",
  },
  employeePanelHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "10px",
  },
  employeePanelTitle: {
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: "0.68rem",
    fontWeight: "700",
    color: "var(--text-muted)",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  employeeCount: {
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: "0.68rem",
    color: "var(--accent)",
  },
  employeeList: {
    display: "grid",
    gap: "8px",
    maxHeight: "180px",
    overflowY: "auto",
  },
  employeeItem: {
    width: "100%",
    textAlign: "left",
    background: "var(--bg-soft)",
    border: "1px solid var(--border)",
    borderRadius: "10px",
    padding: "10px 12px",
    display: "grid",
    gap: "4px",
  },
  employeeItemActive: {
    border: "1px solid var(--accent)",
    background: "var(--bg-accent-soft)",
  },
  employeeName: {
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: "0.76rem",
    fontWeight: "700",
    color: "var(--text)",
  },
  employeeEmail: {
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: "0.65rem",
    color: "var(--text-soft)",
  },
  emptyEmployees: {
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: "0.72rem",
    color: "var(--text-soft)",
    margin: 0,
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
  },
  submitBtnDisabled: {
    background: "var(--border)",
    color: "var(--text-faint)",
    cursor: "not-allowed",
  },
};

export default TaskForm;
