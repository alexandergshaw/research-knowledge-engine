import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PAGE_SIZE } from "@/lib/constants";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const search = searchParams.get("search")?.trim() ?? "";
    const sort = searchParams.get("sort") ?? "created_at";
    const dir = searchParams.get("dir") === "asc" ? "asc" : "desc";

    const allowedSort = new Set(["title", "query", "created_at"]);
    const sortColumn = allowedSort.has(sort) ? sort : "created_at";

    const supabase = await createClient();
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from("research_reports")
      .select("id, query, title, created_at", { count: "exact" })
      .order(sortColumn, { ascending: dir === "asc" })
      .range(from, to);

    if (search) {
      query = query.or(`title.ilike.%${search}%,query.ilike.%${search}%`);
    }

    const { data, count, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data ?? [], count: count ?? 0 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
