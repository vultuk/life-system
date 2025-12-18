import { TaskCard } from "./TaskCard";
import { EmptyState } from "~/components/ui/EmptyState";
import { Pagination } from "~/components/ui/Pagination";
import type { Task } from "~/api/tasks";

interface TaskListProps {
  tasks: Task[];
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onCreateClick: () => void;
}

export function TaskList({
  tasks,
  total,
  page,
  limit,
  onPageChange,
  onCreateClick,
}: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={<TaskIcon />}
        title="No tasks found"
        description="Get started by creating your first task"
        action={{ label: "Create Task", onClick: onCreateClick }}
      />
    );
  }

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
      <Pagination
        page={page}
        limit={limit}
        total={total}
        onPageChange={onPageChange}
      />
    </div>
  );
}

function TaskIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );
}
