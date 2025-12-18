import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "~/components/layout/PageHeader";
import { Button } from "~/components/ui/Button";
import { Card, CardContent } from "~/components/ui/Card";
import { Modal } from "~/components/ui/Modal";
import { Loading } from "~/components/ui/Spinner";
import { EmptyState } from "~/components/ui/EmptyState";
import { CategoryCard } from "~/components/categories/CategoryCard";
import { CategoryForm, type CategoryFormData } from "~/components/categories/CategoryForm";
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "~/hooks/useCategories";
import type { Category } from "~/api/categories";

export const Route = createFileRoute("/categories/")({
  component: CategoriesPage,
});

function CategoriesPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  const { data: categoriesResponse, isLoading } = useCategories({ limit: 100 });
  const categories = categoriesResponse?.data ?? [];

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const handleCreate = (data: CategoryFormData) => {
    createCategory.mutate(data, {
      onSuccess: () => setIsCreating(false),
    });
  };

  const handleUpdate = (data: CategoryFormData) => {
    if (!editingCategory) return;
    updateCategory.mutate(
      { id: editingCategory.id, ...data },
      { onSuccess: () => setEditingCategory(null) }
    );
  };

  const handleDelete = () => {
    if (!deletingCategory) return;
    deleteCategory.mutate(deletingCategory.id, {
      onSuccess: () => setDeletingCategory(null),
    });
  };

  if (isLoading) {
    return <Loading message="Loading categories..." />;
  }

  return (
    <div>
      <PageHeader
        title="Categories"
        description="Organize your tasks, notes, habits, and contacts"
        action={
          <Button onClick={() => setIsCreating(true)}>Add Category</Button>
        }
      />

      {isCreating && (
        <Card className="max-w-xl mb-6">
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              New Category
            </h3>
            <CategoryForm
              onSubmit={handleCreate}
              onCancel={() => setIsCreating(false)}
              isLoading={createCategory.isPending}
            />
          </CardContent>
        </Card>
      )}

      {editingCategory && (
        <Card className="max-w-xl mb-6">
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Edit Category
            </h3>
            <CategoryForm
              category={editingCategory}
              onSubmit={handleUpdate}
              onCancel={() => setEditingCategory(null)}
              isLoading={updateCategory.isPending}
            />
          </CardContent>
        </Card>
      )}

      {categories.length === 0 ? (
        <EmptyState
          title="No categories yet"
          description="Create categories to organize your items"
          action={
            <Button onClick={() => setIsCreating(true)}>
              Create Your First Category
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onEdit={() => setEditingCategory(category)}
              onDelete={() => setDeletingCategory(category)}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={!!deletingCategory}
        onClose={() => setDeletingCategory(null)}
        title="Delete Category"
      >
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Are you sure you want to delete "{deletingCategory?.name}"? Items in
          this category will not be deleted but will no longer be categorized.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeletingCategory(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            isLoading={deleteCategory.isPending}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
