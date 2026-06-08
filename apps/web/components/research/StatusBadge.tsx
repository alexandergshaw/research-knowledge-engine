import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  active: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
}

/**
 * Renders an active/inactive status badge. Used by the queries table and detail
 * view to make a saved query's enabled state obvious at a glance.
 */
export function StatusBadge({
  active,
  activeLabel = "Active",
  inactiveLabel = "Inactive",
}: StatusBadgeProps) {
  return (
    <Badge variant={active ? "success" : "outline"}>
      {active ? activeLabel : inactiveLabel}
    </Badge>
  );
}
