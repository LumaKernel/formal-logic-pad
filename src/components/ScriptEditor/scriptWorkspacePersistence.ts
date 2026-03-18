/**
 * スクリプトワークスペースの永続化ロジック。
 *
 * WorkspaceState を localStorage 向けに
 * シリアライゼーション/デシリアライゼーションする。
 *
 * ライブラリタブはテンプレートIDのみ保存し、
 * 復元時にテンプレート一覧から再構築する。
 *
 * 変更時は scriptWorkspacePersistence.test.ts も同期すること。
 */

import type { ScriptTemplate } from "@/lib/script-runner/templates";
import type {
  WorkspaceState,
  WorkspaceTab,
  TabSource,
} from "./scriptWorkspaceState";
import { initialWorkspaceState } from "./scriptWorkspaceState";

// ── 定数 ──────────────────────────────────────────────────────

export const WORKSPACE_STORAGE_KEY = "script-editor-workspace";

// ── シリアライズ用型 ──────────────────────────────────────────

interface SerializedTab {
  readonly id: string;
  readonly source: TabSource;
  readonly title: string;
  readonly code: string;
  readonly originalCode: string;
  readonly sourceId: string | null;
  readonly readonly: boolean;
}

interface SerializedWorkspaceState {
  readonly tabs: readonly SerializedTab[];
  readonly activeTabId: string | null;
  readonly nextUnnamedCounter: number;
}

// ── シリアライゼーション ──────────────────────────────────────

export const serializeWorkspace = (state: WorkspaceState): string =>
  JSON.stringify({
    tabs: state.tabs.map(
      (t): SerializedTab => ({
        id: t.id,
        source: t.source,
        title: t.title,
        code: t.source === "library" ? "" : t.code,
        originalCode: t.source === "library" ? "" : t.originalCode,
        sourceId: t.sourceId ?? null,
        readonly: t.readonly,
      }),
    ),
    activeTabId: state.activeTabId ?? null,
    nextUnnamedCounter: state.nextUnnamedCounter,
  } satisfies SerializedWorkspaceState);

// ── デシリアライゼーション ────────────────────────────────────

const TAB_SOURCES: readonly string[] = ["unnamed", "library", "saved"];

const isValidTabSource = (value: unknown): boolean =>
  typeof value === "string" && TAB_SOURCES.includes(value);

const isValidSerializedTab = (value: unknown): boolean => {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj["id"] === "string" &&
    isValidTabSource(obj["source"]) &&
    typeof obj["title"] === "string" &&
    typeof obj["code"] === "string" &&
    typeof obj["originalCode"] === "string" &&
    (obj["sourceId"] === null || typeof obj["sourceId"] === "string") &&
    typeof obj["readonly"] === "boolean"
  );
};

/**
 * ライブラリタブをテンプレート一覧から復元する。
 * テンプレートが見つからない場合はnullを返す（タブを除外）。
 */
const restoreLibraryTab = (
  serialized: SerializedTab,
  templates: readonly ScriptTemplate[],
): WorkspaceTab | null => {
  if (serialized.sourceId === null) return null;
  const template = templates.find((t) => t.id === serialized.sourceId);
  if (!template) return null;
  return {
    id: serialized.id,
    source: "library",
    title: template.title,
    code: template.code,
    originalCode: template.code,
    sourceId: serialized.sourceId,
    readonly: true,
  };
};

const restoreTab = (
  serialized: SerializedTab,
  templates: readonly ScriptTemplate[],
): WorkspaceTab | null => {
  if (serialized.source === "library") {
    return restoreLibraryTab(serialized, templates);
  }
  return {
    id: serialized.id,
    source: serialized.source,
    title: serialized.title,
    code: serialized.code,
    originalCode: serialized.originalCode,
    sourceId: serialized.sourceId ?? undefined,
    readonly: serialized.readonly,
  };
};

/**
 * JSON文字列からWorkspaceStateを復元する。
 * 不正データの場合はinitialWorkspaceStateを返す。
 *
 * @param json - シリアライズされたJSON文字列
 * @param templates - ライブラリタブ復元用のテンプレート一覧
 */
export const deserializeWorkspace = (
  json: string,
  templates: readonly ScriptTemplate[],
): WorkspaceState => {
  try {
    const parsed: unknown = JSON.parse(json);
    if (typeof parsed !== "object" || parsed === null) {
      return initialWorkspaceState;
    }
    const obj = parsed as Record<string, unknown>;
    if (!Array.isArray(obj["tabs"])) {
      return initialWorkspaceState;
    }
    if (
      typeof obj["nextUnnamedCounter"] !== "number" ||
      !Number.isFinite(obj["nextUnnamedCounter"])
    ) {
      return initialWorkspaceState;
    }

    const tabs: readonly WorkspaceTab[] = (
      obj["tabs"] as readonly unknown[]
    ).flatMap((item) => {
      if (!isValidSerializedTab(item)) return [];
      const serialized = item as SerializedTab;
      const tab = restoreTab(serialized, templates);
      return tab ? [tab] : [];
    });

    const activeTabId =
      typeof obj["activeTabId"] === "string" &&
      tabs.some((t) => t.id === obj["activeTabId"])
        ? obj["activeTabId"]
        : tabs[0]?.id;

    return {
      tabs,
      activeTabId,
      nextUnnamedCounter: obj["nextUnnamedCounter"] as number,
    };
  } catch {
    return initialWorkspaceState;
  }
};
