/**
 * URL形式のクエスト共有 - 純粋ロジック。
 *
 * クエスト定義をURLパラメータにエンコード/デコードする。
 * エンコード形式: JSON → UTF-8バイト列 → base64url
 *
 * 変更時は questUrlSharing.test.ts, index.ts も同期すること。
 */

import type { QuestDefinition } from "./questDefinition";
import type { QuestGoalDefinition } from "../proof-pad/workspaceState";
import type { AxiomId } from "../logic-core/inferenceRule";
import type { InferenceRuleId } from "../proof-pad/inferenceEdge";

// --- URL パラメータ名 ---

export const QUEST_URL_PARAM = "quest" as const;

// --- エンコード/デコード結果型 ---

export type DecodeQuestUrlResult =
  | { readonly _tag: "Ok"; readonly quest: QuestDefinition }
  | { readonly _tag: "InvalidBase64" }
  | { readonly _tag: "InvalidJson" }
  | { readonly _tag: "InvalidQuest" };

// --- 共有用のコンパクトなクエスト表現 ---

/**
 * URL共有用のコンパクトなクエスト表現。
 * ビルトインクエストもカスタムクエストも同じ形式で共有する。
 * インポート時にカスタムIDが新規付与されるため、元のIDは参考情報として保持。
 */
type SharedQuestPayload = {
  readonly _f: "ifp-quest"; // format identifier (短縮)
  readonly _v: 1; // version
  readonly t: string; // title
  readonly d: string; // description
  readonly cat: string; // category
  readonly diff: number; // difficulty
  readonly sys: string; // systemPresetId
  readonly g: readonly SharedGoal[]; // goals
  readonly h: readonly string[]; // hints
  readonly est?: number; // estimatedSteps
  readonly lp: string; // learningPoint
  readonly ax?: readonly string[]; // allowedAxiomIds (quest-level)
};

type SharedGoal = {
  readonly f: string; // formulaText
  readonly l?: string; // label
  readonly ax?: readonly string[]; // allowedAxiomIds
  readonly ru?: readonly string[]; // allowedRuleIds
};

// --- base64url エンコード/デコード ---

/**
 * UTF-8文字列をbase64urlエンコードする。
 * ブラウザ/Node互換のために手動でUTF-8バイト列を作成。
 */
/* v8 ignore start — V8 coverage aggregation artifact: function definition */
export function utf8ToBase64Url(str: string): string {
  /* v8 ignore stop */
  // UTF-8 エンコード（手動）
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    let charCode = str.charCodeAt(i);

    // サロゲートペア処理
    if (charCode >= 0xd800 && charCode <= 0xdbff && i + 1 < str.length) {
      const next = str.charCodeAt(i + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        charCode = ((charCode - 0xd800) << 10) + (next - 0xdc00) + 0x10000;
        i++;
      }
    }

    if (charCode < 0x80) {
      bytes.push(charCode);
    } else if (charCode < 0x800) {
      bytes.push(0xc0 | (charCode >> 6), 0x80 | (charCode & 0x3f));
    } else if (charCode < 0x10000) {
      bytes.push(
        0xe0 | (charCode >> 12),
        0x80 | ((charCode >> 6) & 0x3f),
        0x80 | (charCode & 0x3f),
      );
    } else {
      bytes.push(
        0xf0 | (charCode >> 18),
        0x80 | ((charCode >> 12) & 0x3f),
        0x80 | ((charCode >> 6) & 0x3f),
        0x80 | (charCode & 0x3f),
      );
    }
  }

  // base64 エンコード
  const base64Chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let result = "";
  for (let i = 0; i < bytes.length; i += 3) {
    /* v8 ignore start -- 防御的コード: i < bytes.length で bytes[i] は常に定義済み */
    const b0 = bytes[i] ?? 0;
    /* v8 ignore stop */
    const b1 = bytes[i + 1];
    const b2 = bytes[i + 2];

    result += base64Chars[b0 >> 2];
    /* v8 ignore start -- b1 ?? 0: nullish coalescing fallback for partial byte group */
    result += base64Chars[((b0 & 3) << 4) | ((b1 ?? 0) >> 4)];
    /* v8 ignore stop */
    result +=
      b1 !== undefined
        ? base64Chars[((b1 & 0xf) << 2) | ((b2 ?? 0) >> 6)]
        : "=";
    result += b2 !== undefined ? base64Chars[b2 & 0x3f] : "=";
  }

  // base64 → base64url 変換（URL安全に）
  return result.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

