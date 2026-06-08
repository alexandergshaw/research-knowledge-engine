import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { savedQuerySchema } from "@/lib/validation/schemas";
import type { RelatedReport } from "@/lib/types/database";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/queries/[id]
 *
 * Returns a single saved query plus its related reports (resolved through the
 * `query_results` join table, ordered newest first).
 */
export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: queryRow, error: queryError } = await supabase
      .from("saved_queries")
      .select("*")
      .eq("id", id)
      .single();

    if (queryError || !queryRow) {
      return NextResponse.json({ error: "Query not found" }, { status: 404 });
    }

    // Resolve related reports via the query_results join table.
    const { data: links, error: linksError } = await supabase
      .from("query_results")
      .select("report_id, created_at, research_reports(id, title, created_at)")
      .eq("saved_query_id", id)
      .order("created_at", { ascending: false });

    if (linksError) {
      return NextResponse.json({ error: linksError.message }, { status: 500 });
    }

    const reports: RelatedReport[] = (links ?? [])
      .map((link) => {
        const report = link.research_reports as unknown as RelatedReport | null;
        if (!report) return null;
        return {
          id: report.id,
          title: report.title,
          created_at: report.created_at,
        };
      })
      .filter((r): r is RelatedReport => r !== null);

    return NextResponse.json({ query: queryRow, reports });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/queries/[id]
 *
 * Updates a saved query. Supports editing from the detail page.
 */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
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
      .update({
        title,
        query,
        category: category || null,
        subcategory: subcategory || null,
        active,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
