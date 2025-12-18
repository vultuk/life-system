import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "~/components/layout/PageHeader";
import { Card, CardContent } from "~/components/ui/Card";
import { HabitForm, type HabitFormData } from "~/components/habits/HabitForm";
import { useCreateHabit } from "~/hooks/useHabits";

export const Route = createFileRoute("/habits/new")({
  component: NewHabitPage,
});

function NewHabitPage() {
  const navigate = useNavigate();
  const createHabit = useCreateHabit();

  const handleSubmit = (data: HabitFormData) => {
    createHabit.mutate(data, {
      onSuccess: () => navigate({ to: "/habits" }),
    });
  };

  return (
    <div>
      <PageHeader
        title="New Habit"
        description="Create a new habit to track"
      />

      <Card className="max-w-2xl">
        <CardContent className="pt-6">
          <HabitForm
            onSubmit={handleSubmit}
            onCancel={() => navigate({ to: "/habits" })}
            isLoading={createHabit.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
