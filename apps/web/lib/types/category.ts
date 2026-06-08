/**
 * Category taxonomy types shared across the web app.
 *
 * The canonical taxonomy lives in `data/source_categories.yaml` at the repo
 * root and is loaded server-side by `lib/taxonomy/loader.ts`. The shape here
 * mirrors that file plus a kebab-case `key` for each category.
 */

export interface Category {
  /** Stable kebab-case identifier (the YAML map key). */
  key: string;
  /** Human-readable display name. */
  name: string;
  /** One-sentence description of the category's scope. */
  description: string;
  /** Synonyms / lookup aliases. */
  tags: string[];
  /** Stable, broad sub-topics (kebab-case). */
  subcategories: string[];
}

export interface CategoriesResponse {
  categories: Category[];
  categoryCount: number;
  subcategoryCount: number;
}
