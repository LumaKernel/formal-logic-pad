/**
 * スクリプトワークスペースの純粋ロジック。
 *
 * VSCode のような複数タブ管理を提供する。
 * - Unnamed タブ: 新規作成ファイル（編集可能）
 * - Library タブ: ビルトインテンプレート（immutable、コードは読み取り専用）
 * - Saved タブ: ユーザー保存スクリプト（編集可能）
 *
 * 変更時は scriptWorkspaceState.test.ts, ScriptEditorComponent.tsx も同期すること。
 */

// ── タブ種別 ────────────────────────────────────────────────────

/**
 * タブのソース種別。
 * - "unnamed": 新規ファイル
 * - "library": ビルトインテンプレート（immutable）
 * - "saved": ユーザー保存スクリプト
 */
export type TabSource = "unnamed" | "library" | "saved";

// ── タブ型定義 ──────────────────────────────────────────────────

export interface WorkspaceTab {
  /** タブ固有ID */
  readonly id: string;
  /** タブのソース種別 */
  readonly source: TabSource;
  /** 表示タイトル */
  readonly title: string;
  /** 現在のコード内容 */
  readonly code: string;
  /**
   * 元のコード（library/savedの場合のみ意味を持つ）。
   * libraryタブでは常にoriginalCodeと一致を強制。
   * savedタブでは保存時点のコードを保持し、差分検知に使う。
   */
  readonly originalCode: string;
  /** ソースの参照ID（library: template.id, saved: savedScript.id） */
  readonly sourceId: string | undefined;
  /** タブがimmutableか（libraryタブはtrue） */
  readonly readonly: boolean;
}

// ── ワークスペース状態 ──────────────────────────────────────────

export interface WorkspaceState {
  /** 開いているタブ一覧（表示順） */
  readonly tabs: readonly WorkspaceTab[];
  /** アクティブタブのID。タブがない場合はundefined */
  readonly activeTabId: string | undefined;
  /** 次のUnnamedタブ番号カウンタ */
  readonly nextUnnamedCounter: number;
}

// ── 初期状態 ────────────────────────────────────────────────────

export const initialWorkspaceState: WorkspaceState = {
  tabs: [],
  activeTabId: undefined,
  nextUnnamedCounter: 1,
};

// ── タブID生成 ──────────────────────────────────────────────────

export const generateTabId = (prefix: string, timestamp: number): string =>
  `${prefix satisfies string}-${String(timestamp) satisfies string}`;

// ── タブ作成 ────────────────────────────────────────────────────

/**
 * 新規Unnamedタブを作成して開く。
 */
export const createUnnamedTab = (
  state: WorkspaceState,
  timestamp: number,
): WorkspaceState => {
  const tabId = generateTabId("unnamed", timestamp);
  const counter = state.nextUnnamedCounter;
  const tab: WorkspaceTab = {
    id: tabId,
    source: "unnamed",
    title: `Unnamed-${String(counter) satisfies string}`,
    code: "",
    originalCode: "",
    sourceId: undefined,
    readonly: false,
  };
  return {
    tabs: [...state.tabs, tab],
    activeTabId: tabId,
    nextUnnamedCounter: counter + 1,
  };
};

/**
 * ライブラリテンプレートをimmutableタブとして開く。
 * 同じテンプレートが既に開いている場合はそのタブをアクティブにする。
 */
export const openLibraryTab = (
  state: WorkspaceState,
  templateId: string,
  title: string,
  code: string,
  timestamp: number,
): WorkspaceState => {
  // 既に同じテンプレートが開いていればアクティブにするだけ
  const existing = state.tabs.find(
    (t) => t.source === "library" && t.sourceId === templateId,
  );
  if (existing) {
    return { ...state, activeTabId: existing.id };
  }

  const tabId = generateTabId("lib", timestamp);
  const tab: WorkspaceTab = {
    id: tabId,
    source: "library",
    title,
    code,
    originalCode: code,
    sourceId: templateId,
    readonly: true,
  };
  return {
    ...state,
    tabs: [...state.tabs, tab],
    activeTabId: tabId,
  };
};

/**
 * 保存済みスクリプトを編集可能タブとして開く。
 * 同じスクリプトが既に開いている場合はそのタブをアクティブにする。
 */
export const openSavedTab = (
  state: WorkspaceState,
  scriptId: string,
  title: string,
  code: string,
  timestamp: number,
): WorkspaceState => {
  // 既に同じスクリプトが開いていればアクティブにするだけ
  const existing = state.tabs.find(
    (t) => t.source === "saved" && t.sourceId === scriptId,
  );
  if (existing) {
    return { ...state, activeTabId: existing.id };
  }

  const tabId = generateTabId("saved", timestamp);
  const tab: WorkspaceTab = {
    id: tabId,
    source: "saved",
    title,
    code,
    originalCode: code,
    sourceId: scriptId,
    readonly: false,
  };
  return {
    ...state,
    tabs: [...state.tabs, tab],
    activeTabId: tabId,
  };
};

// ── タブ操作 ────────────────────────────────────────────────────

/**
 * アクティブタブを切り替える。
 * 指定IDのタブが存在しない場合は状態を変更しない。
 */
