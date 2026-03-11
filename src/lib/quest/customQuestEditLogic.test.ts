import { describe, it, expect } from "vitest";
import {
  createEmptyEditFormValues,
  questToEditFormValues,
  validateEditForm,
  getEditFieldError,
  shouldShowEditFieldError,
  getFirstEditErrorField,
  parseGoalLines,
  goalsTextToDefinitions,
  parseHintLines,
  parseEstimatedSteps,
  type EditFormValues,
} from "./customQuestEditLogic";
import type { QuestDefinition } from "./questDefinition";

// --- ヘルパー ---

function makeQuest(overrides: Partial<QuestDefinition> = {}): QuestDefinition {
  return {
    id: "custom-1000",
    category: "propositional-basics",
    title: "テストクエスト",
    description: "テスト用の自作クエスト。",
    difficulty: 2,
    systemPresetId: "lukasiewicz",
    goals: [{ formulaText: "p -> p" }, { formulaText: "p -> (q -> p)" }],
    hints: ["ヒント1", "ヒント2"],
    estimatedSteps: 5,
    learningPoint: "テスト学習ポイント",
    order: 0,
    version: 1,
    ...overrides,
  };
}

function makeValidValues(
  overrides: Partial<EditFormValues> = {},
): EditFormValues {
  return {
    title: "テストクエスト",
    description: "説明",
    difficulty: 2,
    systemPresetId: "lukasiewicz",
    goalsText: "p -> p",
    hints: "",
    estimatedSteps: "5",
    learningPoint: "学習ポイント",
    ...overrides,
  };
}

// --- createEmptyEditFormValues ---

describe("createEmptyEditFormValues", () => {
  it("空のフォーム初期値を生成する", () => {
    const result = createEmptyEditFormValues();
    expect(result.title).toBe("");
    expect(result.description).toBe("");
    expect(result.difficulty).toBe(1);
    expect(result.systemPresetId).toBe("lukasiewicz");
    expect(result.goalsText).toBe("");
    expect(result.hints).toBe("");
    expect(result.estimatedSteps).toBe("");
    expect(result.learningPoint).toBe("");
  });

  it("バリデーションでタイトルとゴール式のエラーが出る", () => {
    const values = createEmptyEditFormValues();
    const validation = validateEditForm(values);
    expect(validation.valid).toBe(false);
    if (!validation.valid) {
      // estimatedSteps="" は「未指定」として有効なのでエラーにならない
      expect(validation.errors.map((e) => e.field)).toEqual([
        "title",
        "goalsText",
      ]);
    }
  });
});

// --- questToEditFormValues ---

describe("questToEditFormValues", () => {
  it("クエスト定義からフォーム値に変換する", () => {
    const quest = makeQuest();
    const result = questToEditFormValues(quest);

    expect(result.title).toBe("テストクエスト");
    expect(result.description).toBe("テスト用の自作クエスト。");
    expect(result.difficulty).toBe(2);
    expect(result.systemPresetId).toBe("lukasiewicz");
    expect(result.goalsText).toBe("p -> p\np -> (q -> p)");
    expect(result.hints).toBe("ヒント1\nヒント2");
    expect(result.estimatedSteps).toBe("5");
    expect(result.learningPoint).toBe("テスト学習ポイント");
  });

  it("ゴールが1つの場合は改行なし", () => {
    const quest = makeQuest({ goals: [{ formulaText: "p -> p" }] });
    const result = questToEditFormValues(quest);
    expect(result.goalsText).toBe("p -> p");
  });

  it("ヒントが空の場合は空文字列", () => {
    const quest = makeQuest({ hints: [] });
    const result = questToEditFormValues(quest);
    expect(result.hints).toBe("");
  });

  it("ゴールが空の場合は空文字列", () => {
    const quest = makeQuest({ goals: [] });
    const result = questToEditFormValues(quest);
    expect(result.goalsText).toBe("");
  });

  it("estimatedStepsがundefinedの場合は空文字列", () => {
    const quest = makeQuest({ estimatedSteps: undefined });
    const result = questToEditFormValues(quest);
    expect(result.estimatedSteps).toBe("");
  });
});

// --- validateEditForm ---

