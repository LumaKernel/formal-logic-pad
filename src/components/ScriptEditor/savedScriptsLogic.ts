/**
 * ユーザー保存スクリプトの純粋ロジック。
 *
 * ScriptEditor のユーザー保存スクリプトの CRUD と
 * localStorage シリアライゼーションを担う。
 *
 * 変更時は savedScriptsLogic.test.ts, ScriptEditorComponent.tsx も同期すること。
 */

// ── 型定義 ─────────────────────────────────────────────────────

export interface SavedScript {
  readonly id: string;
  readonly title: string;
  readonly code: string;
  readonly savedAt: number;
}

export interface SavedScriptsState {
  readonly scripts: readonly SavedScript[];
}

// ── 定数 ──────────────────────────────────────────────────────

export const STORAGE_KEY = "script-editor-saved-scripts";

export const initialSavedScriptsState: SavedScriptsState = {
  scripts: [],
};

// ── CRUD 純粋関数 ─────────────────────────────────────────────

export const addScript = (
  state: SavedScriptsState,
  id: string,
  title: string,
  code: string,
  savedAt: number,
): SavedScriptsState => ({
  scripts: [...state.scripts, { id, title, code, savedAt }],
});

export const removeScript = (
  state: SavedScriptsState,
  id: string,
): SavedScriptsState => ({
  scripts: state.scripts.filter((s) => s.id !== id),
});

export const renameScript = (
  state: SavedScriptsState,
  id: string,
  newTitle: string,
): SavedScriptsState => ({
  scripts: state.scripts.map((s) =>
    s.id === id ? { ...s, title: newTitle } : s,
  ),
});

export const updateScriptCode = (
  state: SavedScriptsState,
  id: string,
  newCode: string,
  savedAt: number,
): SavedScriptsState => ({
  scripts: state.scripts.map((s) =>
    s.id === id ? { ...s, code: newCode, savedAt } : s,
  ),
});

export const findScript = (
  state: SavedScriptsState,
  id: string,
): SavedScript | undefined => state.scripts.find((s) => s.id === id);

// ── シリアライゼーション ──────────────────────────────────────

interface SerializedSavedScript {
  readonly id: string;
  readonly title: string;
  readonly code: string;
  readonly savedAt: number;
}

interface SerializedSavedScriptsState {
  readonly scripts: readonly SerializedSavedScript[];
}

export const serializeSavedScripts = (state: SavedScriptsState): string =>
  JSON.stringify({
    scripts: state.scripts.map((s) => ({
      id: s.id,
      title: s.title,
      code: s.code,
      savedAt: s.savedAt,
    })),
  } satisfies SerializedSavedScriptsState);

export const deserializeSavedScripts = (json: string): SavedScriptsState => {
  try {
    const parsed: unknown = JSON.parse(json);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("scripts" in parsed) ||
      !Array.isArray((parsed as SerializedSavedScriptsState).scripts)
    ) {
      return initialSavedScriptsState;
    }
    const data = parsed as SerializedSavedScriptsState;
    const scripts: readonly SavedScript[] = data.scripts.flatMap((s) => {
      if (
        typeof s === "object" &&
        s !== null &&
        typeof s.id === "string" &&
        typeof s.title === "string" &&
        typeof s.code === "string" &&
        typeof s.savedAt === "number"
      ) {
        return [{ id: s.id, title: s.title, code: s.code, savedAt: s.savedAt }];
      }
      return [];
    });
    return { scripts };
  } catch {
    return initialSavedScriptsState;
  }
};

// ── ID 生成 ──────────────────────────────────────────────────

export const generateScriptId = (now: number): string =>
  `user-script-${String(now) satisfies string}`;
