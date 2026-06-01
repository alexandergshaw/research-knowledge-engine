import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Rss, Briefcase, BookOpen } from "lucide-react";

interface StatsCardsProps {
  sources: number;
  feeds: number;
  jobs: number;
  reports: number;
}

export function StatsCards({ sources, feeds, jobs, reports }: StatsCardsProps) {
  const stats = [
    {
      label: "Total Sources",
      value: sources,
      icon: FileText,
      description: "Indexed research documents",
    },
    {
      label: "Total Feeds",
      value: feeds,
      icon: Rss,
      description: "Configured RSS feeds",
    },
    {
      label: "Total Jobs",
      value: jobs,
      icon: Briefcase,
      description: "Background worker jobs",
    },
    {
      label: "Total Reports",
      value: reports,
      icon: BookOpen,
      description: "Generated research reports",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
