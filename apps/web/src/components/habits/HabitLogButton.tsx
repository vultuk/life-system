import { cn } from "~/utils/cn";

interface HabitLogButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  size?: "sm" | "md";
}

export function HabitLogButton({
  onClick,
  isLoading = false,
  size = "md",
}: HabitLogButtonProps) {
  const sizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
  };

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      disabled={isLoading}
      className={cn(
        "flex-shrink-0 rounded-full bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 transition-colors flex items-center justify-center",
        sizes[size],
        isLoading && "opacity-50 cursor-not-allowed"
      )}
      title="Log completion"
    >
      {isLoading ? (
        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      )}
    </button>
  );
}
