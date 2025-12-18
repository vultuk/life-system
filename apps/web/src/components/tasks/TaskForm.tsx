import { useState } from "react";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";
import { Textarea } from "~/components/ui/Textarea";
import { Select } from "~/components/ui/Select";
import type {
  Task,
  CreateTaskInput,
  TaskPriority,
  TaskStatus,
} from "~/api/tasks";

export type TaskFormData = CreateTaskInput & { status?: TaskStatus };

interface TaskFormProps {
  task?: Task;
  onSubmit: (data: TaskFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function TaskForm({
  task,
  onSubmit,
  onCancel,
  isLoading,
}: TaskFormProps) {
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [priority, setPriority] = useState<TaskPriority>(
    task?.priority || "Normal"
  );
  const [status, setStatus] = useState<TaskStatus>(task?.status || "todo");
  const [deadline, setDeadline] = useState(task?.deadline || "");
  const [deadlineTime, setDeadlineTime] = useState(task?.deadlineTime || "");
  const [scheduledStart, setScheduledStart] = useState(
    task?.scheduledStart ? task.scheduledStart.slice(0, 16) : ""
  );
  const [scheduledFinish, setScheduledFinish] = useState(
    task?.scheduledFinish ? task.scheduledFinish.slice(0, 16) : ""
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = "Title is required";
    }

    if (scheduledStart && scheduledFinish) {
      if (new Date(scheduledFinish) <= new Date(scheduledStart)) {
        newErrors.scheduledFinish = "Finish must be after start";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const data: TaskFormData = {
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      ...(task && { status }),
      deadline: deadline || undefined,
      deadlineTime: deadlineTime || undefined,
      scheduledStart: scheduledStart
        ? new Date(scheduledStart).toISOString()
        : undefined,
      scheduledFinish: scheduledFinish
        ? new Date(scheduledFinish).toISOString()
        : undefined,
    };

    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        error={errors.title}
        placeholder="Enter task title"
        required
      />

      <Textarea
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Enter task description (optional)"
        rows={3}
      />

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value as TaskPriority)}
          options={[
            { value: "Lowest", label: "Lowest" },
            { value: "Low", label: "Low" },
            { value: "Normal", label: "Normal" },
            { value: "High", label: "High" },
            { value: "Very high", label: "Very High" },
          ]}
        />

        {task && (
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
            options={[
              { value: "todo", label: "To Do" },
              { value: "in_progress", label: "In Progress" },
              { value: "done", label: "Done" },
            ]}
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Deadline Date"
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
        />
        <Input
          label="Deadline Time"
          type="time"
          value={deadlineTime}
          onChange={(e) => setDeadlineTime(e.target.value)}
          placeholder="09:00"
        />
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Scheduled Time Block (optional)
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Start"
            type="datetime-local"
            value={scheduledStart}
            onChange={(e) => setScheduledStart(e.target.value)}
          />
          <Input
            label="Finish"
            type="datetime-local"
            value={scheduledFinish}
            onChange={(e) => setScheduledFinish(e.target.value)}
            error={errors.scheduledFinish}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {task ? "Update Task" : "Create Task"}
        </Button>
      </div>
    </form>
  );
}