describe("validateEditForm", () => {
  it("有効な値はvalid: trueを返す", () => {
    const result = validateEditForm(makeValidValues());
    expect(result.valid).toBe(true);
  });

  it("タイトルが空の場合はエラー", () => {
    const result = validateEditForm(makeValidValues({ title: "" }));
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]!.field).toBe("title");
    }
  });

  it("タイトルが空白のみの場合はエラー", () => {
    const result = validateEditForm(makeValidValues({ title: "   " }));
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors[0]!.field).toBe("title");
    }
  });

  it("タイトルが100文字を超える場合はエラー", () => {
    const longTitle = "a".repeat(101);
    const result = validateEditForm(makeValidValues({ title: longTitle }));
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors[0]!.field).toBe("title");
      expect(result.errors[0]!.message).toContain("100文字以内");
    }
  });

  it("タイトルが100文字ちょうどの場合は有効", () => {
    const result = validateEditForm(
      makeValidValues({ title: "a".repeat(100) }),
    );
    expect(result.valid).toBe(true);
  });

  it("ゴール式が空の場合はエラー", () => {
    const result = validateEditForm(makeValidValues({ goalsText: "" }));
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors[0]!.field).toBe("goalsText");
    }
  });

  it("ゴール式が空白行のみの場合はエラー", () => {
    const result = validateEditForm(
      makeValidValues({ goalsText: "  \n  \n  " }),
    );
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors[0]!.field).toBe("goalsText");
    }
  });

  it("推定ステップ数が空の場合は有効（未指定）", () => {
    const result = validateEditForm(makeValidValues({ estimatedSteps: "" }));
    expect(result.valid).toBe(true);
  });

  it("推定ステップ数が空白のみの場合も有効（未指定）", () => {
    const result = validateEditForm(makeValidValues({ estimatedSteps: "   " }));
    expect(result.valid).toBe(true);
  });

  it("推定ステップ数が0の場合はエラー", () => {
    const result = validateEditForm(makeValidValues({ estimatedSteps: "0" }));
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors[0]!.field).toBe("estimatedSteps");
    }
  });

  it("推定ステップ数が負の場合はエラー", () => {
    const result = validateEditForm(makeValidValues({ estimatedSteps: "-1" }));
    expect(result.valid).toBe(false);
  });

  it("推定ステップ数が小数の場合はエラー", () => {
    const result = validateEditForm(makeValidValues({ estimatedSteps: "1.5" }));
    expect(result.valid).toBe(false);
  });

  it("推定ステップ数が数値でない場合はエラー", () => {
    const result = validateEditForm(makeValidValues({ estimatedSteps: "abc" }));
    expect(result.valid).toBe(false);
  });

  it("複数のエラーが同時に発生する", () => {
    const result = validateEditForm(
      makeValidValues({ title: "", goalsText: "", estimatedSteps: "abc" }),
    );
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors).toHaveLength(3);
      expect(result.errors.map((e) => e.field)).toEqual([
        "title",
        "goalsText",
        "estimatedSteps",
      ]);
    }
  });

  it("タイトルとゴールが空でestimatedStepsも空の場合はtitleとgoalsTextのみエラー", () => {
    const result = validateEditForm(
      makeValidValues({ title: "", goalsText: "", estimatedSteps: "" }),
    );
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors).toHaveLength(2);
      expect(result.errors.map((e) => e.field)).toEqual([
        "title",
        "goalsText",
      ]);
    }
  });

  it("複数行のゴール式は有効", () => {
    const result = validateEditForm(
      makeValidValues({ goalsText: "p -> p\nq -> q\nr -> r" }),
    );
    expect(result.valid).toBe(true);
  });
});

// --- getEditFieldError ---

describe("getEditFieldError", () => {
  it("valid の場合は undefined", () => {
    expect(getEditFieldError({ valid: true }, "title")).toBeUndefined();
  });

  it("指定フィールドのエラーメッセージを返す", () => {
    const validation = validateEditForm(makeValidValues({ title: "" }));
    expect(getEditFieldError(validation, "title")).toBe(
      "タイトルを入力してください",
    );
  });

  it("存在しないフィールドは undefined", () => {
    const validation = validateEditForm(makeValidValues({ title: "" }));
    expect(getEditFieldError(validation, "goalsText")).toBeUndefined();
  });
});

// --- shouldShowEditFieldError ---

