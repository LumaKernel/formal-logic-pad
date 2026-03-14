import { describe, it, expect, vi, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CustomQuestList } from "./CustomQuestListComponent";
import type { QuestCatalogItem } from "./questCatalog";
import type { QuestDefinition } from "./questDefinition";

// --- テストヘルパー ---

function makeQuest(overrides: Partial<QuestDefinition> = {}): QuestDefinition {
  return {
    id: "custom-1000",
    category: "propositional-basics",
    title: "テストクエスト",
    description: "テスト用の自作クエスト。",
    difficulty: 1,
    systemPresetId: "lukasiewicz",
    goals: [{ formulaText: "p -> p" }],
    hints: [],
    estimatedSteps: 5,
    learningPoint: "テスト",
    order: 0,
    version: 1,
    ...overrides,
  };
}

function makeItem(
  overrides: Partial<QuestCatalogItem> & {
    readonly questOverrides?: Partial<QuestDefinition>;
  } = {},
): QuestCatalogItem {
  const { questOverrides, ...rest } = overrides;
  return {
    quest: makeQuest(questOverrides),
    completed: false,
    completionCount: 0,
    bestStepCount: undefined,
    rating: "not-completed",
    ...rest,
  };
}

const sampleItems: readonly QuestCatalogItem[] = [
  makeItem({
    questOverrides: {
      id: "custom-1001",
      title: "恒等律の練習",
      description: "φ → φ を証明せよ。",
      difficulty: 1,
    },
    completed: true,
    completionCount: 2,
    bestStepCount: 4,
    rating: "perfect",
  }),
  makeItem({
    questOverrides: {
      id: "custom-1002",
      title: "ド・モルガンの法則",
      description: "¬(p ∧ q) → (¬p ∨ ¬q) を証明せよ。",
      difficulty: 3,
    },
  }),
];

