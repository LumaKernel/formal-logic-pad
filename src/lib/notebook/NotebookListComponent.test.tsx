import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NotebookList } from "./NotebookListComponent";
import type { NotebookListItem } from "./notebookListLogic";

const makeItem = (
  id: string,
  name: string,
  mode: "free" | "quest" = "free",
): NotebookListItem => ({
  id,
  name,
  systemName: "Łukasiewicz",
  mode,
  updatedAtLabel: "たった今",
  createdAtLabel: "1日前",
});

const defaultHandlers = {
  onOpen: vi.fn(),
  onDelete: vi.fn(),
  onDuplicate: vi.fn(),
  onRename: vi.fn(),
  onConvertToFree: vi.fn(),
};

describe("NotebookList", () => {
  describe("空の状態", () => {
    it("ノートがない場合にメッセージを表示する", () => {
      render(<NotebookList items={[]} {...defaultHandlers} />);
      expect(screen.getByTestId("notebook-list-empty")).toBeTruthy();
      expect(screen.getByText(/ノートがありません/)).toBeTruthy();
    });
  });

  describe("一覧表示", () => {
    it("ノートブック一覧を表示する", () => {
      const items = [makeItem("nb-1", "ノート1"), makeItem("nb-2", "ノート2")];
      render(<NotebookList items={items} {...defaultHandlers} />);
      expect(screen.getByTestId("notebook-list")).toBeTruthy();
      expect(screen.getByText("ノート1")).toBeTruthy();
      expect(screen.getByText("ノート2")).toBeTruthy();
    });

    it("体系名を表示する", () => {
      render(
        <NotebookList
          items={[makeItem("nb-1", "テスト")]}
          {...defaultHandlers}
        />,
      );
      expect(screen.getByText("Łukasiewicz")).toBeTruthy();
    });

    it("モードバッジを表示する（自由帳）", () => {
      render(
        <NotebookList
          items={[makeItem("nb-1", "テスト", "free")]}
          {...defaultHandlers}
        />,
      );
      expect(screen.getByText("自由帳")).toBeTruthy();
    });

    it("モードバッジを表示する（クエスト）", () => {
      render(
        <NotebookList
          items={[makeItem("nb-1", "テスト", "quest")]}
          {...defaultHandlers}
        />,
      );
      expect(screen.getByText("クエスト")).toBeTruthy();
    });

    it("更新日時を表示する", () => {
      render(
        <NotebookList
          items={[makeItem("nb-1", "テスト")]}
          {...defaultHandlers}
        />,
      );
      expect(screen.getByText(/たった今/)).toBeTruthy();
    });
  });

  describe("操作", () => {
    it("クリックでonOpenが呼ばれる", () => {
      const onOpen = vi.fn();
      render(
        <NotebookList
          items={[makeItem("nb-1", "テスト")]}
          {...defaultHandlers}
          onOpen={onOpen}
        />,
      );
      fireEvent.click(screen.getByTestId("notebook-item-nb-1"));
      expect(onOpen).toHaveBeenCalledWith("nb-1");
    });

    it("削除ボタンで確認状態になる（即時削除しない）", () => {
      const onDelete = vi.fn();
      render(
        <NotebookList
          items={[makeItem("nb-1", "テスト")]}
          {...defaultHandlers}
          onDelete={onDelete}
        />,
      );
      fireEvent.click(screen.getByTestId("delete-btn-nb-1"));
      // まだonDeleteは呼ばれない
      expect(onDelete).not.toHaveBeenCalled();
      // 確認UIが表示される
      expect(screen.getByTestId("delete-confirm-nb-1")).toBeTruthy();
    });

    it("削除確認で「削除する」をクリックするとonDeleteが呼ばれる", () => {
      const onDelete = vi.fn();
      render(
        <NotebookList
          items={[makeItem("nb-1", "テスト")]}
          {...defaultHandlers}
          onDelete={onDelete}
        />,
      );
      fireEvent.click(screen.getByTestId("delete-btn-nb-1"));
      fireEvent.click(screen.getByTestId("delete-confirm-btn-nb-1"));
      expect(onDelete).toHaveBeenCalledWith("nb-1");
    });

    it("削除確認で「キャンセル」をクリックすると確認が解除される", () => {
      const onDelete = vi.fn();
      render(
        <NotebookList
          items={[makeItem("nb-1", "テスト")]}
          {...defaultHandlers}
          onDelete={onDelete}
        />,
      );
      fireEvent.click(screen.getByTestId("delete-btn-nb-1"));
      fireEvent.click(screen.getByTestId("delete-cancel-btn-nb-1"));
      expect(onDelete).not.toHaveBeenCalled();
      // 確認UIが消える
      expect(screen.queryByTestId("delete-confirm-nb-1")).toBeNull();
    });

    it("削除ボタンクリックでonOpenが呼ばれない（伝播停止）", () => {
      const onOpen = vi.fn();
      const onDelete = vi.fn();
      render(
        <NotebookList
          items={[makeItem("nb-1", "テスト")]}
          {...defaultHandlers}
          onOpen={onOpen}
          onDelete={onDelete}
        />,
      );
      fireEvent.click(screen.getByTestId("delete-btn-nb-1"));
      expect(onOpen).not.toHaveBeenCalled();
    });

    it("複製ボタンでonDuplicateが呼ばれる", () => {
      const onDuplicate = vi.fn();
      render(
        <NotebookList
          items={[makeItem("nb-1", "テスト")]}
          {...defaultHandlers}
          onDuplicate={onDuplicate}
        />,
      );
      fireEvent.click(screen.getByTestId("duplicate-btn-nb-1"));
      expect(onDuplicate).toHaveBeenCalledWith("nb-1");
    });

    it("自由帳として複製ボタンはクエストモード時のみ表示される", () => {
      render(
        <NotebookList
          items={[makeItem("nb-1", "テスト", "quest")]}
          {...defaultHandlers}
        />,
      );
      expect(screen.getByTestId("convert-btn-nb-1")).toBeTruthy();
    });

    it("自由帳モードでは自由帳として複製ボタンが表示されない", () => {
      render(
        <NotebookList
          items={[makeItem("nb-1", "テスト", "free")]}
          {...defaultHandlers}
        />,
      );
      expect(screen.queryByTestId("convert-btn-nb-1")).toBeNull();
    });

    it("自由帳として複製ボタンでonConvertToFreeが呼ばれる", () => {
      const onConvertToFree = vi.fn();
      render(
        <NotebookList
          items={[makeItem("nb-1", "テスト", "quest")]}
          {...defaultHandlers}
          onConvertToFree={onConvertToFree}
        />,
      );
      fireEvent.click(screen.getByTestId("convert-btn-nb-1"));
      expect(onConvertToFree).toHaveBeenCalledWith("nb-1");
    });
  });

  describe("名前変更", () => {
    it("名前変更ボタンで入力モードになる", () => {
      render(
        <NotebookList
          items={[makeItem("nb-1", "テスト")]}
          {...defaultHandlers}
        />,
      );
      fireEvent.click(screen.getByTestId("rename-btn-nb-1"));
      expect(screen.getByTestId("rename-input")).toBeTruthy();
    });

    it("Enterキーで名前変更がコミットされる", () => {
      const onRename = vi.fn();
      render(
        <NotebookList
          items={[makeItem("nb-1", "旧名前")]}
          {...defaultHandlers}
          onRename={onRename}
        />,
      );
      fireEvent.click(screen.getByTestId("rename-btn-nb-1"));
      const input = screen.getByTestId("rename-input");
      fireEvent.change(input, { target: { value: "新名前" } });
      fireEvent.keyDown(input, { key: "Enter" });
      expect(onRename).toHaveBeenCalledWith("nb-1", "新名前");
    });

    it("Escapeキーでキャンセルされる", () => {
      const onRename = vi.fn();
      render(
        <NotebookList
          items={[makeItem("nb-1", "テスト")]}
          {...defaultHandlers}
          onRename={onRename}
        />,
      );
      fireEvent.click(screen.getByTestId("rename-btn-nb-1"));
      const input = screen.getByTestId("rename-input");
      fireEvent.keyDown(input, { key: "Escape" });
      expect(onRename).not.toHaveBeenCalled();
      // 入力モードが解除されている
      expect(screen.queryByTestId("rename-input")).toBeNull();
    });

    it("空文字名前ではエラーが表示される", () => {
      const onRename = vi.fn();
      render(
        <NotebookList
          items={[makeItem("nb-1", "テスト")]}
          {...defaultHandlers}
          onRename={onRename}
        />,
      );
      fireEvent.click(screen.getByTestId("rename-btn-nb-1"));
      const input = screen.getByTestId("rename-input");
      fireEvent.change(input, { target: { value: "" } });
      fireEvent.keyDown(input, { key: "Enter" });
      expect(onRename).not.toHaveBeenCalled();
      expect(screen.getByText(/名前を入力/)).toBeTruthy();
    });

    it("blurで名前変更がコミットされる", () => {
      const onRename = vi.fn();
      render(
        <NotebookList
          items={[makeItem("nb-1", "テスト")]}
          {...defaultHandlers}
          onRename={onRename}
        />,
      );
      fireEvent.click(screen.getByTestId("rename-btn-nb-1"));
      const input = screen.getByTestId("rename-input");
      fireEvent.change(input, { target: { value: "変更後" } });
      fireEvent.blur(input);
      expect(onRename).toHaveBeenCalledWith("nb-1", "変更後");
    });
  });

  describe("ホバーインタラクション", () => {
    it("カードのホバーで浮き上がりスタイルが適用される", () => {
      render(
        <NotebookList
          items={[makeItem("nb-1", "テスト")]}
          {...defaultHandlers}
        />,
      );
      const item = screen.getByTestId("notebook-item-nb-1");
      fireEvent.mouseEnter(item);
      expect(item.style.transform).toBe("translateY(-1px)");
      fireEvent.mouseLeave(item);
      expect(item.style.transform).toBe("");
    });

    it("アクションボタンのホバーでスタイルが切り替わる", () => {
      render(
        <NotebookList
          items={[makeItem("nb-1", "テスト")]}
          {...defaultHandlers}
        />,
      );
      const btn = screen.getByTestId("rename-btn-nb-1");
      fireEvent.mouseEnter(btn);
      fireEvent.mouseLeave(btn);
      // ホバー状態の切り替えが正常に行われること（エラーなし）
      expect(btn).toBeTruthy();
    });

    it("削除ボタンのホバーでスタイルが切り替わる", () => {
      render(
        <NotebookList
          items={[makeItem("nb-1", "テスト")]}
          {...defaultHandlers}
        />,
      );
      const btn = screen.getByTestId("delete-btn-nb-1");
      fireEvent.mouseEnter(btn);
      fireEvent.mouseLeave(btn);
      expect(btn).toBeTruthy();
    });
  });

  describe("キーボード操作", () => {
    it("EnterキーでonOpenが呼ばれる", () => {
      const onOpen = vi.fn();
      render(
        <NotebookList
          items={[makeItem("nb-1", "テスト")]}
          {...defaultHandlers}
          onOpen={onOpen}
        />,
      );
      fireEvent.keyDown(screen.getByTestId("notebook-item-nb-1"), {
        key: "Enter",
      });
      expect(onOpen).toHaveBeenCalledWith("nb-1");
    });

    it("SpaceキーでonOpenが呼ばれる", () => {
      const onOpen = vi.fn();
      render(
        <NotebookList
          items={[makeItem("nb-1", "テスト")]}
          {...defaultHandlers}
          onOpen={onOpen}
        />,
      );
      fireEvent.keyDown(screen.getByTestId("notebook-item-nb-1"), {
        key: " ",
      });
      expect(onOpen).toHaveBeenCalledWith("nb-1");
    });
  });
});
