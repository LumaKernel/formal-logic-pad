import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FormulaListEditor } from "./FormulaListEditor";

describe("FormulaListEditor", () => {
  describe("初期表示", () => {
    it("空リストの場合に空メッセージと追加ボタンを表示する", () => {
      render(<FormulaListEditor formulas={[]} onChange={vi.fn()} />);
      expect(screen.getByText("式を追加してください")).toBeTruthy();
      expect(screen.getByTestId("formula-list-add")).toBeTruthy();
    });

    it("論理式が1つある場合にアイテム行を表示する", () => {
      render(<FormulaListEditor formulas={["A → B"]} onChange={vi.fn()} />);
      expect(screen.getByTestId("formula-list-item-0")).toBeTruthy();
    });

    it("複数の論理式がある場合にすべてのアイテム行を表示する", () => {
      render(
        <FormulaListEditor formulas={["A", "B", "C"]} onChange={vi.fn()} />,
      );
      expect(screen.getByTestId("formula-list-item-0")).toBeTruthy();
      expect(screen.getByTestId("formula-list-item-1")).toBeTruthy();
      expect(screen.getByTestId("formula-list-item-2")).toBeTruthy();
    });

    it("エラーメッセージが指定されている場合に表示する", () => {
      render(
        <FormulaListEditor
          formulas={[]}
          onChange={vi.fn()}
          error="ゴール式を1つ以上入力してください"
        />,
      );
      expect(screen.getByTestId("formula-list-error")).toBeTruthy();
      expect(
        screen.getByText("ゴール式を1つ以上入力してください"),
      ).toBeTruthy();
    });

    it("エラーがない場合はエラー要素を表示しない", () => {
      render(<FormulaListEditor formulas={["A"]} onChange={vi.fn()} />);
      expect(screen.queryByTestId("formula-list-error")).toBeNull();
    });
  });

  describe("追加", () => {
    it("追加ボタンをクリックすると空の論理式が追加される", () => {
      const onChange = vi.fn();
      render(<FormulaListEditor formulas={["A"]} onChange={onChange} />);
      fireEvent.click(screen.getByTestId("formula-list-add"));
      expect(onChange).toHaveBeenCalledWith(["A", ""]);
    });

    it("空リストから追加すると1要素になる", () => {
      const onChange = vi.fn();
      render(<FormulaListEditor formulas={[]} onChange={onChange} />);
      fireEvent.click(screen.getByTestId("formula-list-add"));
      expect(onChange).toHaveBeenCalledWith([""]);
    });
  });

  describe("削除", () => {
    it("削除ボタンをクリックすると指定要素が削除される", () => {
      const onChange = vi.fn();
      render(
        <FormulaListEditor formulas={["A", "B", "C"]} onChange={onChange} />,
      );
      fireEvent.click(screen.getByTestId("formula-list-remove-1"));
      expect(onChange).toHaveBeenCalledWith(["A", "C"]);
    });

    it("先頭要素を削除できる", () => {
      const onChange = vi.fn();
      render(<FormulaListEditor formulas={["A", "B"]} onChange={onChange} />);
      fireEvent.click(screen.getByTestId("formula-list-remove-0"));
      expect(onChange).toHaveBeenCalledWith(["B"]);
    });
  });

  describe("並び替え", () => {
    it("↑ボタンで要素を上に移動する", () => {
      const onChange = vi.fn();
      render(
        <FormulaListEditor formulas={["A", "B", "C"]} onChange={onChange} />,
      );
      fireEvent.click(screen.getByTestId("formula-list-up-1"));
      expect(onChange).toHaveBeenCalledWith(["B", "A", "C"]);
    });

    it("↓ボタンで要素を下に移動する", () => {
      const onChange = vi.fn();
      render(
        <FormulaListEditor formulas={["A", "B", "C"]} onChange={onChange} />,
      );
      fireEvent.click(screen.getByTestId("formula-list-down-0"));
      expect(onChange).toHaveBeenCalledWith(["B", "A", "C"]);
    });

    it("先頭要素の↑ボタンは無効", () => {
      render(<FormulaListEditor formulas={["A", "B"]} onChange={vi.fn()} />);
      const upButton = screen.getByTestId("formula-list-up-0");
      expect(upButton).toHaveProperty("disabled", true);
    });

    it("末尾要素の↓ボタンは無効", () => {
      render(<FormulaListEditor formulas={["A", "B"]} onChange={vi.fn()} />);
      const downButton = screen.getByTestId("formula-list-down-1");
      expect(downButton).toHaveProperty("disabled", true);
    });
  });

  describe("テキスト編集", () => {
    it("FormulaEditorが各行にレンダリングされる", () => {
      render(<FormulaListEditor formulas={["A", "B"]} onChange={vi.fn()} />);
      expect(screen.getByTestId("formula-list-editor-0")).toBeTruthy();
      expect(screen.getByTestId("formula-list-editor-1")).toBeTruthy();
    });

    it("FormulaEditor内でテキストを変更するとonChangeが呼ばれる", () => {
      const onChange = vi.fn();
      render(<FormulaListEditor formulas={["A"]} onChange={onChange} />);
      // FormulaEditorのdisplayボタンをクリックして編集モードに入る
      fireEvent.click(screen.getByTestId("formula-list-editor-0-display"));
      // 編集モードのinput要素を取得
      const input = screen.getByTestId("formula-list-editor-0-input-input");
      fireEvent.change(input, { target: { value: "A → B" } });
      expect(onChange).toHaveBeenCalledWith(["A → B"]);
    });
  });

  describe("testId", () => {
    it("カスタムtestIdプレフィックスが適用される", () => {
      render(
        <FormulaListEditor
          formulas={["A"]}
          onChange={vi.fn()}
          testId="custom-list"
        />,
      );
      expect(screen.getByTestId("custom-list")).toBeTruthy();
      expect(screen.getByTestId("custom-list-item-0")).toBeTruthy();
      expect(screen.getByTestId("custom-list-add")).toBeTruthy();
    });
  });
});
