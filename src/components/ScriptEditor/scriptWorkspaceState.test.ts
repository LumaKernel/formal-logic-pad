import { describe, it, expect } from "vitest";
import {
  initialWorkspaceState,
  generateTabId,
  createUnnamedTab,
  openLibraryTab,
  openSavedTab,
  setActiveTab,
  closeTab,
  closeOtherTabs,
  closeTabsToRight,
  closeAllTabs,
  updateTabCode,
  updateTabTitle,
  getActiveTab,
  isTabModified,
  hasModifiedTabs,
  findTabBySourceId,
  duplicateAsUnnamed,
  markTabAsSaved,
  markTabSynced,
} from "./scriptWorkspaceState";
import type { WorkspaceState } from "./scriptWorkspaceState";

describe("scriptWorkspaceState", () => {
  describe("initialWorkspaceState", () => {
    it("空のタブ一覧で初期化される", () => {
      expect(initialWorkspaceState.tabs).toEqual([]);
      expect(initialWorkspaceState.activeTabId).toBeUndefined();
      expect(initialWorkspaceState.nextUnnamedCounter).toBe(1);
    });
  });

  describe("generateTabId", () => {
    it("prefixとタイムスタンプを含むIDを生成する", () => {
      const id = generateTabId("unnamed", 1000);
      expect(id).toBe("unnamed-1000");
    });

    it("異なるタイムスタンプで異なるIDを生成する", () => {
      const id1 = generateTabId("lib", 1000);
      const id2 = generateTabId("lib", 2000);
      expect(id1).not.toBe(id2);
    });
  });

  describe("createUnnamedTab", () => {
    it("新規Unnamedタブを作成してアクティブにする", () => {
      const state = createUnnamedTab(initialWorkspaceState, 1000);
      expect(state.tabs).toHaveLength(1);
      expect(state.tabs[0]?.source).toBe("unnamed");
      expect(state.tabs[0]?.title).toBe("Unnamed-1");
      expect(state.tabs[0]?.code).toBe("");
      expect(state.tabs[0]?.readonly).toBe(false);
      expect(state.activeTabId).toBe(state.tabs[0]?.id);
    });

    it("カウンタがインクリメントされる", () => {
      const state1 = createUnnamedTab(initialWorkspaceState, 1000);
      expect(state1.nextUnnamedCounter).toBe(2);
      const state2 = createUnnamedTab(state1, 2000);
      expect(state2.nextUnnamedCounter).toBe(3);
      expect(state2.tabs[1]?.title).toBe("Unnamed-2");
    });

    it("既存タブの後に追加される", () => {
      const state1 = createUnnamedTab(initialWorkspaceState, 1000);
      const state2 = createUnnamedTab(state1, 2000);
      expect(state2.tabs).toHaveLength(2);
      expect(state2.tabs[0]?.title).toBe("Unnamed-1");
      expect(state2.tabs[1]?.title).toBe("Unnamed-2");
    });
  });

  describe("openLibraryTab", () => {
    it("ライブラリテンプレートをreadonly タブとして開く", () => {
      const state = openLibraryTab(
        initialWorkspaceState,
        "tpl-1",
        "My Template",
        "// template code",
        1000,
      );
      expect(state.tabs).toHaveLength(1);
      expect(state.tabs[0]?.source).toBe("library");
      expect(state.tabs[0]?.title).toBe("My Template");
      expect(state.tabs[0]?.code).toBe("// template code");
      expect(state.tabs[0]?.originalCode).toBe("// template code");
      expect(state.tabs[0]?.readonly).toBe(true);
      expect(state.tabs[0]?.sourceId).toBe("tpl-1");
      expect(state.activeTabId).toBe(state.tabs[0]?.id);
    });

    it("同じテンプレートを再度開くと既存タブをアクティブにする", () => {
      const state1 = openLibraryTab(
        initialWorkspaceState,
        "tpl-1",
        "Template",
        "code",
        1000,
      );
      const otherState = createUnnamedTab(state1, 2000);
      const state2 = openLibraryTab(
        otherState,
        "tpl-1",
        "Template",
        "code",
        3000,
      );
      expect(state2.tabs).toHaveLength(2); // library + unnamed
      expect(state2.activeTabId).toBe(state1.tabs[0]?.id);
    });

    it("異なるテンプレートは別タブで開く", () => {
      const state1 = openLibraryTab(
        initialWorkspaceState,
        "tpl-1",
        "Template 1",
        "code1",
        1000,
      );
      const state2 = openLibraryTab(
        state1,
        "tpl-2",
        "Template 2",
        "code2",
        2000,
      );
      expect(state2.tabs).toHaveLength(2);
    });

    it("非libraryタブを飛ばして同じテンプレートを見つける", () => {
      // unnamed → library の順で配置し、再度開く
      // .find() が unnamed を先に評価し source !== "library" で短絡する
      const s1 = createUnnamedTab(initialWorkspaceState, 1000);
      const s2 = openLibraryTab(s1, "tpl-1", "Template", "code", 2000);
      const s3 = openLibraryTab(s2, "tpl-1", "Template", "code", 3000);
      expect(s3.tabs).toHaveLength(2);
      expect(s3.activeTabId).toBe(s2.tabs[1]?.id);
    });
  });

  describe("openSavedTab", () => {
    it("保存済みスクリプトを編集可能タブとして開く", () => {
      const state = openSavedTab(
        initialWorkspaceState,
        "script-1",
        "My Script",
        "// saved code",
        1000,
      );
      expect(state.tabs).toHaveLength(1);
      expect(state.tabs[0]?.source).toBe("saved");
      expect(state.tabs[0]?.readonly).toBe(false);
      expect(state.tabs[0]?.sourceId).toBe("script-1");
      expect(state.tabs[0]?.originalCode).toBe("// saved code");
      expect(state.activeTabId).toBe(state.tabs[0]?.id);
    });

    it("同じスクリプトを再度開くと既存タブをアクティブにする", () => {
      const state1 = openSavedTab(
        initialWorkspaceState,
        "script-1",
        "Script",
        "code",
        1000,
      );
      const otherState = createUnnamedTab(state1, 2000);
      const state2 = openSavedTab(
        otherState,
        "script-1",
        "Script",
        "code",
        3000,
      );
      expect(state2.tabs).toHaveLength(2);
      expect(state2.activeTabId).toBe(state1.tabs[0]?.id);
    });

    it("非savedタブを飛ばして同じスクリプトを見つける", () => {
      // library → saved の順で配置し、再度開く
      // .find() が library を先に評価し source !== "saved" で短絡する
      const s1 = openLibraryTab(
        initialWorkspaceState,
        "tpl-1",
        "Template",
        "tpl-code",
        1000,
      );
      const s2 = openSavedTab(s1, "script-1", "Script", "code", 2000);
      const s3 = openSavedTab(s2, "script-1", "Script", "code", 3000);
      expect(s3.tabs).toHaveLength(2);
      expect(s3.activeTabId).toBe(s2.tabs[1]?.id);
    });
  });

  describe("setActiveTab", () => {
    it("指定タブをアクティブにする", () => {
      const state1 = createUnnamedTab(initialWorkspaceState, 1000);
      const state2 = createUnnamedTab(state1, 2000);
      const firstTabId = state1.tabs[0]?.id;
      const result = setActiveTab(state2, firstTabId ?? "");
      expect(result.activeTabId).toBe(firstTabId);
    });

    it("存在しないタブIDでは状態を変更しない", () => {
      const state = createUnnamedTab(initialWorkspaceState, 1000);
      const result = setActiveTab(state, "nonexistent");
      expect(result).toBe(state);
    });
  });

  describe("closeTab", () => {
    it("タブを閉じる", () => {
      const state = createUnnamedTab(initialWorkspaceState, 1000);
      const tabId = state.tabs[0]?.id ?? "";
      const result = closeTab(state, tabId);
      expect(result.tabs).toHaveLength(0);
      expect(result.activeTabId).toBeUndefined();
    });

    it("アクティブタブを閉じると右隣がアクティブになる", () => {
      const s1 = createUnnamedTab(initialWorkspaceState, 1000);
      const s2 = createUnnamedTab(s1, 2000);
      const s3 = createUnnamedTab(s2, 3000);
      // アクティブは3番目（最後に作成）→1番目をアクティブにして閉じる
      const withFirst = setActiveTab(s3, s1.tabs[0]?.id ?? "");
      const result = closeTab(withFirst, s1.tabs[0]?.id ?? "");
      expect(result.tabs).toHaveLength(2);
      // 右隣（元の2番目=新しいインデックス0）がアクティブ
      expect(result.activeTabId).toBe(s2.tabs[1]?.id);
    });

    it("最後のタブを閉じると左隣がアクティブになる", () => {
      const s1 = createUnnamedTab(initialWorkspaceState, 1000);
      const s2 = createUnnamedTab(s1, 2000);
      // アクティブは2番目→それを閉じる
      const result = closeTab(s2, s2.tabs[1]?.id ?? "");
      expect(result.tabs).toHaveLength(1);
      expect(result.activeTabId).toBe(s1.tabs[0]?.id);
    });

    it("非アクティブタブを閉じてもアクティブは変わらない", () => {
      const s1 = createUnnamedTab(initialWorkspaceState, 1000);
      const s2 = createUnnamedTab(s1, 2000);
      // アクティブは2番目→1番目を閉じる
      const result = closeTab(s2, s1.tabs[0]?.id ?? "");
      expect(result.tabs).toHaveLength(1);
      expect(result.activeTabId).toBe(s2.tabs[1]?.id);
    });

    it("存在しないタブIDでは状態を変更しない", () => {
      const state = createUnnamedTab(initialWorkspaceState, 1000);
      const result = closeTab(state, "nonexistent");
      expect(result).toBe(state);
    });
  });

  describe("closeOtherTabs", () => {
    it("指定タブ以外を閉じる", () => {
      const s1 = createUnnamedTab(initialWorkspaceState, 1000);
      const s2 = createUnnamedTab(s1, 2000);
      const s3 = createUnnamedTab(s2, 3000);
      const targetId = s2.tabs[1]?.id ?? "";
      const result = closeOtherTabs(s3, targetId);
      expect(result.tabs).toHaveLength(1);
      expect(result.tabs[0]?.id).toBe(targetId);
      expect(result.activeTabId).toBe(targetId);
    });

    it("存在しないタブIDでは状態を変更しない", () => {
      const state = createUnnamedTab(initialWorkspaceState, 1000);
      const result = closeOtherTabs(state, "nonexistent");
      expect(result).toBe(state);
    });

    it("1つのタブのみの場合はそのまま", () => {
      const state = createUnnamedTab(initialWorkspaceState, 1000);
      const tabId = state.tabs[0]?.id ?? "";
      const result = closeOtherTabs(state, tabId);
      expect(result.tabs).toHaveLength(1);
      expect(result.activeTabId).toBe(tabId);
    });
  });

  describe("closeTabsToRight", () => {
    it("指定タブより右のタブを閉じる", () => {
      const s1 = createUnnamedTab(initialWorkspaceState, 1000);
      const s2 = createUnnamedTab(s1, 2000);
      const s3 = createUnnamedTab(s2, 3000);
      const targetId = s1.tabs[0]?.id ?? "";
      const result = closeTabsToRight(s3, targetId);
      expect(result.tabs).toHaveLength(1);
      expect(result.tabs[0]?.id).toBe(targetId);
    });

    it("アクティブタブが右側にあればターゲットをアクティブにする", () => {
      const s1 = createUnnamedTab(initialWorkspaceState, 1000);
      const s2 = createUnnamedTab(s1, 2000);
      const s3 = createUnnamedTab(s2, 3000);
      // アクティブは3番目（最後に作成）
      const targetId = s1.tabs[0]?.id ?? "";
      const result = closeTabsToRight(s3, targetId);
      expect(result.activeTabId).toBe(targetId);
    });

    it("アクティブタブが左側にあれば維持される", () => {
      const s1 = createUnnamedTab(initialWorkspaceState, 1000);
      const s2 = createUnnamedTab(s1, 2000);
      const s3 = createUnnamedTab(s2, 3000);
      const withFirst = setActiveTab(s3, s1.tabs[0]?.id ?? "");
      const secondId = s2.tabs[1]?.id ?? "";
      const result = closeTabsToRight(withFirst, secondId);
      expect(result.activeTabId).toBe(s1.tabs[0]?.id);
    });

    it("最後のタブを指定すると何も閉じない", () => {
      const s1 = createUnnamedTab(initialWorkspaceState, 1000);
      const s2 = createUnnamedTab(s1, 2000);
      const lastId = s2.tabs[1]?.id ?? "";
      const result = closeTabsToRight(s2, lastId);
      expect(result.tabs).toHaveLength(2);
    });

    it("存在しないタブIDでは状態を変更しない", () => {
      const state = createUnnamedTab(initialWorkspaceState, 1000);
      const result = closeTabsToRight(state, "nonexistent");
      expect(result).toBe(state);
    });
  });

  describe("closeAllTabs", () => {
    it("すべてのタブを閉じる", () => {
      const s1 = createUnnamedTab(initialWorkspaceState, 1000);
      const s2 = createUnnamedTab(s1, 2000);
      const result = closeAllTabs(s2);
      expect(result.tabs).toHaveLength(0);
      expect(result.activeTabId).toBeUndefined();
    });

    it("空の状態でも動作する", () => {
      const result = closeAllTabs(initialWorkspaceState);
      expect(result.tabs).toHaveLength(0);
      expect(result.activeTabId).toBeUndefined();
    });

    it("nextUnnamedCounterは保持される", () => {
      const s1 = createUnnamedTab(initialWorkspaceState, 1000);
      const s2 = createUnnamedTab(s1, 2000);
      const result = closeAllTabs(s2);
      expect(result.nextUnnamedCounter).toBe(3);
    });
  });

  describe("updateTabCode", () => {
    it("タブのコードを更新する", () => {
      const state = createUnnamedTab(initialWorkspaceState, 1000);
      const tabId = state.tabs[0]?.id ?? "";
      const result = updateTabCode(state, tabId, "new code");
      expect(result.tabs[0]?.code).toBe("new code");
    });

    it("readonlyタブのコードは更新しない", () => {
      const state = openLibraryTab(
        initialWorkspaceState,
        "tpl-1",
        "Template",
        "original",
        1000,
      );
      const tabId = state.tabs[0]?.id ?? "";
      const result = updateTabCode(state, tabId, "hacked!");
      expect(result).toBe(state);
      expect(result.tabs[0]?.code).toBe("original");
    });

    it("存在しないタブIDでは状態を変更しない", () => {
      const state = createUnnamedTab(initialWorkspaceState, 1000);
      const result = updateTabCode(state, "nonexistent", "code");
      expect(result).toBe(state);
    });
  });

  describe("updateTabTitle", () => {
    it("タブのタイトルを更新する", () => {
      const state = createUnnamedTab(initialWorkspaceState, 1000);
      const tabId = state.tabs[0]?.id ?? "";
      const result = updateTabTitle(state, tabId, "My Script");
      expect(result.tabs[0]?.title).toBe("My Script");
    });

    it("対象タブのみタイトルが更新され他のタブは変わらない", () => {
      const s1 = createUnnamedTab(initialWorkspaceState, 1000);
      const s2 = createUnnamedTab(s1, 2000);
      const targetId = s2.tabs[1]?.id ?? "";
      const result = updateTabTitle(s2, targetId, "New Title");
      expect(result.tabs[1]?.title).toBe("New Title");
      expect(result.tabs[0]?.title).toBe("Unnamed-1");
    });
  });

  describe("getActiveTab", () => {
    it("アクティブタブを返す", () => {
      const state = createUnnamedTab(initialWorkspaceState, 1000);
      const tab = getActiveTab(state);
      expect(tab?.source).toBe("unnamed");
    });

    it("タブがない場合はundefinedを返す", () => {
      const tab = getActiveTab(initialWorkspaceState);
      expect(tab).toBeUndefined();
    });
  });

  describe("isTabModified", () => {
    it("Unnamedタブは空ならば未変更", () => {
      const state = createUnnamedTab(initialWorkspaceState, 1000);
      const tab = state.tabs[0];
      expect(tab).toBeDefined();
      expect(isTabModified(tab!)).toBe(false);
    });

    it("Unnamedタブはコードがあれば変更済み", () => {
      const state = createUnnamedTab(initialWorkspaceState, 1000);
      const updated = updateTabCode(
        state,
        state.tabs[0]?.id ?? "",
        "some code",
      );
      expect(isTabModified(updated.tabs[0]!)).toBe(true);
    });

    it("Libraryタブは常に未変更", () => {
      const state = openLibraryTab(
        initialWorkspaceState,
        "tpl-1",
        "Template",
        "code",
        1000,
      );
      expect(isTabModified(state.tabs[0]!)).toBe(false);
    });

    it("SavedタブはoriginalCodeと異なれば変更済み", () => {
      const state = openSavedTab(
        initialWorkspaceState,
        "script-1",
        "Script",
        "original code",
        1000,
      );
      expect(isTabModified(state.tabs[0]!)).toBe(false);

      const updated = updateTabCode(
        state,
        state.tabs[0]?.id ?? "",
        "modified code",
      );
      expect(isTabModified(updated.tabs[0]!)).toBe(true);
    });
  });

  describe("hasModifiedTabs", () => {
    it("変更されたタブがなければfalse", () => {
      expect(hasModifiedTabs(initialWorkspaceState)).toBe(false);
      const state = createUnnamedTab(initialWorkspaceState, 1000);
      expect(hasModifiedTabs(state)).toBe(false);
    });

    it("変更されたタブがあればtrue", () => {
      const state = createUnnamedTab(initialWorkspaceState, 1000);
      const updated = updateTabCode(state, state.tabs[0]?.id ?? "", "code");
      expect(hasModifiedTabs(updated)).toBe(true);
    });
  });

  describe("findTabBySourceId", () => {
    it("ソースIDでタブを検索する", () => {
      const state = openLibraryTab(
        initialWorkspaceState,
        "tpl-1",
        "Template",
        "code",
        1000,
      );
      const found = findTabBySourceId(state, "library", "tpl-1");
      expect(found?.sourceId).toBe("tpl-1");
    });

    it("異なるソース種別では見つからない", () => {
      const state = openLibraryTab(
        initialWorkspaceState,
        "tpl-1",
        "Template",
        "code",
        1000,
      );
      const found = findTabBySourceId(state, "saved", "tpl-1");
      expect(found).toBeUndefined();
    });

    it("存在しないソースIDではundefinedを返す", () => {
      const found = findTabBySourceId(
        initialWorkspaceState,
        "library",
        "tpl-1",
      );
      expect(found).toBeUndefined();
    });

    it("混在タブから正しいソース種別とIDで検索する", () => {
      // unnamed, library, saved の混在タブで saved を検索
      // .find() が unnamed, library を先に評価し source !== "saved" で短絡する
      const s1 = createUnnamedTab(initialWorkspaceState, 1000);
      const s2 = openLibraryTab(s1, "tpl-1", "Template", "code", 2000);
      const s3 = openSavedTab(s2, "script-1", "Script", "saved-code", 3000);
      const found = findTabBySourceId(s3, "saved", "script-1");
      expect(found?.sourceId).toBe("script-1");
    });
  });

  describe("duplicateAsUnnamed", () => {
    it("ライブラリタブの内容をUnnamedタブとして複製する", () => {
      const state = openLibraryTab(
        initialWorkspaceState,
        "tpl-1",
        "My Template",
        "// template code",
        1000,
      );
      const result = duplicateAsUnnamed(state, state.tabs[0]?.id ?? "", 2000);
      expect(result.tabs).toHaveLength(2);
      const newTab = result.tabs[1];
      expect(newTab?.source).toBe("unnamed");
      expect(newTab?.title).toBe("My Template (copy)");
      expect(newTab?.code).toBe("// template code");
      expect(newTab?.readonly).toBe(false);
      expect(result.activeTabId).toBe(newTab?.id);
      expect(result.nextUnnamedCounter).toBe(2);
    });

    it("存在しないタブIDでは状態を変更しない", () => {
      const state = createUnnamedTab(initialWorkspaceState, 1000);
      const result = duplicateAsUnnamed(state, "nonexistent", 2000);
      expect(result).toBe(state);
    });
  });

  describe("markTabAsSaved", () => {
    it("Unnamedタブをsavedタブに変換する", () => {
      const state = createUnnamedTab(initialWorkspaceState, 1000);
      const tabId = state.tabs[0]?.id ?? "";
      const updated = updateTabCode(state, tabId, "my code");
      const result = markTabAsSaved(updated, tabId, "script-1", "My Script");
      const tab = result.tabs[0];
      expect(tab?.source).toBe("saved");
      expect(tab?.title).toBe("My Script");
      expect(tab?.sourceId).toBe("script-1");
      expect(tab?.originalCode).toBe("my code");
    });
  });

  describe("markTabSynced", () => {
    it("originalCodeを現在のcodeに更新する", () => {
      const state = openSavedTab(
        initialWorkspaceState,
        "script-1",
        "Script",
        "original",
        1000,
      );
      const tabId = state.tabs[0]?.id ?? "";
      const updated = updateTabCode(state, tabId, "modified");
      expect(isTabModified(updated.tabs[0]!)).toBe(true);
      const synced = markTabSynced(updated, tabId);
      expect(isTabModified(synced.tabs[0]!)).toBe(false);
      expect(synced.tabs[0]?.originalCode).toBe("modified");
    });
  });

  describe("immutability", () => {
    it("すべての操作が元の状態を変更しない", () => {
      const original: WorkspaceState = { ...initialWorkspaceState };
      createUnnamedTab(original, 1000);
      expect(original.tabs).toHaveLength(0);
      expect(original.nextUnnamedCounter).toBe(1);
    });

    it("タブの配列は新しい参照で返される", () => {
      const s1 = createUnnamedTab(initialWorkspaceState, 1000);
      const s2 = createUnnamedTab(s1, 2000);
      expect(s1.tabs).not.toBe(s2.tabs);
      expect(s1.tabs).toHaveLength(1);
    });
  });

  describe("複合シナリオ", () => {
    it("ワークスペース操作の一連のフロー", () => {
      // 1. Unnamedタブを作成
      let state = createUnnamedTab(initialWorkspaceState, 1000);
      expect(state.tabs).toHaveLength(1);

      // 2. ライブラリテンプレートを開く
      state = openLibraryTab(state, "tpl-1", "Template", "// tpl code", 2000);
      expect(state.tabs).toHaveLength(2);
      expect(getActiveTab(state)?.source).toBe("library");

      // 3. ライブラリを複製して編集
      state = duplicateAsUnnamed(state, state.tabs[1]?.id ?? "", 3000);
      expect(state.tabs).toHaveLength(3);
      expect(getActiveTab(state)?.source).toBe("unnamed");
      expect(getActiveTab(state)?.code).toBe("// tpl code");

      // 4. コードを編集
      const activeId = state.activeTabId ?? "";
      state = updateTabCode(state, activeId, "// modified code");
      expect(isTabModified(getActiveTab(state)!)).toBe(true);

      // 5. 保存
      state = markTabAsSaved(state, activeId, "script-1", "My Script");
      expect(getActiveTab(state)?.source).toBe("saved");
      expect(isTabModified(getActiveTab(state)!)).toBe(false);

      // 6. さらに編集
      state = updateTabCode(state, activeId, "// more changes");
      expect(isTabModified(getActiveTab(state)!)).toBe(true);

      // 7. 同期
      state = markTabSynced(state, activeId);
      expect(isTabModified(getActiveTab(state)!)).toBe(false);

      // 8. タブを閉じる
      state = closeTab(state, activeId);
      expect(state.tabs).toHaveLength(2);
    });

    it("同じライブラリを再度開くと既存タブに遷移する", () => {
      let state = openLibraryTab(
        initialWorkspaceState,
        "tpl-1",
        "Template",
        "code",
        1000,
      );
      const libTabId = state.tabs[0]?.id;
      state = createUnnamedTab(state, 2000);
      expect(state.activeTabId).not.toBe(libTabId);

      state = openLibraryTab(state, "tpl-1", "Template", "code", 3000);
      expect(state.activeTabId).toBe(libTabId);
      expect(state.tabs).toHaveLength(2); // 増えない
    });
  });
});
