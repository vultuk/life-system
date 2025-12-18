import type { Category } from "~/api/categories";
import { Card, CardContent } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";

interface CategoryCardProps {
  category: Category;
  onEdit: () => void;
  onDelete: () => void;
}

export function CategoryCard({ category, onEdit, onDelete }: CategoryCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: category.color || "#6B7280" }}
            />
            <span className="font-medium text-gray-900 dark:text-white">
              {category.name}
            </span>
            {category.icon && (
              <span className="text-gray-500 dark:text-gray-400 text-sm">
                ({category.icon})
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={onEdit}>
              Edit
            </Button>
            <Button size="sm" variant="danger" onClick={onDelete}>
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
