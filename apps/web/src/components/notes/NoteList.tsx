import { NoteCard } from "./NoteCard";
import { EmptyState } from "~/components/ui/EmptyState";
import { Pagination } from "~/components/ui/Pagination";
import type { Note } from "~/api/notes";

interface NoteListProps {
  notes: Note[];
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onCreateClick: () => void;
}

export function NoteList({
  notes,
  total,
  page,
  limit,
  onPageChange,
  onCreateClick,
}: NoteListProps) {
  if (notes.length === 0) {
    return (
      <EmptyState
        icon={<NoteIcon />}
        title="No notes found"
        description="Get started by creating your first note"
        action={{ label: "Create Note", onClick: onCreateClick }}
      />
    );
  }

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {notes.map((note) => (
          <NoteCard key={note.id} note={note} />
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

function NoteIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}
