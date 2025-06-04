import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, X } from "lucide-react";

interface CommanderSearchBarProps {
  onSearch: (query: string) => Promise<void>;
  isLoading: boolean;
  onClear?: () => void;
  placeholder?: string;
}

export function CommanderSearchBar({
  onSearch,
  isLoading,
  onClear,
  placeholder = "Enter commander name (e.g., Atraxa, Ur-Dragon, Jace)...",
}: CommanderSearchBarProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      await onSearch(query.trim());
    }
  };

  const handleClear = () => {
    setQuery("");
    if (onClear) {
      onClear();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading) {
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            className="pl-10 pr-10 bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:ring-purple-500 focus:border-purple-500"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              disabled={isLoading}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <Button
          type="submit"
          disabled={!query.trim() || isLoading}
          className="bg-purple-600 hover:bg-purple-700 text-white min-w-[100px]"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Search
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
