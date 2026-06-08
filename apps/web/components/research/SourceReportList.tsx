"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import type { SourceReportSummary } from "@/lib/types/database";

interface SourceReportListProps {
  reports: SourceReportSummary[];
}

/** "Used In Reports" panel on a source detail page. */
export function SourceReportList({ reports }: SourceReportListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Used In Reports</CardTitle>
      </CardHeader>
      <CardContent>
        {reports.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            This source has not been cited in any report yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {reports.map((report) => (
              <li
                key={report.id}
                className="flex items-center justify-between gap-4"
              >
                <Link
                  href={`/research/reports/${report.id}`}
                  className="text-sm text-primary hover:underline"
                >
                  {report.title}
                </Link>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatDateTime(report.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
