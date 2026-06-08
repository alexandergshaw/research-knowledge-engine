"use client";

import { useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { QueryTable } from "@/components/research/QueryTable";
import { CategoryDropdown } from "@/components/taxonomy/CategoryDropdown";
import { useQueries } from "@/lib/hooks/useQueries";
import { PAGE_SIZE } from "@/lib/constants";
import { Plus, Search } from "lucide-react";

export default function QueriesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [active, setActive] = useState<"" | "true" | "false">("");
  const [sort, setSort] = useState("created_at");
  const [dir, setDir] = useState<"asc" | "desc">("desc");

  const { data, isLoading, isError } = useQueries({
    page,
    search,
    category,
    active,
    sort,
    dir,
  });

  const totalPages = data ? Math.ceil(data.count / PAGE_SIZE) : 0;

  function handleSort(column: string) {
    if (sort === column) {
      setDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSort(column);
      setDir("asc");
    }
    setPage(1);
  }

  function resetToFirstPage<T>(setter: (v: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  return (
    <DashboardLayout title="Queries">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Saved Queries</h2>
            <p className="text-muted-foreground">
              {data?.count ?? 0} reusable research queries
            </p>
          </div>
          <Button asChild>
            <Link href="/research/queries/new">
              <Plus className="mr-2 h-4 w-4" />
              New Query
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search title or query…"
                value={search}
                onChange={(e) => resetToFirstPage(setSearch)(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <CategoryDropdown
              id="category"
              value={category}
              onChange={resetToFirstPage(setCategory)}
              placeholder="All categories"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="active">Status</Label>
            <Select
              id="active"
              value={active}
              onChange={(e) =>
                resetToFirstPage<"" | "true" | "false">(setActive)(
                  e.target.value as "" | "true" | "false"
                )
              }
            >
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </Select>
          </div>
        </div>

        <QueryTable
          queries={data?.data ?? []}
          isLoading={isLoading}
          isError={isError}
          sort={sort}
          dir={dir}
          onSort={handleSort}
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
