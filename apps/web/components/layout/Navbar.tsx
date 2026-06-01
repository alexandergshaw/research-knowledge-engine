import { User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  title?: string;
}

export function Navbar({ title }: NavbarProps) {
  const env = process.env.NODE_ENV;

  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center gap-3">
        {title && <h2 className="font-semibold text-foreground">{title}</h2>}
        {env !== "production" && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 font-medium uppercase">
            {env}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon">
          <User className="h-4 w-4" />
          <span className="sr-only">User menu</span>
        </Button>
      </div>
    </header>
  );
}
