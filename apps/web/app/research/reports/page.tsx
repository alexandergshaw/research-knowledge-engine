"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";
import { PAGE_SIZE } from "@/lib/constants";
import type { ResearchReport } from "@/lib/types/database";

interface ReportsResponse {
  data: ResearchReport[];
  count: number;
}

export default function ReportsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery<ReportsResponse>({
    queryKey: ["reports", "list", { page }],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page) });
      const res = await fetch(`/api/reports?${params}`);
      if (!res.ok) throw new Error("Failed to fetch reports");
      return res.json();
    },
  });

  const totalPages = data ? Math.ceil(data.count / PAGE_SIZE) : 0;

  return (
    <DashboardLayout title="Reports">
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Reports</h2>
          <p className="text-muted-foreground">
            {data?.count ?? 0} research reports
          </p>
        </div>

        {isLoading && (
          <div className="text-muted-foreground text-sm py-8 text-center">
            Loading reports…
          </div>
        )}

        {isError && (
          <div className="py-8 text-center text-destructive text-sm">
            Failed to load reports.
          </div>
        )}

        {!isLoading && !isError && data?.data.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            <p className="text-lg font-medium">No reports yet</p>
            <p className="text-sm mt-1">Reports will appear here once generated.</p>
          </div>
        )}

        {!isLoading && !isError && data && data.data.length > 0 && (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Query</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((report) => (
                    <TableRow
                      key={report.id}
                      className="cursor-pointer"
                      onClick={() =>
                        router.push(`/research/reports/${report.id}`)
                      }
                    >
                      <TableCell className="font-medium">{report.title}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                        {report.query}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateTime(report.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