/**
 * base64url文字列をUTF-8文字列にデコードする。
 * 不正な入力の場合は undefined を返す。
 */
/* v8 ignore start — V8 coverage aggregation artifact: function definition */
export function base64UrlToUtf8(base64url: string): string | undefined {
  /* v8 ignore stop */
  // base64url → base64 変換
  let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  // パディング追加
  const padding = base64.length % 4;
  if (padding === 2) {
    base64 += "==";
  } else if (padding === 3) {
    base64 += "=";
  } else if (padding === 1) {
    return undefined; // 不正な長さ
  }

  // base64 デコード
  const base64Chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const bytes: number[] = [];

  for (let i = 0; i < base64.length; i += 4) {
    /* v8 ignore start -- 防御的コード: パディング補正済みbase64のインデックスアクセスは常に定義済み */
    const c0 = base64Chars.indexOf(base64[i] ?? "");
    const c1 = base64Chars.indexOf(base64[i + 1] ?? "");
    const c2Char = base64[i + 2];
    const c3Char = base64[i + 3];
    const c2 = c2Char === "=" ? 0 : base64Chars.indexOf(c2Char ?? "");
    const c3 = c3Char === "=" ? 0 : base64Chars.indexOf(c3Char ?? "");
    /* v8 ignore stop */

    if (c0 === -1 || c1 === -1 || c2 === -1 || c3 === -1) {
      return undefined; // 不正な文字
    }

    bytes.push((c0 << 2) | (c1 >> 4));
    if (c2Char !== "=") {
      bytes.push(((c1 & 0xf) << 4) | (c2 >> 2));
    }
    if (c3Char !== "=") {
      bytes.push(((c2 & 3) << 6) | c3);
    }
  }

  // UTF-8 デコード
  let result = "";
  let i = 0;
  while (i < bytes.length) {
    const b0 = bytes[i];
    /* v8 ignore start -- 防御的コード: i < bytes.length で bytes[i] は常に定義済み */
    if (b0 === undefined) break;
    /* v8 ignore stop */

    if (b0 < 0x80) {
      result += String.fromCharCode(b0);
      i++;
    } else if ((b0 & 0xe0) === 0xc0) {
      const b1 = bytes[i + 1];
      if (b1 === undefined) return undefined;
      result += String.fromCharCode(((b0 & 0x1f) << 6) | (b1 & 0x3f));
      i += 2;
    } else if ((b0 & 0xf0) === 0xe0) {
      const b1 = bytes[i + 1];
      const b2 = bytes[i + 2];
      if (b1 === undefined || b2 === undefined) return undefined;
      result += String.fromCharCode(
        ((b0 & 0x0f) << 12) | ((b1 & 0x3f) << 6) | (b2 & 0x3f),
      );
      i += 3;
    } else if ((b0 & 0xf8) === 0xf0) {
      const b1 = bytes[i + 1];
      const b2 = bytes[i + 2];
      const b3 = bytes[i + 3];
      if (b1 === undefined || b2 === undefined || b3 === undefined)
        return undefined;
      const codePoint =
        ((b0 & 0x07) << 18) |
        ((b1 & 0x3f) << 12) |
        ((b2 & 0x3f) << 6) |
        (b3 & 0x3f);
      // サロゲートペアに変換
      const surrogate = codePoint - 0x10000;
      result += String.fromCharCode(
        0xd800 + (surrogate >> 10),
        0xdc00 + (surrogate & 0x3ff),
      );
      i += 4;
    } else {
      return undefined; // 不正なUTF-8
    }
  }

  return result;
}

