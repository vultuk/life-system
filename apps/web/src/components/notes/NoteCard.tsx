import { Link } from "@tanstack/react-router";
import { Card, CardContent } from "~/components/ui/Card";
import { Badge } from "~/components/ui/Badge";
import type { Note } from "~/api/notes";
import { formatRelativeDate } from "~/utils/dates";

interface NoteCardProps {
  note: Note;
}

export function NoteCard({ note }: NoteCardProps) {
  return (
    <Link to="/notes/$noteId" params={{ noteId: note.id }}>
      <Card hover className="h-full">
        <CardContent>
          <h3 className="font-medium text-gray-900 dark:text-white line-clamp-1">
            {note.title}
          </h3>

          {note.content && (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 line-clamp-3">
              {note.content}
            </p>
          )}

          <div className="mt-3 flex items-center justify-between">
            <div className="flex flex-wrap gap-1">
              {note.tags?.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="primary" size="sm">
                  {tag}
                </Badge>
              ))}
              {note.tags && note.tags.length > 3 && (
                <Badge variant="default" size="sm">
                  +{note.tags.length - 3}
                </Badge>
              )}
            </div>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {formatRelativeDate(note.updatedAt)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
