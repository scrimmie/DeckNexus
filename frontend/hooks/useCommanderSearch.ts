import { useState, useCallback } from "react";
import { scryfallClient } from "@/services/scryfall";
import type { Card } from "@/types/scryfall";

interface UseCommanderSearchResult {
  searchResults: Card[];
  isLoading: boolean;
  error: string | null;
  selectedCard: Card | null;
  searchCommanders: (query: string) => Promise<void>;
  selectCommander: (card: Card) => void;
  clearSelection: () => void;
  clearResults: () => void;
}

export function useCommanderSearch(): UseCommanderSearchResult {
  const [searchResults, setSearchResults] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  const searchCommanders = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const results = await scryfallClient.searchCommandersByName(query);
      setSearchResults(results);

      if (results.length === 0) {
        setError(
          `No commanders found matching "${query}". Try a different search term.`
        );
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to search commanders"
      );
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectCommander = useCallback((card: Card) => {
    setSelectedCard(card);
    setSearchResults([]); // Clear search results after selection
    setError(null);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedCard(null);
    setError(null);
  }, []);

  const clearResults = useCallback(() => {
    setSearchResults([]);
    setError(null);
  }, []);

  return {
    searchResults,
    isLoading,
    error,
    selectedCard,
    searchCommanders,
    selectCommander,
    clearSelection,
    clearResults,
  };
}
