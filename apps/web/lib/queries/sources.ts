import { createClient } from "@/lib/supabase/client";
import type { Source } from "@/lib/types/database";
import { PAGE_SIZE } from "@/lib/constants";

export async function getSources({
  page = 1,
  search = "",
  category = "",
}: {
  page?: number;
  search?: string;
  category?: string;
} = {}): Promise<{ data: Source[]; count: number }> {
  const supabase = createClient();
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("sources")
    .select("*", { count: "exact" })
    .order("accessed_at", { ascending: false })
    .range(from, to);

  if (search) {
    query = query.or(`title.ilike.%${search}%,domain.ilike.%${search}%`);
  }

  if (category) {
    query = query.eq("category", category);
  }

  const { data, count, error } = await query;
  if (error) throw error;

  return { data: data ?? [], count: count ?? 0 };
}

export async function getSourceById(id: number): Promise<Source | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("sources")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export const sourceQueryKeys = {
  all: ["sources"] as const,
  list: (params: { page?: number; search?: string; category?: string }) =>
    ["sources", "list", params] as const,
  detail: (id: number) => ["sources", "detail", id] as const,
};
