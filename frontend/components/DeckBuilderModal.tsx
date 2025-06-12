import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Wand2,
  Info,
  CheckCircle,
  AlertCircle,
  Loader2,
  Users,
  X,
} from "lucide-react";
import { useDeckBuilder } from "@/hooks/useDeckBuilder";
import type { Card as ScryfallCard } from "@/types/scryfall";
import type { DeckBuilderOptions } from "@/services/deckbuilder";
import { DeckDisplay } from "./DeckDisplay";

interface FinalDeck {
  commander: ScryfallCard;
  lands: Array<{ name: string; mana_cost: string; type_line: string }>;
  creatures: Array<{ name: string; mana_cost: string; type_line: string }>;
  spells: Array<{ name: string; mana_cost: string; type_line: string }>;
  totalCards: number;
  manaCurve: Record<number, number>;
  colorDistribution: Record<string, number>;
}

interface DeckBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  commander: ScryfallCard;
}

export function DeckBuilderModal({
  isOpen,
  onClose,
  commander,
}: DeckBuilderModalProps) {
  const {
    isBuilding,
    progress,
    currentStage,
    stageMessage,
    logs,
    error,
    result,
    availableModels,
    cardPoolCount,
    buildDeck,
    loadAvailableModels,
    loadCardPoolCount,
    resetState,
  } = useDeckBuilder();

  const [selectedModel, setSelectedModel] = useState<"local" | "remote">(
    "local"
  );
  const [showOptions, setShowOptions] = useState(false);
  const [options, setOptions] = useState<DeckBuilderOptions>({
    powerLevel: 7,
    includeCombo: true,
  });

  // Load available models and card pool when modal opens
  useEffect(() => {
    if (isOpen) {
      loadAvailableModels();
      loadCardPoolCount(commander.id);
    }
  }, [isOpen, commander.id, loadAvailableModels, loadCardPoolCount]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      resetState();
    }
  }, [isOpen, resetState]);

  const handleBuildDeck = async () => {
    await buildDeck({
      commanderId: commander.id,
      model: selectedModel,
      options,
    });
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const getStageIcon = () => {
    if (error) return <AlertCircle className="h-5 w-5 text-red-400" />;
    if (result) return <CheckCircle className="h-5 w-5 text-green-400" />;
    if (isBuilding)
      return <Loader2 className="h-5 w-5 animate-spin text-purple-400" />;
    return <Wand2 className="h-5 w-5 text-purple-400" />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-800 border border-slate-600 rounded-lg p-6 m-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-purple-400" />
            <h2 className="text-white text-xl font-semibold">
              AI Deck Builder
            </h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClose}
            disabled={isBuilding}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-slate-300 mb-6">
          Build a Commander deck for {commander.name} using AI analysis
        </p>

        <div className="space-y-6">
          {/* Commander Info */}
          <Card className="bg-slate-700 border-slate-600">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-slate-600 rounded-lg flex items-center justify-center">
                  <Users className="h-8 w-8 text-slate-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">{commander.name}</h3>
                  <p className="text-slate-300 text-sm">
                    {commander.type_line}
                  </p>
                  {cardPoolCount !== null && (
                    <Badge variant="secondary" className="mt-1">
                      {cardPoolCount.toLocaleString()} legal cards
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Model Selection */}
          <Card className="bg-slate-700 border-slate-600">
            <CardHeader>
              <CardTitle className="text-white text-sm">AI Model</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex gap-2">
                  {availableModels.includes("local") && (
                    <Button
                      variant={
                        selectedModel === "local" ? "default" : "outline"
                      }
                      onClick={() => setSelectedModel("local")}
                      className="flex-1"
                    >
                      Local LM Studio
                    </Button>
                  )}
                  {availableModels.includes("remote") && (
                    <Button
                      variant={
                        selectedModel === "remote" ? "default" : "outline"
                      }
                      onClick={() => setSelectedModel("remote")}
                      className="flex-1"
                    >
                      Remote (OpenRouter)
                    </Button>
                  )}
                </div>
              </div>

              <Alert className="bg-slate-600 border-slate-500">
                <Info className="h-4 w-4 text-blue-400" />
                <AlertDescription className="text-slate-300 text-sm">
                  {selectedModel === "local"
                    ? "Uses LM Studio running locally. Make sure it's running on port 1234."
                    : "Uses OpenRouter API for more advanced AI analysis. Requires API key."}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Advanced Options */}
          <Card className="bg-slate-700 border-slate-600">
            <CardHeader>
              <CardTitle className="text-white text-sm flex items-center justify-between">
                Advanced Options
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowOptions(!showOptions)}
                  className="text-purple-400 hover:text-purple-300"
                >
                  {showOptions ? "Hide" : "Show"}
                </Button>
              </CardTitle>
            </CardHeader>
            {showOptions && (
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-slate-300 text-sm">
                    Power Level: {options.powerLevel}
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={options.powerLevel || 7}
                    onChange={(e) =>
                      setOptions((prev) => ({
                        ...prev,
                        powerLevel: Number(e.target.value),
                      }))
                    }
                    className="w-full"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-slate-300 text-sm">
                    Include Combo Pieces
                  </label>
                  <input
                    type="checkbox"
                    checked={options.includeCombo}
                    onChange={(e) =>
                      setOptions((prev) => ({
                        ...prev,
                        includeCombo: e.target.checked,
                      }))
                    }
                    className="h-4 w-4"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-slate-300 text-sm">
                    Focus Theme (optional)
                  </label>
                  <Input
                    value={options.focusTheme || ""}
                    onChange={(e) =>
                      setOptions((prev) => ({
                        ...prev,
                        focusTheme: e.target.value,
                      }))
                    }
                    placeholder="e.g., tribal, artifacts, graveyard"
                    className="bg-slate-600 border-slate-500 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-slate-300 text-sm">
                    Budget Limit (optional)
                  </label>
                  <Input
                    type="number"
                    value={options.budget || ""}
                    onChange={(e) =>
                      setOptions((prev) => ({
                        ...prev,
                        budget: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      }))
                    }
                    placeholder="e.g., 100"
                    className="bg-slate-600 border-slate-500 text-white"
                  />
                </div>
              </CardContent>
            )}
          </Card>

          {/* Progress Section */}
          {(isBuilding || result || error) && (
            <Card className="bg-slate-700 border-slate-600">
              <CardHeader>
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  {getStageIcon()}
                  {currentStage || "Ready to Build"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isBuilding && (
                  <div className="space-y-2">
                    <div className="w-full bg-slate-600 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-slate-300 text-sm">{stageMessage}</p>
                  </div>
                )}

                {error && (
                  <Alert className="bg-red-900/20 border-red-600">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <AlertDescription className="text-red-300">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                {result && (
                  <Alert className="bg-green-900/20 border-green-600">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <AlertDescription className="text-green-300">
                      Deck building completed! Your deck is ready.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Deck Display */}
                {result && (
                  <DeckDisplay
                    deck={result as FinalDeck}
                    commander={commander}
                  />
                )}

                {/* Activity Log */}
                {logs.length > 0 && (
                  <div className="bg-slate-800 rounded-lg p-3 max-h-32 overflow-y-auto">
                    <div className="text-xs text-slate-400 space-y-1">
                      {logs.map((log, index) => (
                        <div key={index}>{log}</div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isBuilding}
            >
              {result ? "Close" : "Cancel"}
            </Button>
            {!result && (
              <Button
                onClick={handleBuildDeck}
                disabled={isBuilding || availableModels.length === 0}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isBuilding ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Building...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Build Deck with AI
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
