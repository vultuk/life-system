import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { Badge } from "~/components/ui/Badge";
import { Loading } from "~/components/ui/Spinner";
import { useTasks } from "~/hooks/useTasks";
import { useHabits, useLogHabit } from "~/hooks/useHabits";
import { useNotes } from "~/hooks/useNotes";
import { useContacts } from "~/hooks/useContacts";
import { HabitLogButton } from "~/components/habits/HabitLogButton";
import { isOverdue, isDueToday, getTodayString } from "~/utils/dates";
import { useState } from "react";

export const Route = createFileRoute("/")({
  component: DashboardPage,
});

function DashboardPage() {
  const { data: tasksData, isLoading: tasksLoading } = useTasks({ limit: 5 });
  const { data: habitsData, isLoading: habitsLoading } = useHabits({ limit: 5 });
  const { data: notesData, isLoading: notesLoading } = useNotes({ limit: 5 });
  const { data: contactsData, isLoading: contactsLoading } = useContacts({ limit: 5 });

  const logHabit = useLogHabit();
  const [loggingHabitId, setLoggingHabitId] = useState<string | null>(null);

  const handleLogHabit = (habitId: string) => {
    setLoggingHabitId(habitId);
    logHabit.mutate(
      { id: habitId, logDate: getTodayString() },
      { onSettled: () => setLoggingHabitId(null) }
    );
  };

  const tasks = tasksData?.items || [];
  const habits = habitsData?.items || [];
  const notes = notesData?.items || [];
  const contacts = contactsData?.items || [];

  const overdueTasks = tasks.filter(
    (t) => t.status !== "done" && isOverdue(t.dueDate)
  );
  const dueTodayTasks = tasks.filter(
    (t) => t.status !== "done" && isDueToday(t.dueDate)
  );
  const todoTasks = tasks.filter((t) => t.status === "todo");

  if (tasksLoading || habitsLoading || notesLoading || contactsLoading) {
    return <Loading message="Loading dashboard..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Welcome back! Here's an overview of your life system.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Tasks"
          value={todoTasks.length}
          label="to do"
          color="blue"
          href="/tasks"
        />
        <StatCard
          title="Overdue"
          value={overdueTasks.length}
          label="tasks"
          color="red"
          href="/tasks?status=todo"
        />
        <StatCard
          title="Due Today"
          value={dueTodayTasks.length}
          label="tasks"
          color="amber"
          href="/tasks"
        />
        <StatCard
          title="Habits"
          value={habits.length}
          label="tracking"
          color="green"
          href="/habits"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Habits */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Today's Habits
              </h2>
              <Link to="/habits">
                <Button variant="ghost" size="sm">
                  View all
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {habits.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No habits yet.{" "}
                <Link to="/habits/new" className="text-primary-600">
                  Create one
                </Link>
              </p>
            ) : (
              <div className="space-y-3">
                {habits.map((habit) => (
                  <div
                    key={habit.id}
                    className="flex items-center justify-between"
                  >
                    <Link
                      to="/habits/$habitId"
                      params={{ habitId: habit.id }}
                      className="text-gray-900 dark:text-white hover:text-primary-600"
                    >
                      {habit.name}
                    </Link>
                    <HabitLogButton
                      size="sm"
                      onClick={() => handleLogHabit(habit.id)}
                      isLoading={loggingHabitId === habit.id}
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Tasks */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Tasks
              </h2>
              <Link to="/tasks">
                <Button variant="ghost" size="sm">
                  View all
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No tasks yet.{" "}
                <Link to="/tasks/new" className="text-primary-600">
                  Create one
                </Link>
              </p>
            ) : (
              <div className="space-y-3">
                {tasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between"
                  >
                    <Link
                      to="/tasks/$taskId"
                      params={{ taskId: task.id }}
                      className="text-gray-900 dark:text-white hover:text-primary-600 truncate"
                    >
                      {task.title}
                    </Link>
                    <Badge
                      variant={
                        task.status === "done"
                          ? "success"
                          : task.priority === "high"
                            ? "danger"
                            : "default"
                      }
                      size="sm"
                    >
                      {task.status === "done" ? "Done" : task.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Notes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Notes
              </h2>
              <Link to="/notes">
                <Button variant="ghost" size="sm">
                  View all
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {notes.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No notes yet.{" "}
                <Link to="/notes/new" className="text-primary-600">
                  Create one
                </Link>
              </p>
            ) : (
              <div className="space-y-3">
                {notes.map((note) => (
                  <Link
                    key={note.id}
                    to="/notes/$noteId"
                    params={{ noteId: note.id }}
                    className="block text-gray-900 dark:text-white hover:text-primary-600 truncate"
                  >
                    {note.title}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Contacts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Contacts
              </h2>
              <Link to="/contacts">
                <Button variant="ghost" size="sm">
                  View all
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {contacts.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No contacts yet.{" "}
                <Link to="/contacts/new" className="text-primary-600">
                  Add one
                </Link>
              </p>
            ) : (
              <div className="space-y-3">
                {contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center justify-between"
                  >
                    <Link
                      to="/contacts/$contactId"
                      params={{ contactId: contact.id }}
                      className="text-gray-900 dark:text-white hover:text-primary-600 truncate"
                    >
                      {contact.name}
                    </Link>
                    {contact.relationship && (
                      <Badge variant="default" size="sm">
                        {contact.relationship}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Quick Actions
          </h2>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Link to="/tasks/new">
              <Button>New Task</Button>
            </Link>
            <Link to="/contacts/new">
              <Button variant="secondary">Add Contact</Button>
            </Link>
            <Link to="/notes/new">
              <Button variant="secondary">Create Note</Button>
            </Link>
            <Link to="/habits/new">
              <Button variant="secondary">Track Habit</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  label: string;
  color: "blue" | "red" | "amber" | "green";
  href: string;
}

function StatCard({ title, value, label, color, href }: StatCardProps) {
  const colors = {
    blue: "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30",
    red: "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30",
    amber: "text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30",
    green: "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30",
  };

  return (
    <Link to={href}>
      <Card hover>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${colors[color]}`}>
              <span className="text-2xl font-bold">{value}</span>
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{title}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
