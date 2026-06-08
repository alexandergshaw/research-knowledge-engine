"use client";

import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CategoryList } from "@/components/taxonomy/CategoryList";
import { CategoryDropdown } from "@/components/taxonomy/CategoryDropdown";
import { useCategories } from "@/lib/hooks/useCategories";
import { Layers, ListTree, Search } from "lucide-react";

export default function CategoriesPage() {
  const { data, isLoading, isError } = useCategories();
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  const allCategories = useMemo(() => data?.categories ?? [], [data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allCategories.filter((c) => {
      if (filterCategory && c.key !== filterCategory) return false;
      if (!q) return true;
      return (
        c.key.includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q)) ||
        c.subcategories.some((s) => s.includes(q))
      );
    });
  }, [allCategories, search, filterCategory]);

  const subcategoryCount = data?.subcategoryCount ?? 0;
  const categoryCount = data?.categoryCount ?? 0;

  return (
    <DashboardLayout title="Categories">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Category Explorer</h2>
          <p className="text-muted-foreground">
            Visual validation tool for the source category taxonomy. Confirm
            categories, descriptions, tags, and subcategories load correctly.
          </p>
        </div>

        {/* Summary counts */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-md bg-primary/10 p-2 text-primary">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold leading-none">
                  {isLoading ? "—" : categoryCount}
                </p>
                <p className="text-sm text-muted-foreground">Total categories</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-md bg-primary/10 p-2 text-primary">
                <ListTree className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold leading-none">
                  {isLoading ? "—" : subcategoryCount}
                </p>
                <p className="text-sm text-muted-foreground">
                  Total subcategories
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search name, tag, or subcategory…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="filter">Filter by category</Label>
            <CategoryDropdown
              id="filter"
              value={filterCategory}
              onChange={setFilterCategory}
              placeholder="All categories"
            />
          </div>
        </div>

        {(search || filterCategory) && (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>
              Showing {filtered.length} of {allCategories.length} categories
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7"
              onClick={() => {
                setSearch("");
                setFilterCategory("");
              }}
            >
              Clear filters
            </Button>
          </div>
        )}

        <CategoryList
          categories={filtered}
          isLoading={isLoading}
          isError={isError}
          defaultOpen={Boolean(search || filterCategory)}
        />
      </div>
    </DashboardLayout>
  );
}
