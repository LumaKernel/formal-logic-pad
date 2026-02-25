import { describe, expect, it } from "vitest";
import {
  applyCompletion,
  computeCompletions,
  extractTrigger,
} from "./inputCompletion";

// --- extractTrigger ---

describe("extractTrigger", () => {
  it("空文字列で空トリガーを返す", () => {
    const result = extractTrigger("", 0);
    expect(result.trigger).toBe("");
    expect(result.start).toBe(0);
  });

  it("カーソルが0で空トリガーを返す", () => {
    const result = extractTrigger("abc", 0);
    expect(result.trigger).toBe("");
    expect(result.start).toBe(0);
  });

  it("英字の連続をトリガーとして抽出する", () => {
    const result = extractTrigger("phi", 3);
    expect(result.trigger).toBe("phi");
    expect(result.start).toBe(0);
  });

  it("スペース後の英字をトリガーとして抽出する", () => {
    const result = extractTrigger("x + ph", 6);
    expect(result.trigger).toBe("ph");
    expect(result.start).toBe(4);
  });

  it("記号をトリガーとして抽出する", () => {
    const result = extractTrigger("x ->", 4);
    expect(result.trigger).toBe("->");
    expect(result.start).toBe(2);
  });

  it("チルダをトリガーとして抽出する", () => {
    const result = extractTrigger("~", 1);
    expect(result.trigger).toBe("~");
    expect(result.start).toBe(0);
  });

  it("/\\をトリガーとして抽出する", () => {
    const result = extractTrigger("x /\\", 4);
    expect(result.trigger).toBe("/\\");
    expect(result.start).toBe(2);
  });

  it("カーソルが文字列途中でもトリガーを抽出する", () => {
    const result = extractTrigger("alpha + beta", 5);
    expect(result.trigger).toBe("alpha");
    expect(result.start).toBe(0);
  });

  it("カーソルが範囲外で空トリガーを返す", () => {
    const result = extractTrigger("abc", 10);
    expect(result.trigger).toBe("");
    expect(result.start).toBe(10);
  });

  it("Unicode文字の後で空トリガーを返す", () => {
    const result = extractTrigger("φ ", 3);
    expect(result.trigger).toBe("");
    expect(result.start).toBe(3);
  });
});

// --- computeCompletions ---

