"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { JobStatusBadge } from "@/components/research/JobStatusBadge";
import { formatDateTime } from "@/lib/utils";
import { PAGE_SIZE } from "@/lib/constants";
import type { Job } from "@/lib/types/database";

interface JobsResponse {
  data: Job[];
  count: number;
}

export default function JobsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");

  const { data, isLoading, isError } = useQuery<JobsResponse>({
    queryKey: ["jobs", "list", { page, status }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        ...(status && { status }),
      });
      const res = await fetch(`/api/jobs?${params}`);
      if (!res.ok) throw new Error("Failed to fetch jobs");
      return res.json();
    },
    refetchInterval: 5000,
  });

  const totalPages = data ? Math.ceil(data.count / PAGE_SIZE) : 0;

  return (
    <DashboardLayout title="Jobs">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Jobs</h2>
            <p className="text-muted-foreground">
              {data?.count ?? 0} background jobs
            </p>
          </div>
        </div>

        <div className="flex gap-2 items-center">
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="w-40"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="running">Running</option>
            <option value="done">Done</option>
            <option value="failed">Failed</option>
          </Select>
          {status && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatus("");
                setPage(1);
              }}
            >
              Clear
            </Button>
          )}
        </div>

        {isLoading && (
          <div className="text-muted-foreground text-sm py-8 text-center">
            Loading jobs…
          </div>
        )}

        {isError && (
          <div className="py-8 text-center text-destructive text-sm">
            Failed to load jobs.
          </div>
        )}

        {!isLoading && !isError && data?.data.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            <p className="text-lg font-medium">No jobs found</p>
            <p className="text-sm mt-1">
              {status
                ? `No jobs with status "${status}".`
                : "Import a URL to create your first job."}
            </p>
          </div>
        )}

        {!isLoading && !isError && data && data.data.length > 0 && (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Retries</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium font-mono text-sm">
                        {job.job_type}
                      </TableCell>
                      <TableCell>
                        <JobStatusBadge status={job.status} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateTime(job.created_at)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateTime(job.started_at)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateTime(job.finished_at)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {job.retry_count > 0 ? job.retry_count : "—"}
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
