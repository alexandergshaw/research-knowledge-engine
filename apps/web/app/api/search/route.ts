import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PAGE_SIZE } from "@/lib/constants";

/**
 * GET /api/search
 *
 * Deterministic Postgres full-text search over sources via the
 * `search_sources` SQL function. NO AI — relevance is `ts_rank` only.
 *
 * Query params:
 *   keyword      free-text query (websearch syntax)
 *   category     exact category filter
 *   subcategory  exact subcategory filter
 *   tag          tag membership filter
 *   from / to    accessed_at date range (ISO date)
 *   sort         relevance (default) | newest | oldest
 *   page         1-based page number (default 1)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get("page") ?? "1", 10) || 1, 1);
    const keyword = searchParams.get("keyword")?.trim() || null;
    const category = searchParams.get("category")?.trim() || null;
    const subcategory = searchParams.get("subcategory")?.trim() || null;
    const tag = searchParams.get("tag")?.trim() || null;
    const from = searchParams.get("from")?.trim() || null;
    const to = searchParams.get("to")?.trim() || null;
    const sort = searchParams.get("sort") ?? "relevance";

    const supabase = await createClient();
    const offset = (page - 1) * PAGE_SIZE;

    const { data, error } = await supabase.rpc("search_sources", {
      keyword,
      category_filter: category,
      subcategory_filter: subcategory,
      tag_filter: tag,
      from_date: from,
      to_date: to,
      sort_order: sort,
      page_limit: PAGE_SIZE,
      page_offset: offset,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = (data ?? []) as Array<Record<string, unknown>>;
    const count = rows.length > 0 ? Number(rows[0].total_count ?? 0) : 0;
    // Strip the window-function helper column from the response payload.
    const results = rows.map((row) => {
      const rest = { ...row };
      delete rest.total_count;
      return rest;
    });

    return NextResponse.json({ data: results, count });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
