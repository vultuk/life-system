import { useState } from "react";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";
import { Textarea } from "~/components/ui/Textarea";
import { Select } from "~/components/ui/Select";
import type { Habit, CreateHabitInput } from "~/api/habits";

export type HabitFormData = CreateHabitInput;

interface HabitFormProps {
  habit?: Habit;
  onSubmit: (data: HabitFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function HabitForm({ habit, onSubmit, onCancel, isLoading }: HabitFormProps) {
  const [name, setName] = useState(habit?.name || "");
  const [description, setDescription] = useState(habit?.description || "");
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly">(
    habit?.frequency || "daily"
  );
  const [targetCount, setTargetCount] = useState(habit?.targetCount || 1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Name is required";
    }

    if (targetCount < 1) {
      newErrors.targetCount = "Target must be at least 1";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      frequency,
      targetCount,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        placeholder="e.g., Morning Exercise"
        required
      />

      <Textarea
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="What does this habit involve?"
        rows={3}
      />

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Frequency"
          value={frequency}
          onChange={(e) => setFrequency(e.target.value as typeof frequency)}
          options={[
            { value: "daily", label: "Daily" },
            { value: "weekly", label: "Weekly" },
            { value: "monthly", label: "Monthly" },
          ]}
        />

        <Input
          label="Target Count"
          type="number"
          min={1}
          max={100}
          value={targetCount}
          onChange={(e) => setTargetCount(parseInt(e.target.value) || 1)}
          error={errors.targetCount}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {habit ? "Update Habit" : "Create Habit"}
        </Button>
      </div>
    </form>
  );
}
