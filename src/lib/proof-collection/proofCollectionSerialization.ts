/**
 * 証明コレクションのシリアライズ/デシリアライズ（純粋ロジック）。
 *
 * ProofCollection を JSON 互換のオブジェクトに変換して保存し、
 * 復元時にバリデーションを行う。
 *
 * 変更時は proofCollectionSerialization.test.ts も同期すること。
 */

import type {
  ProofCollection,
  ProofEntry,
  ProofFolder,
} from "./proofCollectionState";
import { createEmptyProofCollection } from "./proofCollectionState";
import type { DeductionStyle } from "../logic-core/deductionSystem";

// --- バリデーション ---

const VALID_DEDUCTION_STYLES: ReadonlySet<string> = new Set([
  "hilbert",
  "natural-deduction",
  "sequent-calculus",
  "tableau-calculus",
  "analytic-tableau",
]);

function validateDeductionStyle(value: unknown): DeductionStyle | undefined {
  if (typeof value !== "string") return undefined;
  if (!VALID_DEDUCTION_STYLES.has(value)) return undefined;
  // VALID_DEDUCTION_STYLES に含まれることを確認済み
  return value as DeductionStyle;
}

function parseProofEntry(raw: unknown): ProofEntry | undefined {
  if (typeof raw !== "object" || raw === null) return undefined;
  const obj = raw as Record<string, unknown>;

  if (typeof obj["id"] !== "string") return undefined;
  if (typeof obj["name"] !== "string") return undefined;
  if (typeof obj["memo"] !== "string") return undefined;
  if (typeof obj["createdAt"] !== "number") return undefined;
  if (typeof obj["updatedAt"] !== "number") return undefined;
  if (!Array.isArray(obj["nodes"])) return undefined;
  if (!Array.isArray(obj["connections"])) return undefined;
  if (!Array.isArray(obj["inferenceEdges"])) return undefined;
  if (!Array.isArray(obj["usedAxiomIds"])) return undefined;

  const deductionStyle = validateDeductionStyle(obj["deductionStyle"]);
  if (deductionStyle === undefined) return undefined;

  // folderId: string | undefined
  const folderId = obj["folderId"];
  if (
    folderId !== undefined &&
    folderId !== null &&
    typeof folderId !== "string"
  ) {
    return undefined;
  }

  return {
    id: obj["id"],
    name: obj["name"],
    memo: obj["memo"],
    folderId: typeof folderId === "string" ? folderId : undefined,
    createdAt: obj["createdAt"],
    updatedAt: obj["updatedAt"],
    nodes: obj["nodes"] as readonly ProofEntry["nodes"][number][],
    connections: obj[
      "connections"
    ] as readonly ProofEntry["connections"][number][],
    inferenceEdges: obj[
      "inferenceEdges"
    ] as readonly ProofEntry["inferenceEdges"][number][],
    deductionStyle,
    usedAxiomIds: obj["usedAxiomIds"] as readonly string[],
  };
}

function parseProofFolder(raw: unknown): ProofFolder | undefined {
  if (typeof raw !== "object" || raw === null) return undefined;
  const obj = raw as Record<string, unknown>;

  if (typeof obj["id"] !== "string") return undefined;
  if (typeof obj["name"] !== "string") return undefined;
  if (typeof obj["createdAt"] !== "number") return undefined;

  return {
    id: obj["id"],
    name: obj["name"],
    createdAt: obj["createdAt"],
  };
}

// --- シリアライズ ---

/** ProofCollection を JSON 文字列にシリアライズする */
export function serializeProofCollection(collection: ProofCollection): string {
  return JSON.stringify(collection);
}

// --- デシリアライズ ---

/** JSON 文字列を ProofCollection にデシリアライズする。不正なデータは空コレクションを返す */
export function deserializeProofCollection(json: string): ProofCollection {
  try {
    const parsed: unknown = JSON.parse(json);
    if (typeof parsed !== "object" || parsed === null) {
      return createEmptyProofCollection();
    }
    const obj = parsed as Record<string, unknown>;

    // entries
    const entries: ProofEntry[] = [];
    if (Array.isArray(obj["entries"])) {
      for (const rawEntry of obj["entries"] as readonly unknown[]) {
        const entry = parseProofEntry(rawEntry);
        if (entry !== undefined) {
          entries.push(entry);
        }
        // 不正なエントリはスキップ
      }
    }

    // folders
    const folders: ProofFolder[] = [];
    if (Array.isArray(obj["folders"])) {
      for (const rawFolder of obj["folders"] as readonly unknown[]) {
        const folder = parseProofFolder(rawFolder);
        if (folder !== undefined) {
          folders.push(folder);
        }
      }
    }

    // nextEntryId / nextFolderId
    const nextEntryId =
      typeof obj["nextEntryId"] === "number" ? obj["nextEntryId"] : 1;
    const nextFolderId =
      typeof obj["nextFolderId"] === "number" ? obj["nextFolderId"] : 1;

    return { entries, folders, nextEntryId, nextFolderId };
  } catch {
    return createEmptyProofCollection();
  }
}
