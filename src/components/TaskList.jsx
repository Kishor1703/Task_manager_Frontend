import { useState } from "react";
import axios from "axios";
import { buildApiUrl } from "../api";

const STATUS_CONFIG = {
  done: { color: "#22c55e", bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.25)", label: "Done" },
  "in-progress": { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)", label: "In Progress" },
  pending: { color: "#64748b", bg: "rgba(100,116,139,0.1)", border: "rgba(100,116,139,0.25)", label: "Pending" },
};

const PRIORITY_CONFIG = {
  high: { color: "#ef4444", label: "High" },
  medium: { color: "#f59e0b", label: "Medium" },
  low: { color: "#22c55e", label: "Low" },
};

const STATUS_OPTIONS = ["pending", "in-progress", "done"];

function formatDate(value) {
  if (!value) return "No due date";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function TaskCard({ task, onDelete, onStatusChange, canDelete, canUpdateStatus }) {
  const [deleting, setDeleting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [employeeNote, setEmployeeNote] = useState(task.employeeNote ?? "");
  const cfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending;
  const priorityCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(task.id);
  };

  const handleStatusChange = async (e) => {
    const nextStatus = e.target.value;
    if (nextStatus === task.status && employeeNote === (task.employeeNote ?? "")) return;

    setUpdatingStatus(true);
    try {
      await onStatusChange(task.id, nextStatus, employeeNote);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleNoteBlur = async () => {
    if (!canUpdateStatus || employeeNote === (task.employeeNote ?? "")) return;

    setUpdatingStatus(true);
    try {
      await onStatusChange(task.id, task.status, employeeNote);
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div
      style={{
        ...styles.card,
        ...(hovered ? styles.cardHover : {}),
        borderLeft: `3px solid ${cfg.color}`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={styles.cardTop}>
        <div style={styles.taskMeta}>
          <div style={styles.cardMetaRow}>
            <p style={styles.taskTitle}>{task.title}</p>
            <span style={{ ...styles.priorityBadge, color: priorityCfg.color, borderColor: `${priorityCfg.color}55` }}>
              {priorityCfg.label}
            </span>
          </div>
          {task.description && <p style={styles.taskDescription}>{task.description}</p>}
          <p style={styles.taskOwner}>Assigned to: {task.assignedEmployeeName} ({task.assignedEmployeeEmail})</p>
          <p style={styles.taskOwner}>Assigned by: {task.createdByName}</p>
          <div style={styles.infoRow}>
            <span style={styles.infoTag}>Due {formatDate(task.dueDate)}</span>
            <span style={styles.infoTag}>Updated {formatDate(task.updatedAt)}</span>
          </div>
        </div>
        {canDelete && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{ ...styles.deleteBtn, ...(deleting ? styles.deleteBtnDisabled : {}) }}
            title="Delete task"
          >
            {deleting ? "..." : "X"}
          </button>
        )}
      </div>

      <div style={styles.cardBottom}>
        <label style={styles.statusControl}>
          <span
            style={{
              ...styles.statusBadge,
              color: cfg.color,
              background: cfg.bg,
              border: `1px solid ${cfg.border}`,
            }}
          >
            <span style={{ ...styles.statusPulse, background: cfg.color }} />
            {updatingStatus ? "Updating..." : cfg.label}
          </span>

          {canUpdateStatus ? (
            <select
              value={task.status}
              onChange={handleStatusChange}
              disabled={updatingStatus}
              style={{ ...styles.statusSelect, ...(updatingStatus ? styles.statusSelectDisabled : {}) }}
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {STATUS_CONFIG[status].label}
                </option>
              ))}
            </select>
          ) : (
            <span style={styles.managerHint}>Manager tracking only</span>
          )}
        </label>
        <span style={styles.taskId}>#{String(task.id).padStart(4, "0")}</span>
      </div>

      <div style={styles.noteBlock}>
        <label style={styles.noteLabel}>Employee Note</label>
        {canUpdateStatus ? (
          <textarea
            value={employeeNote}
            onChange={(e) => setEmployeeNote(e.target.value)}
            onBlur={handleNoteBlur}
            placeholder="Add progress, blocker, or next step"
            rows={3}
            style={styles.noteInput}
          />
        ) : (
          <div style={styles.noteReadOnly}>{task.employeeNote || "No employee update yet."}</div>
        )}
      </div>
    </div>
  );
}

function TaskList({ tasks, fetchTasks, searchQuery, canDelete, canUpdateStatus, emptyMessage }) {
  const deleteTask = async (id) => {
    await axios.delete(buildApiUrl(`/tasks/${id}`));
    fetchTasks();
  };

  const updateTaskStatus = async (id, status, employeeNote) => {
    await axios.put(buildApiUrl(`/tasks/${id}/status`), { status, employeeNote });
    fetchTasks();
  };

  const grouped = {
    "in-progress": tasks.filter((t) => t.status === "in-progress"),
    pending: tasks.filter((t) => t.status === "pending"),
    done: tasks.filter((t) => t.status === "done"),
  };

  return (
    <div>
      <div style={styles.listHeader}>
        <span style={styles.listTitle}>Task Board</span>
        <span style={styles.taskCount}>{tasks.length} task{tasks.length !== 1 ? "s" : ""}</span>
      </div>

      {tasks.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>O</div>
          <p style={styles.emptyText}>
            {searchQuery.trim() ? `No tasks found for "${searchQuery.trim()}".` : emptyMessage}
          </p>
        </div>
      ) : (
        Object.entries(grouped).map(([status, items]) =>
          items.length > 0 && (
            <div key={status} style={styles.group}>
              <div style={styles.groupHeader}>
                <span
                  style={{
                    ...styles.groupDot,
                    background: STATUS_CONFIG[status].color,
                    boxShadow: `0 0 6px ${STATUS_CONFIG[status].color}`,
                  }}
                />
                <span style={styles.groupLabel}>{STATUS_CONFIG[status].label}</span>
                <span style={styles.groupCount}>{items.length}</span>
              </div>
              {items.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onDelete={deleteTask}
                  onStatusChange={updateTaskStatus}
                  canDelete={canDelete}
                  canUpdateStatus={canUpdateStatus}
                />
              ))}
            </div>
          )
        )
      )}
    </div>
  );
}

