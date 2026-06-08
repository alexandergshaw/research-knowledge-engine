"use client";

import { CategoryCard } from "@/components/taxonomy/CategoryCard";
import type { Category } from "@/lib/types/category";

interface CategoryListProps {
  categories: Category[];
  isLoading?: boolean;
  isError?: boolean;
  /** Whether each card starts expanded. */
  defaultOpen?: boolean;
  emptyMessage?: string;
  errorMessage?: string;
}

/**
 * Renders a list of {@link CategoryCard}s and handles loading, error, and empty
 * states. Callers pass the (optionally filtered) category list and the query
 * state flags so this component can stay presentational and reusable.
 */
export function CategoryList({
  categories,
  isLoading = false,
  isError = false,
  defaultOpen = false,
  emptyMessage = "No categories match your filters.",
  errorMessage = "Failed to load categories.",
}: CategoryListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3" aria-busy="true">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-lg border bg-muted/40"
          />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-8 text-center text-sm text-destructive">
        {errorMessage}
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="rounded-md border border-dashed px-4 py-12 text-center text-muted-foreground">
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {categories.map((category) => (
        <CategoryCard
          key={category.key}
          category={category}
          defaultOpen={defaultOpen}
        />
      ))}
    </div>
  );
}
