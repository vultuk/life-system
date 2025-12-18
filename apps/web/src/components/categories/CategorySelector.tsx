import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "~/utils/cn";
import { useCategories } from "~/hooks/useCategories";

export interface CategorySelectorProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "value" | "onChange"> {
  label?: string;
  error?: string;
  value: string | null | undefined;
  onChange: (categoryId: string | null) => void;
  showNone?: boolean;
}

const CategorySelector = forwardRef<HTMLSelectElement, CategorySelectorProps>(
  (
    {
      className,
      label,
      error,
      id,
      value,
      onChange,
      showNone = true,
      ...props
    },
    ref
  ) => {
    const { data: categoriesResponse, isLoading } = useCategories({ limit: 100 });
    const categories = categoriesResponse?.items ?? [];

    const inputId = id || label?.toLowerCase().replace(/\s/g, "-") || "category";

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newValue = e.target.value;
      onChange(newValue === "" ? null : newValue);
    };

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          value={value ?? ""}
          onChange={handleChange}
          disabled={isLoading}
          className={cn(
            "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors",
            error
              ? "border-red-500 focus:ring-red-500"
              : "border-gray-300 dark:border-gray-600",
            "dark:bg-gray-800 dark:text-white",
            isLoading && "opacity-50 cursor-wait",
            className
          )}
          {...props}
        >
          {showNone && <option value="">None</option>}
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        {error && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

CategorySelector.displayName = "CategorySelector";

export { CategorySelector };
