import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { SourceReportSummary } from "@/lib/types/database";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/sources/[id]
 *
 * Returns a single source plus the reports it was used in (via report_sources).
 */
export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const sourceId = parseInt(id, 10);

    if (Number.isNaN(sourceId)) {
      return NextResponse.json({ error: "Invalid source id" }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: source, error: sourceError } = await supabase
      .from("sources")
      .select("*")
      .eq("id", sourceId)
      .single();

    if (sourceError || !source) {
      return NextResponse.json({ error: "Source not found" }, { status: 404 });
    }

    const { data: links, error: linksError } = await supabase
      .from("report_sources")
      .select("rank, research_reports(id, title, created_at)")
      .eq("source_id", sourceId);

    if (linksError) {
      return NextResponse.json({ error: linksError.message }, { status: 500 });
    }

    const reports: SourceReportSummary[] = (links ?? [])
      .map((link: Record<string, unknown>) => {
        const report = link.research_reports as
          | { id: number; title: string; created_at: string }
          | null;
        if (!report) return null;
        return {
          id: report.id,
          title: report.title,
          created_at: report.created_at,
          rank: (link.rank as number | null) ?? null,
        };
      })
      .filter((r): r is SourceReportSummary => r !== null)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));

    return NextResponse.json({ ...source, reports });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
