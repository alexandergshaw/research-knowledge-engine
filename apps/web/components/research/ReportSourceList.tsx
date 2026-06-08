"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useReportSources } from "@/lib/hooks/useSources";

interface ReportSourceListProps {
  reportId: number | string;
}

/**
 * "Sources Used" panel on a report detail page. Loads the ranked sources for a
 * report (with a legacy source_ids fallback handled by the API).
 */
export function ReportSourceList({ reportId }: ReportSourceListProps) {
  const { data, isLoading, isError } = useReportSources(reportId);
  const sources = data?.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Sources Used</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <p className="text-sm text-muted-foreground">Loading sources…</p>
        )}
        {isError && (
          <p className="text-sm text-destructive">Failed to load sources.</p>
        )}
        {!isLoading && !isError && sources.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No sources were recorded for this report.
          </p>
        )}
        {!isLoading && !isError && sources.length > 0 && (
          <ol className="space-y-2">
            {sources.map((source) => (
              <li key={source.id} className="flex items-start gap-2 text-sm">
                {source.rank != null && (
                  <span className="mt-0.5 text-xs text-muted-foreground">
                    {source.rank}.
                  </span>
                )}
                <div className="min-w-0">
                  <Link
                    href={`/research/sources/${source.id}`}
                    className="text-primary hover:underline"
                  >
                    {source.title}
                  </Link>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{source.domain}</span>
                    {source.category && (
                      <Badge variant="outline" className="text-xs">
                        {source.category}
                      </Badge>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
