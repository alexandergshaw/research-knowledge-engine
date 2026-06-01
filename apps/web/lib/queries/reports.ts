import { createClient } from "@/lib/supabase/client";
import type { ResearchReport } from "@/lib/types/database";
import { PAGE_SIZE } from "@/lib/constants";

export async function getReports({
  page = 1,
}: {
  page?: number;
} = {}): Promise<{ data: ResearchReport[]; count: number }> {
  const supabase = createClient();
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, count, error } = await supabase
    .from("research_reports")
    .select("id, query, title, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw error;
  return { data: (data as ResearchReport[]) ?? [], count: count ?? 0 };
}

export async function getReportById(id: number): Promise<ResearchReport | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("research_reports")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export const reportQueryKeys = {
  all: ["reports"] as const,
  list: (params: { page?: number }) => ["reports", "list", params] as const,
  detail: (id: number) => ["reports", "detail", id] as const,
};
