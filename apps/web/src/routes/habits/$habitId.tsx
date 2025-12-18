import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "~/components/layout/PageHeader";
import { Card, CardContent, CardHeader } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { Badge } from "~/components/ui/Badge";
import { Modal } from "~/components/ui/Modal";
import { Loading } from "~/components/ui/Spinner";
import { HabitForm, type HabitFormData } from "~/components/habits/HabitForm";
import { HabitLogButton } from "~/components/habits/HabitLogButton";
import {
  useHabit,
  useHabitLogs,
  useUpdateHabit,
  useDeleteHabit,
  useLogHabit,
} from "~/hooks/useHabits";
import { formatDate, getTodayString } from "~/utils/dates";

export const Route = createFileRoute("/habits/$habitId")({
  component: HabitDetailPage,
});

function HabitDetailPage() {
  const { habitId } = Route.useParams();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { data: habit, isLoading } = useHabit(habitId);
  const { data: logsData, isLoading: logsLoading } = useHabitLogs(habitId, {
    limit: 30,
  });
  const updateHabit = useUpdateHabit();
  const deleteHabit = useDeleteHabit();
  const logHabit = useLogHabit();

  const [isLogging, setIsLogging] = useState(false);

  if (isLoading) {
    return <Loading message="Loading habit..." />;
  }

  if (!habit) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Habit not found
        </h2>
        <Button className="mt-4" onClick={() => navigate({ to: "/habits" })}>
          Back to Habits
        </Button>
      </div>
    );
  }

  const handleUpdate = (data: HabitFormData) => {
    updateHabit.mutate(
      { id: habitId, ...data },
      { onSuccess: () => setIsEditing(false) }
    );
  };

  const handleDelete = () => {
    deleteHabit.mutate(habitId, {
      onSuccess: () => navigate({ to: "/habits" }),
    });
  };

  const handleLog = () => {
    setIsLogging(true);
    logHabit.mutate(
      { id: habitId, logDate: getTodayString() },
      { onSettled: () => setIsLogging(false) }
    );
  };

  const frequencyLabels = {
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
  };

  const logs = logsData?.items || [];

  return (
    <div>
      <PageHeader
        title={habit.name}
        action={
          <div className="flex gap-2">
            <HabitLogButton onClick={handleLog} isLoading={isLogging} />
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
            <HabitForm
              habit={habit}
              onSubmit={handleUpdate}
              onCancel={() => setIsEditing(false)}
              isLoading={updateHabit.isPending}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="default">{frequencyLabels[habit.frequency]}</Badge>
                <Badge variant="primary">Target: {habit.targetCount}x</Badge>
              </div>

              {habit.description && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Description
                  </h3>
                  <p className="text-gray-900 dark:text-white">
                    {habit.description}
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Created {formatDate(habit.createdAt)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Recent Completions
              </h3>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <Loading message="Loading logs..." />
              ) : logs.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  No completions yet. Click the check button to log your first
                  completion!
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatDate(log.logDate)}
                        </p>
                        {log.notes && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {log.notes}
                          </p>
                        )}
                      </div>
                      {log.count > 1 && (
                        <Badge variant="success" size="sm">
                          x{log.count}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Habit"
      >
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Are you sure you want to delete this habit? All completion history will
          be lost. This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            isLoading={deleteHabit.isPending}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
