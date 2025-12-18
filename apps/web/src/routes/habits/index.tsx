import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "~/components/layout/PageHeader";
import { Button } from "~/components/ui/Button";
import { Loading } from "~/components/ui/Spinner";
import { HabitList } from "~/components/habits/HabitList";
import { useHabits, useLogHabit } from "~/hooks/useHabits";
import { getTodayString } from "~/utils/dates";
import { cn } from "~/utils/cn";

export const Route = createFileRoute("/habits/")({
  component: HabitsPage,
});

type FrequencyFilter = "all" | "daily" | "weekly" | "monthly";

function HabitsPage() {
  const navigate = useNavigate();
  const [frequency, setFrequency] = useState<FrequencyFilter>("all");
  const [page, setPage] = useState(1);
  const [loggingHabitId, setLoggingHabitId] = useState<string | null>(null);

  const { data, isLoading } = useHabits({
    frequency: frequency === "all" ? undefined : frequency,
    page,
    limit: 12,
  });

  const logHabit = useLogHabit();

  const handleLogHabit = (habitId: string) => {
    setLoggingHabitId(habitId);
    logHabit.mutate(
      { id: habitId, logDate: getTodayString() },
      { onSettled: () => setLoggingHabitId(null) }
    );
  };

  const tabs: { value: FrequencyFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
  ];

  return (
    <div>
      <PageHeader
        title="Habits"
        description="Track your daily habits and routines"
        action={
          <Button onClick={() => navigate({ to: "/habits/new" })}>
            New Habit
          </Button>
        }
      />

      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setFrequency(tab.value);
                setPage(1);
              }}
              className={cn(
                "pb-3 text-sm font-medium border-b-2 transition-colors",
                frequency === tab.value
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {isLoading ? (
        <Loading message="Loading habits..." />
      ) : (
        <HabitList
          habits={data?.items || []}
          total={data?.total || 0}
          page={page}
          limit={12}
          onPageChange={setPage}
          onCreateClick={() => navigate({ to: "/habits/new" })}
          onLog={handleLogHabit}
          loggingHabitId={loggingHabitId || undefined}
        />
      )}
    </div>
  );
}
