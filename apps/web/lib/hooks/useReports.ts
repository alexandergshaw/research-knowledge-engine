"use client";

import { useQuery as useReactQuery } from "@tanstack/react-query";
import type { ResearchReport } from "@/lib/types/database";

export interface ReportSummary {
  id: number;
  query: string;
  title: string;
  created_at: string;
}

export interface ReportsParams {
  page?: number;
  search?: string;
  sort?: string;
  dir?: "asc" | "desc";
}

export interface ReportsResponse {
  data: ReportSummary[];
  count: number;
}

function buildParams(params: ReportsParams): string {
  const sp = new URLSearchParams();
  sp.set("page", String(params.page ?? 1));
  if (params.search) sp.set("search", params.search);
  if (params.sort) sp.set("sort", params.sort);
  if (params.dir) sp.set("dir", params.dir);
  return sp.toString();
}

/** Lists research reports with search, sorting, and pagination. */
export function useReports(params: ReportsParams) {
  return useReactQuery<ReportsResponse>({
    queryKey: ["reports", "list", params],
    queryFn: async () => {
      const res = await fetch(`/api/reports?${buildParams(params)}`);
      if (!res.ok) throw new Error("Failed to fetch reports");
      return res.json();
    },
  });
}

/** Fetches a single research report (including markdown). */
export function useReport(id: string | number | undefined) {
  return useReactQuery<ResearchReport>({
    queryKey: ["reports", "detail", id],
    queryFn: async () => {
      const res = await fetch(`/api/reports/${id}`);
      if (!res.ok) throw new Error("Failed to fetch report");
      return res.json();
    },
    enabled: id !== undefined && id !== "",
  });
}
