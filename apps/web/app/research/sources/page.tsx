"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { SourceTable } from "@/components/research/SourceTable";
import { SearchBar } from "@/components/research/SearchBar";
import {
  SearchFilters,
  type SearchFiltersValue,
} from "@/components/research/SearchFilters";
import { useSources } from "@/lib/hooks/useSources";
import { PAGE_SIZE } from "@/lib/constants";

const EMPTY_FILTERS: SearchFiltersValue = {
  category: "",
  subcategory: "",
  tag: "",
  from: "",
  to: "",
  sort: "newest",
};

export default function SourcesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<SearchFiltersValue>(EMPTY_FILTERS);

  const { data, isLoading, isError } = useSources({
    page,
    search,
    category: filters.category,
    subcategory: filters.subcategory,
    tag: filters.tag,
    from: filters.from,
    to: filters.to,
    sort: filters.sort,
  });

  const totalPages = data ? Math.ceil(data.count / PAGE_SIZE) : 0;

  return (
    <DashboardLayout title="Sources">
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Sources</h2>
          <p className="text-muted-foreground">
            {data?.count ?? 0} indexed research documents
          </p>
        </div>

        <SearchBar
          defaultValue={search}
          onSearch={(keyword) => {
            setSearch(keyword);
            setPage(1);
          }}
          placeholder="Search by title or domain…"
        />

        <SearchFilters
          value={filters}
          onChange={(next) => {
            setFilters(next);
            setPage(1);
          }}
          onReset={() => {
            setFilters(EMPTY_FILTERS);
            setSearch("");
            setPage(1);
          }}
          showRelevance={false}
        />

        <SourceTable
          sources={data?.data ?? []}
          isLoading={isLoading}
          isError={isError}
        />

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
      </div>
    </DashboardLayout>
  );
}