// --- クエスト → URLパラメータ ---

/**
 * クエスト定義をURL共有用の文字列にエンコードする。
 * ビルトインクエストもカスタムクエストも同じ形式でエンコード可能。
 */
/* v8 ignore start — V8 coverage aggregation artifact: function definition */
export function encodeQuestToUrlParam(quest: QuestDefinition): string {
  /* v8 ignore stop */
  const payload: SharedQuestPayload = {
    _f: "ifp-quest",
    _v: 1,
    t: quest.title,
    d: quest.description,
    cat: quest.category,
    diff: quest.difficulty,
    sys: quest.systemPresetId,
    g: quest.goals.map(
      (g): SharedGoal => ({
        f: g.formulaText,
        ...(g.label !== undefined ? { l: g.label } : {}),
        ...(g.allowedAxiomIds !== undefined
          ? { ax: [...g.allowedAxiomIds] }
          : {}),
        ...(g.allowedRuleIds !== undefined
          ? { ru: [...g.allowedRuleIds] }
          : {}),
      }),
    ),
    h: [...quest.hints],
    ...(quest.estimatedSteps !== undefined
      ? { est: quest.estimatedSteps }
      : {}),
    lp: quest.learningPoint,
    ...(quest.allowedAxiomIds !== undefined
      ? { ax: [...quest.allowedAxiomIds] }
      : {}),
  };

  const json = JSON.stringify(payload);
  return utf8ToBase64Url(json);
}

/**
 * URLパラメータからクエスト定義をデコードする。
 * デコード結果は一時的なカスタムIDが付与される。
 * 実際にコレクションに追加する際は新しいIDが割り当てられる。
 */
