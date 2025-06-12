import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Wand2, Info } from "lucide-react";
import { CommanderSearchBar } from "./CommanderSearchBar";
import { CommanderSearchResults } from "./CommanderSearchResults";
import { CommanderCard } from "./CommanderCard";
import { DeckBuilderModal } from "./DeckBuilderModal";
import { useCommanderSearch } from "@/hooks/useCommanderSearch";

export function NewDeckPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    searchResults,
    isLoading,
    error,
    selectedCard,
    searchCommanders,
    selectCommander,
    clearSelection,
    clearResults,
  } = useCommanderSearch();

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <Wand2 className="h-8 w-8 text-purple-400" />
          <h1 className="text-4xl font-bold text-white">Create New Deck</h1>
        </div>
        <p className="text-slate-300 text-lg max-w-2xl mx-auto">
          Start by searching for your commander. Enter a commander name and
          click search to see all matching legendary creatures and
          planeswalkers.
        </p>
      </div>

      {/* Commander Search Section */}
      <Card className="bg-slate-800 border-slate-600">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <span>Search for Your Commander</span>
            {isLoading && (
              <Loader2 className="h-5 w-5 animate-spin text-purple-400" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <CommanderSearchBar
            onSearch={searchCommanders}
            isLoading={isLoading}
            onClear={clearResults}
            placeholder="Enter commander name (e.g., Atraxa, Ur-Dragon, Jace)..."
          />

          {/* Info about commander requirements */}
          <Alert className="bg-slate-700 border-slate-600">
            <Info className="h-4 w-4 text-blue-400" />
            <AlertDescription className="text-slate-300">
              Search for legendary creatures and planeswalkers that can be
              commanders. Results will be sorted by name similarity.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Search Results Section */}
      {(isLoading || searchResults.length > 0) && (
        <CommanderSearchResults
          results={searchResults}
          onSelect={selectCommander}
          isLoading={isLoading}
        />
      )}

      {/* Error Display */}
      {error && (
        <Alert className="bg-red-900/20 border-red-600">
          <AlertDescription className="text-red-300">{error}</AlertDescription>
        </Alert>
      )}

      {/* Commander Display Section */}
      {selectedCard ? (
        <CommanderCard card={selectedCard} onClear={clearSelection} />
      ) : (
        !isLoading &&
        searchResults.length === 0 &&
        !error && (
          <Card className="bg-slate-800 border-slate-600">
            <CardContent className="py-16">
              <div className="text-center text-slate-400">
                <Wand2 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-medium mb-2">Ready to Search</h3>
                <p className="text-sm">
                  Enter a commander name in the search bar above to find
                  matching cards.
                </p>
              </div>
            </CardContent>
          </Card>
        )
      )}

      {/* Future: Deck Building Actions */}
      {selectedCard && (
        <Card className="bg-slate-800 border-slate-600">
          <CardHeader>
            <CardTitle className="text-white">Next Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <p className="text-slate-300">
                Great choice! {selectedCard.name} will make an excellent
                commander.
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
                  onClick={() => setIsModalOpen(true)}
                >
                  <Wand2 className="h-4 w-4" />
                  Generate Deck with AI
                </button>
                <button
                  className="px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  disabled
                >
                  Manual Deck Builder (Coming Soon)
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Deck Builder Modal */}
      {selectedCard && (
        <DeckBuilderModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          commander={selectedCard}
        />
      )}
    </div>
  );
}
