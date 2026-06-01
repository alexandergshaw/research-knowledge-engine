import { createClient } from "@/lib/supabase/client";
import type { Job } from "@/lib/types/database";
import { PAGE_SIZE } from "@/lib/constants";

export async function getJobs({
  page = 1,
  status = "",
}: {
  page?: number;
  status?: string;
} = {}): Promise<{ data: Job[]; count: number }> {
  const supabase = createClient();
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("jobs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, count, error } = await query;
  if (error) throw error;

  return { data: data ?? [], count: count ?? 0 };
}

export async function createJob(
  job: Pick<Job, "job_type" | "payload">
): Promise<Job> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("jobs")
    .insert({ ...job, status: "pending" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export const jobQueryKeys = {
  all: ["jobs"] as const,
  list: (params: { page?: number; status?: string }) =>
    ["jobs", "list", params] as const,
};
