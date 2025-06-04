import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { X, Crown, Sparkles } from "lucide-react";
import type { Card as ScryfallCard, CardFace } from "@/types/scryfall";
import { ReactElement } from "react";

interface CommanderCardProps {
  card: ScryfallCard;
  onClear?: () => void;
}

// Helper function to get the primary face of a card (for MDFCs, etc.)
function getPrimaryFace(card: ScryfallCard): {
  face: CardFace | ScryfallCard;
  isCardFace: boolean;
} {
  if (card.card_faces && card.card_faces.length > 0) {
    // For multiface cards, return the first face
    return { face: card.card_faces[0], isCardFace: true };
  }
  // For single-face cards, return the card itself
  return { face: card, isCardFace: false };
}

// Helper function to get the best image URL
function getImageUrl(card: ScryfallCard): string | null {
  const { face } = getPrimaryFace(card);

  // Try to get art_crop first (for the art display), then fall back to normal
  if ("image_uris" in face && face.image_uris) {
    return (
      face.image_uris.art_crop ||
      face.image_uris.large ||
      face.image_uris.normal ||
      null
    );
  }

  // If no face-specific images, try card-level images
  if (card.image_uris) {
    return (
      card.image_uris.art_crop ||
      card.image_uris.large ||
      card.image_uris.normal ||
      null
    );
  }

  return null;
}

// Helper function to format mana cost with symbols
function formatManaCost(manaCost?: string): string {
  if (!manaCost) return "";
  // For now, just return the mana cost as-is.
  // In the future, we could parse and display mana symbols
  return manaCost;
}

// Helper function to get color identity badges
function getColorIdentityBadges(colorIdentity?: string[]): ReactElement[] {
  if (!colorIdentity || colorIdentity.length === 0) {
    return [
      <Badge key="colorless" variant="secondary" className="bg-slate-600">
        Colorless
      </Badge>,
    ];
  }

  const colorMap: Record<string, { name: string; className: string }> = {
    W: {
      name: "White",
      className: "bg-yellow-100 text-yellow-800 border-yellow-300",
    },
    U: { name: "Blue", className: "bg-blue-100 text-blue-800 border-blue-300" },
    B: {
      name: "Black",
      className: "bg-slate-100 text-slate-800 border-slate-300",
    },
    R: { name: "Red", className: "bg-red-100 text-red-800 border-red-300" },
    G: {
      name: "Green",
      className: "bg-green-100 text-green-800 border-green-300",
    },
  };

  return colorIdentity
    .map((color) => {
      const colorInfo = colorMap[color];
      if (!colorInfo) return null;

      return (
        <Badge key={color} variant="outline" className={colorInfo.className}>
          {colorInfo.name}
        </Badge>
      );
    })
    .filter(Boolean) as ReactElement[];
}

export function CommanderCard({ card, onClear }: CommanderCardProps) {
  const { face } = getPrimaryFace(card);
  const imageUrl = getImageUrl(card);

  // Get the relevant data from either the card or the primary face
  const name = "name" in face ? face.name : card.name;
  const manaCost = "mana_cost" in face ? face.mana_cost : card.mana_cost;
  const typeLine = "type_line" in face ? face.type_line : card.type_line;
  const oracleText =
    "oracle_text" in face ? face.oracle_text : card.oracle_text;
  const power = "power" in face ? face.power : card.power;
  const toughness = "toughness" in face ? face.toughness : card.toughness;
  const loyalty = "loyalty" in face ? face.loyalty : card.loyalty;

  return (
    <Card className="w-full bg-slate-800 border-slate-600">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Crown className="h-5 w-5 text-purple-400" />
            <CardTitle className="text-white text-xl">Commander</CardTitle>
          </div>
          {onClear && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Split Layout: Image on left, details on right */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Card Art */}
          <div className="space-y-4">
            {imageUrl ? (
              <div className="relative aspect-square rounded-lg overflow-hidden bg-slate-700">
                <img
                  src={imageUrl}
                  alt={name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <p className="text-white font-semibold text-lg">{name}</p>
                  {card.artist && (
                    <p className="text-slate-300 text-sm">
                      Art by {card.artist}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="aspect-square rounded-lg bg-slate-700 flex items-center justify-center">
                <div className="text-center text-slate-400">
                  <Sparkles className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No image available</p>
                </div>
              </div>
            )}
          </div>

          {/* Right: Card Details */}
          <div className="space-y-4">
            {/* Basic Info */}
            <div className="space-y-3">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">{name}</h3>
                <p className="text-slate-300 text-sm">
                  {formatManaCost(manaCost)}
                </p>
              </div>

              <div>
                <p className="text-slate-400 text-sm mb-1">Type</p>
                <p className="text-white">{typeLine}</p>
              </div>

              {/* Color Identity */}
              <div>
                <p className="text-slate-400 text-sm mb-2">Color Identity</p>
                <div className="flex flex-wrap gap-1">
                  {getColorIdentityBadges(card.color_identity)}
                </div>
              </div>

              {/* Power/Toughness or Loyalty */}
              {power && toughness && (
                <div>
                  <p className="text-slate-400 text-sm mb-1">
                    Power / Toughness
                  </p>
                  <p className="text-white font-mono text-lg">
                    {power} / {toughness}
                  </p>
                </div>
              )}

              {loyalty && (
                <div>
                  <p className="text-slate-400 text-sm mb-1">Loyalty</p>
                  <p className="text-white font-mono text-lg">{loyalty}</p>
                </div>
              )}

              {/* Commander Legality */}
              <div>
                <p className="text-slate-400 text-sm mb-1">
                  Commander Legality
                </p>
                <Badge
                  variant={
                    card.legalities.commander === "legal"
                      ? "default"
                      : "destructive"
                  }
                  className={
                    card.legalities.commander === "legal" ? "bg-green-600" : ""
                  }
                >
                  {card.legalities.commander || "Unknown"}
                </Badge>
              </div>
            </div>

            <Separator className="bg-slate-600" />

            {/* Oracle Text in Accordion */}
            {oracleText && (
              <Accordion type="single" collapsible>
                <AccordionItem value="oracle-text" className="border-slate-600">
                  <AccordionTrigger className="text-white hover:text-slate-300">
                    Oracle Text
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-300">
                    <div className="whitespace-pre-wrap">{oracleText}</div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}

            {/* Set Information */}
            <div className="text-sm text-slate-400">
              <p>
                <span className="font-medium">Set:</span> {card.set_name} (
                {card.set.toUpperCase()})
              </p>
              <p>
                <span className="font-medium">Rarity:</span> {card.rarity}
              </p>
              {card.collector_number && (
                <p>
                  <span className="font-medium">Collector Number:</span>{" "}
                  {card.collector_number}
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Loading skeleton component
export function CommanderCardSkeleton() {
  return (
    <Card className="w-full bg-slate-800 border-slate-600">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-2">
          <Crown className="h-5 w-5 text-purple-400" />
          <Skeleton className="h-6 w-32 bg-slate-700" />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Image skeleton */}
          <Skeleton className="aspect-square rounded-lg bg-slate-700" />

          {/* Right: Details skeleton */}
          <div className="space-y-4">
            <div className="space-y-3">
              <Skeleton className="h-8 w-3/4 bg-slate-700" />
              <Skeleton className="h-4 w-1/2 bg-slate-700" />
              <Skeleton className="h-4 w-full bg-slate-700" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16 bg-slate-700" />
                <Skeleton className="h-6 w-16 bg-slate-700" />
              </div>
              <Skeleton className="h-6 w-20 bg-slate-700" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
