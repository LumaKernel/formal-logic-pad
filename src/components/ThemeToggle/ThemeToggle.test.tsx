import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { ThemeProvider } from "../../lib/theme/ThemeProvider";
import { THEME_STORAGE_KEY } from "../../lib/theme";
import { ThemeToggle } from "./ThemeToggle";
import type { ReactNode } from "react";

function renderWithProvider(ui: ReactNode) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe("ThemeToggle", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders three theme buttons", () => {
    renderWithProvider(<ThemeToggle />);
    expect(screen.getByTestId("theme-toggle-light")).toBeDefined();
    expect(screen.getByTestId("theme-toggle-dark")).toBeDefined();
    expect(screen.getByTestId("theme-toggle-system")).toBeDefined();
  });

  it("renders with radiogroup role", () => {
    renderWithProvider(<ThemeToggle />);
    const group = screen.getByTestId("theme-toggle");
    expect(group.getAttribute("role")).toBe("radiogroup");
    expect(group.getAttribute("aria-label")).toBe("Theme selection");
  });

  it("shows labels by default", () => {
    renderWithProvider(<ThemeToggle />);
    expect(screen.getByText("Light")).toBeDefined();
    expect(screen.getByText("Dark")).toBeDefined();
    expect(screen.getByText("System")).toBeDefined();
  });

  it("hides labels when showLabels is false", () => {
    renderWithProvider(<ThemeToggle showLabels={false} />);
    expect(screen.queryByText("Light")).toBeNull();
    expect(screen.queryByText("Dark")).toBeNull();
    expect(screen.queryByText("System")).toBeNull();
  });

  it("marks system as active by default", () => {
    renderWithProvider(<ThemeToggle />);
    const systemBtn = screen.getByTestId("theme-toggle-system");
    expect(systemBtn.getAttribute("aria-checked")).toBe("true");
    expect(
      screen.getByTestId("theme-toggle-light").getAttribute("aria-checked"),
    ).toBe("false");
    expect(
      screen.getByTestId("theme-toggle-dark").getAttribute("aria-checked"),
    ).toBe("false");
  });

  it("has correct aria-labels", () => {
    renderWithProvider(<ThemeToggle />);
    expect(
      screen.getByTestId("theme-toggle-light").getAttribute("aria-label"),
    ).toBe("Switch theme (current: Light)");
    expect(
      screen.getByTestId("theme-toggle-dark").getAttribute("aria-label"),
    ).toBe("Switch theme (current: Dark)");
    expect(
      screen.getByTestId("theme-toggle-system").getAttribute("aria-label"),
    ).toBe("Switch theme (current: System)");
  });

  it("has role=radio on each button", () => {
    renderWithProvider(<ThemeToggle />);
    expect(screen.getByTestId("theme-toggle-light").getAttribute("role")).toBe(
      "radio",
    );
    expect(screen.getByTestId("theme-toggle-dark").getAttribute("role")).toBe(
      "radio",
    );
    expect(screen.getByTestId("theme-toggle-system").getAttribute("role")).toBe(
      "radio",
    );
  });

  it("switches to dark mode when dark button is clicked", async () => {
    const user = userEvent.setup();
    renderWithProvider(<ThemeToggle />);

    await user.click(screen.getByTestId("theme-toggle-dark"));

    expect(
      screen.getByTestId("theme-toggle-dark").getAttribute("aria-checked"),
    ).toBe("true");
    expect(
      screen.getByTestId("theme-toggle-system").getAttribute("aria-checked"),
    ).toBe("false");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
  });

  it("switches to light mode when light button is clicked", async () => {
    const user = userEvent.setup();
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    renderWithProvider(<ThemeToggle />);

    await user.click(screen.getByTestId("theme-toggle-light"));

    expect(
      screen.getByTestId("theme-toggle-light").getAttribute("aria-checked"),
    ).toBe("true");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
  });

  it("switches to system mode when system button is clicked", async () => {
    const user = userEvent.setup();
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    renderWithProvider(<ThemeToggle />);

    await user.click(screen.getByTestId("theme-toggle-system"));

    expect(
      screen.getByTestId("theme-toggle-system").getAttribute("aria-checked"),
    ).toBe("true");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("system");
  });

  it("is keyboard accessible via Enter", async () => {
    const user = userEvent.setup();
    renderWithProvider(<ThemeToggle />);

    // Tab to the first button (light)
    await user.tab();
    // The focus should be on the first button
    expect(document.activeElement).toBe(
      screen.getByTestId("theme-toggle-light"),
    );

    // Press Enter to activate
    await user.keyboard("{Enter}");
    expect(
      screen.getByTestId("theme-toggle-light").getAttribute("aria-checked"),
    ).toBe("true");
  });

  it("is keyboard accessible via Space", async () => {
    const user = userEvent.setup();
    renderWithProvider(<ThemeToggle />);

    // Tab to first button, then to dark button
    await user.tab();
    await user.tab();
    expect(document.activeElement).toBe(
      screen.getByTestId("theme-toggle-dark"),
    );

    // Press Space to activate
    await user.keyboard(" ");
    expect(
      screen.getByTestId("theme-toggle-dark").getAttribute("aria-checked"),
    ).toBe("true");
  });

  it("renders SVG icons with aria-hidden", () => {
    renderWithProvider(<ThemeToggle />);
    const svgs = document.querySelectorAll("svg");
    expect(svgs.length).toBe(3);
    for (const svg of svgs) {
      expect(svg.getAttribute("aria-hidden")).toBe("true");
    }
  });
});
