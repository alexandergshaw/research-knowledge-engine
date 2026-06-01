import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatDateTime } from "@/lib/utils";
import { ArrowLeft, ExternalLink } from "lucide-react";
import type { Source } from "@/lib/types/database";

interface SourceDetailPageProps {
  params: Promise<{ id: string }>;
}

async function getSource(id: number): Promise<Source | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("sources")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

export default async function SourceDetailPage({ params }: SourceDetailPageProps) {
  const { id } = await params;
  const sourceId = parseInt(id, 10);

  if (isNaN(sourceId)) notFound();

  const source = await getSource(sourceId);
  if (!source) notFound();

  return (
    <DashboardLayout title="Source Detail">
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/research/sources">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Sources
            </Link>
          </Button>
        </div>

        <div>
          <h2 className="text-2xl font-bold tracking-tight">{source.title}</h2>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge variant="secondary">{source.source_type}</Badge>
            {source.category && <Badge variant="outline">{source.category}</Badge>}
            {source.trust_level && (
              <Badge variant="outline">Trust: {source.trust_level}</Badge>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground">URL</span>
                <div className="mt-0.5 flex items-center gap-1">
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline truncate max-w-xs"
                  >
                    {source.url}
                  </a>
                  <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Domain</span>
                <p className="mt-0.5 font-medium">{source.domain}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Published</span>
                <p className="mt-0.5 font-medium">{formatDate(source.published_at)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Fetched</span>
                <p className="mt-0.5 font-medium">{formatDateTime(source.fetched_at)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Accessed</span>
                <p className="mt-0.5 font-medium">{formatDateTime(source.accessed_at)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tags</CardTitle>
            </CardHeader>
            <CardContent>
              {source.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {source.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No tags</p>
              )}
            </CardContent>
          </Card>
        </div>

        {source.content && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Content Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
                {source.content.slice(0, 2000)}
                {source.content.length > 2000 && (
                  <span className="text-muted-foreground italic">
                    {" "}… (truncated)
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
