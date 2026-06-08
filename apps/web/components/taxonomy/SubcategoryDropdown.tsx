"use client";

import { Select } from "@/components/ui/select";
import { useCategories, getSubcategories } from "@/lib/hooks/useCategories";

interface SubcategoryDropdownProps {
  /** The currently selected category key. Drives the available options. */
  category: string;
  value: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * Self-contained subcategory <select> whose options depend on the selected
 * category. Disabled until a category is chosen so invalid combinations cannot
 * be selected.
 */
export function SubcategoryDropdown({
  category,
  value,
  onChange,
  id = "subcategory",
  placeholder = "Select a subcategory",
  disabled = false,
}: SubcategoryDropdownProps) {
  const { data, isLoading, isError } = useCategories();
  const categories = data?.categories ?? [];
  const subcategories = getSubcategories(categories, category);

  if (isError) {
    return (
      <p className="text-sm text-destructive">Failed to load subcategories.</p>
    );
  }

  const noCategory = !category;

  return (
    <Select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled || isLoading || noCategory}
    >
      <option value="">
        {isLoading
          ? "Loading…"
          : noCategory
            ? "Select a category first"
            : placeholder}
      </option>
      {subcategories.map((sub) => (
        <option key={sub} value={sub}>
          {sub}
        </option>
      ))}
    </Select>
  );
}