describe("computeCompletions", () => {
  describe("演算子補完", () => {
    it("'-' で → 候補を返す", () => {
      const result = computeCompletions("-", 1);
      const labels = result.candidates.map((c) => c.label);
      expect(labels).toContain("→ (implies)");
    });

    it("'->' で → の完全一致候補を返す", () => {
      const result = computeCompletions("->", 2);
      const implies = result.candidates.find((c) => c.insertText === "→");
      expect(implies).toBeDefined();
      expect(implies?.trigger).toBe("->");
    });

    it("'<-' で ↔ 候補を返す", () => {
      const result = computeCompletions("<-", 2);
      const labels = result.candidates.map((c) => c.label);
      expect(labels).toContain("↔ (iff)");
    });

    it("'/' で ∧ ∨ 候補を返す", () => {
      const result = computeCompletions("/", 1);
      const labels = result.candidates.map((c) => c.label);
      expect(labels).toContain("∧ (and)");
    });

    it("'~' で ¬ 候補を返す", () => {
      const result = computeCompletions("~", 1);
      const notCandidate = result.candidates.find((c) => c.insertText === "¬");
      expect(notCandidate).toBeDefined();
    });

    it("演算子候補のカテゴリが operator", () => {
      const result = computeCompletions("->", 2);
      const implies = result.candidates.find((c) => c.insertText === "→");
      expect(implies?.category).toBe("operator");
    });
  });

  describe("ギリシャ文字補完", () => {
    it("'ph' で φ 候補を返す", () => {
      const result = computeCompletions("ph", 2);
      const phi = result.candidates.find((c) => c.insertText === "φ");
      expect(phi).toBeDefined();
      expect(phi?.category).toBe("greek");
    });

    it("'phi' で φ の完全一致候補を返す", () => {
      const result = computeCompletions("phi", 3);
      const phi = result.candidates.find((c) => c.insertText === "φ");
      expect(phi).toBeDefined();
    });

    it("'al' で α 候補を返す", () => {
      const result = computeCompletions("al", 2);
      const alpha = result.candidates.find((c) => c.insertText === "α");
      expect(alpha).toBeDefined();
    });

    it("'ps' で ψ 候補を返す", () => {
      const result = computeCompletions("ps", 2);
      const psi = result.candidates.find((c) => c.insertText === "ψ");
      expect(psi).toBeDefined();
    });

    it("'om' で ω 候補を返す", () => {
      const result = computeCompletions("om", 2);
      const omega = result.candidates.find((c) => c.insertText === "ω");
      expect(omega).toBeDefined();
    });

    it("1文字ではギリシャ文字候補を返さない", () => {
      const result = computeCompletions("a", 1);
      const greekCandidates = result.candidates.filter(
        (c) => c.category === "greek",
      );
      expect(greekCandidates).toHaveLength(0);
    });

    it("マッチしない入力で空候補を返す", () => {
      const result = computeCompletions("xyz", 3);
      expect(result.candidates).toHaveLength(0);
    });
  });

  describe("量化子補完", () => {
    it("'al' で ∀ 候補を返す", () => {
      const result = computeCompletions("al", 2);
      const forall = result.candidates.find((c) => c.insertText === "∀");
      expect(forall).toBeDefined();
      expect(forall?.category).toBe("quantifier");
    });

    it("'all' で ∀ の完全一致候補を返す", () => {
      const result = computeCompletions("all", 3);
      const forall = result.candidates.find(
        (c) => c.insertText === "∀" && c.trigger === "all",
      );
      expect(forall).toBeDefined();
    });

    it("'ex' で ∃ 候補を返す", () => {
      const result = computeCompletions("ex", 2);
      const exists = result.candidates.find((c) => c.insertText === "∃");
      expect(exists).toBeDefined();
    });

    it("'fo' で forall 候補を返す", () => {
      const result = computeCompletions("fo", 2);
      const forall = result.candidates.find((c) => c.trigger === "forall");
      expect(forall).toBeDefined();
    });
  });

  describe("コンテキスト内での補完", () => {
    it("式の途中でも補完できる", () => {
      const result = computeCompletions("x -", 3);
      const implies = result.candidates.find((c) => c.insertText === "→");
      expect(implies).toBeDefined();
    });

    it("式の途中でギリシャ文字を補完できる", () => {
      const result = computeCompletions("x + ph", 6);
      const phi = result.candidates.find((c) => c.insertText === "φ");
      expect(phi).toBeDefined();
      expect(result.triggerStart).toBe(4);
      expect(result.triggerLength).toBe(2);
    });

    it("空入力で空候補を返す", () => {
      const result = computeCompletions("", 0);
      expect(result.candidates).toHaveLength(0);
    });

    it("スペースの後で空候補を返す", () => {
      const result = computeCompletions("x ", 2);
      expect(result.candidates).toHaveLength(0);
    });
  });

  describe("triggerStart と triggerLength", () => {
    it("先頭からのトリガーで start=0", () => {
      const result = computeCompletions("phi", 3);
      expect(result.triggerStart).toBe(0);
      expect(result.triggerLength).toBe(3);
    });

    it("途中からのトリガーで正しい start", () => {
      const result = computeCompletions("x + al", 6);
      expect(result.triggerStart).toBe(4);
      expect(result.triggerLength).toBe(2);
    });
  });
});

// --- applyCompletion ---

describe("applyCompletion", () => {
  it("トリガーを挿入テキストで置換する", () => {
    const completion = computeCompletions("phi", 3);
    const phi = completion.candidates.find((c) => c.insertText === "φ")!;
    const result = applyCompletion("phi", completion, phi);
    expect(result.text).toBe("φ");
    expect(result.cursorPos).toBe(1); // φ は1文字（UTF-16で）
  });

  it("式の途中でトリガーを置換する", () => {
    const completion = computeCompletions("x + ph", 6);
    const phi = completion.candidates.find((c) => c.insertText === "φ")!;
    const result = applyCompletion("x + ph", completion, phi);
    expect(result.text).toBe("x + φ");
    expect(result.cursorPos).toBe(5);
  });

  it("演算子を置換する", () => {
    const completion = computeCompletions("x ->", 4);
    const implies = completion.candidates.find((c) => c.insertText === "→")!;
    const result = applyCompletion("x ->", completion, implies);
    expect(result.text).toBe("x →");
    expect(result.cursorPos).toBe(3);
  });

  it("後ろにテキストがある場合も正しく置換する", () => {
    const text = "x -> y";
    // カーソルは -> の直後（位置4）
    const completion = computeCompletions(text, 4);
    const implies = completion.candidates.find((c) => c.insertText === "→")!;
    const result = applyCompletion(text, completion, implies);
    expect(result.text).toBe("x → y");
    expect(result.cursorPos).toBe(3);
  });

  it("量化子を置換する", () => {
    const completion = computeCompletions("all", 3);
    const forall = completion.candidates.find(
      (c) => c.insertText === "∀" && c.trigger === "all",
    )!;
    const result = applyCompletion("all", completion, forall);
    expect(result.text).toBe("∀");
    expect(result.cursorPos).toBe(1);
  });
});
