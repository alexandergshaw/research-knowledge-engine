"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatDateTime } from "@/lib/utils";
import type { Source } from "@/lib/types/database";

interface SourceDetailCardProps {
  source: Source;
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm">{value}</dd>
    </div>
  );
}

/** Presents the metadata and content preview for a single source. */
export function SourceDetailCard({ source }: SourceDetailCardProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{source.title}</h2>
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-block break-all text-sm text-primary hover:underline"
        >
          {source.url}
        </a>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Metadata</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field label="Domain" value={source.domain} />
            <Field label="Type" value={source.source_type} />
            <Field
              label="Category"
              value={
                source.category ? (
                  <Badge variant="secondary">{source.category}</Badge>
                ) : (
                  "—"
                )
              }
            />
            <Field label="Subcategory" value={source.subcategory || "—"} />
            <Field label="Trust level" value={source.trust_level || "—"} />
            <Field label="Published" value={formatDate(source.published_at)} />
            <Field label="Accessed" value={formatDateTime(source.accessed_at)} />
          </dl>

          {source.tags.length > 0 && (
            <div className="mt-4">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Tags
              </dt>
              <dd className="mt-1 flex flex-wrap gap-1">
                {source.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </dd>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Content Preview</CardTitle>
        </CardHeader>
        <CardContent>
          {source.content ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {source.content.slice(0, 2000)}
              {source.content.length > 2000 && "…"}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              No extracted content available for this source.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
