"use client";

import { useQuery } from "@tanstack/react-query";
import type { CategoriesResponse, Category } from "@/lib/types/category";

async function fetchCategories(): Promise<CategoriesResponse> {
  const res = await fetch("/api/categories");
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to fetch categories");
  }
  return res.json();
}

/**
 * Fetches and caches the canonical category taxonomy from `/api/categories`.
 *
 * The taxonomy is static, so it is cached aggressively (no refetch on focus and
 * a long stale time). Components derive dropdown options, validation, and counts
 * from this single source.
 */
export function useCategories() {
  return useQuery<CategoriesResponse>({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: 1000 * 60 * 60, // 1 hour — taxonomy rarely changes within a session
    refetchOnWindowFocus: false,
  });
}

// ---------------------------------------------------------------------------
// Pure helpers for working with a loaded category list (client-side).
// ---------------------------------------------------------------------------

export function findCategory(
  categories: Category[],
  key: string
): Category | undefined {
  return categories.find((c) => c.key === key);
}

export function getSubcategories(
  categories: Category[],
  categoryKey: string
): string[] {
  return findCategory(categories, categoryKey)?.subcategories ?? [];
}

export function isValidCategory(
  categories: Category[],
  categoryKey: string
): boolean {
  return categories.some((c) => c.key === categoryKey);
}

export function isValidSubcategory(
  categories: Category[],
  categoryKey: string,
  subcategory: string
): boolean {
  return getSubcategories(categories, categoryKey).includes(subcategory);
}
