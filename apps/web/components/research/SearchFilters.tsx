"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CategoryDropdown } from "@/components/taxonomy/CategoryDropdown";
import { SubcategoryDropdown } from "@/components/taxonomy/SubcategoryDropdown";

export interface SearchFiltersValue {
  category: string;
  subcategory: string;
  tag: string;
  from: string;
  to: string;
  sort: string;
}

interface SearchFiltersProps {
  value: SearchFiltersValue;
  onChange: (value: SearchFiltersValue) => void;
  onReset: () => void;
  /** When false, hides the relevance option (e.g. plain browse mode). */
  showRelevance?: boolean;
}

/** Faceted filter controls for source search / browse. */
export function SearchFilters({
  value,
  onChange,
  onReset,
  showRelevance = true,
}: SearchFiltersProps) {
  const set = (patch: Partial<SearchFiltersValue>) =>
    onChange({ ...value, ...patch });

  return (
    <div className="grid grid-cols-1 gap-4 rounded-md border p-4 sm:grid-cols-2 lg:grid-cols-3">
      <div className="space-y-1.5">
        <Label htmlFor="filter-category">Category</Label>
        <CategoryDropdown
          id="filter-category"
          value={value.category}
          onChange={(category) => set({ category, subcategory: "" })}
          placeholder="All categories"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="filter-subcategory">Subcategory</Label>
        <SubcategoryDropdown
          id="filter-subcategory"
          category={value.category}
          value={value.subcategory}
          onChange={(subcategory) => set({ subcategory })}
          placeholder="All subcategories"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="filter-tag">Tag</Label>
        <Input
          id="filter-tag"
          value={value.tag}
          onChange={(e) => set({ tag: e.target.value })}
          placeholder="e.g. machine-learning"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="filter-from">Accessed from</Label>
        <Input
          id="filter-from"
          type="date"
          value={value.from}
          onChange={(e) => set({ from: e.target.value })}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="filter-to">Accessed to</Label>
        <Input
          id="filter-to"
          type="date"
          value={value.to}
          onChange={(e) => set({ to: e.target.value })}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="filter-sort">Sort</Label>
        <Select
          id="filter-sort"
          value={value.sort}
          onChange={(e) => set({ sort: e.target.value })}
        >
          {showRelevance && <option value="relevance">Relevance</option>}
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
        </Select>
      </div>

      <div className="flex items-end sm:col-span-2 lg:col-span-3">
        <Button type="button" variant="ghost" onClick={onReset}>
          Reset filters
        </Button>
      </div>
    </div>
  );
}
