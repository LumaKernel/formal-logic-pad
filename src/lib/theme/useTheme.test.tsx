import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import {
  loadThemeMode,
  saveThemeMode,
  applyThemeToDocument,
  markThemeLoaded,
  useTheme,
  type ThemeDocument,
} from "./useTheme";
import {
  ThemeProvider,
  useThemeContext,
  useResolvedTheme,
  useThemeMode,
} from "./ThemeProvider";
import {
  THEME_STORAGE_KEY,
  THEME_DATA_ATTRIBUTE,
  THEME_LOADED_ATTRIBUTE,
} from "./themeLogic";
import type { ReactNode } from "react";

// --- Pure function tests ---

describe("loadThemeMode", () => {
  it("returns 'system' when localStorage is empty", () => {
    const storage = createMockStorage({});
    expect(loadThemeMode(storage)).toBe("system");
  });

  it("returns stored value when valid", () => {
    const storage = createMockStorage({ [THEME_STORAGE_KEY]: "dark" });
    expect(loadThemeMode(storage)).toBe("dark");
  });

  it("returns 'system' for invalid stored value", () => {
    const storage = createMockStorage({ [THEME_STORAGE_KEY]: "invalid" });
    expect(loadThemeMode(storage)).toBe("system");
  });

  it("returns 'light' when stored", () => {
    const storage = createMockStorage({ [THEME_STORAGE_KEY]: "light" });
    expect(loadThemeMode(storage)).toBe("light");
  });
});

describe("saveThemeMode", () => {
  it("saves mode to storage", () => {
    const storage = createMockStorage({});
    saveThemeMode(storage, "dark");
    expect(storage.getItem(THEME_STORAGE_KEY)).toBe("dark");
  });

  it("overwrites previous value", () => {
    const storage = createMockStorage({ [THEME_STORAGE_KEY]: "light" });
    saveThemeMode(storage, "system");
    expect(storage.getItem(THEME_STORAGE_KEY)).toBe("system");
  });
});

describe("applyThemeToDocument", () => {
  it("sets data-theme attribute on documentElement", () => {
    const doc = createMockDocument();
    applyThemeToDocument("dark", doc);
    expect(doc.documentElement.getAttribute(THEME_DATA_ATTRIBUTE)).toBe("dark");
  });

  it("updates attribute when called again", () => {
    const doc = createMockDocument();
    applyThemeToDocument("dark", doc);
    applyThemeToDocument("light", doc);
    expect(doc.documentElement.getAttribute(THEME_DATA_ATTRIBUTE)).toBe(
      "light",
    );
  });
});

describe("markThemeLoaded", () => {
  it("sets data-theme-loaded attribute on documentElement", () => {
    const doc = createMockDocument();
    markThemeLoaded(doc);
    expect(doc.documentElement.hasAttribute(THEME_LOADED_ATTRIBUTE)).toBe(true);
  });

  it("does not overwrite if already set", () => {
    const doc = createMockDocument();
    const setAttrSpy = vi.spyOn(doc.documentElement, "setAttribute");
    markThemeLoaded(doc);
    markThemeLoaded(doc);
    // setAttribute should only be called once
    const loadedCalls = setAttrSpy.mock.calls.filter(
      ([name]) => name === THEME_LOADED_ATTRIBUTE,
    );
    expect(loadedCalls).toHaveLength(1);
  });
});

// --- useTheme hook tests ---

