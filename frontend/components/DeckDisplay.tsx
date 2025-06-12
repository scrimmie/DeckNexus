import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, CheckCircle } from "lucide-react";
import type { Card as ScryfallCard } from "@/types/scryfall";

interface DeckDisplayProps {
  deck: {
    commander: ScryfallCard;
    lands: Array<{ name: string; mana_cost: string; type_line: string }>;
    creatures: Array<{ name: string; mana_cost: string; type_line: string }>;
    spells: Array<{ name: string; mana_cost: string; type_line: string }>;
    totalCards: number;
    manaCurve: Record<number, number>;
    colorDistribution: Record<string, number>;
  };
  commander: ScryfallCard;
}

export function DeckDisplay({ deck }: DeckDisplayProps) {
  const [isCopied, setIsCopied] = useState(false);

  const formatDeckForArchidekt = () => {
    const lines: string[] = [];

    // Commander section
    lines.push("// Commander");
    lines.push(`1 ${deck.commander.name}`);
    lines.push("");

    // Lands section
    if (deck.lands.length > 0) {
      lines.push("// Lands");
      deck.lands.forEach((card) => {
        lines.push(`1 ${card.name}`);
      });
      lines.push("");
    }

    // Creatures section
    if (deck.creatures.length > 0) {
      lines.push("// Creatures");
      deck.creatures.forEach((card) => {
        lines.push(`1 ${card.name}`);
      });
      lines.push("");
    }

    // Spells section (everything else)
    if (deck.spells.length > 0) {
      lines.push("// Spells");
      deck.spells.forEach((card) => {
        lines.push(`1 ${card.name}`);
      });
    }

    return lines.join("\n");
  };

  const handleCopyDeck = async () => {
    try {
      const deckText = formatDeckForArchidekt();
      await navigator.clipboard.writeText(deckText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy deck:", error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with Copy Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-white text-lg font-semibold">
          Your Deck ({deck.totalCards} cards)
        </h3>
        <Button
          onClick={handleCopyDeck}
          variant="outline"
          size="sm"
          className="text-purple-400 border-purple-400 hover:bg-purple-400 hover:text-white"
        >
          {isCopied ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-2" />
              Copy for Archidekt
            </>
          )}
        </Button>
      </div>

      {/* Deck Statistics */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-slate-700 border-slate-600">
          <CardContent className="pt-3 pb-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {deck.lands.length}
              </div>
              <div className="text-sm text-slate-300">Lands</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-700 border-slate-600">
          <CardContent className="pt-3 pb-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {deck.creatures.length}
              </div>
              <div className="text-sm text-slate-300">Creatures</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-700 border-slate-600">
          <CardContent className="pt-3 pb-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {deck.spells.length}
              </div>
              <div className="text-sm text-slate-300">Spells</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mana Curve */}
      {deck.manaCurve && Object.keys(deck.manaCurve).length > 0 && (
        <Card className="bg-slate-700 border-slate-600">
          <CardHeader>
            <CardTitle className="text-white text-sm">Mana Curve</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-center gap-1 h-20">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((cmc) => {
                const count = deck.manaCurve[cmc] || 0;
                const maxCount = Math.max(...Object.values(deck.manaCurve));
                const height = maxCount > 0 ? (count / maxCount) * 60 : 0;

                return (
                  <div key={cmc} className="flex flex-col items-center">
                    <div className="text-xs text-slate-300 mb-1">{count}</div>
                    <div
                      className="w-6 bg-purple-500 rounded-t"
                      style={{
                        height: `${height}px`,
                        minHeight: count > 0 ? "4px" : "0px",
                      }}
                    />
                    <div className="text-xs text-slate-400 mt-1">
                      {cmc >= 7 ? "7+" : cmc}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Card Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Lands */}
        {deck.lands.length > 0 && (
          <Card className="bg-slate-700 border-slate-600">
            <CardHeader>
              <CardTitle className="text-white text-sm flex items-center justify-between">
                Lands ({deck.lands.length})
                <Badge variant="secondary">
                  {((deck.lands.length / (deck.totalCards - 1)) * 100).toFixed(
                    0
                  )}
                  %
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {deck.lands.slice(0, 10).map((card, index) => (
                  <div key={index} className="text-sm text-slate-300">
                    {card.name}
                  </div>
                ))}
                {deck.lands.length > 10 && (
                  <div className="text-sm text-slate-400 italic">
                    +{deck.lands.length - 10} more lands...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Creatures */}
        {deck.creatures.length > 0 && (
          <Card className="bg-slate-700 border-slate-600">
            <CardHeader>
              <CardTitle className="text-white text-sm flex items-center justify-between">
                Creatures ({deck.creatures.length})
                <Badge variant="secondary">
                  {(
                    (deck.creatures.length / (deck.totalCards - 1)) *
                    100
                  ).toFixed(0)}
                  %
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {deck.creatures.slice(0, 10).map((card, index) => (
                  <div key={index} className="text-sm text-slate-300">
                    {card.name}
                  </div>
                ))}
                {deck.creatures.length > 10 && (
                  <div className="text-sm text-slate-400 italic">
                    +{deck.creatures.length - 10} more creatures...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Alert className="bg-blue-900/20 border-blue-600">
        <Copy className="h-4 w-4 text-blue-400" />
        <AlertDescription className="text-blue-300">
          Click "Copy for Archidekt" to copy the deck list in a format that can
          be imported directly into Archidekt.
        </AlertDescription>
      </Alert>
    </div>
  );
}
