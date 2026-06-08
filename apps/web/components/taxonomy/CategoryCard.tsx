"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Hash } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SubcategoryList } from "@/components/taxonomy/SubcategoryList";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/types/category";

interface CategoryCardProps {
  category: Category;
  /** Whether the card starts expanded. */
  defaultOpen?: boolean;
}

/**
 * Collapsible card that displays a single category: name, kebab-case key,
 * description, lookup tags, and its subcategories.
 */
export function CategoryCard({ category, defaultOpen = false }: CategoryCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card>
      <CardHeader className="p-0">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-start gap-3 p-4 text-left"
        >
          <span className="mt-0.5 text-muted-foreground">
            {open ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </span>
          <span className="flex-1 space-y-1">
            <span className="flex flex-wrap items-center gap-2">
              <span className="text-base font-semibold leading-none">
                {category.name}
              </span>
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                {category.key}
              </code>
              <Badge variant="outline" className="text-xs">
                {category.subcategories.length} subcategories
              </Badge>
            </span>
            <span className="block text-sm text-muted-foreground">
              {category.description}
            </span>
          </span>
        </button>
      </CardHeader>

      <CardContent className={cn("space-y-4 pt-0", !open && "hidden")}>
        <div className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Tags
          </p>
          {category.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {category.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="gap-1 text-xs">
                  <Hash className="h-3 w-3" />
                  {tag}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No tags</p>
          )}
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Subcategories
          </p>
          <SubcategoryList subcategories={category.subcategories} />
        </div>
      </CardContent>
    </Card>
  );
}
