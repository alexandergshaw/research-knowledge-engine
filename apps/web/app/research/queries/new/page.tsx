"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QueryForm } from "@/components/research/QueryForm";
import type { SavedQueryFormValues } from "@/lib/validation/schemas";
import type { SavedQuery } from "@/lib/types/database";
import { ArrowLeft } from "lucide-react";

export default function NewQueryPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (values: SavedQueryFormValues): Promise<SavedQuery> => {
      const res = await fetch("/api/queries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to create query");
      }
      return res.json();
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["queries", "list"] });
      router.push(`/research/queries/${created.id}`);
    },
    onError: (err: Error) => {
      setSubmitError(err.message);
    },
  });

  return (
    <DashboardLayout title="New Query">
      <div className="max-w-2xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/research/queries">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to Queries
            </Link>
          </Button>
        </div>

        <div>
          <h2 className="text-2xl font-bold tracking-tight">New Query</h2>
          <p className="text-muted-foreground">
            Create a reusable research query. The worker generates reports from it
            later.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Query Details</CardTitle>
          </CardHeader>
          <CardContent>
            <QueryForm
              onSubmit={async (values) => {
                setSubmitError(null);
                await mutation.mutateAsync(values);
              }}
              onCancel={() => router.push("/research/queries")}
              isSubmitting={mutation.isPending}
              submitError={submitError}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
