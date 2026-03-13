/**
 * スクリプトノードの型定義とロジック。
 *
 * スクリプトノードは証明ワークスペース内で実行可能なスクリプトを表示し、
 * その場で実行したり、スクリプト一覧に追加したりできる特殊なノード。
 *
 * 変更時は scriptNode.test.ts も同期すること。
 */

import { Schema } from "effect";

// --- スクリプトノードのデータ型 ---

/**
 * スクリプトノードの追加データ。
 * WorkspaceNodeのformulaTex tフィールドにスクリプトコードを格納し、
 * このメタデータを別途管理する。
 */
export class ScriptNodeData extends Schema.TaggedClass<ScriptNodeData>()(
  "ScriptNodeData",
  {
    /** スクリプトのタイトル */
    title: Schema.NonEmptyString,
    /** スクリプトの説明（オプション） */
    description: Schema.optional(Schema.String),
    /** スクリプトの作成者（オプション） */
    author: Schema.optional(Schema.String),
    /** スクリプトのタグ（カテゴリ分類用） */
    tags: Schema.Array(Schema.NonEmptyString),
    /** 実行時の最大ステップ数（オプション、デフォルトはシステム設定） */
    maxSteps: Schema.optional(Schema.Number),
    /** 実行時の最大時間（ミリ秒、オプション、デフォルトはシステム設定） */
    maxTimeMs: Schema.optional(Schema.Number),
  },
) {}

/** ScriptNodeDataのSchema */
export const ScriptNodeDataSchema = Schema.typeSchema(ScriptNodeData);

// --- スクリプトノードの操作 ---

/**
 * スクリプトノードのコードを取得する。
 * WorkspaceNodeのformulaTextフィールドに格納されている。
 */
export function getScriptCode(formulaText: string): string {
  return formulaText;
}

/**
 * スクリプトノードのコードを設定する。
 * WorkspaceNodeのformulaTextフィールドに格納する。
 */
export function setScriptCode(code: string): string {
  return code;
}

/**
 * デフォルトのScriptNodeDataを作成する。
 */
export function createDefaultScriptNodeData(title: string): ScriptNodeData {
  return new ScriptNodeData({
    title,
    tags: [],
  });
}

/**
 * スクリプトノードの表示用ラベルを生成する。
 */
export function getScriptNodeLabel(data: ScriptNodeData): string {
  return `Script: ${data.title satisfies string}`;
}

