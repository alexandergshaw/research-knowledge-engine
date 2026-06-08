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
import { StatusBadge } from "@/components/research/StatusBadge";
import { formatDate } from "@/lib/utils";
import { truncate } from "@/lib/utils";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import type { SavedQuery } from "@/lib/types/database";

interface QueryTableProps {
  queries: SavedQuery[];
  isLoading?: boolean;
  isError?: boolean;
  sort: string;
  dir: "asc" | "desc";
  onSort: (column: string) => void;
}

const COLUMNS: { key: string; label: string; sortable: boolean }[] = [
  { key: "title", label: "Title", sortable: true },
  { key: "query", label: "Query", sortable: false },
  { key: "category", label: "Category", sortable: true },
  { key: "subcategory", label: "Subcategory", sortable: true },
  { key: "active", label: "Active", sortable: true },
  { key: "created_at", label: "Created", sortable: true },
];

export function QueryTable({
  queries,
  isLoading = false,
  isError = false,
  sort,
  dir,
  onSort,
}: QueryTableProps) {
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
        Failed to load queries.
      </div>
    );
  }

  if (queries.length === 0) {
    return (
      <div className="rounded-md border border-dashed px-4 py-12 text-center text-muted-foreground">
        <p className="text-lg font-medium">No queries found</p>
        <p className="mt-1 text-sm">
          Create a new query to start building reusable research prompts.
        </p>
      </div>
    );
  }

  function SortIcon({ column }: { column: string }) {
    if (sort !== column) {
      return <ChevronsUpDown className="ml-1 inline h-3 w-3 text-muted-foreground/60" />;
    }
    return dir === "asc" ? (
      <ArrowUp className="ml-1 inline h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 inline h-3 w-3" />
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {COLUMNS.map((col) => (
              <TableHead key={col.key}>
                {col.sortable ? (
                  <button
                    type="button"
                    onClick={() => onSort(col.key)}
                    className="inline-flex items-center font-medium hover:text-foreground"
                  >
                    {col.label}
                    <SortIcon column={col.key} />
                  </button>
                ) : (
                  col.label
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {queries.map((q) => (
            <TableRow
              key={q.id}
              className="cursor-pointer"
              onClick={() => router.push(`/research/queries/${q.id}`)}
            >
              <TableCell className="font-medium">{q.title}</TableCell>
              <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                {truncate(q.query, 80)}
              </TableCell>
              <TableCell>
                {q.category ? (
                  <Badge variant="secondary">{q.category}</Badge>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                {q.subcategory ? (
                  <Badge variant="secondary" className="font-mono text-xs">
                    {q.subcategory}
                  </Badge>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                <StatusBadge active={q.active} />
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(q.created_at)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
