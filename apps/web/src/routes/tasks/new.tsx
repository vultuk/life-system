import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "~/components/layout/PageHeader";
import { Card, CardContent } from "~/components/ui/Card";
import { TaskForm, type TaskFormData } from "~/components/tasks/TaskForm";
import { useCreateTask } from "~/hooks/useTasks";

export const Route = createFileRoute("/tasks/new")({
  component: NewTaskPage,
});

function NewTaskPage() {
  const navigate = useNavigate();
  const createTask = useCreateTask();

  const handleSubmit = (data: TaskFormData) => {
    createTask.mutate(data, {
      onSuccess: () => navigate({ to: "/tasks" }),
    });
  };

  return (
    <div>
      <PageHeader
        title="New Task"
        description="Create a new task to track"
      />

      <Card className="max-w-2xl">
        <CardContent className="pt-6">
          <TaskForm
            onSubmit={handleSubmit}
            onCancel={() => navigate({ to: "/tasks" })}
            isLoading={createTask.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
