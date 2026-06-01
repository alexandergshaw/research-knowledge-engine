import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ImportUrlForm } from "@/components/forms/ImportUrlForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ImportPage() {
  return (
    <DashboardLayout title="Import URL">
      <div className="space-y-6 max-w-2xl">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Import URL</h2>
          <p className="text-muted-foreground">
            Queue a URL for import into the knowledge engine.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Import Details</CardTitle>
            <CardDescription>
              Submitting this form creates an <code className="text-xs bg-muted px-1 py-0.5 rounded">import_url</code> job
              in the jobs queue with status <code className="text-xs bg-muted px-1 py-0.5 rounded">pending</code>.
              The worker will process it when available.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ImportUrlForm />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
