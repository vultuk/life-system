import { Link } from "@tanstack/react-router";
import { Card, CardContent } from "~/components/ui/Card";
import { Badge } from "~/components/ui/Badge";
import type { Task } from "~/api/tasks";
import { formatDate, isOverdue, isDueToday } from "~/utils/dates";

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  const priorityVariants = {
    low: "default",
    medium: "warning",
    high: "danger",
  } as const;

  const statusLabels = {
    todo: "To Do",
    in_progress: "In Progress",
    done: "Done",
  };

  const overdue = task.status !== "done" && isOverdue(task.dueDate);
  const dueToday = task.status !== "done" && isDueToday(task.dueDate);

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

            {task.dueDate && (
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
                {!dueToday && formatDate(task.dueDate)}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
