import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "~/components/layout/PageHeader";
import { Button } from "~/components/ui/Button";
import { Loading } from "~/components/ui/Spinner";
import { TaskList } from "~/components/tasks/TaskList";
import { CategoryFilter } from "~/components/categories/CategoryFilter";
import { useTasks } from "~/hooks/useTasks";
import { cn } from "~/utils/cn";

export const Route = createFileRoute("/tasks/")({
  component: TasksPage,
});

type StatusFilter = "all" | "todo" | "in_progress" | "done";

function TasksPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<StatusFilter>("all");
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useTasks({
    status: status === "all" ? undefined : status,
    categoryId,
    page,
    limit: 12,
  });

  const tabs: { value: StatusFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "todo", label: "To Do" },
    { value: "in_progress", label: "In Progress" },
    { value: "done", label: "Done" },
  ];

  return (
    <div>
      <PageHeader
        title="Tasks"
        description="Manage your tasks and to-dos"
        action={
          <Button onClick={() => navigate({ to: "/tasks/new" })}>
            New Task
          </Button>
        }
      />

      <div className="mb-6 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setStatus(tab.value);
                setPage(1);
              }}
              className={cn(
                "pb-3 text-sm font-medium border-b-2 transition-colors",
                status === tab.value
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="pb-3">
          <CategoryFilter
            value={categoryId}
            onChange={(id) => {
              setCategoryId(id);
              setPage(1);
            }}
          />
        </div>
      </div>

      {isLoading ? (
        <Loading message="Loading tasks..." />
      ) : (
        <TaskList
          tasks={data?.items || []}
          total={data?.total || 0}
          page={page}
          limit={12}
          onPageChange={setPage}
          onCreateClick={() => navigate({ to: "/tasks/new" })}
        />
      )}
    </div>
  );
}
