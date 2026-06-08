"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Download } from "lucide-react";

interface ExportButtonProps {
  reportId: number | string;
}

const FORMATS = [
  { value: "md", label: "Markdown (.md)" },
  { value: "json", label: "JSON (.json)" },
  { value: "csv", label: "Sources CSV (.csv)" },
];

/** Lets a user download a report in a chosen format. */
export function ExportButton({ reportId }: ExportButtonProps) {
  const [format, setFormat] = useState("md");

  const handleExport = () => {
    // Trigger a download via the export endpoint (Content-Disposition handles it).
    window.location.href = `/api/reports/${reportId}/export?format=${format}`;
  };

  return (
    <div className="flex items-center gap-2">
      <Select
        value={format}
        onChange={(e) => setFormat(e.target.value)}
        className="w-44"
        aria-label="Export format"
      >
        {FORMATS.map((f) => (
          <option key={f.value} value={f.value}>
            {f.label}
          </option>
        ))}
      </Select>
      <Button type="button" variant="outline" onClick={handleExport}>
        <Download className="mr-1.5 h-4 w-4" />
        Export
      </Button>
    </div>
  );
}
