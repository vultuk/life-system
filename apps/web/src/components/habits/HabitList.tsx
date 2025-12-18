import { HabitCard } from "./HabitCard";
import { EmptyState } from "~/components/ui/EmptyState";
import { Pagination } from "~/components/ui/Pagination";
import type { Habit } from "~/api/habits";

interface HabitListProps {
  habits: Habit[];
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onCreateClick: () => void;
  onLog: (habitId: string) => void;
  loggingHabitId?: string;
}

export function HabitList({
  habits,
  total,
  page,
  limit,
  onPageChange,
  onCreateClick,
  onLog,
  loggingHabitId,
}: HabitListProps) {
  if (habits.length === 0) {
    return (
      <EmptyState
        icon={<HabitIcon />}
        title="No habits found"
        description="Get started by creating your first habit to track"
        action={{ label: "Create Habit", onClick: onCreateClick }}
      />
    );
  }

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {habits.map((habit) => (
          <HabitCard
            key={habit.id}
            habit={habit}
            onLog={() => onLog(habit.id)}
            isLogging={loggingHabitId === habit.id}
          />
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

function HabitIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}
