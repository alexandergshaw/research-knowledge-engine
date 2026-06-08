"use client";

import { useQuery as useReactQuery } from "@tanstack/react-query";
import type { SavedQuery, RelatedReport } from "@/lib/types/database";

export interface QueriesParams {
  page?: number;
  search?: string;
  category?: string;
  active?: "" | "true" | "false";
  sort?: string;
  dir?: "asc" | "desc";
}

export interface QueriesResponse {
  data: SavedQuery[];
  count: number;
}

export interface QueryDetailResponse {
  query: SavedQuery;
  reports: RelatedReport[];
}

function buildParams(params: QueriesParams): string {
  const sp = new URLSearchParams();
  sp.set("page", String(params.page ?? 1));
  if (params.search) sp.set("search", params.search);
  if (params.category) sp.set("category", params.category);
  if (params.active) sp.set("active", params.active);
  if (params.sort) sp.set("sort", params.sort);
  if (params.dir) sp.set("dir", params.dir);
  return sp.toString();
}

/** Lists saved queries with search, filtering, sorting, and pagination. */
export function useQueries(params: QueriesParams) {
  return useReactQuery<QueriesResponse>({
    queryKey: ["queries", "list", params],
    queryFn: async () => {
      const res = await fetch(`/api/queries?${buildParams(params)}`);
      if (!res.ok) throw new Error("Failed to fetch queries");
      return res.json();
    },
  });
}

/** Fetches a single saved query and its related reports. */
export function useQuery(id: string | undefined) {
  return useReactQuery<QueryDetailResponse>({
    queryKey: ["queries", "detail", id],
    queryFn: async () => {
      const res = await fetch(`/api/queries/${id}`);
      if (!res.ok) throw new Error("Failed to fetch query");
      return res.json();
    },
    enabled: Boolean(id),
  });
}