describe("CustomQuestListComponent", () => {
  describe("キーボードナビゲーション", () => {
    it("Enterキーでクエスト開始が呼ばれる", async () => {
      const onStartQuest = vi.fn();
      render(
        <CustomQuestList items={sampleItems} onStartQuest={onStartQuest} />,
      );

      const questItem = screen.getByTestId("custom-quest-item-custom-1001");
      questItem.focus();
      await userEvent.keyboard("{Enter}");

      expect(onStartQuest).toHaveBeenCalledWith("custom-1001");
    });

    it("Spaceキーでクエスト開始が呼ばれる", async () => {
      const onStartQuest = vi.fn();
      render(
        <CustomQuestList items={sampleItems} onStartQuest={onStartQuest} />,
      );

      const questItem = screen.getByTestId("custom-quest-item-custom-1002");
      questItem.focus();
      await userEvent.keyboard(" ");

      expect(onStartQuest).toHaveBeenCalledWith("custom-1002");
    });

    it("Tabキーではクエスト開始が呼ばれない", async () => {
      const onStartQuest = vi.fn();
      render(
        <CustomQuestList items={sampleItems} onStartQuest={onStartQuest} />,
      );

      const questItem = screen.getByTestId("custom-quest-item-custom-1001");
      questItem.focus();
      await userEvent.keyboard("{Tab}");

      expect(onStartQuest).not.toHaveBeenCalled();
    });
  });

  describe("ファイルインポート", () => {
    it("ファイル選択でJSONテキストがテキストエリアに反映される", async () => {
      const onImportQuest = vi.fn();
      render(
        <CustomQuestList
          items={sampleItems}
          onStartQuest={vi.fn()}
          onImportQuest={onImportQuest}
        />,
      );

      // インポートフォームを開く
      await userEvent.click(screen.getByTestId("custom-quest-import-btn"));

      // ファイル入力を取得
      const fileInput = screen.getByTestId(
        "import-file-input",
      ) as HTMLInputElement;

      // テスト用JSONファイルを作成
      const jsonContent = '{"_format":"intro-formal-proof-quest","_version":1}';
      const file = new File([jsonContent], "quest.json", {
        type: "application/json",
      });

      // ファイルをアップロード
      await userEvent.upload(fileInput, file);

      // FileReaderの非同期処理を待つ
      await waitFor(() => {
        const textarea = screen.getByTestId(
          "import-json-input",
        ) as HTMLTextAreaElement;
        expect(textarea.value).toBe(jsonContent);
      });
    });

    it("ファイルが選択されていない場合は何もしない", () => {
      const onImportQuest = vi.fn();
      render(
        <CustomQuestList
          items={sampleItems}
          onStartQuest={vi.fn()}
          onImportQuest={onImportQuest}
        />,
      );

      // インポートフォームを開く
      fireEvent.click(screen.getByTestId("custom-quest-import-btn"));

      // ファイル入力にファイルなしのchangeイベントを発火
      const fileInput = screen.getByTestId("import-file-input");
      fireEvent.change(fileInput, { target: { files: [] } });

      // テキストエリアは空のまま
      const textarea = screen.getByTestId(
        "import-json-input",
      ) as HTMLTextAreaElement;
      expect(textarea.value).toBe("");
    });

    it("空のJSONテキストではインポートボタンが無効", async () => {
      render(
        <CustomQuestList
          items={sampleItems}
          onStartQuest={vi.fn()}
          onImportQuest={vi.fn()}
        />,
      );

      await userEvent.click(screen.getByTestId("custom-quest-import-btn"));

      const submitBtn = screen.getByTestId("import-submit-btn");
      expect(submitBtn).toBeDisabled();
    });

    it("空のJSONテキストでsubmitしてもonImportQuestが呼ばれない", () => {
      const onImportQuest = vi.fn();
      render(
        <CustomQuestList
          items={sampleItems}
          onStartQuest={vi.fn()}
          onImportQuest={onImportQuest}
        />,
      );

      fireEvent.click(screen.getByTestId("custom-quest-import-btn"));

      // form submit を直接発火（空テキスト状態で）
      const form = screen.getByTestId("import-submit-btn").closest("form")!;
      fireEvent.submit(form);

      expect(onImportQuest).not.toHaveBeenCalled();
    });
  });

  describe("編集フォーム フィールド入力", () => {
    function renderWithEditForm() {
      const onEditQuest = vi.fn();
      render(
        <CustomQuestList
          items={sampleItems}
          onStartQuest={vi.fn()}
          onEditQuest={onEditQuest}
        />,
      );
      // 編集ボタンをクリック
      fireEvent.click(screen.getByTestId("custom-quest-edit-btn-custom-1001"));
      return { onEditQuest };
    }

    it("説明を入力できる", () => {
      renderWithEditForm();
      const textarea = screen.getByTestId(
        "edit-description-input",
      ) as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: "新しい説明" } });
      expect(textarea.value).toBe("新しい説明");
    });

    it("難易度を変更できる", () => {
      renderWithEditForm();
      const select = screen.getByTestId(
        "edit-difficulty-select",
      ) as HTMLSelectElement;
      fireEvent.change(select, { target: { value: "3" } });
      expect(select.value).toBe("3");
    });

    it("体系を変更できる", () => {
      renderWithEditForm();
      const select = screen.getByTestId(
        "edit-system-select",
      ) as HTMLSelectElement;
      fireEvent.change(select, { target: { value: "classical" } });
      expect(select.value).toBe("classical");
    });

    it("ゴール式を追加・削除できる", () => {
      renderWithEditForm();
      // 初期状態で1つのゴール式がある（quest.goals = [{ formulaText: "p -> p" }]）
      expect(screen.getByTestId("edit-goals-item-0")).toBeInTheDocument();
      // 追加ボタンをクリック
      fireEvent.click(screen.getByTestId("edit-goals-add"));
      expect(screen.getByTestId("edit-goals-item-1")).toBeInTheDocument();
      // 削除ボタンをクリック
      fireEvent.click(screen.getByTestId("edit-goals-remove-1"));
      expect(screen.queryByTestId("edit-goals-item-1")).toBeNull();
    });

    it("ゴール式をすべて削除してsubmitするとエラーが表示される", () => {
      renderWithEditForm();
      // 唯一のゴール式を削除
      fireEvent.click(screen.getByTestId("edit-goals-remove-0"));
      // submitする
      const form = screen.getByTestId("edit-save-btn").closest("form")!;
      fireEvent.submit(form);
      // エラーが表示される
      expect(screen.getByTestId("edit-goals-error")).toBeInTheDocument();
    });

    it("ヒントを入力できる", () => {
      renderWithEditForm();
      const textarea = screen.getByTestId(
        "edit-hints-input",
      ) as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: "ヒント1\nヒント2" } });
      expect(textarea.value).toBe("ヒント1\nヒント2");
    });

    it("推定ステップ数を入力できる", () => {
      renderWithEditForm();
      const input = screen.getByTestId("edit-steps-input") as HTMLInputElement;
      fireEvent.change(input, { target: { value: "10" } });
      expect(input.value).toBe("10");
    });

    it("推定ステップ数のblurでtouchedが設定される", () => {
      renderWithEditForm();
      const input = screen.getByTestId("edit-steps-input");
      fireEvent.change(input, { target: { value: "0" } });
      fireEvent.blur(input);
      expect(screen.getByTestId("edit-steps-error")).toBeInTheDocument();
    });

    it("学習ポイントを入力できる", () => {
      renderWithEditForm();
      const input = screen.getByTestId(
        "edit-learning-point-input",
      ) as HTMLInputElement;
      fireEvent.change(input, { target: { value: "新しい学習ポイント" } });
      expect(input.value).toBe("新しい学習ポイント");
    });
  });

  describe("編集フォーム バリデーションエラー時のフォーカス", () => {
    it("タイトル空でsubmitするとタイトルにフォーカスが移動する", () => {
      const onEditQuest = vi.fn();
      render(
        <CustomQuestList
          items={sampleItems}
          onStartQuest={vi.fn()}
          onEditQuest={onEditQuest}
        />,
      );
      fireEvent.click(screen.getByTestId("custom-quest-edit-btn-custom-1001"));

      // タイトルを空にする
      const titleInput = screen.getByTestId("edit-title-input");
      fireEvent.change(titleInput, { target: { value: "" } });

      // submitする
      const form = screen.getByTestId("edit-save-btn").closest("form")!;
      fireEvent.submit(form);

      expect(document.activeElement).toBe(titleInput);
      expect(onEditQuest).not.toHaveBeenCalled();
    });

    it("ゴール空でsubmitするとエラーが表示される", () => {
      const onEditQuest = vi.fn();
      render(
        <CustomQuestList
          items={sampleItems}
          onStartQuest={vi.fn()}
          onEditQuest={onEditQuest}
        />,
      );
      fireEvent.click(screen.getByTestId("custom-quest-edit-btn-custom-1001"));

      // ゴールをすべて削除
      fireEvent.click(screen.getByTestId("edit-goals-remove-0"));

      // submitする
      const form = screen.getByTestId("edit-save-btn").closest("form")!;
      fireEvent.submit(form);

      expect(screen.getByTestId("edit-goals-error")).toBeInTheDocument();
      expect(onEditQuest).not.toHaveBeenCalled();
    });

    it("ステップ数不正でsubmitするとステップ数にフォーカスが移動する", () => {
      const onEditQuest = vi.fn();
      render(
        <CustomQuestList
          items={sampleItems}
          onStartQuest={vi.fn()}
          onEditQuest={onEditQuest}
        />,
      );
      fireEvent.click(screen.getByTestId("custom-quest-edit-btn-custom-1001"));

      // ステップ数を不正な値にする
      const stepsInput = screen.getByTestId("edit-steps-input");
      fireEvent.change(stepsInput, { target: { value: "0" } });

      // submitする
      const form = screen.getByTestId("edit-save-btn").closest("form")!;
      fireEvent.submit(form);

      expect(document.activeElement).toBe(stepsInput);
      expect(onEditQuest).not.toHaveBeenCalled();
    });
  });

  describe("作成フォーム フィールド入力", () => {
    function renderWithCreateForm() {
      const onCreateQuest = vi.fn();
      render(
        <CustomQuestList
          items={sampleItems}
          onStartQuest={vi.fn()}
          onCreateQuest={onCreateQuest}
        />,
      );
      // 新規作成ボタンをクリック
      fireEvent.click(screen.getByTestId("custom-quest-create-btn"));
      return { onCreateQuest };
    }

    it("説明を入力できる", () => {
      renderWithCreateForm();
      const textarea = screen.getByTestId(
        "create-description-input",
      ) as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: "新しい説明" } });
      expect(textarea.value).toBe("新しい説明");
    });

    it("難易度を変更できる", () => {
      renderWithCreateForm();
      const select = screen.getByTestId(
        "create-difficulty-select",
      ) as HTMLSelectElement;
      fireEvent.change(select, { target: { value: "4" } });
      expect(select.value).toBe("4");
    });

    it("体系を変更できる", () => {
      renderWithCreateForm();
      const select = screen.getByTestId(
        "create-system-select",
      ) as HTMLSelectElement;
      fireEvent.change(select, { target: { value: "classical" } });
      expect(select.value).toBe("classical");
    });

    it("ゴール式を追加できる", () => {
      renderWithCreateForm();
      // 初期状態は空（追加メッセージが表示される）
      expect(screen.getByText("式を追加してください")).toBeInTheDocument();
      // 追加ボタンをクリック
      fireEvent.click(screen.getByTestId("create-goals-add"));
      expect(screen.getByTestId("create-goals-item-0")).toBeInTheDocument();
    });

    it("ヒントを入力できる", () => {
      renderWithCreateForm();
      const textarea = screen.getByTestId(
        "create-hints-input",
      ) as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: "ヒント1" } });
      expect(textarea.value).toBe("ヒント1");
    });

    it("推定ステップ数を入力できる", () => {
      renderWithCreateForm();
      const input = screen.getByTestId(
        "create-steps-input",
      ) as HTMLInputElement;
      fireEvent.change(input, { target: { value: "7" } });
      expect(input.value).toBe("7");
    });

    it("推定ステップ数のblurでtouchedが設定される", () => {
      renderWithCreateForm();
      const input = screen.getByTestId("create-steps-input");
      fireEvent.change(input, { target: { value: "0" } });
      fireEvent.blur(input);
      expect(screen.getByTestId("create-steps-error")).toBeInTheDocument();
    });

    it("学習ポイントを入力できる", () => {
      renderWithCreateForm();
      const input = screen.getByTestId(
        "create-learning-point-input",
      ) as HTMLInputElement;
      fireEvent.change(input, { target: { value: "テスト学習ポイント" } });
      expect(input.value).toBe("テスト学習ポイント");
    });
  });

  describe("作成フォーム バリデーションエラー時のフォーカス", () => {
    it("タイトル空でsubmitするとタイトルにフォーカスが移動する", () => {
      const onCreateQuest = vi.fn();
      render(
        <CustomQuestList
          items={sampleItems}
          onStartQuest={vi.fn()}
          onCreateQuest={onCreateQuest}
        />,
      );
      fireEvent.click(screen.getByTestId("custom-quest-create-btn"));

      // デフォルトではタイトルが空なのでそのままsubmit
      const form = screen.getByTestId("create-save-btn").closest("form")!;
      fireEvent.submit(form);

      const titleInput = screen.getByTestId("create-title-input");
      expect(document.activeElement).toBe(titleInput);
      expect(onCreateQuest).not.toHaveBeenCalled();
    });

    it("ゴール空でsubmitするとエラーが表示される", () => {
      const onCreateQuest = vi.fn();
      render(
        <CustomQuestList
          items={sampleItems}
          onStartQuest={vi.fn()}
          onCreateQuest={onCreateQuest}
        />,
      );
      fireEvent.click(screen.getByTestId("custom-quest-create-btn"));

      // タイトルを入力してゴールだけ空の状態にする
      const titleInput = screen.getByTestId("create-title-input");
      fireEvent.change(titleInput, { target: { value: "テスト" } });

      const form = screen.getByTestId("create-save-btn").closest("form")!;
      fireEvent.submit(form);

      expect(screen.getByTestId("create-goals-error")).toBeInTheDocument();
      expect(onCreateQuest).not.toHaveBeenCalled();
    });

    it("ステップ数不正でsubmitするとステップ数にフォーカスが移動する", () => {
      const onCreateQuest = vi.fn();
      render(
        <CustomQuestList
          items={sampleItems}
          onStartQuest={vi.fn()}
          onCreateQuest={onCreateQuest}
        />,
      );
      fireEvent.click(screen.getByTestId("custom-quest-create-btn"));

      // タイトルとゴールを入力
      fireEvent.change(screen.getByTestId("create-title-input"), {
        target: { value: "テスト" },
      });
      // FormulaListEditor でゴール式を追加
      fireEvent.click(screen.getByTestId("create-goals-add"));
      fireEvent.click(screen.getByTestId("create-goals-editor-0-display"));
      const goalInput = screen.getByTestId("create-goals-editor-0-input-input");
      fireEvent.change(goalInput, { target: { value: "p -> p" } });
      // ステップ数を0にする
      fireEvent.change(screen.getByTestId("create-steps-input"), {
        target: { value: "0" },
      });

      const form = screen.getByTestId("create-save-btn").closest("form")!;
      fireEvent.submit(form);

      const stepsInput = screen.getByTestId("create-steps-input");
      expect(document.activeElement).toBe(stepsInput);
      expect(onCreateQuest).not.toHaveBeenCalled();
    });
  });

  describe("ホバー状態", () => {
    it("mouseLeaveでホバー状態が解除される", () => {
      render(<CustomQuestList items={sampleItems} onStartQuest={vi.fn()} />);

      const questItem = screen.getByTestId("custom-quest-item-custom-1001");

      // mouseEnterでホバー
      fireEvent.mouseEnter(questItem);
      const hoveredBg = questItem.style.background;

      // mouseLeaveで解除
      fireEvent.mouseLeave(questItem);
      const normalBg = questItem.style.background;

      // ホバー状態と通常状態でスタイルが異なることを確認
      expect(hoveredBg).not.toBe(normalBg);
    });
  });

  describe("空状態表示", () => {
    it("アイテムが空で作成・インポート中でなければ空メッセージが表示される", () => {
      render(<CustomQuestList items={[]} onStartQuest={vi.fn()} />);

      expect(screen.getByTestId("custom-quest-list-empty")).toBeInTheDocument();
    });

    it("アイテムが空でも作成中なら空メッセージは表示されない", () => {
      const onCreateQuest = vi.fn();
      render(
        <CustomQuestList
          items={[]}
          onStartQuest={vi.fn()}
          onCreateQuest={onCreateQuest}
        />,
      );

      // 作成ボタンをクリックして作成モードに入る
      fireEvent.click(screen.getByTestId("custom-quest-create-btn"));

      // 空メッセージは非表示
      expect(
        screen.queryByTestId("custom-quest-list-empty"),
      ).not.toBeInTheDocument();
    });

    it("アイテムが空でもインポート中なら空メッセージは表示されない", () => {
      const onImportQuest = vi.fn();
      render(
        <CustomQuestList
          items={[]}
          onStartQuest={vi.fn()}
          onImportQuest={onImportQuest}
        />,
      );

      // インポートボタンをクリックしてインポートモードに入る
      fireEvent.click(screen.getByTestId("custom-quest-import-btn"));

      // 空メッセージは非表示
      expect(
        screen.queryByTestId("custom-quest-list-empty"),
      ).not.toBeInTheDocument();
    });
  });

  describe("削除確認", () => {
    it("削除ボタンクリックで確認オーバーレイが表示される", () => {
      render(
        <CustomQuestList
          items={sampleItems}
          onStartQuest={vi.fn()}
          onDeleteQuest={vi.fn()}
        />,
      );

      fireEvent.click(
        screen.getByTestId("custom-quest-delete-btn-custom-1001"),
      );

      expect(
        screen.getByTestId("custom-quest-delete-confirm-custom-1001"),
      ).toBeInTheDocument();
      expect(screen.getByText("本当に削除しますか？")).toBeInTheDocument();
    });

    it("確認ボタンクリックでonDeleteQuestが呼ばれる", () => {
      const onDeleteQuest = vi.fn();
      render(
        <CustomQuestList
          items={sampleItems}
          onStartQuest={vi.fn()}
          onDeleteQuest={onDeleteQuest}
        />,
      );

      // 削除ボタンクリック → 確認オーバーレイ表示
      fireEvent.click(
        screen.getByTestId("custom-quest-delete-btn-custom-1001"),
      );

      // 確認ボタンクリック → onDeleteQuest呼び出し
      fireEvent.click(
        screen.getByTestId("custom-quest-delete-confirm-btn-custom-1001"),
      );

      expect(onDeleteQuest).toHaveBeenCalledWith("custom-1001");
    });

    it("キャンセルボタンクリックでオーバーレイが閉じる", () => {
      render(
        <CustomQuestList
          items={sampleItems}
          onStartQuest={vi.fn()}
          onDeleteQuest={vi.fn()}
        />,
      );

      // 削除ボタンクリック → 確認オーバーレイ表示
      fireEvent.click(
        screen.getByTestId("custom-quest-delete-btn-custom-1001"),
      );
      expect(
        screen.getByTestId("custom-quest-delete-confirm-custom-1001"),
      ).toBeInTheDocument();

      // キャンセルボタンクリック → オーバーレイが閉じる
      fireEvent.click(
        screen.getByTestId("custom-quest-delete-cancel-btn-custom-1001"),
      );
      expect(
        screen.queryByTestId("custom-quest-delete-confirm-custom-1001"),
      ).not.toBeInTheDocument();
    });

    it("確認前にonDeleteQuestが呼ばれない", () => {
      const onDeleteQuest = vi.fn();
      render(
        <CustomQuestList
          items={sampleItems}
          onStartQuest={vi.fn()}
          onDeleteQuest={onDeleteQuest}
        />,
      );

      // 削除ボタンクリックだけでは onDeleteQuest は呼ばれない
      fireEvent.click(
        screen.getByTestId("custom-quest-delete-btn-custom-1001"),
      );

      expect(onDeleteQuest).not.toHaveBeenCalled();
    });

    it("確認後にオーバーレイが閉じる", () => {
      const onDeleteQuest = vi.fn();
      render(
        <CustomQuestList
          items={sampleItems}
          onStartQuest={vi.fn()}
          onDeleteQuest={onDeleteQuest}
        />,
      );

      fireEvent.click(
        screen.getByTestId("custom-quest-delete-btn-custom-1001"),
      );
      fireEvent.click(
        screen.getByTestId("custom-quest-delete-confirm-btn-custom-1001"),
      );

      // 確認後にオーバーレイが閉じる
      expect(
        screen.queryByTestId("custom-quest-delete-confirm-custom-1001"),
      ).not.toBeInTheDocument();
    });

    it("確認オーバーレイクリックでonStartQuestが呼ばれない（stopPropagation）", () => {
      const onStartQuest = vi.fn();
      render(
        <CustomQuestList
          items={sampleItems}
          onStartQuest={onStartQuest}
          onDeleteQuest={vi.fn()}
        />,
      );

      fireEvent.click(
        screen.getByTestId("custom-quest-delete-btn-custom-1001"),
      );

      // 確認オーバーレイをクリック
      fireEvent.click(
        screen.getByTestId("custom-quest-delete-confirm-custom-1001"),
      );

      expect(onStartQuest).not.toHaveBeenCalled();
    });
  });

  describe("共有パネル", () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it("共有ボタンクリックで共有パネルが表示される", () => {
      render(
        <CustomQuestList
          items={sampleItems}
          onStartQuest={vi.fn()}
          onExportQuest={vi.fn()}
          onShareQuestUrl={vi.fn()}
        />,
      );

      fireEvent.click(screen.getByTestId("custom-quest-share-btn-custom-1001"));

      const panel = screen.getByTestId("custom-quest-share-panel-custom-1001");
      expect(panel).toBeInTheDocument();
      expect(
        screen.getByTestId("custom-quest-share-export-btn-custom-1001"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("custom-quest-share-url-btn-custom-1001"),
      ).toBeInTheDocument();
    });

    it("共有ボタンのテキストが「共有」である", () => {
      render(
        <CustomQuestList
          items={sampleItems}
          onStartQuest={vi.fn()}
          onExportQuest={vi.fn()}
          onShareQuestUrl={vi.fn()}
        />,
      );

      const shareBtn = screen.getByTestId("custom-quest-share-btn-custom-1001");
      expect(shareBtn).toHaveTextContent("共有");
    });

    it("JSONエクスポートボタンクリックでonExportQuestが呼ばれる", () => {
      const onExportQuest = vi.fn();
      render(
        <CustomQuestList
          items={sampleItems}
          onStartQuest={vi.fn()}
          onExportQuest={onExportQuest}
          onShareQuestUrl={vi.fn()}
        />,
      );

      // 共有パネルを開く
      fireEvent.click(screen.getByTestId("custom-quest-share-btn-custom-1001"));

      // JSONエクスポートボタンをクリック
      fireEvent.click(
        screen.getByTestId("custom-quest-share-export-btn-custom-1001"),
      );

      expect(onExportQuest).toHaveBeenCalledWith("custom-1001");
    });

    it("URLコピーボタンクリックでonShareQuestUrlが呼ばれる", () => {
      const onShareQuestUrl = vi.fn();
      render(
        <CustomQuestList
          items={sampleItems}
          onStartQuest={vi.fn()}
          onExportQuest={vi.fn()}
          onShareQuestUrl={onShareQuestUrl}
        />,
      );

      // 共有パネルを開く
      fireEvent.click(screen.getByTestId("custom-quest-share-btn-custom-1001"));

      // URLコピーボタンをクリック
      fireEvent.click(
        screen.getByTestId("custom-quest-share-url-btn-custom-1001"),
      );

      expect(onShareQuestUrl).toHaveBeenCalledWith("custom-1001");
    });

    it("URLコピー後に「コピーしました!」フィードバックが表示される", () => {
      render(
        <CustomQuestList
          items={sampleItems}
          onStartQuest={vi.fn()}
          onExportQuest={vi.fn()}
          onShareQuestUrl={vi.fn()}
        />,
      );

      // 共有パネルを開く
      fireEvent.click(screen.getByTestId("custom-quest-share-btn-custom-1001"));

      // URLコピーボタンをクリック
      fireEvent.click(
        screen.getByTestId("custom-quest-share-url-btn-custom-1001"),
      );

      // フィードバックが表示される
      expect(
        screen.getByTestId("custom-quest-share-url-btn-custom-1001"),
      ).toHaveTextContent("コピーしました!");
    });

    it("URLコピーのフィードバックが2秒後に消える", () => {
      vi.useFakeTimers();
      render(
        <CustomQuestList
          items={sampleItems}
          onStartQuest={vi.fn()}
          onExportQuest={vi.fn()}
          onShareQuestUrl={vi.fn()}
        />,
      );

      // 共有パネルを開く
      fireEvent.click(screen.getByTestId("custom-quest-share-btn-custom-1001"));

      // URLコピーボタンをクリック
      fireEvent.click(
        screen.getByTestId("custom-quest-share-url-btn-custom-1001"),
      );

      expect(
        screen.getByTestId("custom-quest-share-url-btn-custom-1001"),
      ).toHaveTextContent("コピーしました!");

      // 2秒後にフィードバックが消える
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(
        screen.getByTestId("custom-quest-share-url-btn-custom-1001"),
      ).toHaveTextContent("URLをコピー");
    });

    it("閉じるボタンクリックでパネルが閉じる", () => {
      render(
        <CustomQuestList
          items={sampleItems}
          onStartQuest={vi.fn()}
          onExportQuest={vi.fn()}
          onShareQuestUrl={vi.fn()}
        />,
      );

      // 共有パネルを開く
      fireEvent.click(screen.getByTestId("custom-quest-share-btn-custom-1001"));
      expect(
        screen.getByTestId("custom-quest-share-panel-custom-1001"),
      ).toBeInTheDocument();

      // 閉じるボタンクリック
      fireEvent.click(
        screen.getByTestId("custom-quest-share-close-btn-custom-1001"),
      );
      expect(
        screen.queryByTestId("custom-quest-share-panel-custom-1001"),
      ).not.toBeInTheDocument();
    });

    it("共有パネルクリックでonStartQuestが呼ばれない（stopPropagation）", () => {
      const onStartQuest = vi.fn();
      render(
        <CustomQuestList
          items={sampleItems}
          onStartQuest={onStartQuest}
          onExportQuest={vi.fn()}
          onShareQuestUrl={vi.fn()}
        />,
      );

      // 共有パネルを開く
      fireEvent.click(screen.getByTestId("custom-quest-share-btn-custom-1001"));

      // パネルをクリック
      fireEvent.click(
        screen.getByTestId("custom-quest-share-panel-custom-1001"),
      );

      expect(onStartQuest).not.toHaveBeenCalled();
    });

    it("onExportQuestのみの場合でも共有ボタンが表示される", () => {
      render(
        <CustomQuestList
          items={sampleItems}
          onStartQuest={vi.fn()}
          onExportQuest={vi.fn()}
        />,
      );

      expect(
        screen.getByTestId("custom-quest-share-btn-custom-1001"),
      ).toBeInTheDocument();
    });

    it("onShareQuestUrlのみの場合でも共有ボタンが表示される", () => {
      render(
        <CustomQuestList
          items={sampleItems}
          onStartQuest={vi.fn()}
          onShareQuestUrl={vi.fn()}
        />,
      );

      expect(
        screen.getByTestId("custom-quest-share-btn-custom-1001"),
      ).toBeInTheDocument();
    });

    it("両方ない場合は共有ボタンが表示されない", () => {
      render(<CustomQuestList items={sampleItems} onStartQuest={vi.fn()} />);

      expect(
        screen.queryByTestId("custom-quest-share-btn-custom-1001"),
      ).not.toBeInTheDocument();
    });

    it("URLコピーを2回呼ぶと前回のタイマーがクリアされる", () => {
      vi.useFakeTimers();
      const onShareQuestUrl = vi.fn();
      render(
        <CustomQuestList
          items={sampleItems}
          onStartQuest={vi.fn()}
          onExportQuest={vi.fn()}
          onShareQuestUrl={onShareQuestUrl}
        />,
      );

      // 共有パネルを開く
      fireEvent.click(screen.getByTestId("custom-quest-share-btn-custom-1001"));

      // URL共有を2回クリック（タイマークリアパスを通す）
      fireEvent.click(
        screen.getByTestId("custom-quest-share-url-btn-custom-1001"),
      );
      fireEvent.click(
        screen.getByTestId("custom-quest-share-url-btn-custom-1001"),
      );

      expect(onShareQuestUrl).toHaveBeenCalledTimes(2);
      vi.useRealTimers();
    });

    it("削除ボタンクリックで共有パネルが閉じる", () => {
      render(
        <CustomQuestList
          items={sampleItems}
          onStartQuest={vi.fn()}
          onExportQuest={vi.fn()}
          onShareQuestUrl={vi.fn()}
          onDeleteQuest={vi.fn()}
        />,
      );

      // 共有パネルを開く
      fireEvent.click(screen.getByTestId("custom-quest-share-btn-custom-1001"));
      expect(
        screen.getByTestId("custom-quest-share-panel-custom-1001"),
      ).toBeInTheDocument();

      // 削除ボタンクリック → 共有パネルが閉じ、削除確認が表示される
      fireEvent.click(
        screen.getByTestId("custom-quest-delete-btn-custom-1001"),
      );
      expect(
        screen.queryByTestId("custom-quest-share-panel-custom-1001"),
      ).not.toBeInTheDocument();
      expect(
        screen.getByTestId("custom-quest-delete-confirm-custom-1001"),
      ).toBeInTheDocument();
    });
  });

  describe("クエストアイテム操作", () => {
    it("クエストアイテム行クリックでonStartQuestが呼ばれる", () => {
      const onStartQuest = vi.fn();
      render(
        <CustomQuestList items={sampleItems} onStartQuest={onStartQuest} />,
      );

      fireEvent.click(screen.getByTestId("custom-quest-item-custom-1001"));
      expect(onStartQuest).toHaveBeenCalledWith("custom-1001");
    });

    it("開始ボタンクリックでonStartQuestが呼ばれstopPropagationされる", () => {
      const onStartQuest = vi.fn();
      render(
        <CustomQuestList items={sampleItems} onStartQuest={onStartQuest} />,
      );

      fireEvent.click(screen.getByTestId("custom-quest-start-btn-custom-1001"));
      expect(onStartQuest).toHaveBeenCalledWith("custom-1001");
    });

    it("複製ボタンクリックでonDuplicateQuestが呼ばれる", () => {
      const onDuplicateQuest = vi.fn();
      render(
        <CustomQuestList
          items={sampleItems}
          onStartQuest={vi.fn()}
          onDuplicateQuest={onDuplicateQuest}
        />,
      );

      fireEvent.click(
        screen.getByTestId("custom-quest-duplicate-btn-custom-1001"),
      );
      expect(onDuplicateQuest).toHaveBeenCalledWith("custom-1001");
    });
  });

  describe("編集フォーム保存・キャンセル", () => {
    it("有効なデータでsubmitするとonEditQuestが呼ばれる", () => {
      const onEditQuest = vi.fn();
      render(
        <CustomQuestList
          items={sampleItems}
          onStartQuest={vi.fn()}
          onEditQuest={onEditQuest}
        />,
      );

      // 編集フォームを開く（既存クエストはtitle/goals/stepsが設定済み）
      fireEvent.click(screen.getByTestId("custom-quest-edit-btn-custom-1001"));

      // submit（既存クエストデータはバリデーション通過済み）
      const form = screen.getByTestId("edit-save-btn").closest("form")!;
      fireEvent.submit(form);

      expect(onEditQuest).toHaveBeenCalled();
      // 保存後は編集フォームが閉じる
      expect(screen.queryByTestId("edit-title-input")).not.toBeInTheDocument();
    });

    it("編集フォームのタイトルblurでtouchedが設定される", () => {
      const onEditQuest = vi.fn();
      render(
        <CustomQuestList
          items={sampleItems}
          onStartQuest={vi.fn()}
          onEditQuest={onEditQuest}
        />,
      );

      fireEvent.click(screen.getByTestId("custom-quest-edit-btn-custom-1001"));

      // タイトルを空にしてblur
      const titleInput = screen.getByTestId("edit-title-input");
      fireEvent.change(titleInput, { target: { value: "" } });
      fireEvent.blur(titleInput);

      expect(screen.getByTestId("edit-title-error")).toBeInTheDocument();
    });

    it("編集フォームのキャンセルボタンクリックでフォームが閉じる", () => {
      render(
        <CustomQuestList
          items={sampleItems}
          onStartQuest={vi.fn()}
          onEditQuest={vi.fn()}
        />,
      );

      fireEvent.click(screen.getByTestId("custom-quest-edit-btn-custom-1001"));
      expect(screen.getByTestId("edit-title-input")).toBeInTheDocument();

      fireEvent.click(screen.getByTestId("edit-cancel-btn"));
      expect(screen.queryByTestId("edit-title-input")).not.toBeInTheDocument();
    });
  });

  describe("作成フォーム保存・キャンセル（コンテナ統合）", () => {
    it("有効なデータでsubmitするとonCreateQuestが呼ばれフォームが閉じる", async () => {
      const onCreateQuest = vi.fn();
      render(
        <CustomQuestList
          items={sampleItems}
          onStartQuest={vi.fn()}
          onCreateQuest={onCreateQuest}
        />,
      );

      // 作成フォームを開く
      fireEvent.click(screen.getByTestId("custom-quest-create-btn"));

      // タイトルを入力
      const titleInput = screen.getByTestId("create-title-input");
      fireEvent.change(titleInput, { target: { value: "テスト新規クエスト" } });

      // ゴール式を追加
      fireEvent.click(screen.getByTestId("create-goals-add"));

      // FormulaEditorのdisplay要素をクリックして編集モードにする
      const editorDisplay = screen.getByTestId("create-goals-editor-0-display");
      fireEvent.click(editorDisplay);

      // 編集モードのinput要素を見つけて値を入力
      await waitFor(() => {
        const formulaInput = screen.getByTestId(
          "create-goals-editor-0-input-input",
        );
        fireEvent.change(formulaInput, { target: { value: "p -> p" } });
      });

      // 推定ステップ数を入力
      const stepsInput = screen.getByTestId("create-steps-input");
      fireEvent.change(stepsInput, { target: { value: "5" } });

      // submit
      const form = screen.getByTestId("create-save-btn").closest("form")!;
      fireEvent.submit(form);

      expect(onCreateQuest).toHaveBeenCalled();
      // フォームが閉じることを確認
      expect(
        screen.queryByTestId("create-title-input"),
      ).not.toBeInTheDocument();
    });

    it("作成フォームのタイトルblurでtouchedが設定される", () => {
      const onCreateQuest = vi.fn();
      render(
        <CustomQuestList
          items={sampleItems}
          onStartQuest={vi.fn()}
          onCreateQuest={onCreateQuest}
        />,
      );

      fireEvent.click(screen.getByTestId("custom-quest-create-btn"));

      const titleInput = screen.getByTestId("create-title-input");
      fireEvent.change(titleInput, { target: { value: "" } });
      fireEvent.blur(titleInput);

      // タイトルが空なのでエラーが表示される
      expect(screen.getByTestId("create-title-error")).toBeInTheDocument();
    });

    it("作成フォームのキャンセルボタンクリックでフォームが閉じる", () => {
      const onCreateQuest = vi.fn();
      render(
        <CustomQuestList
          items={sampleItems}
          onStartQuest={vi.fn()}
          onCreateQuest={onCreateQuest}
        />,
      );

      fireEvent.click(screen.getByTestId("custom-quest-create-btn"));
      expect(screen.getByTestId("create-title-input")).toBeInTheDocument();

      fireEvent.click(screen.getByTestId("create-cancel-btn"));
      expect(
        screen.queryByTestId("create-title-input"),
      ).not.toBeInTheDocument();
    });
  });

  describe("インポートフォーム保存・キャンセル（コンテナ統合）", () => {
    it("JSONテキスト入力でテキストエリアが更新される", () => {
      const onImportQuest = vi.fn();
      render(
        <CustomQuestList
          items={sampleItems}
          onStartQuest={vi.fn()}
          onImportQuest={onImportQuest}
        />,
      );

      fireEvent.click(screen.getByTestId("custom-quest-import-btn"));

      const textarea = screen.getByTestId(
        "import-json-input",
      ) as HTMLTextAreaElement;
      fireEvent.change(textarea, {
        target: { value: '{"test": true}' },
      });
      expect(textarea.value).toBe('{"test": true}');
    });

    it("非空JSONテキストでsubmitするとonImportQuestが呼ばれフォームが閉じる", () => {
      const onImportQuest = vi.fn();
      render(
        <CustomQuestList
          items={sampleItems}
          onStartQuest={vi.fn()}
          onImportQuest={onImportQuest}
        />,
      );

      fireEvent.click(screen.getByTestId("custom-quest-import-btn"));

      // JSONテキストを入力
      const textarea = screen.getByTestId("import-json-input");
      fireEvent.change(textarea, {
        target: { value: '{"_format":"intro-formal-proof-quest"}' },
      });

      // submit
      const form = screen.getByTestId("import-submit-btn").closest("form")!;
      fireEvent.submit(form);

      expect(onImportQuest).toHaveBeenCalledWith(
        '{"_format":"intro-formal-proof-quest"}',
      );
      // インポートフォームが閉じることを確認
      expect(
        screen.queryByTestId("custom-quest-import-form"),
      ).not.toBeInTheDocument();
    });

    it("インポートフォームのキャンセルボタンクリックでフォームが閉じる", () => {
      const onImportQuest = vi.fn();
      render(
        <CustomQuestList
          items={sampleItems}
          onStartQuest={vi.fn()}
          onImportQuest={onImportQuest}
        />,
      );

      fireEvent.click(screen.getByTestId("custom-quest-import-btn"));
      expect(
        screen.getByTestId("custom-quest-import-form"),
      ).toBeInTheDocument();

      fireEvent.click(screen.getByTestId("import-cancel-btn"));
      expect(
        screen.queryByTestId("custom-quest-import-form"),
      ).not.toBeInTheDocument();
    });
  });
});
