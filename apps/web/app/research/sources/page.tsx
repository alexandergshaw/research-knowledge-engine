"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { PAGE_SIZE } from "@/lib/constants";
import type { Source } from "@/lib/types/database";

interface SourcesResponse {
  data: Source[];
  count: number;
}

export default function SourcesPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const { data, isLoading, isError } = useQuery<SourcesResponse>({
    queryKey: ["sources", "list", { page, search }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        ...(search && { search }),
      });
      const res = await fetch(`/api/sources?${params}`);
      if (!res.ok) throw new Error("Failed to fetch sources");
      return res.json();
    },
  });

  const totalPages = data ? Math.ceil(data.count / PAGE_SIZE) : 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <DashboardLayout title="Sources">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Sources</h2>
            <p className="text-muted-foreground">
              {data?.count ?? 0} indexed research documents
            </p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Search by title or domain…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="max-w-sm"
          />
          <Button type="submit" variant="outline">
            Search
          </Button>
          {search && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setSearch("");
                setSearchInput("");
                setPage(1);
              }}
            >
              Clear
            </Button>
          )}
        </form>

        {isLoading && (
          <div className="text-muted-foreground text-sm py-8 text-center">
            Loading sources…
          </div>
        )}

        {isError && (
          <div className="py-8 text-center text-destructive text-sm">
            Failed to load sources. Please check your Supabase connection.
          </div>
        )}

        {!isLoading && !isError && data?.data.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            <p className="text-lg font-medium">No sources found</p>
            <p className="text-sm mt-1">
              {search
                ? "Try a different search term."
                : "Import URLs or configure feeds to start indexing content."}
            </p>
          </div>
        )}

        {!isLoading && !isError && data && data.data.length > 0 && (
          <>
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
                  {data.data.map((source) => (
                    <TableRow
                      key={source.id}
                      className="cursor-pointer"
                      onClick={() =>
                        router.push(`/research/sources/${source.id}`)
                      }
                    >
                      <TableCell className="font-medium max-w-xs truncate">
                        {source.title}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {source.domain}
                      </TableCell>
                      <TableCell>
                        {source.category ? (
                          <Badge variant="secondary">{source.category}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(source.published_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
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

            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
