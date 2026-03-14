import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ScriptListPanel, type ScriptListPanelMessages } from "./ScriptListPanel";
import type { ScriptListItem } from "./scriptListPanelLogic";

const defaultMessages: ScriptListPanelMessages = {
  emptyTitle: "No saved scripts yet",
  emptyDescription: "Save scripts from the workspace.",
  deleteButton: "Delete",
  renameButton: "Rename",
  exportButton: "Export",
};

const sampleItems: readonly ScriptListItem[] = [
  { id: "s1", title: "Script Alpha", savedAtLabel: "2h ago" },
  { id: "s2", title: "Script Beta", savedAtLabel: "1d ago" },
];

describe("ScriptListPanel", () => {
  describe("空状態", () => {
    it("空メッセージが表示される", () => {
      render(
        <ScriptListPanel items={[]} messages={defaultMessages} />,
      );
      expect(screen.getByText("No saved scripts yet")).toBeInTheDocument();
      expect(
        screen.getByText("Save scripts from the workspace."),
      ).toBeInTheDocument();
    });

    it("empty testId が付く", () => {
      render(
        <ScriptListPanel
          items={[]}
          messages={defaultMessages}
          testId="my-panel"
        />,
      );
      expect(screen.getByTestId("my-panel-empty")).toBeInTheDocument();
    });
  });

  describe("一覧表示", () => {
    it("スクリプトが一覧表示される", () => {
      render(
        <ScriptListPanel items={sampleItems} messages={defaultMessages} />,
      );
      expect(screen.getByText("Script Alpha")).toBeInTheDocument();
      expect(screen.getByText("Script Beta")).toBeInTheDocument();
      expect(screen.getByText("2h ago")).toBeInTheDocument();
      expect(screen.getByText("1d ago")).toBeInTheDocument();
    });

    it("デフォルト testId が付く", () => {
      render(
        <ScriptListPanel items={sampleItems} messages={defaultMessages} />,
      );
      expect(screen.getByTestId("script-list-panel")).toBeInTheDocument();
    });
  });

  describe("削除", () => {
    it("削除ボタンが動作する", async () => {
      const onDelete = vi.fn();
      render(
        <ScriptListPanel
          items={sampleItems}
          messages={defaultMessages}
          onDelete={onDelete}
        />,
      );
      await userEvent.click(screen.getByTestId("script-delete-btn-s1"));
      expect(onDelete).toHaveBeenCalledWith("s1");
    });

    it("onDelete 未指定で削除ボタンが非表示", () => {
      render(
        <ScriptListPanel items={sampleItems} messages={defaultMessages} />,
      );
      expect(screen.queryByTestId("script-delete-btn-s1")).toBeNull();
    });
  });

  describe("リネーム", () => {
    it("リネームボタンでインラインリネームが開始される", async () => {
      const onRename = vi.fn();
      render(
        <ScriptListPanel
          items={sampleItems}
          messages={defaultMessages}
          onRename={onRename}
        />,
      );
      await userEvent.click(screen.getByTestId("script-rename-btn-s1"));
      const input = screen.getByTestId("script-rename-input-s1");
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue("Script Alpha");
    });

    it("Enter でリネームが確定される", async () => {
      const onRename = vi.fn();
      render(
        <ScriptListPanel
          items={sampleItems}
          messages={defaultMessages}
          onRename={onRename}
        />,
      );
      await userEvent.click(screen.getByTestId("script-rename-btn-s1"));
      const input = screen.getByTestId("script-rename-input-s1");
      await userEvent.clear(input);
      await userEvent.type(input, "Renamed Script");
      await userEvent.keyboard("{Enter}");
      expect(onRename).toHaveBeenCalledWith("s1", "Renamed Script");
    });

    it("Escape でリネームがキャンセルされる", async () => {
      const onRename = vi.fn();
      render(
        <ScriptListPanel
          items={sampleItems}
          messages={defaultMessages}
          onRename={onRename}
        />,
      );
      await userEvent.click(screen.getByTestId("script-rename-btn-s1"));
      await userEvent.keyboard("{Escape}");
      expect(onRename).not.toHaveBeenCalled();
      // タイトルが元に戻る
      expect(screen.getByText("Script Alpha")).toBeInTheDocument();
    });

    it("空のリネームは確定されない", async () => {
      const onRename = vi.fn();
      render(
        <ScriptListPanel
          items={sampleItems}
          messages={defaultMessages}
          onRename={onRename}
        />,
      );
      await userEvent.click(screen.getByTestId("script-rename-btn-s1"));
      const input = screen.getByTestId("script-rename-input-s1");
      await userEvent.clear(input);
      await userEvent.keyboard("{Enter}");
      expect(onRename).not.toHaveBeenCalled();
    });
  });

  describe("エクスポート", () => {
    it("エクスポートボタンが動作する", async () => {
      const onExport = vi.fn();
      render(
        <ScriptListPanel
          items={sampleItems}
          messages={defaultMessages}
          onExport={onExport}
        />,
      );
      await userEvent.click(screen.getByTestId("script-export-btn-s2"));
      expect(onExport).toHaveBeenCalledWith("s2");
    });
  });
});