/* v8 ignore start — V8 coverage aggregation artifact: function definition */
export function decodeQuestFromUrlParam(param: string): DecodeQuestUrlResult {
  /* v8 ignore stop */
  const json = base64UrlToUtf8(param);
  if (json === undefined) {
    return { _tag: "InvalidBase64" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { _tag: "InvalidJson" };
  }

  if (typeof parsed !== "object" || parsed === null) {
    return { _tag: "InvalidQuest" };
  }

  const obj = parsed as Record<string, unknown>;

  // フォーマット検証
  if (obj["_f"] !== "ifp-quest" || obj["_v"] !== 1) {
    return { _tag: "InvalidQuest" };
  }

  // 必須フィールド検証
  if (typeof obj["t"] !== "string" || obj["t"].trim() === "") {
    return { _tag: "InvalidQuest" };
  }
  if (typeof obj["d"] !== "string") return { _tag: "InvalidQuest" };
  if (typeof obj["cat"] !== "string") return { _tag: "InvalidQuest" };
  if (typeof obj["diff"] !== "number") return { _tag: "InvalidQuest" };
  if (typeof obj["sys"] !== "string") return { _tag: "InvalidQuest" };
  if (!Array.isArray(obj["g"]) || obj["g"].length === 0) {
    return { _tag: "InvalidQuest" };
  }
  if (!Array.isArray(obj["h"])) return { _tag: "InvalidQuest" };
  if (obj["est"] !== undefined && typeof obj["est"] !== "number") {
    return { _tag: "InvalidQuest" };
  }
  if (typeof obj["lp"] !== "string") return { _tag: "InvalidQuest" };

  // ゴールのパース
  const goals: QuestGoalDefinition[] = [];
  for (const rawGoal of obj["g"] as readonly unknown[]) {
    if (typeof rawGoal !== "object" || rawGoal === null) {
      return { _tag: "InvalidQuest" };
    }
    const g = rawGoal as Record<string, unknown>;
    if (typeof g["f"] !== "string") return { _tag: "InvalidQuest" };

    const goal: QuestGoalDefinition = {
      formulaText: g["f"] as string,
      ...(typeof g["l"] === "string" ? { label: g["l"] as string } : {}),
      ...(Array.isArray(g["ax"])
        ? {
            allowedAxiomIds: (g["ax"] as readonly unknown[]).filter(
              (x) => typeof x === "string",
            ) as readonly AxiomId[],
          }
        : {}),
      ...(Array.isArray(g["ru"])
        ? {
            allowedRuleIds: (g["ru"] as readonly unknown[]).filter(
              (x) => typeof x === "string",
            ) as readonly InferenceRuleId[],
          }
        : {}),
    };
    goals.push(goal);
  }

  // ヒントのパース
  /* v8 ignore start — V8 coverage aggregation artifact: filter lambda */
  const hints = (obj["h"] as readonly unknown[]).filter(
    (x) => typeof x === "string",
  );
  /* v8 ignore stop */

  // quest-level allowedAxiomIds
  const allowedAxiomIds = Array.isArray(obj["ax"])
    ? ((obj["ax"] as readonly unknown[]).filter(
        (x) => typeof x === "string",
      ) as readonly AxiomId[])
    : undefined;

  // 一時的なIDを付与（コレクション追加時に新しいIDが割り当てられる）
  const quest: QuestDefinition = {
    id: "custom-0",
    category: obj["cat"] as QuestDefinition["category"],
    title: (obj["t"] as string).trim(),
    description: (obj["d"] as string).trim(),
    difficulty: obj["diff"] as QuestDefinition["difficulty"],
    systemPresetId: obj["sys"] as QuestDefinition["systemPresetId"],
    goals,
    hints,
    estimatedSteps: obj["est"] as number | undefined,
    learningPoint: obj["lp"] as string,
    order: 0,
    version: 1,
    ...(allowedAxiomIds !== undefined ? { allowedAxiomIds } : {}),
  };

  return { _tag: "Ok", quest };
}

// --- URL構築/解析 ---

/**
 * 共有URLを構築する。
 * @param baseUrl アプリケーションのベースURL (例: "https://example.com")
 * @param quest 共有するクエスト定義
 */
/* v8 ignore start — V8 coverage aggregation artifact: function definition */
export function buildQuestShareUrl(
  baseUrl: string,
  quest: QuestDefinition,
): string {
  /* v8 ignore stop */
  const param = encodeQuestToUrlParam(quest);
  const separator = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl satisfies string}${separator satisfies string}${QUEST_URL_PARAM satisfies string}=${param satisfies string}`;
}

/**
 * URLのクエリ文字列からクエストパラメータを抽出する。
 * @param searchParams URLSearchParamsのget結果（クエストパラメータの値、またはnull）
 */
/* v8 ignore start — V8 coverage aggregation artifact: function definition */
export function extractQuestParam(
  questParamValue: string | null,
): string | null {
  /* v8 ignore stop */
  return questParamValue;
}

// --- インポートヘルパー ---

/**
 * URL共有経由のクエストをカスタムクエストコレクションに追加する。
 * parseCustomQuestFromRaw を再利用するため、一度フル形式に変換する。
 */
/* v8 ignore start — V8 coverage aggregation artifact: function definition */
export function prepareUrlQuestForImport(quest: QuestDefinition): {
  /* v8 ignore stop */
  readonly title: string;
  readonly description: string;
  readonly category: QuestDefinition["category"];
  readonly difficulty: QuestDefinition["difficulty"];
  readonly systemPresetId: QuestDefinition["systemPresetId"];
  readonly goals: readonly QuestGoalDefinition[];
  readonly hints: readonly string[];
  readonly estimatedSteps: number | undefined;
  readonly learningPoint: string;
} {
  return {
    title: quest.title,
    description: quest.description,
    category: quest.category,
    difficulty: quest.difficulty,
    systemPresetId: quest.systemPresetId,
    goals: quest.goals,
    hints: quest.hints,
    estimatedSteps: quest.estimatedSteps,
    learningPoint: quest.learningPoint,
  };
}
