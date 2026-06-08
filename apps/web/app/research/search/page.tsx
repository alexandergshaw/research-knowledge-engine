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
import { useSearch } from "@/lib/hooks/useSearch";
import { PAGE_SIZE } from "@/lib/constants";

const EMPTY_FILTERS: SearchFiltersValue = {
  category: "",
  subcategory: "",
  tag: "",
  from: "",
  to: "",
  sort: "relevance",
};

export default function SearchPage() {
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [filters, setFilters] = useState<SearchFiltersValue>(EMPTY_FILTERS);

  const params = {
    page,
    keyword,
    category: filters.category,
    subcategory: filters.subcategory,
    tag: filters.tag,
    from: filters.from,
    to: filters.to,
    sort: filters.sort,
  };

  const { data, isLoading, isError, isFetched } = useSearch(params);
  const hasCriteria =
    Boolean(keyword) ||
    Boolean(filters.category) ||
    Boolean(filters.subcategory) ||
    Boolean(filters.tag) ||
    Boolean(filters.from) ||
    Boolean(filters.to);

  const totalPages = data ? Math.ceil(data.count / PAGE_SIZE) : 0;

  return (
    <DashboardLayout title="Search">
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Search</h2>
          <p className="text-muted-foreground">
            Full-text search across all indexed sources.
          </p>
        </div>

        <SearchBar
          defaultValue={keyword}
          onSearch={(value) => {
            setKeyword(value);
            setPage(1);
          }}
          placeholder="Search keywords…"
        />

        <SearchFilters
          value={filters}
          onChange={(next) => {
            setFilters(next);
            setPage(1);
          }}
          onReset={() => {
            setFilters(EMPTY_FILTERS);
            setKeyword("");
            setPage(1);
          }}
        />

        {!hasCriteria ? (
          <div className="rounded-md border border-dashed px-4 py-12 text-center text-muted-foreground">
            <p className="text-lg font-medium">Start searching</p>
            <p className="mt-1 text-sm">
              Enter a keyword or apply a filter to find sources.
            </p>
          </div>
        ) : (
          <>
            {isFetched && !isLoading && !isError && (
              <p className="text-sm text-muted-foreground">
                {data?.count ?? 0} result(s)
              </p>
            )}
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
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
