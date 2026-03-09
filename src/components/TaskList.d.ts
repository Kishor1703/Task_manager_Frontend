interface TaskListTask {
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

declare function TaskList(props: {
  tasks: TaskListTask[];
  fetchTasks: () => Promise<unknown>;
  searchQuery: string;
  canDelete: boolean;
  canUpdateStatus: boolean;
  emptyMessage: string;
}): JSX.Element;

export default TaskList;