describe("useTheme", () => {
  let originalMatchMedia: typeof window.matchMedia;
  let mediaListeners: Array<() => void>;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute(THEME_DATA_ATTRIBUTE);
    document.documentElement.removeAttribute(THEME_LOADED_ATTRIBUTE);
    mediaListeners = [];
    originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: (_event: string, cb: () => void) => {
        mediaListeners.push(cb);
      },
      removeEventListener: (_event: string, cb: () => void) => {
        mediaListeners = mediaListeners.filter((l) => l !== cb);
      },
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  function TestComponent(): ReactNode {
    const { mode, resolved, setMode } = useTheme();
    return (
      <div>
        <span data-testid="mode">{mode}</span>
        <span data-testid="resolved">{resolved}</span>
        <button data-testid="set-dark" onClick={() => setMode("dark")}>
          Dark
        </button>
        <button data-testid="set-light" onClick={() => setMode("light")}>
          Light
        </button>
        <button data-testid="set-system" onClick={() => setMode("system")}>
          System
        </button>
      </div>
    );
  }

  it("defaults to system mode when localStorage is empty", () => {
    render(<TestComponent />);
    expect(screen.getByTestId("mode").textContent).toBe("system");
  });

  it("resolves system mode to light when system prefers light", () => {
    render(<TestComponent />);
    expect(screen.getByTestId("resolved").textContent).toBe("light");
  });

  it("loads mode from localStorage", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    render(<TestComponent />);
    expect(screen.getByTestId("mode").textContent).toBe("dark");
    expect(screen.getByTestId("resolved").textContent).toBe("dark");
  });

  it("saves mode to localStorage on change", async () => {
    const user = userEvent.setup();
    render(<TestComponent />);
    await user.click(screen.getByTestId("set-dark"));
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
  });

  it("updates resolved theme when mode changes", async () => {
    const user = userEvent.setup();
    render(<TestComponent />);
    await user.click(screen.getByTestId("set-dark"));
    expect(screen.getByTestId("resolved").textContent).toBe("dark");
    await user.click(screen.getByTestId("set-light"));
    expect(screen.getByTestId("resolved").textContent).toBe("light");
  });

  it("applies data-theme attribute to documentElement", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    render(<TestComponent />);
    expect(document.documentElement.getAttribute(THEME_DATA_ATTRIBUTE)).toBe(
      "dark",
    );
  });

  it("sets data-theme-loaded after initial render via requestAnimationFrame", async () => {
    const rafCallbacks: Array<FrameRequestCallback> = [];
    const originalRaf = window.requestAnimationFrame;
    window.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
      rafCallbacks.push(cb);
      return 0;
    });

    try {
      render(<TestComponent />);
      // data-theme-loaded should not be set yet (rAF hasn't fired)
      expect(
        document.documentElement.hasAttribute(THEME_LOADED_ATTRIBUTE),
      ).toBe(false);

      // Fire rAF callback
      act(() => {
        for (const cb of rafCallbacks) {
          cb(0);
        }
      });

      expect(
        document.documentElement.hasAttribute(THEME_LOADED_ATTRIBUTE),
      ).toBe(true);
    } finally {
      window.requestAnimationFrame = originalRaf;
    }
  });

  it("reacts to system preference changes in system mode", () => {
    // Start with system mode, system prefers light
    render(<TestComponent />);
    expect(screen.getByTestId("resolved").textContent).toBe("light");

    // Simulate system preference change to dark
    (window.matchMedia as ReturnType<typeof vi.fn>).mockImplementation(
      (query: string) => ({
        matches: true,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    );

    // Trigger listeners
    act(() => {
      for (const listener of mediaListeners) {
        listener();
      }
    });

    expect(screen.getByTestId("resolved").textContent).toBe("dark");
  });
});

// --- ThemeProvider / context tests ---

describe("ThemeProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute(THEME_DATA_ATTRIBUTE);
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

  function ContextConsumer(): ReactNode {
    const { mode, resolved, setMode } = useThemeContext();
    return (
      <div>
        <span data-testid="ctx-mode">{mode}</span>
        <span data-testid="ctx-resolved">{resolved}</span>
        <button data-testid="ctx-set-dark" onClick={() => setMode("dark")}>
          Dark
        </button>
      </div>
    );
  }

  it("provides theme context to children", () => {
    render(
      <ThemeProvider>
        <ContextConsumer />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("ctx-mode").textContent).toBe("system");
    expect(screen.getByTestId("ctx-resolved").textContent).toBe("light");
  });

  it("allows setting mode through context", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ContextConsumer />
      </ThemeProvider>,
    );
    await user.click(screen.getByTestId("ctx-set-dark"));
    expect(screen.getByTestId("ctx-mode").textContent).toBe("dark");
    expect(screen.getByTestId("ctx-resolved").textContent).toBe("dark");
  });

  it("throws when useThemeContext is used outside ThemeProvider", () => {
    expect(() => {
      render(<ContextConsumer />);
    }).toThrow("useThemeContext must be used within a ThemeProvider");
  });
});

describe("useResolvedTheme", () => {
  beforeEach(() => {
    localStorage.clear();
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

  function ResolvedConsumer(): ReactNode {
    const resolved = useResolvedTheme();
    return <span data-testid="resolved-only">{resolved}</span>;
  }

  it("returns resolved theme", () => {
    render(
      <ThemeProvider>
        <ResolvedConsumer />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("resolved-only").textContent).toBe("light");
  });
});

describe("useThemeMode", () => {
  beforeEach(() => {
    localStorage.clear();
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

  function ModeConsumer(): ReactNode {
    const mode = useThemeMode();
    return <span data-testid="mode-only">{mode}</span>;
  }

  it("returns theme mode", () => {
    render(
      <ThemeProvider>
        <ModeConsumer />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("mode-only").textContent).toBe("system");
  });
});

// --- Test helpers ---

function createMockStorage(initial: Record<string, string>): Storage {
  const data = new Map(Object.entries(initial));
  return {
    getItem(key: string) {
      return data.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      data.set(key, value);
    },
    removeItem(key: string) {
      data.delete(key);
    },
    clear() {
      data.clear();
    },
    get length() {
      return data.size;
    },
    key(index: number) {
      return [...data.keys()][index] ?? null;
    },
  };
}

interface MockThemeDocument extends ThemeDocument {
  readonly documentElement: {
    setAttribute(name: string, value: string): void;
    getAttribute(name: string): string | null;
    hasAttribute(name: string): boolean;
  };
}

function createMockDocument(): MockThemeDocument {
  const attrs = new Map<string, string>();
  return {
    documentElement: {
      setAttribute(name: string, value: string) {
        attrs.set(name, value);
      },
      getAttribute(name: string) {
        return attrs.get(name) ?? null;
      },
      hasAttribute(name: string) {
        return attrs.has(name);
      },
    },
  };
}
