/**
 * React hook for theme management.
 *
 * Manages theme mode persistence (localStorage), system preference tracking
 * (matchMedia), and <html> data-attribute synchronization.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import {
  isThemeMode,
  resolveTheme,
  THEME_DATA_ATTRIBUTE,
  THEME_STORAGE_KEY,
  type ResolvedTheme,
  type ThemeMode,
} from "./themeLogic";

// --- localStorage adapter (pure functions operating on Storage interface) ---

export function loadThemeMode(storage: Storage): ThemeMode {
  const stored = storage.getItem(THEME_STORAGE_KEY);
  if (isThemeMode(stored)) {
    return stored;
  }
  return "system";
}

export function saveThemeMode(storage: Storage, mode: ThemeMode): void {
  storage.setItem(THEME_STORAGE_KEY, mode);
}

// --- matchMedia adapter ---

function getSystemPrefersDark(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function subscribeSystemPrefersDark(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const mql = window.matchMedia("(prefers-color-scheme: dark)");
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

// --- HTML attribute synchronization ---

/** Minimal interface for document-like objects that support theme attribute setting. */
export interface ThemeDocument {
  readonly documentElement: {
    setAttribute(name: string, value: string): void;
  };
}

export function applyThemeToDocument(
  resolved: ResolvedTheme,
  doc: ThemeDocument,
): void {
  doc.documentElement.setAttribute(THEME_DATA_ATTRIBUTE, resolved);
}

// --- useTheme hook ---

export interface UseThemeResult {
  /** The currently selected theme mode (light/dark/system). */
  readonly mode: ThemeMode;
  /** The resolved visual theme (light/dark). */
  readonly resolved: ResolvedTheme;
  /** Set the theme mode. */
  readonly setMode: (mode: ThemeMode) => void;
}

export function useTheme(): UseThemeResult {
  const [mode, setModeState] = useState<ThemeMode>(() =>
    typeof window === "undefined"
      ? "system"
      : loadThemeMode(window.localStorage),
  );

  const systemPrefersDark = useSyncExternalStore(
    subscribeSystemPrefersDark,
    getSystemPrefersDark,
    () => false, // server snapshot
  );

  const resolved = resolveTheme(mode, systemPrefersDark);

  // Persist mode to localStorage and sync <html> attribute
  useEffect(() => {
    if (typeof window === "undefined") return;
    saveThemeMode(window.localStorage, mode);
  }, [mode]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    applyThemeToDocument(resolved, document);
  }, [resolved]);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
  }, []);

  return useMemo(
    () => ({ mode, resolved, setMode }),
    [mode, resolved, setMode],
  );
}
