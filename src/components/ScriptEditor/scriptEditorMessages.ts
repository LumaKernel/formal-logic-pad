/**
 * スクリプトエディタのUI文字列定義（純粋ロジック）。
 *
 * ScriptEditorComponent で表示されるすべてのユーザー向けメッセージのキーとデフォルト値を定義する。
 * i18n対応のため、純粋ロジック層はメッセージキーとデフォルト英語メッセージを提供し、
 * アプリ層（WorkspaceContent.tsx）がロケールに応じた翻訳を注入する。
 *
 * 変更時は ScriptEditorComponent.tsx, ScriptLibraryPanel.tsx,
 * ScriptApiReferencePanel.tsx, WorkspaceContent.tsx,
 * messages/en.json, messages/ja.json, index.ts も同期すること。
 */

import type { ExecutionStatus } from "./scriptEditorLogic";

// --- メッセージキー定義 ---

export type ScriptEditorMessages = {
  // --- ツールバーボタン ---
  readonly files: string;
  readonly library: string;
  readonly save: string;
  readonly run: string;
  readonly step: string;
  readonly pause: string;
  readonly play: string;
  readonly reset: string;
  readonly apiRef: string;
  readonly cancel: string;
  readonly speed: string;

  // --- ステータス ---
  readonly statusReady: string;
  readonly statusRunning: string;
  readonly statusStepping: string;
  readonly statusDone: string;
  readonly statusError: string;

  // --- その他 ---
  readonly stepsCount: (count: number) => string;
  readonly slowdown: (factor: number) => string;
  readonly savePlaceholder: string;
  readonly scriptLibraryTitle: string;
  readonly searchScripts: string;
  readonly searchApis: string;

  // --- title属性 ---
  readonly toggleFileExplorer: string;
  readonly openScriptLibrary: string;
  readonly saveCurrentScript: string;
  readonly toggleApiReference: string;
};

// --- デフォルト値（英語） ---

export const defaultScriptEditorMessages: ScriptEditorMessages = {
  files: "Files",
  library: "Library",
  save: "Save",
  run: "Run",
  step: "Step",
  pause: "Pause",
  play: "Play",
  reset: "Reset",
  apiRef: "API Ref",
  cancel: "Cancel",
  speed: "Speed",

  statusReady: "Ready",
  statusRunning: "Running...",
  statusStepping: "Stepping...",
  statusDone: "Done",
  statusError: "Error",

  stepsCount: (count) => `${String(count) satisfies string} steps`,
  slowdown: (factor) => `Slowdown x${String(factor) satisfies string}`,
  savePlaceholder: "Enter script name...",
  scriptLibraryTitle: "Script Library",
  searchScripts: "Search scripts...",
  searchApis: "Search APIs...",

  toggleFileExplorer: "Toggle File Explorer",
  openScriptLibrary: "Open Script Library",
  saveCurrentScript: "Save current script",
  toggleApiReference: "Toggle API Reference",
};

// --- ステータスラベル取得ヘルパー ---

export const getStatusMessage = (
  messages: ScriptEditorMessages,
  status: ExecutionStatus,
): string => {
  if (status === "idle") return messages.statusReady;
  if (status === "running") return messages.statusRunning;
  if (status === "stepping") return messages.statusStepping;
  if (status === "done") return messages.statusDone;
  // fall-through: TypeScript narrows to "error"
  return messages.statusError;
};
