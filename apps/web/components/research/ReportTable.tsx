"use client";

import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime, truncate } from "@/lib/utils";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import type { ReportSummary } from "@/lib/hooks/useReports";

interface ReportTableProps {
  reports: ReportSummary[];
  isLoading?: boolean;
  isError?: boolean;
  sort: string;
  dir: "asc" | "desc";
  onSort: (column: string) => void;
}

const COLUMNS: { key: string; label: string; sortable: boolean }[] = [
  { key: "title", label: "Title", sortable: true },
  { key: "query", label: "Query", sortable: true },
  { key: "created_at", label: "Created", sortable: true },
];

export function ReportTable({
  reports,
  isLoading = false,
  isError = false,
  sort,
  dir,
  onSort,
}: ReportTableProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="space-y-2" aria-busy="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-md border bg-muted/40" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-8 text-center text-sm text-destructive">
        Failed to load reports.
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="rounded-md border border-dashed px-4 py-12 text-center text-muted-foreground">
        <p className="text-lg font-medium">No reports yet</p>
        <p className="mt-1 text-sm">
          Reports appear here once a generate_report job is processed.
        </p>
      </div>
    );
  }

  function SortIcon({ column }: { column: string }) {
    if (sort !== column) {
      return <ChevronsUpDown className="ml-1 inline h-3 w-3 text-muted-foreground/60" />;
    }
    return dir === "asc" ? (
      <ArrowUp className="ml-1 inline h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 inline h-3 w-3" />
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {COLUMNS.map((col) => (
              <TableHead key={col.key}>
                {col.sortable ? (
                  <button
                    type="button"
                    onClick={() => onSort(col.key)}
                    className="inline-flex items-center font-medium hover:text-foreground"
                  >
                    {col.label}
                    <SortIcon column={col.key} />
                  </button>
                ) : (
                  col.label
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((report) => (
            <TableRow
              key={report.id}
              className="cursor-pointer"
              onClick={() => router.push(`/research/reports/${report.id}`)}
            >
              <TableCell className="font-medium">{report.title}</TableCell>
              <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                {truncate(report.query, 80)}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDateTime(report.created_at)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
