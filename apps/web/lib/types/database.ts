export interface Source {
  id: number;
  title: string;
  url: string;
  domain: string;
  source_type: string;
  category: string | null;
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
  source_ids: number[];
  created_at: string;
}

export interface PaginatedResult<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
}
