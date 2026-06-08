import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** Convert an array of source rows to a CSV string. */
function sourcesToCsv(
  sources: Array<{ id: number; title: string; url: string; domain: string; rank: number | null }>
): string {
  const header = ["rank", "id", "title", "domain", "url"];
  const escape = (value: unknown) => {
    const str = String(value ?? "");
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };
  const rows = sources.map((s) =>
    [s.rank ?? "", s.id, s.title, s.domain, s.url].map(escape).join(",")
  );
  return [header.join(","), ...rows].join("\n");
}

/**
 * GET /api/reports/[id]/export?format=md|json|csv
 *
 * Exports a report. `md` returns the Markdown body, `json` the full report
 * with its sources, and `csv` the list of sources used. All deterministic —
 * no AI involved.
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const reportId = parseInt(id, 10);

    if (Number.isNaN(reportId)) {
      return NextResponse.json({ error: "Invalid report id" }, { status: 400 });
    }

    const format = (
      new URL(request.url).searchParams.get("format") ?? "md"
    ).toLowerCase();

    const supabase = await createClient();
    const { data: report, error } = await supabase
      .from("research_reports")
      .select("*")
      .eq("id", reportId)
      .single();

    if (error || !report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const { data: links } = await supabase
      .from("report_sources")
      .select("rank, sources(id, title, url, domain)")
      .eq("report_id", reportId)
      .order("rank", { ascending: true });

    const sources = (links ?? [])
      .map((link: Record<string, unknown>) => {
        const src = link.sources as
          | { id: number; title: string; url: string; domain: string }
          | null;
        if (!src) return null;
        return { ...src, rank: (link.rank as number | null) ?? null };
      })
      .filter(
        (s): s is { id: number; title: string; url: string; domain: string; rank: number | null } =>
          s !== null
      );

    const baseName = `report-${reportId}`;
    const body = (report.markdown as string | null) ?? (report.content as string) ?? "";

    if (format === "json") {
      const payload = JSON.stringify({ ...report, sources }, null, 2);
      return new NextResponse(payload, {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${baseName}.json"`,
        },
      });
    }

    if (format === "csv") {
      return new NextResponse(sourcesToCsv(sources), {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${baseName}-sources.csv"`,
        },
      });
    }

    if (format === "md" || format === "markdown") {
      return new NextResponse(body, {
        headers: {
          "Content-Type": "text/markdown",
          "Content-Disposition": `attachment; filename="${baseName}.md"`,
        },
      });
    }

    return NextResponse.json(
      { error: `Unsupported format: ${format} (use md, json, or csv)` },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
