import { Link } from "@tanstack/react-router";
import { Card, CardContent } from "~/components/ui/Card";
import { Badge } from "~/components/ui/Badge";
import { HabitLogButton } from "./HabitLogButton";
import type { Habit } from "~/api/habits";

interface HabitCardProps {
  habit: Habit;
  onLog: () => void;
  isLogging?: boolean;
}

export function HabitCard({ habit, onLog, isLogging }: HabitCardProps) {
  const frequencyLabels = {
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
  };

  return (
    <Card className="h-full">
      <CardContent>
        <div className="flex items-start justify-between gap-2">
          <Link
            to="/habits/$habitId"
            params={{ habitId: habit.id }}
            className="flex-1 min-w-0"
          >
            <h3 className="font-medium text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 line-clamp-1">
              {habit.name}
            </h3>
          </Link>
          <HabitLogButton onClick={onLog} isLoading={isLogging} />
        </div>

        {habit.description && (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
            {habit.description}
          </p>
        )}

        <div className="mt-3 flex items-center gap-2">
          <Badge variant="default" size="sm">
            {frequencyLabels[habit.frequency]}
          </Badge>
          {habit.targetCount > 1 && (
            <Badge variant="primary" size="sm">
              Target: {habit.targetCount}x
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
