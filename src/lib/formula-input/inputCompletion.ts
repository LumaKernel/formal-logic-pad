/**
 * 入力補完のピュアロジック。
 *
 * カーソル位置の入力テキストから補完候補を計算する。
 * UI非依存で完全にテスト可能。
 *
 * 変更時は inputCompletion.test.ts, CompletionPopup.tsx, FormulaInput.tsx, TermInput.tsx も同期すること。
 */

import { greekLetterNames } from "../logic-core/greekLetters";

// --- 補完候補の型 ---

export interface CompletionCandidate {
  /** 候補のラベル（表示用） */
  readonly label: string;
  /** 挿入するテキスト */
  readonly insertText: string;
  /** カテゴリ（表示グルーピング用） */
  readonly category: "operator" | "greek" | "quantifier";
  /** トリガーテキスト（マッチした入力部分） */
  readonly trigger: string;
}

export interface CompletionResult {
  /** 補完候補のリスト */
  readonly candidates: readonly CompletionCandidate[];
  /** トリガー部分の開始位置（カーソルからの負のオフセット） */
  readonly triggerStart: number;
  /** トリガー部分の長さ */
  readonly triggerLength: number;
}

// --- 補完マッピングテーブル ---

/** ASCII演算子 → Unicode変換 */
const OPERATOR_COMPLETIONS: readonly {
  readonly trigger: string;
  readonly label: string;
  readonly insertText: string;
}[] = [
  { trigger: "->", label: "→ (implies)", insertText: "→" },
  { trigger: "<->", label: "↔ (iff)", insertText: "↔" },
  { trigger: "/\\", label: "∧ (and)", insertText: "∧" },
  { trigger: "\\/", label: "∨ (or)", insertText: "∨" },
  { trigger: "~", label: "¬ (not)", insertText: "¬" },
];

/** 量化子テンプレート */
const QUANTIFIER_COMPLETIONS: readonly {
  readonly trigger: string;
  readonly label: string;
  readonly insertText: string;
}[] = [
  { trigger: "all", label: "∀. (forall)", insertText: "∀" },
  { trigger: "forall", label: "∀. (forall)", insertText: "∀" },
  { trigger: "ex", label: "∃. (exists)", insertText: "∃" },
  { trigger: "exists", label: "∃. (exists)", insertText: "∃" },
];

// --- ギリシャ文字候補の事前計算 ---

const GREEK_COMPLETIONS: readonly {
  readonly trigger: string;
  readonly label: string;
  readonly insertText: string;
}[] = [...greekLetterNames.entries()].map(([name, letter]) => ({
  trigger: name,
  label: `${letter satisfies string} (${name satisfies string})`,
  insertText: letter,
}));

// --- カーソル手前のトリガー抽出 ---

/**
 * カーソル位置の手前からトリガーテキストを抽出する。
 * 英字・数字・記号（->, <->, /\, \/, ~）を対象。
 */
export const extractTrigger = (
  text: string,
  cursorPos: number,
): { readonly trigger: string; readonly start: number } => {
  // カーソルが範囲外の場合
  if (cursorPos <= 0 || cursorPos > text.length) {
    return { trigger: "", start: cursorPos };
  }

  // カーソル手前の文字列から英数字の連続部分を取得
  let start = cursorPos;
  while (start > 0) {
    const ch = text[start - 1]!;
    // 英字・数字・_は単語の一部
    if (/[a-zA-Z0-9_]/.test(ch)) {
      start--;
      continue;
    }
    // 特殊記号: ~, -, <, >, /, \
    if ("-<>/\\~".includes(ch)) {
      start--;
      continue;
    }
    break;
  }

  return {
    trigger: text.slice(start, cursorPos),
    start,
  };
};

// --- 補完候補の計算 ---

/**
 * カーソル位置の入力テキストから補完候補を計算する。
 *
 * @param text - 入力テキスト全体
 * @param cursorPos - カーソル位置（0-indexed、テキストの長さ以下）
 * @returns 補完結果。候補がなければ空配列
 */
export const computeCompletions = (
  text: string,
  cursorPos: number,
): CompletionResult => {
  const { trigger, start } = extractTrigger(text, cursorPos);

  if (trigger === "") {
    return { candidates: [], triggerStart: start, triggerLength: 0 };
  }

  const lowerTrigger = trigger.toLowerCase();
  const candidates: CompletionCandidate[] = [];

  // 演算子マッチ（完全前方一致）
  for (const op of OPERATOR_COMPLETIONS) {
    if (op.trigger.startsWith(lowerTrigger) && op.trigger !== lowerTrigger) {
      // 部分一致のみ（完全一致は除外 = まだ確定していない）
      candidates.push({
        label: op.label,
        insertText: op.insertText,
        category: "operator",
        trigger: op.trigger,
      });
    }
    if (op.trigger === lowerTrigger) {
      // 完全一致 = 変換確定候補
      candidates.push({
        label: op.label,
        insertText: op.insertText,
        category: "operator",
        trigger: op.trigger,
      });
    }
  }

  // 量化子マッチ
  for (const q of QUANTIFIER_COMPLETIONS) {
    if (
      q.trigger.startsWith(lowerTrigger) &&
      q.trigger.length > lowerTrigger.length
    ) {
      candidates.push({
        label: q.label,
        insertText: q.insertText,
        category: "quantifier",
        trigger: q.trigger,
      });
    }
    if (q.trigger === lowerTrigger) {
      candidates.push({
        label: q.label,
        insertText: q.insertText,
        category: "quantifier",
        trigger: q.trigger,
      });
    }
  }

  // ギリシャ文字マッチ（2文字以上の入力から）
  if (lowerTrigger.length >= 2) {
    for (const g of GREEK_COMPLETIONS) {
      if (
        g.trigger.startsWith(lowerTrigger) &&
        g.trigger.length > lowerTrigger.length
      ) {
        candidates.push({
          label: g.label,
          insertText: g.insertText,
          category: "greek",
          trigger: g.trigger,
        });
      }
      if (g.trigger === lowerTrigger) {
        candidates.push({
          label: g.label,
          insertText: g.insertText,
          category: "greek",
          trigger: g.trigger,
        });
      }
    }
  }

  // 同じ insertText を持つ候補を重複排除
  // （例: "ex" → trigger "ex" の完全一致と trigger "exists" の前方一致が両方マッチする）
  const seen = new Set<string>();
  const deduplicated: CompletionCandidate[] = [];
  for (const c of candidates) {
    if (!seen.has(c.insertText)) {
      seen.add(c.insertText);
      deduplicated.push(c);
    }
  }

  return {
    candidates: deduplicated,
    triggerStart: start,
    triggerLength: trigger.length,
  };
};

// --- テキスト適用 ---

/**
 * 補完候補を入力テキストに適用して新しいテキストとカーソル位置を返す。
 *
 * @param text - 現在の入力テキスト
 * @param completion - 適用する補完結果
 * @param candidate - 選択された候補
 * @returns 新しいテキストとカーソル位置
 */
export const applyCompletion = (
  text: string,
  completion: CompletionResult,
  candidate: CompletionCandidate,
): { readonly text: string; readonly cursorPos: number } => {
  const before = text.slice(0, completion.triggerStart);
  const after = text.slice(completion.triggerStart + completion.triggerLength);
  const newText = before + candidate.insertText + after;
  const newCursorPos = before.length + candidate.insertText.length;

  return { text: newText, cursorPos: newCursorPos };
};
