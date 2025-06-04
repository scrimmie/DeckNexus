import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders DeckNexus heading", () => {
  render(<App />);
  const headingElement = screen.getByText(/magic commander deck builder/i);
  expect(headingElement).toBeInTheDocument();
});
