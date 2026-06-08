import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { savedQuerySchema } from "@/lib/validation/schemas";
import { PAGE_SIZE } from "@/lib/constants";

/**
 * GET /api/queries
 *
 * Lists saved queries with optional search, category filter, active filter,
 * sorting, and pagination.
 *
 * Query params:
 *   - page:     1-based page number (default 1)
 *   - search:   matches title or query text (case-insensitive)
 *   - category: exact category key filter
 *   - active:   "true" | "false" filter
 *   - sort:     column to order by (default created_at)
 *   - dir:      "asc" | "desc" (default desc)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const search = searchParams.get("search")?.trim() ?? "";
    const category = searchParams.get("category") ?? "";
    const active = searchParams.get("active") ?? "";
    const sort = searchParams.get("sort") ?? "created_at";
    const dir = searchParams.get("dir") === "asc" ? "asc" : "desc";

    const allowedSort = new Set([
      "title",
      "category",
      "subcategory",
      "active",
      "created_at",
    ]);
    const sortColumn = allowedSort.has(sort) ? sort : "created_at";

    const supabase = await createClient();
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from("saved_queries")
      .select("*", { count: "exact" })
      .order(sortColumn, { ascending: dir === "asc" })
      .range(from, to);

    if (search) {
      query = query.or(`title.ilike.%${search}%,query.ilike.%${search}%`);
    }
    if (category) {
      query = query.eq("category", category);
    }
    if (active === "true" || active === "false") {
      query = query.eq("active", active === "true");
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

/**
 * POST /api/queries
 *
 * Creates a saved query. Returns the inserted row.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = savedQuerySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { title, query, category, subcategory, active } = parsed.data;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("saved_queries")
      .insert({
        title,
        query,
        category: category || null,
        subcategory: subcategory || null,
        active,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
