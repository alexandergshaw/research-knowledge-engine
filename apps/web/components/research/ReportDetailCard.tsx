"use client";

import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import type { ResearchReport } from "@/lib/types/database";

interface ReportDetailCardProps {
  report: ResearchReport;
}

/**
 * Tailwind styling for rendered markdown. The typography plugin is not enabled
 * in this project, so element styles are applied explicitly.
 */
const markdownComponents: Components = {
  h1: ({ ...props }) => <h1 className="mt-6 mb-3 text-2xl font-bold" {...props} />,
  h2: ({ ...props }) => <h2 className="mt-6 mb-3 text-xl font-semibold" {...props} />,
  h3: ({ ...props }) => <h3 className="mt-4 mb-2 text-lg font-semibold" {...props} />,
  p: ({ ...props }) => <p className="mb-4 leading-relaxed" {...props} />,
  ul: ({ ...props }) => <ul className="mb-4 list-disc space-y-1 pl-6" {...props} />,
  ol: ({ ...props }) => <ol className="mb-4 list-decimal space-y-1 pl-6" {...props} />,
  li: ({ ...props }) => <li className="leading-relaxed" {...props} />,
  a: ({ ...props }) => (
    <a className="text-primary underline hover:no-underline" target="_blank" rel="noopener noreferrer" {...props} />
  ),
  blockquote: ({ ...props }) => (
    <blockquote className="mb-4 border-l-2 border-border pl-4 italic text-muted-foreground" {...props} />
  ),
  code: ({ ...props }) => (
    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm" {...props} />
  ),
  pre: ({ ...props }) => (
    <pre className="mb-4 overflow-x-auto rounded-md bg-muted p-4 text-sm" {...props} />
  ),
  table: ({ ...props }) => (
    <div className="mb-4 overflow-x-auto">
      <table className="w-full border-collapse text-sm" {...props} />
    </div>
  ),
  th: ({ ...props }) => (
    <th className="border border-border bg-muted px-3 py-2 text-left font-semibold" {...props} />
  ),
  td: ({ ...props }) => <td className="border border-border px-3 py-2" {...props} />,
  hr: ({ ...props }) => <hr className="my-6 border-border" {...props} />,
};

export function ReportDetailCard({ report }: ReportDetailCardProps) {
  const body = report.markdown ?? report.content ?? "";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{report.title}</h2>
        <p className="mt-1 text-muted-foreground">
          Created {formatDateTime(report.created_at)}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Query</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm italic text-muted-foreground">{report.query}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Report</CardTitle>
        </CardHeader>
        <CardContent>
          {body.trim() ? (
            <div className="max-w-none text-sm text-foreground">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {body}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              This report has no content yet.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sources Used</CardTitle>
        </CardHeader>
        <CardContent>
          {report.source_ids && report.source_ids.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {report.source_ids.map((id) => (
                <a
                  key={id}
                  href={`/research/sources/${id}`}
                  className="text-xs text-primary hover:underline"
                >
                  Source #{id}
                </a>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Source tracking will be available in a future release.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
