"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Rss,
  Briefcase,
  BookOpen,
  Link as LinkIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Sources", href: "/research/sources", icon: FileText },
  { label: "Feeds", href: "/research/feeds", icon: Rss },
  { label: "Jobs", href: "/research/jobs", icon: Briefcase },
  { label: "Reports", href: "/research/reports", icon: BookOpen },
  { label: "Import URL", href: "/research/import", icon: LinkIcon },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen border-r bg-card">
      <div className="p-6 border-b">
        <h1 className="font-bold text-lg leading-tight">Research Knowledge Engine</h1>
        <p className="text-xs text-muted-foreground mt-1">Control Center</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
