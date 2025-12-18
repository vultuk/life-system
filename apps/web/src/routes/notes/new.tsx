import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "~/components/layout/PageHeader";
import { Card, CardContent } from "~/components/ui/Card";
import { NoteForm, type NoteFormData } from "~/components/notes/NoteForm";
import { useCreateNote } from "~/hooks/useNotes";

export const Route = createFileRoute("/notes/new")({
  component: NewNotePage,
});

function NewNotePage() {
  const navigate = useNavigate();
  const createNote = useCreateNote();

  const handleSubmit = (data: NoteFormData) => {
    createNote.mutate(data, {
      onSuccess: () => navigate({ to: "/notes" }),
    });
  };

  return (
    <div>
      <PageHeader
        title="New Note"
        description="Create a new note"
      />

      <Card className="max-w-2xl">
        <CardContent className="pt-6">
          <NoteForm
            onSubmit={handleSubmit}
            onCancel={() => navigate({ to: "/notes" })}
            isLoading={createNote.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
