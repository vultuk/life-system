import { useCategories } from "~/hooks/useCategories";
import { cn } from "~/utils/cn";

interface CategoryFilterProps {
  value: string | undefined;
  onChange: (categoryId: string | undefined) => void;
  className?: string;
}

export function CategoryFilter({ value, onChange, className }: CategoryFilterProps) {
  const { data: categoriesResponse, isLoading } = useCategories({ limit: 100 });
  const categories = categoriesResponse?.data ?? [];

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    onChange(newValue === "" ? undefined : newValue);
  };

  return (
    <select
      value={value ?? ""}
      onChange={handleChange}
      disabled={isLoading}
      className={cn(
        "px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors",
        "border-gray-300 dark:border-gray-600",
        "dark:bg-gray-800 dark:text-white",
        isLoading && "opacity-50 cursor-wait",
        className
      )}
    >
      <option value="">All Categories</option>
      {categories.map((category) => (
        <option key={category.id} value={category.id}>
          {category.name}
        </option>
      ))}
    </select>
  );
}
