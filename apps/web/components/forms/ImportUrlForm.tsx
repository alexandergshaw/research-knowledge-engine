"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CategoryDropdown } from "@/components/taxonomy/CategoryDropdown";
import { SubcategoryDropdown } from "@/components/taxonomy/SubcategoryDropdown";
import { useCategories, isValidSubcategory } from "@/lib/hooks/useCategories";

interface ImportPayload {
  url: string;
  category?: string;
  subcategory?: string;
  tags?: string;
}

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export function ImportUrlForm() {
  const { data: categoriesData } = useCategories();
  const categories = categoriesData?.categories ?? [];

  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [tags, setTags] = useState("");
  const [touched, setTouched] = useState(false);

  // When the category changes, clear any subcategory that no longer belongs to
  // it so an invalid combination can never persist.
  useEffect(() => {
    if (subcategory && !isValidSubcategory(categories, category, subcategory)) {
      setSubcategory("");
    }
  }, [category, subcategory, categories]);

  const urlError = touched && !isValidUrl(url) ? "Please enter a valid URL." : null;
  const comboError =
    subcategory && !isValidSubcategory(categories, category, subcategory)
      ? `"${subcategory}" is not a subcategory of "${category}".`
      : null;
  const canSubmit = isValidUrl(url) && !comboError;

  const mutation = useMutation({
    mutationFn: async (values: ImportPayload) => {
      const res = await fetch("/api/import-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error ?? "Failed to create import job");
      }
      return res.json();
    },
    onSuccess: () => {
      setUrl("");
      setCategory("");
      setSubcategory("");
      setTags("");
      setTouched(false);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!canSubmit) return;
    mutation.mutate({
      url,
      category: category || undefined,
      subcategory: subcategory || undefined,
      tags: tags || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="url">URL *</Label>
        <Input
          id="url"
          type="url"
          placeholder="https://example.com/article"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onBlur={() => setTouched(true)}
        />
        {urlError && <p className="text-sm text-destructive">{urlError}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <CategoryDropdown value={category} onChange={setCategory} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="subcategory">Subcategory</Label>
        <SubcategoryDropdown
          category={category}
          value={subcategory}
          onChange={setSubcategory}
        />
        {comboError ? (
          <p className="text-sm text-destructive">{comboError}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Options update automatically based on the selected category.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Tags</Label>
        <Input
          id="tags"
          placeholder="comma-separated tags (e.g. ai, nlp, paper)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Separate multiple tags with commas
        </p>
      </div>

      {mutation.isSuccess && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-800 dark:bg-green-950/40 dark:text-green-400">
          ✓ Import job created successfully. Check the Jobs page for status.
        </div>
      )}

      {mutation.isError && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {mutation.error?.message ?? "An error occurred"}
        </div>
      )}

      <Button type="submit" disabled={mutation.isPending || !canSubmit}>
        {mutation.isPending ? "Submitting…" : "Submit Import Job"}
      </Button>
    </form>
  );
}
