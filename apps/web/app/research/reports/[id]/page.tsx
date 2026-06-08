"use client";

import { use } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { ReportDetailCard } from "@/components/research/ReportDetailCard";
import { useReport } from "@/lib/hooks/useReports";
import { ArrowLeft } from "lucide-react";

interface ReportDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ReportDetailPage({ params }: ReportDetailPageProps) {
  const { id } = use(params);
  const { data: report, isLoading, isError } = useReport(id);

  return (
    <DashboardLayout title="Report">
      <div className="max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/research/reports">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to Reports
            </Link>
          </Button>
        </div>

        {isLoading && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Loading report…
          </div>
        )}

        {isError && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-8 text-center text-sm text-destructive">
            Report not found or failed to load.
          </div>
        )}

        {!isLoading && !isError && report && (
          <ReportDetailCard report={report} />
        )}
      </div>
    </DashboardLayout>
  );
}
