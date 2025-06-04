import { render, screen } from "@testing-library/react";
import { test, expect } from "vitest";
import App from "./App";

test("renders DeckNexus heading", () => {
  render(<App />);
  // The heading is split across multiple elements, so we search for parts
  const deckText = screen.getByText("Deck");
  const nexusText = screen.getByText("Nexus");
  expect(deckText).toBeInTheDocument();
  expect(nexusText).toBeInTheDocument();
});

test("renders tabs navigation", () => {
  render(<App />);
  const homeTab = screen.getByRole("tab", { name: /home/i });
  const newDeckTab = screen.getByRole("tab", { name: /new deck/i });

  expect(homeTab).toBeInTheDocument();
  expect(newDeckTab).toBeInTheDocument();
});