describe("shouldShowEditFieldError", () => {
  const invalidValidation = validateEditForm(makeValidValues({ title: "" }));

  it("touched=false, submitted=false の場合は undefined", () => {
    expect(
      shouldShowEditFieldError({
        touched: false,
        submitted: false,
        validation: invalidValidation,
        field: "title",
      }),
    ).toBeUndefined();
  });

  it("touched=true の場合はエラーメッセージを返す", () => {
    expect(
      shouldShowEditFieldError({
        touched: true,
        submitted: false,
        validation: invalidValidation,
        field: "title",
      }),
    ).toBe("タイトルを入力してください");
  });

  it("submitted=true の場合はエラーメッセージを返す", () => {
    expect(
      shouldShowEditFieldError({
        touched: false,
        submitted: true,
        validation: invalidValidation,
        field: "title",
      }),
    ).toBe("タイトルを入力してください");
  });

  it("valid の場合は touched=true でも undefined", () => {
    expect(
      shouldShowEditFieldError({
        touched: true,
        submitted: true,
        validation: { valid: true },
        field: "title",
      }),
    ).toBeUndefined();
  });
});

// --- getFirstEditErrorField ---

describe("getFirstEditErrorField", () => {
  it("valid の場合は undefined", () => {
    expect(getFirstEditErrorField({ valid: true })).toBeUndefined();
  });

  it("最初のエラーフィールドを返す", () => {
    const validation = validateEditForm(
      makeValidValues({ title: "", goalsText: "" }),
    );
    expect(getFirstEditErrorField(validation)).toBe("title");
  });

  it("タイトルが有効でゴールがエラーの場合はgoalsTextを返す", () => {
    const validation = validateEditForm(makeValidValues({ goalsText: "" }));
    expect(getFirstEditErrorField(validation)).toBe("goalsText");
  });
});

// --- parseGoalLines ---

describe("parseGoalLines", () => {
  it("改行区切りの文字列を配列に変換する", () => {
    expect(parseGoalLines("p -> p\nq -> q")).toEqual(["p -> p", "q -> q"]);
  });

  it("空行は無視する", () => {
    expect(parseGoalLines("p -> p\n\nq -> q\n")).toEqual(["p -> p", "q -> q"]);
  });

  it("空白のみの行は無視する", () => {
    expect(parseGoalLines("p -> p\n   \nq -> q")).toEqual(["p -> p", "q -> q"]);
  });

  it("前後の空白はトリムする", () => {
    expect(parseGoalLines("  p -> p  \n  q -> q  ")).toEqual([
      "p -> p",
      "q -> q",
    ]);
  });

  it("空文字列は空配列", () => {
    expect(parseGoalLines("")).toEqual([]);
  });

  it("単一行", () => {
    expect(parseGoalLines("p -> p")).toEqual(["p -> p"]);
  });
});

// --- goalsTextToDefinitions ---

describe("goalsTextToDefinitions", () => {
  it("ゴール式テキストをQuestGoalDefinition配列に変換する", () => {
    const result = goalsTextToDefinitions("p -> p\nq -> q");
    expect(result).toEqual([
      { formulaText: "p -> p" },
      { formulaText: "q -> q" },
    ]);
  });

  it("空文字列は空配列", () => {
    expect(goalsTextToDefinitions("")).toEqual([]);
  });
});

// --- parseHintLines ---

describe("parseHintLines", () => {
  it("改行区切りの文字列を配列に変換する", () => {
    expect(parseHintLines("ヒント1\nヒント2")).toEqual(["ヒント1", "ヒント2"]);
  });

  it("空行は無視する", () => {
    expect(parseHintLines("ヒント1\n\nヒント2")).toEqual([
      "ヒント1",
      "ヒント2",
    ]);
  });

  it("空文字列は空配列", () => {
    expect(parseHintLines("")).toEqual([]);
  });
});

// --- parseEstimatedSteps ---

describe("parseEstimatedSteps", () => {
  it("空文字列はundefined", () => {
    expect(parseEstimatedSteps("")).toBeUndefined();
  });

  it("空白のみはundefined", () => {
    expect(parseEstimatedSteps("   ")).toBeUndefined();
  });

  it("数値文字列はnumberに変換", () => {
    expect(parseEstimatedSteps("5")).toBe(5);
  });

  it("小数も変換される", () => {
    expect(parseEstimatedSteps("1.5")).toBe(1.5);
  });

  it("不正な文字列はNaN", () => {
    expect(parseEstimatedSteps("abc")).toBeNaN();
  });
});
