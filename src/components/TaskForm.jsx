import { useState } from "react";
import axios from "axios";
import { buildApiUrl } from "../api";

const PRIORITIES = ["low", "medium", "high"];

function TaskForm({ fetchTasks, employees }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [assignedEmployeeEmails, setAssignedEmployeeEmails] = useState([]);
  const [loading, setLoading] = useState(false);

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
          value={assignedEmployeeEmails}
          onChange={(e) =>
            setAssignedEmployeeEmails(Array.from(e.target.selectedOptions, (option) => option.value))
          }
          required
          multiple
          style={styles.select}
        >
          {employees.map((employee) => (
            <option key={employee.email} value={employee.email}>
              {employee.name} ({employee.email})
            </option>
          ))}
        </select>
        <div style={styles.selectionHint}>
          {assignedEmployeeEmails.length === 0
            ? "Select one or more employees"
            : `${assignedEmployeeEmails.length} employee${assignedEmployeeEmails.length > 1 ? "s" : ""} selected`}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !title.trim() || assignedEmployeeEmails.length === 0 || employees.length === 0}
        style={{
          ...styles.submitBtn,
          ...(loading || !title.trim() || assignedEmployeeEmails.length === 0 || employees.length === 0
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
    minHeight: "132px",
  },
  selectionHint: {
    marginTop: "8px",
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: "0.65rem",
    color: "var(--text-soft)",
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
