import { Link } from "@tanstack/react-router";
import { Card, CardContent } from "~/components/ui/Card";
import { Badge } from "~/components/ui/Badge";
import type { Task, TaskPriority } from "~/api/tasks";
import { formatDate } from "~/utils/dates";

interface TaskCardProps {
  task: Task;
}

function isDeadlineOverdue(deadline: string | null): boolean {
  if (!deadline) return false;
  const deadlineDate = new Date(deadline);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return deadlineDate < today;
}

function isDeadlineToday(deadline: string | null): boolean {
  if (!deadline) return false;
  const deadlineDate = new Date(deadline);
  const today = new Date();
  return (
    deadlineDate.getDate() === today.getDate() &&
    deadlineDate.getMonth() === today.getMonth() &&
    deadlineDate.getFullYear() === today.getFullYear()
  );
}

export function TaskCard({ task }: TaskCardProps) {
  const priorityVariants: Record<TaskPriority, "default" | "warning" | "danger" | "success"> = {
    Lowest: "default",
    Low: "default",
    Normal: "warning",
    High: "danger",
    "Very high": "danger",
  };

  const statusLabels = {
    todo: "To Do",
    in_progress: "In Progress",
    done: "Done",
  };

  const overdue = task.status !== "done" && isDeadlineOverdue(task.deadline);
  const dueToday = task.status !== "done" && isDeadlineToday(task.deadline);

  return (
    <Link to="/tasks/$taskId" params={{ taskId: task.id }}>
      <Card hover className="h-full">
        <CardContent>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-gray-900 dark:text-white line-clamp-2">
              {task.title}
            </h3>
            <Badge variant={priorityVariants[task.priority]} size="sm">
              {task.priority}
            </Badge>
          </div>

          {task.description && (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="mt-3 flex items-center justify-between text-sm">
            <Badge
              variant={task.status === "done" ? "success" : "default"}
              size="sm"
            >
              {statusLabels[task.status]}
            </Badge>

            {task.deadline && (
              <span
                className={
                  overdue
                    ? "text-red-600 dark:text-red-400 font-medium"
                    : dueToday
                      ? "text-amber-600 dark:text-amber-400 font-medium"
                      : "text-gray-500 dark:text-gray-400"
                }
              >
                {overdue ? "Overdue: " : dueToday ? "Due today" : "Due: "}
                {!dueToday && formatDate(task.deadline)}
                {task.deadlineTime && ` at ${task.deadlineTime}`}
              </span>
            )}
          </div>

          {task.scheduledStart && (
            <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">
              Scheduled: {new Date(task.scheduledStart).toLocaleString()}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
