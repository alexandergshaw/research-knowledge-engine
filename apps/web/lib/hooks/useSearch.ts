"use client";

import { useQuery as useReactQuery } from "@tanstack/react-query";
import type { SearchResult } from "@/lib/types/database";

export interface SearchParams {
  keyword?: string;
  category?: string;
  subcategory?: string;
  tag?: string;
  from?: string;
  to?: string;
  sort?: string;
  page?: number;
}

export interface SearchResponse {
  data: SearchResult[];
  count: number;
}

function buildParams(params: SearchParams): string {
  const sp = new URLSearchParams();
  sp.set("page", String(params.page ?? 1));
  if (params.keyword) sp.set("keyword", params.keyword);
  if (params.category) sp.set("category", params.category);
  if (params.subcategory) sp.set("subcategory", params.subcategory);
  if (params.tag) sp.set("tag", params.tag);
  if (params.from) sp.set("from", params.from);
  if (params.to) sp.set("to", params.to);
  if (params.sort) sp.set("sort", params.sort);
  return sp.toString();
}

/** Determines whether any search criteria are active. */
function hasCriteria(params: SearchParams): boolean {
  return Boolean(
    params.keyword ||
      params.category ||
      params.subcategory ||
      params.tag ||
      params.from ||
      params.to
  );
}

/**
 * Full-text source search. Only runs when at least one criterion is set, so an
 * empty search page does not fetch the entire corpus.
 */
export function useSearch(params: SearchParams) {
  return useReactQuery<SearchResponse>({
    queryKey: ["search", params],
    queryFn: async () => {
      const res = await fetch(`/api/search?${buildParams(params)}`);
      if (!res.ok) throw new Error("Search request failed");
      return res.json();
    },
    enabled: hasCriteria(params),
  });
}