const styles = {
  listHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "20px",
    paddingBottom: "14px",
    borderBottom: "1px solid #2d3548",
  },
  listTitle: {
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: "0.85rem",
    fontWeight: "700",
    color: "#e2e8f0",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  taskCount: {
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: "0.7rem",
    color: "#475569",
    background: "#1a1f2e",
    border: "1px solid #2d3548",
    borderRadius: "6px",
    padding: "3px 8px",
  },
  group: {
    marginBottom: "20px",
  },
  groupHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "8px",
    padding: "0 4px",
  },
  groupDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    flexShrink: 0,
  },
  groupLabel: {
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: "0.68rem",
    fontWeight: "700",
    color: "#64748b",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    flex: 1,
  },
  groupCount: {
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: "0.65rem",
    color: "#475569",
  },
  card: {
    background: "#1a1f2e",
    border: "1px solid #2d3548",
    borderRadius: "12px",
    padding: "14px 16px",
    marginBottom: "8px",
    transition: "all 0.18s ease",
    cursor: "default",
  },
  cardHover: {
    background: "#1e2436",
    borderColor: "#3d4a6a",
    boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
    transform: "translateY(-1px)",
  },
  cardTop: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "10px",
  },
  cardMetaRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    flexWrap: "wrap",
  },
  taskMeta: {
    flex: 1,
  },
  taskTitle: {
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: "0.9rem",
    fontWeight: "600",
    color: "#e2e8f0",
    margin: 0,
    lineHeight: 1.4,
  },
  priorityBadge: {
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: "0.62rem",
    border: "1px solid",
    borderRadius: "999px",
    padding: "4px 8px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  taskDescription: {
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: "0.72rem",
    color: "#cbd5e1",
    lineHeight: 1.7,
    marginTop: "8px",
    whiteSpace: "pre-wrap",
  },
  taskOwner: {
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: "0.65rem",
    color: "#64748b",
    marginTop: "6px",
  },
  infoRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginTop: "8px",
  },
  infoTag: {
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: "0.62rem",
    color: "#94a3b8",
    background: "#0f1117",
    border: "1px solid #2d3548",
    borderRadius: "999px",
    padding: "4px 8px",
  },
  deleteBtn: {
    background: "transparent",
    border: "1px solid #2d3548",
    borderRadius: "6px",
    width: "26px",
    height: "26px",
    color: "#475569",
    cursor: "pointer",
    fontSize: "0.7rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    padding: 0,
  },
  deleteBtnDisabled: {
    opacity: 0.4,
    cursor: "not-allowed",
  },
  cardBottom: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "12px",
  },
  statusControl: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    minWidth: 0,
    flexWrap: "wrap",
  },
  statusBadge: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: "0.7rem",
    fontWeight: "600",
    borderRadius: "6px",
    padding: "3px 8px",
    letterSpacing: "0.04em",
  },
  statusSelect: {
    background: "#0f1117",
    border: "1px solid #2d3548",
    borderRadius: "6px",
    color: "#cbd5e1",
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: "0.68rem",
    padding: "5px 8px",
    outline: "none",
    cursor: "pointer",
  },
  statusSelectDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
  managerHint: {
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: "0.62rem",
    color: "#64748b",
  },
  statusPulse: {
    width: "5px",
    height: "5px",
    borderRadius: "50%",
    flexShrink: 0,
  },
  taskId: {
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: "0.65rem",
    color: "#334155",
  },
  noteBlock: {
    borderTop: "1px solid #2d3548",
    paddingTop: "12px",
  },
  noteLabel: {
    display: "block",
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: "0.62rem",
    color: "#64748b",
    marginBottom: "8px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  noteInput: {
    width: "100%",
    background: "#0f1117",
    border: "1px solid #2d3548",
    borderRadius: "10px",
    padding: "10px 12px",
    color: "#e2e8f0",
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: "0.74rem",
    outline: "none",
    boxSizing: "border-box",
    resize: "vertical",
  },
  noteReadOnly: {
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: "0.74rem",
    color: "#cbd5e1",
    lineHeight: 1.7,
    whiteSpace: "pre-wrap",
    background: "#0f1117",
    border: "1px solid #2d3548",
    borderRadius: "10px",
    padding: "10px 12px",
  },
  emptyState: {
    textAlign: "center",
    padding: "48px 24px",
    border: "1px dashed #2d3548",
    borderRadius: "16px",
    background: "#0f1117",
  },
  emptyIcon: {
    fontSize: "2rem",
    color: "#334155",
    marginBottom: "12px",
  },
  emptyText: {
    fontFamily: "'DM Mono', 'Courier New', monospace",
    fontSize: "0.8rem",
    color: "#475569",
    margin: 0,
  },
};

export default TaskList;
