import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import type { ResearchReport } from "@/lib/types/database";

interface ReportDetailPageProps {
  params: Promise<{ id: string }>;
}

async function getReport(id: number): Promise<ResearchReport | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("research_reports")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

export default async function ReportDetailPage({ params }: ReportDetailPageProps) {
  const { id } = await params;
  const reportId = parseInt(id, 10);

  if (isNaN(reportId)) notFound();

  const report = await getReport(reportId);
  if (!report) notFound();

  return (
    <DashboardLayout title="Report">
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/research/reports">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Reports
            </Link>
          </Button>
        </div>

        <div>
          <h2 className="text-2xl font-bold tracking-tight">{report.title}</h2>
          <p className="text-muted-foreground mt-1">
            Created {formatDateTime(report.created_at)}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Query</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground italic">{report.query}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Report Content</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none text-sm leading-relaxed whitespace-pre-wrap">
              {report.content}
            </div>
          </CardContent>
        </Card>

        {report.source_ids.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Source References</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                This report references {report.source_ids.length} source
                {report.source_ids.length !== 1 ? "s" : ""}.
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {report.source_ids.map((id) => (
                  <Link
                    key={id}
                    href={`/research/sources/${id}`}
                    className="text-xs text-primary hover:underline"
                  >
                    Source #{id}
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
