import { readFileSync } from "node:fs";
import { join } from "node:path";
import yaml from "js-yaml";
import type { Category } from "@/lib/types/category";

/**
 * Server-side loader for the canonical category taxonomy.
 *
 * Reads `data/source_categories.yaml` from the repository root and normalizes
 * it into a list of {@link Category} objects. This is the single source of
 * truth consumed by `GET /api/categories`.
 */

interface RawCategory {
  name?: string;
  description?: string;
  tags?: string[];
  subcategories?: string[];
}

interface RawTaxonomy {
  categories?: Record<string, RawCategory>;
}

/**
 * Candidate locations for the taxonomy YAML. The first one that exists wins.
 * Different runtimes resolve `process.cwd()` differently (local dev runs from
 * `apps/web`, some build/serverless contexts run from the repo root), so we try
 * a few relative paths.
 */
function candidatePaths(): string[] {
  const cwd = process.cwd();
  return [
    join(cwd, "..", "..", "data", "source_categories.yaml"),
    join(cwd, "data", "source_categories.yaml"),
    join(cwd, "..", "data", "source_categories.yaml"),
  ];
}

function readTaxonomyFile(): string {
  const errors: string[] = [];
  for (const path of candidatePaths()) {
    try {
      return readFileSync(path, "utf8");
    } catch (err) {
      errors.push(`${path}: ${(err as Error).message}`);
    }
  }
  throw new Error(
    `Could not locate source_categories.yaml. Tried:\n${errors.join("\n")}`
  );
}

export function loadCategories(): Category[] {
  const raw = yaml.load(readTaxonomyFile()) as RawTaxonomy | null;
  const categories = raw?.categories ?? {};

  return Object.entries(categories).map(([key, value]) => ({
    key,
    name: value.name ?? key,
    description: value.description ?? "",
    tags: value.tags ?? [],
    subcategories: value.subcategories ?? [],
  }));
}
