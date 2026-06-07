import { Badge } from "@/components/ui/badge";

interface JobStatusBadgeProps {
  status: string;
}

export function JobStatusBadge({ status }: JobStatusBadgeProps) {
  const variantMap: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "running" | "failed"> = {
    pending: "warning",
    running: "running",
    done: "success",
    completed: "success",
    failed: "failed",
  };

  return (
    <Badge variant={variantMap[status] ?? "outline"}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}
