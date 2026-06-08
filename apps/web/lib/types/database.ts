export interface Source {
  id: number;
  title: string;
  url: string;
  domain: string;
  source_type: string;
  category: string | null;
  subcategory: string | null;
  trust_level: string | null;
  published_at: string | null;
  fetched_at: string | null;
  accessed_at: string;
  raw_path: string | null;
  extracted_text_path: string | null;
  content: string | null;
  tags: string[];
}

export interface Feed {
  id: number;
  name: string;
  url: string;
  category: string | null;
  subcategory: string | null;
  tags: string[];
  enabled: boolean;
  last_fetched_at: string | null;
  created_at: string;
}

export interface Job {
  id: number;
  job_type: string;
  payload: Record<string, unknown>;
  status: string;
  error: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  retry_count: number;
}

export interface ResearchReport {
  id: number;
  query: string;
  title: string;
  content: string;
  markdown: string | null;
  source_ids: number[];
  created_at: string;
}

export interface SavedQuery {
  id: string;
  title: string;
  query: string;
  category: string | null;
  subcategory: string | null;
  active: boolean;
  created_at: string;
}

export interface QueryResult {
  id: string;
  saved_query_id: string;
  report_id: number;
  created_at: string;
}

/** A report summary joined to a saved query via query_results. */
export interface RelatedReport {
  id: number;
  title: string;
  created_at: string;
}

/** Join row linking a report to a source it was built from. */
export interface ReportSource {
  report_id: number;
  source_id: number;
  rank: number | null;
  created_at: string;
}

/** A source summary referenced by a report (for the "Sources Used" list). */
export interface ReportSourceSummary {
  id: number;
  title: string;
  url: string;
  domain: string;
  category: string | null;
  rank: number | null;
}

/** A report summary that referenced a source (for the "Used In Reports" list). */
export interface SourceReportSummary {
  id: number;
  title: string;
  created_at: string;
  rank: number | null;
}

/** A source detail with the reports that used it. */
export interface SourceWithReports extends Source {
  reports: SourceReportSummary[];
}

/** A single full-text search hit. */
export interface SearchResult extends Source {
  rank?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
}
