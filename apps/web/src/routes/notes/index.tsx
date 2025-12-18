import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "~/components/layout/PageHeader";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";
import { Badge } from "~/components/ui/Badge";
import { Loading } from "~/components/ui/Spinner";
import { NoteList } from "~/components/notes/NoteList";
import { useNotes } from "~/hooks/useNotes";
import { cn } from "~/utils/cn";

export const Route = createFileRoute("/notes/")({
  component: NotesPage,
});

function NotesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useNotes({
    search: search || undefined,
    tag: selectedTag || undefined,
    page,
    limit: 12,
  });

  // Collect unique tags from notes
  const allTags = new Set<string>();
  data?.items.forEach((note) => {
    note.tags?.forEach((tag) => allTags.add(tag));
  });

  return (
    <div>
      <PageHeader
        title="Notes"
        description="Capture your thoughts and ideas"
        action={
          <Button onClick={() => navigate({ to: "/notes/new" })}>
            New Note
          </Button>
        }
      />

      <div className="mb-6 space-y-4">
        <Input
          placeholder="Search notes..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-md"
        />

        {allTags.size > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setSelectedTag(null);
                setPage(1);
              }}
              className={cn(
                "text-sm px-2 py-1 rounded",
                !selectedTag
                  ? "bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
              )}
            >
              All
            </button>
            {Array.from(allTags).map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  setSelectedTag(tag);
                  setPage(1);
                }}
                className={cn(
                  "text-sm px-2 py-1 rounded",
                  selectedTag === tag
                    ? "bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {isLoading ? (
        <Loading message="Loading notes..." />
      ) : (
        <NoteList
          notes={data?.items || []}
          total={data?.total || 0}
          page={page}
          limit={12}
          onPageChange={setPage}
          onCreateClick={() => navigate({ to: "/notes/new" })}
        />
      )}
    </div>
  );
}
