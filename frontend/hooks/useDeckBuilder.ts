import { useState, useCallback } from "react";
import {
  deckBuilderAPI,
  type DeckBuilderProgress,
  type DeckBuilderRequest,
} from "../services/deckbuilder";

export interface DeckBuilderState {
  isBuilding: boolean;
  progress: number;
  currentStage: string;
  stageMessage: string;
  logs: string[];
  error: string | null;
  result: unknown | null;
  availableModels: string[];
  cardPoolCount: number | null;
}

export function useDeckBuilder() {
  const [state, setState] = useState<DeckBuilderState>({
    isBuilding: false,
    progress: 0,
    currentStage: "",
    stageMessage: "",
    logs: [],
    error: null,
    result: null,
    availableModels: [],
    cardPoolCount: null,
  });

  const addLog = useCallback((message: string) => {
    setState((prev) => ({
      ...prev,
      logs: [...prev.logs, `${new Date().toLocaleTimeString()}: ${message}`],
    }));
  }, []);

  const handleProgress = useCallback(
    (progress: DeckBuilderProgress) => {
      setState((prev) => {
        const newState = { ...prev };

        switch (progress.type) {
          case "connected":
            newState.isBuilding = true;
            newState.error = null;
            newState.logs = [];
            addLog("Connected to deck builder service");
            break;

          case "stageStarted":
            newState.currentStage = progress.stage || "";
            newState.stageMessage = progress.message || "";
            addLog(`Starting: ${progress.message}`);
            break;

          case "stageFinished":
            addLog(`Completed: ${progress.message}`);
            newState.progress = Math.min(100, newState.progress + 20); // Roughly 20% per stage
            break;

          case "progress":
            newState.progress = progress.progress || newState.progress;
            if (progress.message) {
              newState.stageMessage = progress.message;
            }
            break;

          case "complete":
            newState.isBuilding = false;
            newState.progress = 100;
            newState.result = progress.result;
            newState.currentStage = "Complete";
            newState.stageMessage = "Deck building completed successfully!";
            addLog("Deck building completed successfully!");
            break;

          case "error":
            newState.isBuilding = false;
            newState.error = progress.error || "Unknown error occurred";
            newState.currentStage = "Error";
            newState.stageMessage = progress.error || "Unknown error occurred";
            addLog(`Error: ${progress.error}`);
            break;
        }

        return newState;
      });
    },
    [addLog]
  );

  const loadAvailableModels = useCallback(async () => {
    try {
      const models = await deckBuilderAPI.getAvailableModels();
      setState((prev) => ({ ...prev, availableModels: models }));
    } catch (error) {
      console.error("Failed to load available models:", error);
      setState((prev) => ({
        ...prev,
        error: "Failed to load available AI models",
        availableModels: ["local"], // Fallback to local only
      }));
    }
  }, []);

  const loadCardPoolCount = useCallback(async (commanderId: string) => {
    try {
      setState((prev) => ({ ...prev, cardPoolCount: null }));
      const count = await deckBuilderAPI.getCardPoolCount(commanderId);
      setState((prev) => ({ ...prev, cardPoolCount: count }));
    } catch (error) {
      console.error("Failed to load card pool count:", error);
      setState((prev) => ({
        ...prev,
        error: "Failed to load card pool information",
      }));
    }
  }, []);

  const buildDeck = useCallback(
    async (request: DeckBuilderRequest) => {
      try {
        setState((prev) => ({
          ...prev,
          isBuilding: true,
          progress: 0,
          error: null,
          result: null,
          logs: [],
          currentStage: "Initializing",
          stageMessage: "Starting deck building process...",
        }));

        await deckBuilderAPI.buildDeck(request, handleProgress);
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isBuilding: false,
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
          currentStage: "Error",
          stageMessage: "Deck building failed",
        }));
        addLog(
          `Error: ${
            error instanceof Error ? error.message : "Unknown error occurred"
          }`
        );
      }
    },
    [handleProgress, addLog]
  );

  const resetState = useCallback(() => {
    setState({
      isBuilding: false,
      progress: 0,
      currentStage: "",
      stageMessage: "",
      logs: [],
      error: null,
      result: null,
      availableModels: [],
      cardPoolCount: null,
    });
  }, []);

  return {
    ...state,
    buildDeck,
    loadAvailableModels,
    loadCardPoolCount,
    resetState,
  };
}
