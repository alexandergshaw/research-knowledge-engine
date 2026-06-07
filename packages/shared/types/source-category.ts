/**
 * Strongly typed category taxonomy and helpers (TypeScript mirror).
 *
 * This mirrors `data/source_categories.yaml` and the Python model in
 * `packages/shared/models/source_category.py`. It is the canonical taxonomy
 * shared across all projects (Research Knowledge Engine, Personal Knowledge
 * Base, Classroom Artifact Grader, Course Generator, Workflow Automation
 * Platform, Resume Tailoring Engine).
 *
 * The taxonomy is embedded as a typed constant so it can be consumed in
 * browser and server bundles without a YAML parser. When editing the taxonomy,
 * update `data/source_categories.yaml` and keep this file in sync.
 *
 * All category and subcategory names are kebab-case.
 */

export interface SourceCategory {
  /** Human-readable display name. */
  name: string;
  /** One-sentence description of the category's scope. */
  description: string;
  /** Synonyms / lookup aliases used by findCategoryByTag(). */
  tags: string[];
  /** Stable, broad sub-topics (kebab-case). */
  subcategories: string[];
}

export type SourceCategoryTaxonomy = Record<string, SourceCategory>;

export const SOURCE_CATEGORIES = {
  software: {
    name: "Software",
    description: "Software engineering and development topics.",
    tags: ["software", "programming", "engineering", "development", "dev"],
    subcategories: [
      "frontend",
      "backend",
      "cloud",
      "devops",
      "testing",
      "architecture",
      "programming-languages",
      "open-source",
      "web-development",
      "distributed-systems",
    ],
  },
  "computer-science": {
    name: "Computer Science",
    description: "Core computer science concepts and disciplines.",
    tags: ["computer-science", "cs", "engineering"],
    subcategories: [
      "data-structures",
      "algorithms",
      "databases",
      "operating-systems",
      "networking",
      "cybersecurity",
      "software-engineering",
      "artificial-intelligence",
      "theory",
      "compilers",
    ],
  },
  education: {
    name: "Education",
    description: "Higher education and learning systems.",
    tags: ["education", "learning", "edtech"],
    subcategories: [
      "higher-education",
      "instructional-design",
      "accessibility",
      "online-learning",
      "assessment",
      "curriculum-development",
      "student-success",
      "educational-technology",
    ],
  },
  teaching: {
    name: "Teaching",
    description: "Teaching practices and classroom management.",
    tags: ["teaching", "pedagogy", "classroom"],
    subcategories: [
      "assignments",
      "rubrics",
      "grading",
      "active-learning",
      "project-based-learning",
      "discussions",
      "course-design",
      "classroom-management",
    ],
  },
  cybersecurity: {
    name: "Cybersecurity",
    description: "Information security and defensive practices.",
    tags: ["security", "cybersecurity", "infosec"],
    subcategories: [
      "offensive-security",
      "defensive-security",
      "malware",
      "cryptography",
      "incident-response",
      "digital-forensics",
      "standards",
      "compliance",
      "vulnerability-management",
      "threat-intelligence",
    ],
  },
  ai: {
    name: "Artificial Intelligence",
    description: "Artificial intelligence and machine learning.",
    tags: ["ai", "ml", "machine-learning"],
    subcategories: [
      "llms",
      "machine-learning",
      "agents",
      "embeddings",
      "rag",
      "computer-vision",
      "nlp",
      "industry",
      "reinforcement-learning",
      "ai-safety",
    ],
  },
  research: {
    name: "Research",
    description: "Academic and technical research.",
    tags: ["research", "science", "academia"],
    subcategories: [
      "computer-science",
      "engineering",
      "education",
      "methodology",
      "statistics",
      "papers",
      "reproducibility",
      "peer-review",
    ],
  },
  business: {
    name: "Business",
    description: "Organizations and management.",
    tags: ["business", "management", "organization"],
    subcategories: [
      "strategy",
      "leadership",
      "operations",
      "entrepreneurship",
      "product-management",
      "project-management",
      "marketing",
      "sales",
    ],
  },
  finance: {
    name: "Finance",
    description: "Personal and organizational finance.",
    tags: ["finance", "investing", "money"],
    subcategories: [
      "investing",
      "retirement",
      "taxes",
      "real-estate",
      "budgeting",
      "dividends",
      "personal-finance",
      "markets",
    ],
  },
  career: {
    name: "Career",
    description: "Professional development and employment topics.",
    tags: ["career", "jobs", "leadership", "employment"],
    subcategories: [
      "resumes",
      "interviewing",
      "hiring",
      "compensation",
      "leadership",
      "management",
      "job-market",
      "professional-development",
    ],
  },
} as const satisfies SourceCategoryTaxonomy;

/** Union of valid top-level category keys. */
export type CategoryName = keyof typeof SOURCE_CATEGORIES;

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

/** Return all top-level category keys (kebab-case). */
export function listCategories(): string[] {
  return Object.keys(SOURCE_CATEGORIES);
}

/**
 * Return the subcategories for `category`, or an empty array if the category
 * is unknown.
 */
export function listSubcategories(category: string): string[] {
  const entry = SOURCE_CATEGORIES[category as CategoryName];
  return entry ? [...entry.subcategories] : [];
}

/** Return `true` if `category` is a known top-level category. */
export function validateCategory(category: string): boolean {
  return category in SOURCE_CATEGORIES;
}

/** Return `true` if `subcategory` is valid for `category`. */
export function validateSubcategory(
  category: string,
  subcategory: string,
): boolean {
  const entry = SOURCE_CATEGORIES[category as CategoryName];
  return Boolean(entry) && entry.subcategories.includes(subcategory as never);
}

/**
 * Return the category key whose tags include `tag` (case-insensitive), or
 * `null` if no category lists the tag.
 */
export function findCategoryByTag(tag: string): string | null {
  const needle = tag.trim().toLowerCase();
  for (const [key, entry] of Object.entries(SOURCE_CATEGORIES)) {
    if (
      needle === key.toLowerCase() ||
      entry.tags.some((t) => t.toLowerCase() === needle)
    ) {
      return key;
    }
  }
  return null;
}
