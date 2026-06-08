import { NextResponse } from "next/server";
import { loadCategories } from "@/lib/taxonomy/loader";

/**
 * GET /api/categories
 *
 * Returns the canonical category taxonomy loaded from
 * `data/source_categories.yaml`. Each category includes its key, display name,
 * description, lookup tags, and subcategories. Totals are included so the UI can
 * render category/subcategory counts without recomputing.
 */
export async function GET() {
  try {
    const categories = loadCategories();
    const subcategoryCount = categories.reduce(
      (sum, c) => sum + c.subcategories.length,
      0
    );

    return NextResponse.json({
      categories,
      categoryCount: categories.length,
      subcategoryCount,
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message ?? "Failed to load categories" },
      { status: 500 }
    );
  }
}
