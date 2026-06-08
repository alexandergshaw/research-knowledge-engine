import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PAGE_SIZE } from "@/lib/constants";

/**
 * GET /api/sources
 *
 * Browse stored sources with optional filtering and sorting.
 *
 * Query params:
 *   page         1-based page number (default 1)
 *   search       substring match on title/domain (ilike)
 *   category     exact category match
 *   subcategory  exact subcategory match
 *   tag          tag membership (array contains)
 *   from / to    accessed_at date range (ISO date)
 *   sort         newest (default) | oldest | title
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get("page") ?? "1", 10) || 1, 1);
    const search = searchParams.get("search") ?? "";
    const category = searchParams.get("category") ?? "";
    const subcategory = searchParams.get("subcategory") ?? "";
    const tag = searchParams.get("tag") ?? "";
    const from = searchParams.get("from") ?? "";
    const to = searchParams.get("to") ?? "";
    const sort = searchParams.get("sort") ?? "newest";

    const supabase = await createClient();
    const offset = (page - 1) * PAGE_SIZE;
    const rangeEnd = offset + PAGE_SIZE - 1;

    let query = supabase
      .from("sources")
      .select("*", { count: "exact" })
      .range(offset, rangeEnd);

    if (sort === "oldest") {
      query = query.order("accessed_at", { ascending: true });
    } else if (sort === "title") {
      query = query.order("title", { ascending: true });
    } else {
      query = query.order("accessed_at", { ascending: false });
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,domain.ilike.%${search}%`);
    }
    if (category) {
      query = query.eq("category", category);
    }
    if (subcategory) {
      query = query.eq("subcategory", subcategory);
    }
    if (tag) {
      query = query.contains("tags", [tag]);
    }
    if (from) {
      query = query.gte("accessed_at", from);
    }
    if (to) {
      query = query.lte("accessed_at", to);
    }

    const { data, count, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data ?? [], count: count ?? 0 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
