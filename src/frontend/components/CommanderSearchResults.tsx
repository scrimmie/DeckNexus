import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, Sparkles } from "lucide-react";
import type { Card as ScryfallCard } from "@/types/scryfall";

interface CommanderSearchResultsProps {
  results: ScryfallCard[];
  onSelect: (card: ScryfallCard) => void;
  isLoading?: boolean;
}

function getColorIdentityBadges(colorIdentity?: string[]) {
  if (!colorIdentity || colorIdentity.length === 0) {
    return [
      <Badge
        key="colorless"
        variant="secondary"
        className="bg-slate-600 text-xs"
      >
        Colorless
      </Badge>,
    ];
  }

  const colorMap: Record<string, { name: string; className: string }> = {
    W: {
      name: "W",
      className: "bg-yellow-100 text-yellow-800 border-yellow-300",
    },
    U: { name: "U", className: "bg-blue-100 text-blue-800 border-blue-300" },
    B: { name: "B", className: "bg-slate-100 text-slate-800 border-slate-300" },
    R: { name: "R", className: "bg-red-100 text-red-800 border-red-300" },
    G: { name: "G", className: "bg-green-100 text-green-800 border-green-300" },
  };

  return colorIdentity
    .map((color) => {
      const colorInfo = colorMap[color];
      if (!colorInfo) return null;

      return (
        <Badge
          key={color}
          variant="outline"
          className={`${colorInfo.className} text-xs`}
        >
          {colorInfo.name}
        </Badge>
      );
    })
    .filter(Boolean);
}

function formatManaCost(manaCost?: string): string {
  if (!manaCost) return "";
  return manaCost;
}

export function CommanderSearchResults({
  results,
  onSelect,
  isLoading = false,
}: CommanderSearchResultsProps) {
  if (isLoading) {
    return (
      <Card className="bg-slate-800 border-slate-600">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-2 text-slate-400">
              <Sparkles className="h-5 w-5 animate-pulse" />
              <span>Searching for commanders...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (results.length === 0) {
    return null;
  }

  return (
    <Card className="bg-slate-800 border-slate-600">
      <CardContent className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Crown className="h-5 w-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">
            Search Results ({results.length} commander
            {results.length !== 1 ? "s" : ""} found)
          </h3>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {results.map((card) => (
            <div
              key={card.id}
              className="flex items-center justify-between p-4 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 mb-2">
                  <h4 className="font-medium text-white truncate">
                    {card.name}
                  </h4>
                  <span className="text-slate-400 text-sm">
                    {formatManaCost(card.mana_cost)}
                  </span>
                </div>

                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-slate-300 text-sm">
                    {card.type_line}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-slate-400 text-xs">Colors:</span>
                  <div className="flex space-x-1">
                    {getColorIdentityBadges(card.color_identity)}
                  </div>
                  {card.power && card.toughness && (
                    <>
                      <span className="text-slate-400 text-xs ml-4">P/T:</span>
                      <span className="text-slate-300 text-xs font-mono">
                        {card.power}/{card.toughness}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <Button
                onClick={() => onSelect(card)}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white ml-4"
              >
                Select
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
