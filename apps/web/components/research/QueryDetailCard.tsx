import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/research/StatusBadge";
import { formatDateTime } from "@/lib/utils";
import type { SavedQuery } from "@/lib/types/database";

interface QueryDetailCardProps {
  query: SavedQuery;
}

/** Read-only summary card for a saved query's metadata. */
export function QueryDetailCard({ query }: QueryDetailCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Query Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Field label="Query">
          <p className="text-sm italic text-muted-foreground">{query.query}</p>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category">
            {query.category ? (
              <Badge variant="secondary">{query.category}</Badge>
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )}
          </Field>
          <Field label="Subcategory">
            {query.subcategory ? (
              <Badge variant="secondary" className="font-mono text-xs">
                {query.subcategory}
              </Badge>
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )}
          </Field>
          <Field label="Active">
            <StatusBadge active={query.active} />
          </Field>
          <Field label="Created">
            <span className="text-sm text-muted-foreground">
              {formatDateTime(query.created_at)}
            </span>
          </Field>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      {children}
    </div>
  );
}
