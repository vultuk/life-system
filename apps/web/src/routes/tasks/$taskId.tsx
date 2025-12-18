import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "~/components/layout/PageHeader";
import { Card, CardContent } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { Badge } from "~/components/ui/Badge";
import { Modal } from "~/components/ui/Modal";
import { Loading } from "~/components/ui/Spinner";
import { TaskForm, type TaskFormData } from "~/components/tasks/TaskForm";
import { useTask, useUpdateTask, useDeleteTask } from "~/hooks/useTasks";
import { formatDate, isOverdue, isDueToday } from "~/utils/dates";

export const Route = createFileRoute("/tasks/$taskId")({
  component: TaskDetailPage,
});

function TaskDetailPage() {
  const { taskId } = Route.useParams();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { data: task, isLoading } = useTask(taskId);
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  if (isLoading) {
    return <Loading message="Loading task..." />;
  }

  if (!task) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Task not found
        </h2>
        <Button className="mt-4" onClick={() => navigate({ to: "/tasks" })}>
          Back to Tasks
        </Button>
      </div>
    );
  }

  const handleUpdate = (data: TaskFormData) => {
    updateTask.mutate(
      { id: taskId, ...data },
      { onSuccess: () => setIsEditing(false) }
    );
  };

  const handleDelete = () => {
    deleteTask.mutate(taskId, {
      onSuccess: () => navigate({ to: "/tasks" }),
    });
  };

  const handleStatusChange = (status: "todo" | "in_progress" | "done") => {
    updateTask.mutate({ id: taskId, status });
  };

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
    <div>
      <PageHeader
        title={task.title}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
            <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
              Delete
            </Button>
          </div>
        }
      />

      {isEditing ? (
        <Card className="max-w-2xl">
          <CardContent className="pt-6">
            <TaskForm
              task={task}
              onSubmit={handleUpdate}
              onCancel={() => setIsEditing(false)}
              isLoading={updateTask.isPending}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6 max-w-2xl">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant={task.status === "done" ? "success" : "default"}>
                  {statusLabels[task.status]}
                </Badge>
                <Badge variant={priorityVariants[task.priority]}>
                  {task.priority} priority
                </Badge>
                {task.dueDate && (
                  <Badge
                    variant={overdue ? "danger" : dueToday ? "warning" : "default"}
                  >
                    {overdue
                      ? "Overdue"
                      : dueToday
                        ? "Due today"
                        : `Due ${formatDate(task.dueDate)}`}
                  </Badge>
                )}
              </div>

              {task.description && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Description
                  </h3>
                  <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                    {task.description}
                  </p>
                </div>
              )}

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                  Change Status
                </h3>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={task.status === "todo" ? "primary" : "secondary"}
                    onClick={() => handleStatusChange("todo")}
                    disabled={updateTask.isPending}
                  >
                    To Do
                  </Button>
                  <Button
                    size="sm"
                    variant={task.status === "in_progress" ? "primary" : "secondary"}
                    onClick={() => handleStatusChange("in_progress")}
                    disabled={updateTask.isPending}
                  >
                    In Progress
                  </Button>
                  <Button
                    size="sm"
                    variant={task.status === "done" ? "primary" : "secondary"}
                    onClick={() => handleStatusChange("done")}
                    disabled={updateTask.isPending}
                  >
                    Done
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Task"
      >
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Are you sure you want to delete this task? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            isLoading={deleteTask.isPending}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
