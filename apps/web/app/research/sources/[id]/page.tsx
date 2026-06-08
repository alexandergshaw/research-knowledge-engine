"use client";

import { use } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { SourceDetailCard } from "@/components/research/SourceDetailCard";
import { SourceReportList } from "@/components/research/SourceReportList";
import { useSource } from "@/lib/hooks/useSources";
import { ArrowLeft } from "lucide-react";

interface SourceDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function SourceDetailPage({ params }: SourceDetailPageProps) {
  const { id } = use(params);
  const { data: source, isLoading, isError } = useSource(id);

  return (
    <DashboardLayout title="Source Detail">
      <div className="max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/research/sources">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to Sources
            </Link>
          </Button>
        </div>

        {isLoading && (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Loading source…
          </div>
        )}

        {isError && (
          <div className="py-12 text-center text-sm text-destructive">
            Failed to load this source.
          </div>
        )}

        {!isLoading && !isError && source && (
          <>
            <SourceDetailCard source={source} />
            <SourceReportList reports={source.reports ?? []} />
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
