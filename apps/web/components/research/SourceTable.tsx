"use client";

import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { Source } from "@/lib/types/database";

interface SourceTableProps {
  sources: Source[];
  isLoading?: boolean;
  isError?: boolean;
}

/** Reusable, presentational table of sources with loading/empty/error states. */
export function SourceTable({
  sources,
  isLoading = false,
  isError = false,
}: SourceTableProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="space-y-2" aria-busy="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-md border bg-muted/40" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-8 text-center text-sm text-destructive">
        Failed to load sources.
      </div>
    );
  }

  if (sources.length === 0) {
    return (
      <div className="rounded-md border border-dashed px-4 py-12 text-center text-muted-foreground">
        <p className="text-lg font-medium">No sources found</p>
        <p className="mt-1 text-sm">
          Import URLs or configure feeds to start indexing content.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Domain</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Published</TableHead>
            <TableHead>Tags</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sources.map((source) => (
            <TableRow
              key={source.id}
              className="cursor-pointer"
              onClick={() => router.push(`/research/sources/${source.id}`)}
            >
              <TableCell className="max-w-xs truncate font-medium">
                {source.title}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {source.domain}
              </TableCell>
              <TableCell>
                {source.category ? (
                  <Badge variant="secondary">{source.category}</Badge>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(source.published_at)}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {source.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {source.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{source.tags.length - 3}
                    </Badge>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
