import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ReportSourceSummary } from "@/lib/types/database";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/reports/[id]/sources
 *
 * Returns the sources used to build a report, ordered by rank (via
 * report_sources). Falls back to the report's source_ids array when no
 * report_sources rows exist (older reports created before traceability).
 */
export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const reportId = parseInt(id, 10);

    if (Number.isNaN(reportId)) {
      return NextResponse.json({ error: "Invalid report id" }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: links, error: linksError } = await supabase
      .from("report_sources")
      .select("rank, sources(id, title, url, domain, category)")
      .eq("report_id", reportId)
      .order("rank", { ascending: true });

    if (linksError) {
      return NextResponse.json({ error: linksError.message }, { status: 500 });
    }

    let sources: ReportSourceSummary[] = (links ?? [])
      .map((link: Record<string, unknown>) => {
        const src = link.sources as
          | {
              id: number;
              title: string;
              url: string;
              domain: string;
              category: string | null;
            }
          | null;
        if (!src) return null;
        return {
          id: src.id,
          title: src.title,
          url: src.url,
          domain: src.domain,
          category: src.category,
          rank: (link.rank as number | null) ?? null,
        };
      })
      .filter((s): s is ReportSourceSummary => s !== null);

    // Fallback for legacy reports without report_sources rows.
    if (sources.length === 0) {
      const { data: report } = await supabase
        .from("research_reports")
        .select("source_ids")
        .eq("id", reportId)
        .single();

      const sourceIds = (report?.source_ids as number[] | null) ?? [];
      if (sourceIds.length > 0) {
        const { data: rows } = await supabase
          .from("sources")
          .select("id, title, url, domain, category")
          .in("id", sourceIds);
        sources = (rows ?? []).map((src) => ({
          id: src.id,
          title: src.title,
          url: src.url,
          domain: src.domain,
          category: src.category,
          rank: null,
        }));
      }
    }

    return NextResponse.json({ data: sources });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
