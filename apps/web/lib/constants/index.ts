export const JOB_STATUS = {
  PENDING: "pending",
  RUNNING: "running",
  COMPLETED: "completed",
  FAILED: "failed",
} as const;

export type JobStatus = (typeof JOB_STATUS)[keyof typeof JOB_STATUS];

export const JOB_TYPES = {
  IMPORT_URL: "import_url",
  FETCH_FEED: "fetch_feed",
  INDEX_SOURCE: "index_source",
} as const;

export const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: "LayoutDashboard" },
  { label: "Sources", href: "/research/sources", icon: "FileText" },
  { label: "Feeds", href: "/research/feeds", icon: "Rss" },
  { label: "Jobs", href: "/research/jobs", icon: "Briefcase" },
  { label: "Reports", href: "/research/reports", icon: "BookOpen" },
  { label: "Import URL", href: "/research/import", icon: "Link" },
] as const;

export const PAGE_SIZE = 20;