export const setActiveTab = (
  state: WorkspaceState,
  tabId: string,
): WorkspaceState => {
  if (!state.tabs.some((t) => t.id === tabId)) {
    return state;
  }
  return { ...state, activeTabId: tabId };
};

/**
 * タブを閉じる。
 * アクティブタブを閉じた場合、隣接するタブをアクティブにする。
 */
export const closeTab = (
  state: WorkspaceState,
  tabId: string,
): WorkspaceState => {
  const tabIndex = state.tabs.findIndex((t) => t.id === tabId);
  if (tabIndex === -1) {
    return state;
  }

  const newTabs = state.tabs.filter((t) => t.id !== tabId);
  let newActiveTabId = state.activeTabId;

  if (state.activeTabId === tabId) {
    if (newTabs.length === 0) {
      newActiveTabId = undefined;
    } else if (tabIndex < newTabs.length) {
      // 同じインデックスのタブ（右隣）をアクティブに
      newActiveTabId = newTabs[tabIndex]?.id;
    } else {
      // 最後のタブを閉じた場合は左隣
      newActiveTabId = newTabs[newTabs.length - 1]?.id;
    }
  }

  return {
    ...state,
    tabs: newTabs,
    activeTabId: newActiveTabId,
  };
};

// ── コード編集 ──────────────────────────────────────────────────

/**
 * タブのコードを更新する。
 * readonlyタブの場合は状態を変更しない。
 */
export const updateTabCode = (
  state: WorkspaceState,
  tabId: string,
  newCode: string,
): WorkspaceState => {
  const tab = state.tabs.find((t) => t.id === tabId);
  if (!tab || tab.readonly) {
    return state;
  }

  return {
    ...state,
    tabs: state.tabs.map((t) => (t.id === tabId ? { ...t, code: newCode } : t)),
  };
};

/**
 * タブのタイトルを更新する。
 */
export const updateTabTitle = (
  state: WorkspaceState,
  tabId: string,
  newTitle: string,
): WorkspaceState => ({
  ...state,
  tabs: state.tabs.map((t) =>
    t.id === tabId ? { ...t, title: newTitle } : t,
  ),
});

// ── 状態クエリ ──────────────────────────────────────────────────

/**
 * アクティブタブを取得する。
 */
export const getActiveTab = (
  state: WorkspaceState,
): WorkspaceTab | undefined =>
  state.tabs.find((t) => t.id === state.activeTabId);

/**
 * タブが変更されているか（元のコードと異なるか）を判定する。
 * Unnamedタブは空でなければ変更済みとみなす。
 * Libraryタブは常に未変更（readonly）。
 */
export const isTabModified = (tab: WorkspaceTab): boolean => {
  if (tab.readonly) return false;
  if (tab.source === "unnamed") return tab.code !== "";
  return tab.code !== tab.originalCode;
};

/**
 * ワークスペースに変更されたタブがあるかを判定する。
 */
export const hasModifiedTabs = (state: WorkspaceState): boolean =>
  state.tabs.some(isTabModified);

/**
 * 特定のソースIDを持つタブを検索する。
 */
export const findTabBySourceId = (
  state: WorkspaceState,
  source: TabSource,
  sourceId: string,
): WorkspaceTab | undefined =>
  state.tabs.find((t) => t.source === source && t.sourceId === sourceId);

// ── ライブラリタブからの複製 ─────────────────────────────────────

/**
 * ライブラリタブの内容をUnnamedタブとして複製する。
 * ライブラリのコードをベースに編集可能なタブを作成する。
 */
export const duplicateAsUnnamed = (
  state: WorkspaceState,
  sourceTabId: string,
  timestamp: number,
): WorkspaceState => {
  const sourceTab = state.tabs.find((t) => t.id === sourceTabId);
  if (!sourceTab) {
    return state;
  }

  const tabId = generateTabId("unnamed", timestamp);
  const counter = state.nextUnnamedCounter;
  const tab: WorkspaceTab = {
    id: tabId,
    source: "unnamed",
    title: `${sourceTab.title satisfies string} (copy)`,
    code: sourceTab.code,
    originalCode: "",
    sourceId: undefined,
    readonly: false,
  };
  return {
    ...state,
    tabs: [...state.tabs, tab],
    activeTabId: tabId,
    nextUnnamedCounter: counter + 1,
  };
};

// ── 保存時の状態更新 ────────────────────────────────────────────

/**
 * Unnamedタブを保存済みタブに変換する。
 * savedScriptsLogicでの保存後に呼ぶ。
 */
export const markTabAsSaved = (
  state: WorkspaceState,
  tabId: string,
  savedScriptId: string,
  title: string,
): WorkspaceState => ({
  ...state,
  tabs: state.tabs.map((t) =>
    t.id === tabId
      ? {
          ...t,
          source: "saved" as const,
          title,
          originalCode: t.code,
          sourceId: savedScriptId,
        }
      : t,
  ),
});

/**
 * 保存済みタブのoriginalCodeを現在のcodeに更新する（上書き保存後）。
 */
export const markTabSynced = (
  state: WorkspaceState,
  tabId: string,
): WorkspaceState => ({
  ...state,
  tabs: state.tabs.map((t) =>
    t.id === tabId ? { ...t, originalCode: t.code } : t,
  ),
});
