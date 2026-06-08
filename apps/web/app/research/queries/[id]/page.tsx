"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { QueryDetailCard } from "@/components/research/QueryDetailCard";
import { QueryForm } from "@/components/research/QueryForm";
import { useQuery } from "@/lib/hooks/useQueries";
import { formatDateTime } from "@/lib/utils";
import type { SavedQueryFormValues } from "@/lib/validation/schemas";
import { ArrowLeft, FileText, Pencil, Play } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function QueryDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery(id);
  const [isEditing, setIsEditing] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const updateMutation = useMutation({
    mutationFn: async (values: SavedQueryFormValues) => {
      const res = await fetch(`/api/queries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to update query");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["queries", "detail", id] });
      queryClient.invalidateQueries({ queryKey: ["queries", "list"] });
      setIsEditing(false);
    },
    onError: (err: Error) => setEditError(err.message),
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saved_query_id: id }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to queue report");
      }
      return res.json();
    },
  });

  return (
    <DashboardLayout title="Query">
      <div className="max-w-3xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/research/queries">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to Queries
            </Link>
          </Button>
        </div>

        {isLoading && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Loading query…
          </div>
        )}

        {isError && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-8 text-center text-sm text-destructive">
            Failed to load query.
          </div>
        )}

        {!isLoading && !isError && data && (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  {data.query.title}
                </h2>
                <p className="mt-1 text-muted-foreground">
                  Saved query · created {formatDateTime(data.query.created_at)}
                </p>
              </div>
              {!isEditing && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditError(null);
                      setIsEditing(true);
                    }}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Query
                  </Button>
                  <Button
                    onClick={() => generateMutation.mutate()}
                    disabled={generateMutation.isPending}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    {generateMutation.isPending ? "Queuing…" : "Generate Report"}
                  </Button>
                </div>
              )}
            </div>

            {generateMutation.isSuccess && (
              <div className="rounded-md border border-green-600/30 bg-green-600/10 px-4 py-2 text-sm text-green-700 dark:text-green-400">
                Report queued. The worker will generate it shortly — it will appear
                under Related Reports and on the Reports page once complete.
              </div>
            )}
            {generateMutation.isError && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
                {generateMutation.error?.message ?? "Failed to queue report."}
              </div>
            )}

            {isEditing ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Edit Query</CardTitle>
                </CardHeader>
                <CardContent>
                  <QueryForm
                    defaultValues={{
                      title: data.query.title,
                      query: data.query.query,
                      category: data.query.category ?? "",
                      subcategory: data.query.subcategory ?? "",
                      active: data.query.active,
                    }}
                    onSubmit={async (values) => {
                      setEditError(null);
                      await updateMutation.mutateAsync(values);
                    }}
                    onCancel={() => setIsEditing(false)}
                    isSubmitting={updateMutation.isPending}
                    submitError={editError}
                  />
                </CardContent>
              </Card>
            ) : (
              <QueryDetailCard query={data.query} />
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Related Reports</CardTitle>
              </CardHeader>
              <CardContent>
                {data.reports.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No reports generated from this query yet. Use{" "}
                    <span className="font-medium">Generate Report</span> to queue
                    one.
                  </p>
                ) : (
                  <ul className="divide-y">
                    {data.reports.map((report) => (
                      <li key={report.id}>
                        <Link
                          href={`/research/reports/${report.id}`}
                          className="flex items-center justify-between gap-4 py-3 hover:bg-muted/40"
                        >
                          <span className="flex items-center gap-2 font-medium">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            {report.title}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {formatDateTime(report.created_at)}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
