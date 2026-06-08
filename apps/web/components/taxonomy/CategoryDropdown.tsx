"use client";

import { Select } from "@/components/ui/select";
import { useCategories } from "@/lib/hooks/useCategories";

interface CategoryDropdownProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * Self-contained category <select>. Loads options from the taxonomy and handles
 * loading and error states internally.
 */
export function CategoryDropdown({
  value,
  onChange,
  id = "category",
  placeholder = "Select a category",
  disabled = false,
}: CategoryDropdownProps) {
  const { data, isLoading, isError } = useCategories();
  const categories = data?.categories ?? [];

  if (isError) {
    return (
      <p className="text-sm text-destructive">Failed to load categories.</p>
    );
  }

  return (
    <Select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled || isLoading}
    >
      <option value="">{isLoading ? "Loading…" : placeholder}</option>
      {categories.map((category) => (
        <option key={category.key} value={category.key}>
          {category.name}
        </option>
      ))}
    </Select>
  );
}
