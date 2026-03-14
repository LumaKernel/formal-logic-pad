import { describe, it, expect } from "vitest";
import {
  allMenuActions,
  allMenuContexts,
  filterByContext,
  filterByGroup,
  getLabel,
  generateMenuDocMarkdown,
  type MenuContext,
  type MenuActionDefinition,
} from "./menuActionDefinition";

describe("menuActionDefinition", () => {
  describe("allMenuActions", () => {
    it("すべてのアクションにユニークなIDがある", () => {
      const ids = allMenuActions.map((a) => a.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("すべてのアクションに en と ja のラベルがある", () => {
      for (const action of allMenuActions) {
        expect(action.label.en).toBeTruthy();
        expect(action.label.ja).toBeTruthy();
      }
    });

    it("すべてのアクションに少なくとも1つのコンテキストがある", () => {
      for (const action of allMenuActions) {
        expect(action.contexts.length).toBeGreaterThan(0);
      }
    });

    it("コンテキスト値はすべて allMenuContexts に含まれる", () => {
      for (const action of allMenuActions) {
        for (const ctx of action.contexts) {
          expect(allMenuContexts).toContain(ctx);
        }
      }
    });
  });

  describe("filterByContext", () => {
    it("ノードコンテキストメニューのアクションをフィルタできる", () => {
      const nodeActions = filterByContext(allMenuActions, "node-context-menu");
      expect(nodeActions.length).toBeGreaterThan(0);
      for (const action of nodeActions) {
        expect(action.contexts).toContain("node-context-menu");
      }
    });

    it("キャンバスコンテキストメニューのアクションをフィルタできる", () => {
      const canvasActions = filterByContext(
        allMenuActions,
        "canvas-context-menu",
      );
      expect(canvasActions.length).toBeGreaterThan(0);
      for (const action of canvasActions) {
        expect(action.contexts).toContain("canvas-context-menu");
      }
    });

    it("接続コンテキストメニューのアクションをフィルタできる", () => {
      const lineActions = filterByContext(allMenuActions, "line-context-menu");
      expect(lineActions.length).toBeGreaterThan(0);
      for (const action of lineActions) {
        expect(action.contexts).toContain("line-context-menu");
      }
    });

    it("ワークスペースメニューのアクションをフィルタできる", () => {
      const wsActions = filterByContext(allMenuActions, "workspace-menu");
      expect(wsActions.length).toBeGreaterThan(0);
      for (const action of wsActions) {
        expect(action.contexts).toContain("workspace-menu");
      }
    });

    it("ツールバーのアクションをフィルタできる", () => {
      const toolbarActions = filterByContext(allMenuActions, "toolbar");
      expect(toolbarActions.length).toBeGreaterThan(0);
      for (const action of toolbarActions) {
        expect(action.contexts).toContain("toolbar");
      }
    });

    it("キーボードショートカットのアクションをフィルタできる", () => {
      const shortcutActions = filterByContext(
        allMenuActions,
        "keyboard-shortcut",
      );
      expect(shortcutActions.length).toBeGreaterThan(0);
      for (const action of shortcutActions) {
        expect(action.contexts).toContain("keyboard-shortcut");
      }
    });

    it("すべてのコンテキストに少なくとも1つのアクションが存在する", () => {
      for (const ctx of allMenuContexts) {
        const actions = filterByContext(allMenuActions, ctx);
        expect(actions.length).toBeGreaterThan(0);
      }
    });

    it("空の配列に対してフィルタすると空を返す", () => {
      const result = filterByContext([], "toolbar");
      expect(result).toEqual([]);
    });
  });

  describe("filterByGroup", () => {
    it("inference-rules グループをフィルタできる", () => {
      const ruleActions = filterByGroup(allMenuActions, "inference-rules");
      expect(ruleActions.length).toBeGreaterThan(0);
      for (const action of ruleActions) {
        expect(action.group).toBe("inference-rules");
      }
    });

    it("layout グループをフィルタできる", () => {
      const layoutActions = filterByGroup(allMenuActions, "layout");
      expect(layoutActions.length).toBeGreaterThan(0);
      for (const action of layoutActions) {
        expect(action.group).toBe("layout");
      }
    });

    it("空の配列に対してフィルタすると空を返す", () => {
      const result = filterByGroup([], "layout");
      expect(result).toEqual([]);
    });
  });

  describe("getLabel", () => {
    it("英語ラベルを取得できる", () => {
      const action = allMenuActions.find((a) => a.id === "delete-node");
      expect(action).toBeDefined();
      expect(getLabel(action!, "en")).toBe("Delete Node");
    });

    it("日本語ラベルを取得できる", () => {
      const action = allMenuActions.find((a) => a.id === "delete-node");
      expect(action).toBeDefined();
      expect(getLabel(action!, "ja")).toBe("ノードを削除");
    });
  });

  describe("generateMenuDocMarkdown", () => {
    it("Markdown を生成できる", () => {
      const md = generateMenuDocMarkdown(allMenuActions, "ja");
      expect(md).toContain("## 現状のアクション一覧と起点");
      expect(md).toContain("menuActionDefinition.ts から自動生成");
    });

    it("各コンテキストのセクションが含まれる", () => {
      const md = generateMenuDocMarkdown(allMenuActions, "ja");
      expect(md).toContain("### ツールバー（ヘッダー）");
      expect(md).toContain("### ワークスペースメニュー (\u22EF)");
      expect(md).toContain("### ノードコンテキストメニュー");
      expect(md).toContain("### キャンバスコンテキストメニュー");
      expect(md).toContain("### 接続コンテキストメニュー");
      expect(md).toContain("### キーボードショートカット");
    });

    it("テーブルヘッダーが含まれる", () => {
      const md = generateMenuDocMarkdown(allMenuActions, "ja");
      expect(md).toContain("| アクション | ショートカット | 備考 |");
    });

    it("具体的なアクションのラベルが含まれる", () => {
      const md = generateMenuDocMarkdown(allMenuActions, "ja");
      expect(md).toContain("ノードを削除");
      expect(md).toContain("接続を削除");
      expect(md).toContain("ツリー整列（上\u2192下）");
    });

    it("英語でも生成できる", () => {
      const md = generateMenuDocMarkdown(allMenuActions, "en");
      expect(md).toContain("Delete Node");
      expect(md).toContain("Delete Connection");
      expect(md).toContain("Tree Layout (Top\u2192Bottom)");
    });

    it("ショートカットが表に含まれる", () => {
      const md = generateMenuDocMarkdown(allMenuActions, "ja");
      expect(md).toContain("Cmd+Shift+L");
      expect(md).toContain("Cmd+C");
    });

    it("空のアクション配列でも正常に動作する", () => {
      const md = generateMenuDocMarkdown([], "ja");
      expect(md).toContain("## 現状のアクション一覧と起点");
      // セクションなし
      expect(md).not.toContain("### ");
    });

    it("locale省略時はデフォルトでjaが使われる", () => {
      const md = generateMenuDocMarkdown(allMenuActions);
      expect(md).toContain("ノードを削除");
      expect(md).toContain("### ツールバー（ヘッダー）");
    });

    it("コンテキストにアクションがない場合そのセクションは省略される", () => {
      const toolbarOnly: readonly MenuActionDefinition[] = [
        {
          id: "test",
          label: { en: "Test", ja: "テスト" },
          contexts: ["toolbar" as MenuContext],
          group: "navigation",
        },
      ];
      const md = generateMenuDocMarkdown(toolbarOnly, "ja");
      expect(md).toContain("### ツールバー（ヘッダー）");
      expect(md).not.toContain("### ノードコンテキストメニュー");
    });
  });

  describe("特定のアクションの存在確認", () => {
    it("tree-layout-top-to-bottom がキャンバスメニューとコマンドパレットにある", () => {
      const action = allMenuActions.find(
        (a) => a.id === "tree-layout-top-to-bottom",
      );
      expect(action).toBeDefined();
      expect(action!.contexts).toContain("canvas-context-menu");
      expect(action!.contexts).toContain("command-palette");
    });

    it("tree-layout がキーボードショートカットにある", () => {
      const action = allMenuActions.find((a) => a.id === "tree-layout");
      expect(action).toBeDefined();
      expect(action!.contexts).toContain("keyboard-shortcut");
      expect(action!.shortcut).toBe("Cmd+Shift+L");
    });

    it("delete-connection が接続コンテキストメニューにある", () => {
      const action = allMenuActions.find((a) => a.id === "delete-connection");
      expect(action).toBeDefined();
      expect(action!.contexts).toContain("line-context-menu");
    });

    it("edit-note がノードコンテキストメニューにある", () => {
      const action = allMenuActions.find((a) => a.id === "edit-note");
      expect(action).toBeDefined();
      expect(action!.contexts).toContain("node-context-menu");
      expect(action!.group).toBe("node-edit");
    });

    it("run-script がノードコンテキストメニューにある", () => {
      const action = allMenuActions.find((a) => a.id === "run-script");
      expect(action).toBeDefined();
      expect(action!.contexts).toContain("node-context-menu");
      expect(action!.group).toBe("node-edit");
    });

    it("apply-script がノードコンテキストメニューとキャンバスメニューにある", () => {
      const action = allMenuActions.find((a) => a.id === "apply-script");
      expect(action).toBeDefined();
      expect(action!.contexts).toContain("node-context-menu");
      expect(action!.contexts).toContain("canvas-context-menu");
      expect(action!.group).toBe("node-edit");
    });

    it("export 系がワークスペースメニューにある", () => {
      const exportIds = ["export-json", "export-svg", "export-png"];
      for (const id of exportIds) {
        const action = allMenuActions.find((a) => a.id === id);
        expect(action).toBeDefined();
        expect(action!.contexts).toContain("workspace-menu");
      }
    });
  });

  describe("generateMenuDocMarkdown デフォルト引数", () => {
    it("デフォルト引数（locale省略）で正しく動作する", () => {
      const result = generateMenuDocMarkdown(allMenuActions);
      expect(result).toContain("現状のアクション一覧と起点");
    });

    it("明示的にjaを指定しても同じ結果になる", () => {
      const defaultResult = generateMenuDocMarkdown(allMenuActions);
      const jaResult = generateMenuDocMarkdown(allMenuActions, "ja");
      expect(defaultResult).toBe(jaResult);
    });
  });
});
