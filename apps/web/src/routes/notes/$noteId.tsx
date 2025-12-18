import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "~/components/layout/PageHeader";
import { Card, CardContent } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { Badge } from "~/components/ui/Badge";
import { Modal } from "~/components/ui/Modal";
import { Loading } from "~/components/ui/Spinner";
import { NoteForm, type NoteFormData } from "~/components/notes/NoteForm";
import { useNote, useUpdateNote, useDeleteNote } from "~/hooks/useNotes";
import { formatDateTime } from "~/utils/dates";

export const Route = createFileRoute("/notes/$noteId")({
  component: NoteDetailPage,
});

function NoteDetailPage() {
  const { noteId } = Route.useParams();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { data: note, isLoading } = useNote(noteId);
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();

  if (isLoading) {
    return <Loading message="Loading note..." />;
  }

  if (!note) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Note not found
        </h2>
        <Button className="mt-4" onClick={() => navigate({ to: "/notes" })}>
          Back to Notes
        </Button>
      </div>
    );
  }

  const handleUpdate = (data: NoteFormData) => {
    updateNote.mutate(
      { id: noteId, ...data },
      { onSuccess: () => setIsEditing(false) }
    );
  };

  const handleDelete = () => {
    deleteNote.mutate(noteId, {
      onSuccess: () => navigate({ to: "/notes" }),
    });
  };

  return (
    <div>
      <PageHeader
        title={note.title}
        action={
          <div className="flex gap-2">
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
            <NoteForm
              note={note}
              onSubmit={handleUpdate}
              onCancel={() => setIsEditing(false)}
              isLoading={updateNote.isPending}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6 max-w-3xl">
          <Card>
            <CardContent className="pt-6">
              {note.tags && note.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {note.tags.map((tag) => (
                    <Badge key={tag} variant="primary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {note.content ? (
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-gray-900 dark:text-white">
                    {note.content}
                  </pre>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 italic">
                  No content
                </p>
              )}

              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Last updated {formatDateTime(note.updatedAt)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Note"
      >
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Are you sure you want to delete this note? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            isLoading={deleteNote.isPending}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
