import { createClient } from "@/lib/supabase/client";
import type { Feed } from "@/lib/types/database";

export async function getFeeds(): Promise<Feed[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("feeds")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createFeed(
  feed: Omit<Feed, "id" | "created_at" | "last_fetched_at">
): Promise<Feed> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("feeds")
    .insert(feed)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateFeed(
  id: number,
  feed: Partial<Omit<Feed, "id" | "created_at">>
): Promise<Feed> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("feeds")
    .update(feed)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteFeed(id: number): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("feeds").delete().eq("id", id);
  if (error) throw error;
}

export const feedQueryKeys = {
  all: ["feeds"] as const,
  list: () => ["feeds", "list"] as const,
};
