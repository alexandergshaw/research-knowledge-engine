"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface SearchBarProps {
  defaultValue?: string;
  onSearch: (keyword: string) => void;
  placeholder?: string;
}

/** Free-text search input with submit. */
export function SearchBar({
  defaultValue = "",
  onSearch,
  placeholder = "Search sources…",
}: SearchBarProps) {
  const [value, setValue] = useState(defaultValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(value.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="max-w-md"
      />
      <Button type="submit">
        <Search className="mr-1.5 h-4 w-4" />
        Search
      </Button>
    </form>
  );
}
