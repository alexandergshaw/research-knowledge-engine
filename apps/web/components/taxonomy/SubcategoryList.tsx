import { Badge } from "@/components/ui/badge";

interface SubcategoryListProps {
  subcategories: string[];
  emptyMessage?: string;
}

/**
 * Renders a category's subcategories as badges. Shows a friendly empty state
 * when there are none.
 */
export function SubcategoryList({
  subcategories,
  emptyMessage = "No subcategories",
}: SubcategoryListProps) {
  if (subcategories.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {subcategories.map((sub) => (
        <Badge key={sub} variant="secondary" className="font-mono text-xs">
          {sub}
        </Badge>
      ))}
    </div>
  );
}
