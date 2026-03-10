/**
 * ノートブックのエクスポート/インポートの純粋ロジック。
 *
 * 単一のノートブックをJSON形式でエクスポートし、
 * JSON文字列から既存のコレクションにインポートする。
 *
 * バージョン情報（_format + _version）を含め、将来的な破壊変更に対応する。
 *
 * 変更時は notebookExportLogic.test.ts, index.ts も同期すること。
 */

import type { Notebook, NotebookCollection } from "./notebookState";
import { serializeCollection, deserializeCollection } from "./notebookSerialization";

// --- エクスポート形式 ---

/** エクスポート用のJSON形式（バージョン情報付き） */
export type ExportedNotebook = {
  readonly _format: "intro-formal-proof-notebook";
  readonly _version: 1;
  readonly notebook: unknown;
};

/** 現在のフォーマット識別子 */
const EXPORT_FORMAT = "intro-formal-proof-notebook" as const;

/** 現在のバージョン */
const EXPORT_VERSION = 1 as const;

// --- エクスポート ---

/**
 * 単一のノートブックをエクスポート用JSON文字列に変換する。
 *
 * 内部でNotebookCollectionのシリアライゼーションを再利用し、
 * 単一ノートブックとしてラップする。
 */
export function exportNotebookAsJson(notebook: Notebook): string {
  // 既存のserializeCollectionを使って、
  // notebook内のLogicSystemのSet→Array変換などを委譲する
  const tempCollection: NotebookCollection = {
    notebooks: [notebook],
    nextId: 0,
  };
  const serializedCollectionJson = serializeCollection(tempCollection);
  const parsed: unknown = JSON.parse(serializedCollectionJson);
  const collectionObj = parsed as { readonly notebooks: readonly unknown[] };

  const exported: ExportedNotebook = {
    _format: EXPORT_FORMAT,
    _version: EXPORT_VERSION,
    notebook: collectionObj.notebooks[0],
  };

  return JSON.stringify(exported, null, 2);
}

// --- インポート結果 ---

/** インポート結果のdiscriminated union */
export type ImportNotebookResult =
  | {
      readonly _tag: "Ok";
      readonly collection: NotebookCollection;
      readonly notebookId: string;
    }
  | { readonly _tag: "InvalidJson" }
  | { readonly _tag: "InvalidFormat" }
  | { readonly _tag: "InvalidNotebook" };

/**
 * JSON文字列からノートブックをインポートし、コレクションに追加する。
 *
 * インポート時は新しいIDを割り当てる（既存IDとの衝突を防ぐ）。
 * 名前に " (import)" サフィックスを付与する。
 */
export function importNotebookFromJson(
  collection: NotebookCollection,
  jsonString: string,
  now: number,
): ImportNotebookResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    return { _tag: "InvalidJson" };
  }

  if (typeof parsed !== "object" || parsed === null) {
    return { _tag: "InvalidFormat" };
  }

  const obj = parsed as Record<string, unknown>;

  // フォーマット検証
  if (obj["_format"] !== EXPORT_FORMAT) {
    return { _tag: "InvalidFormat" };
  }

  // バージョン検証（現在は1のみ）
  if (obj["_version"] !== EXPORT_VERSION) {
    return { _tag: "InvalidFormat" };
  }

  // ノートブックデータの検証: 既存のdeserializeCollectionを再利用
  const notebookData = obj["notebook"];
  if (typeof notebookData !== "object" || notebookData === null) {
    return { _tag: "InvalidNotebook" };
  }

  // 一時的にCollectionとしてデシリアライズ
  const tempCollectionJson = JSON.stringify({
    notebooks: [notebookData],
    nextId: 1,
  });
  const tempCollection = deserializeCollection(tempCollectionJson);

  if (tempCollection.notebooks.length === 0) {
    return { _tag: "InvalidNotebook" };
  }

  const importedNotebook = tempCollection.notebooks[0];

  // 新しいIDを割り当て
  const newId = `notebook-${String(collection.nextId) satisfies string}`;

  const newNotebook: Notebook = {
    ...importedNotebook,
    meta: {
      ...importedNotebook.meta,
      id: newId,
      name: `${importedNotebook.meta.name satisfies string} (import)`,
      createdAt: now,
      updatedAt: now,
    },
  };

  return {
    _tag: "Ok",
    collection: {
      notebooks: [...collection.notebooks, newNotebook],
      nextId: collection.nextId + 1,
    },
    notebookId: newId,
  };
}

/**
 * エクスポートファイル名を生成する（拡張子なし）。
 * ファイル名に使えない文字を置換する。
 */
export function generateExportFilename(notebookName: string): string {
  const sanitized = notebookName.replace(
    /[^a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF_-]/g,
    "-",
  );
  return `notebook-${sanitized satisfies string}`;
}
