import { useState } from "react";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";
import type { Category, CreateCategoryInput } from "~/api/categories";

export type CategoryFormData = CreateCategoryInput;

interface CategoryFormProps {
  category?: Category;
  onSubmit: (data: CategoryFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const colorOptions = [
  { value: "#EF4444", label: "Red" },
  { value: "#F97316", label: "Orange" },
  { value: "#F59E0B", label: "Amber" },
  { value: "#EAB308", label: "Yellow" },
  { value: "#84CC16", label: "Lime" },
  { value: "#22C55E", label: "Green" },
  { value: "#10B981", label: "Emerald" },
  { value: "#14B8A6", label: "Teal" },
  { value: "#06B6D4", label: "Cyan" },
  { value: "#0EA5E9", label: "Sky" },
  { value: "#3B82F6", label: "Blue" },
  { value: "#6366F1", label: "Indigo" },
  { value: "#8B5CF6", label: "Violet" },
  { value: "#A855F7", label: "Purple" },
  { value: "#D946EF", label: "Fuchsia" },
  { value: "#EC4899", label: "Pink" },
];

export function CategoryForm({
  category,
  onSubmit,
  onCancel,
  isLoading,
}: CategoryFormProps) {
  const [name, setName] = useState(category?.name || "");
  const [color, setColor] = useState(category?.color || "#3B82F6");
  const [icon, setIcon] = useState(category?.icon || "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Name is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const data: CategoryFormData = {
      name: name.trim(),
      color: color || undefined,
      icon: icon.trim() || undefined,
    };

    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        placeholder="Enter category name"
        required
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Color
        </label>
        <div className="flex flex-wrap gap-2">
          {colorOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setColor(option.value)}
              className={`w-8 h-8 rounded-full border-2 transition-all ${
                color === option.value
                  ? "border-gray-900 dark:border-white scale-110"
                  : "border-transparent hover:scale-105"
              }`}
              style={{ backgroundColor: option.value }}
              title={option.label}
            />
          ))}
        </div>
      </div>

      <Input
        label="Icon (optional)"
        value={icon}
        onChange={(e) => setIcon(e.target.value)}
        placeholder="e.g., folder, tag, star"
      />

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {category ? "Update Category" : "Create Category"}
        </Button>
      </div>
    </form>
  );
}
