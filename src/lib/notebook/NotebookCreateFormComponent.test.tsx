import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotebookCreateForm } from "./NotebookCreateFormComponent";
import {
  lukasiewiczSystem,
  predicateLogicSystem,
} from "../logic-core/inferenceRule";

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

    it("自由帳モードがデフォルトで選択される", () => {
      renderForm();
      const freeRadio = screen.getByTestId("create-mode-free");
      expect(freeRadio).toBeChecked();
    });

    it("クエストモードはデフォルトで未選択", () => {
      renderForm();
      const questRadio = screen.getByTestId("create-mode-quest");
      expect(questRadio).not.toBeChecked();
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

  describe("モード選択", () => {
    it("クエストモードを選択できる", async () => {
      renderForm();
      const user = userEvent.setup();
      await user.click(screen.getByTestId("create-mode-quest"));
      expect(screen.getByTestId("create-mode-quest")).toBeChecked();
      expect(screen.getByTestId("create-mode-free")).not.toBeChecked();
    });

    it("自由帳モードに戻せる", async () => {
      renderForm();
      const user = userEvent.setup();
      await user.click(screen.getByTestId("create-mode-quest"));
      await user.click(screen.getByTestId("create-mode-free"));
      expect(screen.getByTestId("create-mode-free")).toBeChecked();
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
        mode: "free",
        system: lukasiewiczSystem,
      });
    });

    it("クエストモードで送信できる", async () => {
      const onSubmit = vi.fn();
      renderForm({ onSubmit });
      const user = userEvent.setup();

      await user.type(screen.getByTestId("create-name-input"), "クエスト1");
      await user.click(screen.getByTestId("create-mode-quest"));
      await user.click(screen.getByTestId("create-submit-btn"));

      expect(onSubmit).toHaveBeenCalledWith({
        name: "クエスト1",
        mode: "quest",
        system: lukasiewiczSystem,
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
        mode: "free",
        system: predicateLogicSystem,
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
});
