import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatsCards } from "@/components/research/StatsCards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

async function getDashboardStats() {
  try {
    const supabase = await createClient();
    const [sources, feeds, jobs, reports] = await Promise.all([
      supabase.from("sources").select("id", { count: "exact", head: true }),
      supabase.from("feeds").select("id", { count: "exact", head: true }),
      supabase.from("jobs").select("id", { count: "exact", head: true }),
      supabase.from("research_reports").select("id", { count: "exact", head: true }),
    ]);
    return {
      sources: sources.count ?? 0,
      feeds: feeds.count ?? 0,
      jobs: jobs.count ?? 0,
      reports: reports.count ?? 0,
    };
  } catch {
    return { sources: 0, feeds: 0, jobs: 0, reports: 0 };
  }
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Overview</h2>
          <p className="text-muted-foreground">
            Research Knowledge Engine control center
          </p>
        </div>
        <StatsCards {...stats} />
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Getting Started</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>1. Configure RSS feeds in the <strong>Feeds</strong> section.</p>
              <p>2. Import individual URLs via <strong>Import URL</strong>.</p>
              <p>3. Monitor processing in the <strong>Jobs</strong> section.</p>
              <p>4. Browse indexed content in <strong>Sources</strong>.</p>
              <p>5. View generated reports in <strong>Reports</strong>.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">System Status</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <div className="flex items-center justify-between">
                <span>Database</span>
                <span className="text-green-600 font-medium">Connected</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Worker</span>
                <span className="text-yellow-600 font-medium">Not configured</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Search Index</span>
                <span className="text-yellow-600 font-medium">Not configured</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
