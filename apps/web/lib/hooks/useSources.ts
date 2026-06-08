"use client";

import { useQuery as useReactQuery } from "@tanstack/react-query";
import type {
  Source,
  SourceWithReports,
  ReportSourceSummary,
} from "@/lib/types/database";

export interface SourcesParams {
  page?: number;
  search?: string;
  category?: string;
  subcategory?: string;
  tag?: string;
  from?: string;
  to?: string;
  sort?: string;
}

export interface SourcesResponse {
  data: Source[];
  count: number;
}

function buildParams(params: SourcesParams): string {
  const sp = new URLSearchParams();
  sp.set("page", String(params.page ?? 1));
  if (params.search) sp.set("search", params.search);
  if (params.category) sp.set("category", params.category);
  if (params.subcategory) sp.set("subcategory", params.subcategory);
  if (params.tag) sp.set("tag", params.tag);
  if (params.from) sp.set("from", params.from);
  if (params.to) sp.set("to", params.to);
  if (params.sort) sp.set("sort", params.sort);
  return sp.toString();
}

/** Lists sources with filtering, sorting, and pagination. */
export function useSources(params: SourcesParams) {
  return useReactQuery<SourcesResponse>({
    queryKey: ["sources", "list", params],
    queryFn: async () => {
      const res = await fetch(`/api/sources?${buildParams(params)}`);
      if (!res.ok) throw new Error("Failed to fetch sources");
      return res.json();
    },
  });
}

/** Fetches a single source plus the reports it was used in. */
export function useSource(id: string | number | undefined) {
  return useReactQuery<SourceWithReports>({
    queryKey: ["sources", "detail", id],
    queryFn: async () => {
      const res = await fetch(`/api/sources/${id}`);
      if (!res.ok) throw new Error("Failed to fetch source");
      return res.json();
    },
    enabled: id !== undefined && id !== "",
  });
}

/** Fetches the sources used to build a report. */
export function useReportSources(id: string | number | undefined) {
  return useReactQuery<{ data: ReportSourceSummary[] }>({
    queryKey: ["reports", "sources", id],
    queryFn: async () => {
      const res = await fetch(`/api/reports/${id}/sources`);
      if (!res.ok) throw new Error("Failed to fetch report sources");
      return res.json();
    },
    enabled: id !== undefined && id !== "",
  });
}
