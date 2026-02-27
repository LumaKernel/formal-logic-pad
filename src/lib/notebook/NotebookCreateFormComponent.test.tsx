import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotebookCreateForm } from "./NotebookCreateFormComponent";
import {
  lukasiewiczSystem,
  predicateLogicSystem,
} from "../logic-core/inferenceRule";
import { hilbertDeduction } from "../logic-core/deductionSystem";
import { allReferenceEntries } from "../reference/referenceContent";

describe("NotebookCreateForm", () => {
  const defaultProps = {
    onSubmit: vi.fn(),
    onCancel: vi.fn(),
  };

  function renderForm(
    props: Partial<React.ComponentProps<typeof NotebookCreateForm>> = {},
  ) {
    return render(<NotebookCreateForm {...defaultProps} {...props} />);
  }

  describe("初期表示", () => {
    it("フォームが表示される", () => {
      renderForm();
      expect(screen.getByTestId("notebook-create-form")).toBeInTheDocument();
    });

    it("名前入力欄が空で表示される", () => {
      renderForm();
      const input = screen.getByTestId("create-name-input");
      expect(input).toHaveValue("");
    });

    it("Łukasiewicz公理系がデフォルトで選択される", () => {
      renderForm();
      const card = screen.getByTestId("system-preset-lukasiewicz");
      expect(card).toHaveAttribute("aria-checked", "true");
    });

    it("公理系カードが3つ表示される", () => {
      renderForm();
      expect(
        screen.getByTestId("system-preset-lukasiewicz"),
      ).toBeInTheDocument();
      expect(screen.getByTestId("system-preset-predicate")).toBeInTheDocument();
      expect(screen.getByTestId("system-preset-equality")).toBeInTheDocument();
    });

    it("作成ボタンとキャンセルボタンが表示される", () => {
      renderForm();
      expect(screen.getByTestId("create-submit-btn")).toBeInTheDocument();
      expect(screen.getByTestId("create-cancel-btn")).toBeInTheDocument();
    });

    it("初期状態ではエラーメッセージが表示されない", () => {
      renderForm();
      expect(screen.queryByTestId("create-name-error")).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("create-system-error"),
      ).not.toBeInTheDocument();
    });
  });

  describe("名前入力", () => {
    it("名前を入力できる", async () => {
      renderForm();
      const user = userEvent.setup();
      const input = screen.getByTestId("create-name-input");
      await user.type(input, "テストノート");
      expect(input).toHaveValue("テストノート");
    });
  });

  describe("公理系選択", () => {
    it("述語論理を選択できる", async () => {
      renderForm();
      const user = userEvent.setup();
      await user.click(screen.getByTestId("system-preset-predicate"));
      expect(screen.getByTestId("system-preset-predicate")).toHaveAttribute(
        "aria-checked",
        "true",
      );
      expect(screen.getByTestId("system-preset-lukasiewicz")).toHaveAttribute(
        "aria-checked",
        "false",
      );
    });

    it("等号付き述語論理を選択できる", async () => {
      renderForm();
      const user = userEvent.setup();
      await user.click(screen.getByTestId("system-preset-equality"));
      expect(screen.getByTestId("system-preset-equality")).toHaveAttribute(
        "aria-checked",
        "true",
      );
    });

    it("キーボードで選択できる", () => {
      renderForm();
      const card = screen.getByTestId("system-preset-predicate");
      fireEvent.keyDown(card, { key: "Enter" });
      expect(card).toHaveAttribute("aria-checked", "true");
    });

    it("スペースキーで選択できる", () => {
      renderForm();
      const card = screen.getByTestId("system-preset-equality");
      fireEvent.keyDown(card, { key: " " });
      expect(card).toHaveAttribute("aria-checked", "true");
    });
  });

  describe("フォーム送信", () => {
    it("有効な値で送信するとonSubmitが呼ばれる", async () => {
      const onSubmit = vi.fn();
      renderForm({ onSubmit });
      const user = userEvent.setup();

      await user.type(screen.getByTestId("create-name-input"), "テストノート");
      await user.click(screen.getByTestId("create-submit-btn"));

      expect(onSubmit).toHaveBeenCalledWith({
        name: "テストノート",
        deductionSystem: hilbertDeduction(lukasiewiczSystem),
      });
    });

    it("述語論理で送信できる", async () => {
      const onSubmit = vi.fn();
      renderForm({ onSubmit });
      const user = userEvent.setup();

      await user.type(
        screen.getByTestId("create-name-input"),
        "述語論理ノート",
      );
      await user.click(screen.getByTestId("system-preset-predicate"));
      await user.click(screen.getByTestId("create-submit-btn"));

      expect(onSubmit).toHaveBeenCalledWith({
        name: "述語論理ノート",
        deductionSystem: hilbertDeduction(predicateLogicSystem),
      });
    });

    it("名前の前後の空白がトリムされる", async () => {
      const onSubmit = vi.fn();
      renderForm({ onSubmit });
      const user = userEvent.setup();

      await user.type(screen.getByTestId("create-name-input"), "  テスト  ");
      await user.click(screen.getByTestId("create-submit-btn"));

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ name: "テスト" }),
      );
    });
  });

  describe("バリデーション", () => {
    it("名前が空のまま送信するとエラー表示", async () => {
      const onSubmit = vi.fn();
      renderForm({ onSubmit });
      const user = userEvent.setup();

      await user.click(screen.getByTestId("create-submit-btn"));

      expect(screen.getByTestId("create-name-error")).toHaveTextContent(
        "名前を入力してください",
      );
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("送信前はエラー表示されない", () => {
      renderForm();
      expect(screen.queryByTestId("create-name-error")).not.toBeInTheDocument();
    });

    it("空の名前入力欄からフォーカスを外すとエラー表示（blur バリデーション）", async () => {
      renderForm();
      const user = userEvent.setup();
      const input = screen.getByTestId("create-name-input");

      // blur前はエラーなし
      expect(screen.queryByTestId("create-name-error")).not.toBeInTheDocument();

      // フォーカスしてblur
      await user.click(input);
      await user.tab();

      expect(screen.getByTestId("create-name-error")).toHaveTextContent(
        "名前を入力してください",
      );
    });

    it("有効な名前入力後のblurではエラー表示されない", async () => {
      renderForm();
      const user = userEvent.setup();
      const input = screen.getByTestId("create-name-input");

      await user.type(input, "テストノート");
      await user.tab();

      expect(screen.queryByTestId("create-name-error")).not.toBeInTheDocument();
    });

    it("blur後にエラーが出ても、有効な値を入力するとエラーが消える", async () => {
      renderForm();
      const user = userEvent.setup();
      const input = screen.getByTestId("create-name-input");

      // blurでエラー表示
      await user.click(input);
      await user.tab();
      expect(screen.getByTestId("create-name-error")).toBeInTheDocument();

      // 有効な値を入力するとエラーが消える
      await user.click(input);
      await user.type(input, "テストノート");
      expect(screen.queryByTestId("create-name-error")).not.toBeInTheDocument();
    });

    it("送信エラー時にname入力欄にフォーカスが移る", async () => {
      renderForm();
      const user = userEvent.setup();

      await user.click(screen.getByTestId("create-submit-btn"));

      const input = screen.getByTestId("create-name-input");
      expect(document.activeElement).toBe(input);
    });

    it("エラーメッセージにrole='alert'が設定されている", async () => {
      renderForm();
      const user = userEvent.setup();

      await user.click(screen.getByTestId("create-submit-btn"));

      const errorEl = screen.getByTestId("create-name-error");
      expect(errorEl).toHaveAttribute("role", "alert");
    });

    it("エラー時にinputにaria-invalid='true'が設定される", async () => {
      renderForm();
      const user = userEvent.setup();

      await user.click(screen.getByTestId("create-submit-btn"));

      const input = screen.getByTestId("create-name-input");
      expect(input).toHaveAttribute("aria-invalid", "true");
    });

    it("正常時にinputにaria-invalid='false'が設定される", () => {
      renderForm();
      const input = screen.getByTestId("create-name-input");
      expect(input).toHaveAttribute("aria-invalid", "false");
    });

    it("エラー時にaria-describedbyでエラーメッセージと紐付く", async () => {
      renderForm();
      const user = userEvent.setup();

      await user.click(screen.getByTestId("create-submit-btn"));

      const input = screen.getByTestId("create-name-input");
      expect(input).toHaveAttribute("aria-describedby", "create-name-error-msg");

      const errorEl = screen.getByTestId("create-name-error");
      expect(errorEl).toHaveAttribute("id", "create-name-error-msg");
    });
  });

  describe("キャンセル", () => {
    it("キャンセルボタンでonCancelが呼ばれる", async () => {
      const onCancel = vi.fn();
      renderForm({ onCancel });
      const user = userEvent.setup();

      await user.click(screen.getByTestId("create-cancel-btn"));

      expect(onCancel).toHaveBeenCalledOnce();
    });
  });

  describe("リファレンスポップオーバー統合", () => {
    it("referenceEntries指定時に(?)ボタンが表示される", () => {
      renderForm({
        referenceEntries: allReferenceEntries,
        locale: "ja",
        testId: "form",
      });
      const refTrigger = screen.getByTestId(
        "form-preset-lukasiewicz-ref-trigger",
      );
      expect(refTrigger).toBeInTheDocument();
    });

    it("リファレンスのないプリセット(predicate)には(?)が表示されない", () => {
      renderForm({
        referenceEntries: allReferenceEntries,
        locale: "ja",
        testId: "form",
      });
      expect(
        screen.queryByTestId("form-preset-predicate-ref-trigger"),
      ).not.toBeInTheDocument();
    });

    it("referenceEntries未指定時は(?)ボタンが表示されない", () => {
      renderForm({ testId: "form" });
      expect(
        screen.queryByTestId("form-preset-lukasiewicz-ref-trigger"),
      ).not.toBeInTheDocument();
    });

    it("(?)クリックでポップオーバーが開く（体系選択は変わらない）", async () => {
      const user = userEvent.setup();
      renderForm({
        referenceEntries: allReferenceEntries,
        locale: "ja",
        testId: "form",
      });

      // lukasiewiczがデフォルト選択
      expect(screen.getByTestId("system-preset-lukasiewicz")).toHaveAttribute(
        "aria-checked",
        "true",
      );

      await user.click(
        screen.getByTestId("form-preset-lukasiewicz-ref-trigger"),
      );

      // ポップオーバーが開く
      expect(
        screen.getByTestId("form-preset-lukasiewicz-ref-popover"),
      ).toBeInTheDocument();

      // 選択状態は変わらない（stopPropagation確認）
      expect(screen.getByTestId("system-preset-lukasiewicz")).toHaveAttribute(
        "aria-checked",
        "true",
      );
    });

    it("onOpenReferenceDetailが呼ばれる", async () => {
      const user = userEvent.setup();
      const handleDetail = vi.fn();
      renderForm({
        referenceEntries: allReferenceEntries,
        locale: "ja",
        onOpenReferenceDetail: handleDetail,
        testId: "form",
      });

      await user.click(
        screen.getByTestId("form-preset-lukasiewicz-ref-trigger"),
      );
      const detailBtn = screen.getByTestId(
        "form-preset-lukasiewicz-ref-detail-btn",
      );
      await user.click(detailBtn);

      expect(handleDetail).toHaveBeenCalledWith("system-lukasiewicz");
    });

    it("別のプリセット(peano)の(?)も表示される", () => {
      renderForm({
        referenceEntries: allReferenceEntries,
        locale: "ja",
        testId: "form",
      });
      expect(
        screen.getByTestId("form-preset-peano-ref-trigger"),
      ).toBeInTheDocument();
    });

    it("自然演繹プリセット(nd-nm)の(?)も表示される", () => {
      renderForm({
        referenceEntries: allReferenceEntries,
        locale: "ja",
        testId: "form",
      });
      expect(
        screen.getByTestId("form-preset-nd-nm-ref-trigger"),
      ).toBeInTheDocument();
    });
  });
});
