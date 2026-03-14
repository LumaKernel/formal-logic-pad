/**
 * ProofWorkspace のメニューアクション宣言的定義。
 *
 * すべてのメニュー項目（コンテキストメニュー、ワークスペースメニュー、ショートカット、
 * コマンドパレット）をデータとして一元管理する。
 *
 * この定義から:
 * - 各メニューコンテキストへのフィルタリング
 * - dev/menu-ux-design.md の「現状のアクション一覧」セクション自動生成
 * - 将来: コマンドパレットの CommandItem[] 自動生成
 *
 * 変更時は menuActionDefinition.test.ts も同期すること。
 */

// --- Types ---

/**
 * メニューアクションが表示されるコンテキスト。
 * 新しいコンテキストを追加した場合、allMenuContexts も更新すること。
 */
export type MenuContext =
  | "toolbar"
  | "workspace-menu"
  | "node-context-menu"
  | "canvas-context-menu"
  | "line-context-menu"
  | "keyboard-shortcut"
  | "command-palette";

/** 網羅性チェック用: すべてのMenuContextを列挙 */
export const allMenuContexts: readonly MenuContext[] = [
  "toolbar",
  "workspace-menu",
  "node-context-menu",
  "canvas-context-menu",
  "line-context-menu",
  "keyboard-shortcut",
  "command-palette",
] as const;

/** メニュー内のグループ分け */
export type MenuGroup =
  | "inference-rules"
  | "selection"
  | "node-edit"
  | "layout"
  | "export-import"
  | "collection"
  | "navigation"
  | "connection";

/** 多言語ラベル */
export type I18nLabel = {
  readonly en: string;
  readonly ja: string;
};

/** メニューアクションの宣言的定義 */
export type MenuActionDefinition = {
  /** ユニークID */
  readonly id: string;
  /** 多言語ラベル */
  readonly label: I18nLabel;
  /** このアクションが表示されるコンテキスト */
  readonly contexts: readonly MenuContext[];
  /** キーボードショートカット表記（人間可読） */
  readonly shortcut?: string;
  /** グループ分け（メニュー内の区切り線に利用） */
  readonly group: MenuGroup;
  /** 備考（ドキュメント生成用） */
  readonly note?: string;
};

// --- Definitions ---

/**
 * ProofWorkspace の全メニューアクション定義。
 *
 * 順序はドキュメント生成時の表示順に影響する。
 * 各メニュー内でのグループ順序は group フィールドで制御。
 */
export const allMenuActions: readonly MenuActionDefinition[] = [
  // --- ツールバー ---
  {
    id: "view-system-detail",
    label: { en: "View System Detail", ja: "体系の詳細を見る" },
    contexts: ["toolbar"],
    group: "navigation",
    note: "Badge click",
  },
  {
    id: "duplicate-to-free",
    label: { en: "Duplicate as Free", ja: "自由証明に複製" },
    contexts: ["toolbar"],
    group: "navigation",
    note: "Quest mode only",
  },
  {
    id: "apply-mp",
    label: {
      en: "Apply Modus Ponens",
      ja: "Modus Ponens 適用",
    },
    contexts: ["toolbar", "node-context-menu"],
    group: "inference-rules",
    note: "Toolbar: toggle button; Node menu: Use as MP Left / Right",
  },
  {
    id: "use-as-mp-left",
    label: { en: "Use as MP Left (\u03C6)", ja: "MPの左に使う (\u03C6)" },
    contexts: ["node-context-menu"],
    group: "inference-rules",
  },
  {
    id: "use-as-mp-right",
    label: {
      en: "Use as MP Right (\u03C6\u2192\u03C8)",
      ja: "MPの右に使う (\u03C6\u2192\u03C8)",
    },
    contexts: ["node-context-menu"],
    group: "inference-rules",
  },
  {
    id: "apply-gen",
    label: { en: "Apply Gen", ja: "一般化適用" },
    contexts: ["toolbar", "node-context-menu"],
    group: "inference-rules",
    note: "Gen-enabled systems only",
  },
  {
    id: "apply-substitution",
    label: { en: "Apply Substitution", ja: "代入適用" },
    contexts: ["node-context-menu"],
    group: "inference-rules",
  },
  {
    id: "normalize-formula",
    label: { en: "Normalize Formula", ja: "論理式を簡約" },
    contexts: ["node-context-menu"],
    group: "node-edit",
    note: "Resolves substitution chains and simplifies FreeVariableAbsence",
  },

  // --- キャンバスメニュー ---
  {
    id: "add-node",
    label: { en: "Add Formula Schema", ja: "論理式スキーマを追加" },
    contexts: ["canvas-context-menu"],
    group: "node-edit",
  },
  {
    id: "paste",
    label: { en: "Paste", ja: "貼り付け" },
    contexts: ["canvas-context-menu"],
    shortcut: "Cmd+V",
    group: "node-edit",
  },

  // --- ノードメニュー ---
  {
    id: "select-subtree",
    label: { en: "Select Subtree", ja: "サブツリー選択" },
    contexts: ["node-context-menu"],
    group: "selection",
  },
  {
    id: "select-proof",
    label: { en: "Select Proof", ja: "証明選択" },
    contexts: ["node-context-menu"],
    group: "selection",
  },
  {
    id: "save-to-collection",
    label: { en: "Save to Collection", ja: "コレクションに保存" },
    contexts: ["node-context-menu"],
    group: "collection",
    note: "Collection enabled only",
  },
  {
    id: "edit-formula",
    label: { en: "Edit Formula", ja: "数式を編集" },
    contexts: ["node-context-menu"],
    group: "node-edit",
    note: "Formula nodes only",
  },
  {
    id: "edit-note",
    label: { en: "Edit Note", ja: "ノートを編集" },
    contexts: ["node-context-menu"],
    group: "node-edit",
    note: "Note nodes only",
  },
  {
    id: "run-script",
    label: { en: "Run Script", ja: "スクリプトを実行" },
    contexts: ["node-context-menu"],
    group: "node-edit",
    note: "Script nodes only",
  },
  {
    id: "apply-script",
    label: { en: "Apply Script\u2026", ja: "スクリプトを適用\u2026" },
    contexts: ["node-context-menu", "canvas-context-menu"],
    group: "node-edit",
    note: "Opens script editor with saved scripts list",
  },
  {
    id: "merge-with-node",
    label: {
      en: "Merge Equivalent Schema\u2026",
      ja: "同一スキーマをマージ\u2026",
    },
    contexts: ["node-context-menu"],
    shortcut: "Cmd+M",
    group: "node-edit",
  },
  {
    id: "duplicate-node",
    label: { en: "Duplicate Node", ja: "ノードを複製" },
    contexts: ["node-context-menu"],
    shortcut: "Cmd+D",
    group: "node-edit",
  },
  {
    id: "delete-node",
    label: { en: "Delete Node", ja: "ノードを削除" },
    contexts: ["node-context-menu"],
    shortcut: "Delete / Backspace",
    group: "node-edit",
  },

  // --- 接続メニュー ---
  {
    id: "delete-connection",
    label: { en: "Delete Connection", ja: "接続を削除" },
    contexts: ["line-context-menu"],
    group: "connection",
  },

  // --- レイアウト ---
  {
    id: "tree-layout-top-to-bottom",
    label: {
      en: "Tree Layout (Top\u2192Bottom)",
      ja: "ツリー整列（上\u2192下）",
    },
    contexts: ["canvas-context-menu", "command-palette"],
    group: "layout",
  },
  {
    id: "tree-layout-bottom-to-top",
    label: {
      en: "Tree Layout (Bottom\u2192Top)",
      ja: "ツリー整列（下\u2192上）",
    },
    contexts: ["canvas-context-menu", "command-palette"],
    group: "layout",
  },
  {
    id: "tree-layout",
    label: {
      en: "Tree Layout (default direction)",
      ja: "ツリー整列（デフォルト方向）",
    },
    contexts: ["keyboard-shortcut"],
    shortcut: "Cmd+Shift+L",
    group: "layout",
  },

  // --- ワークスペースメニュー ---
  {
    id: "export-json",
    label: { en: "Export JSON", ja: "JSONエクスポート" },
    contexts: ["workspace-menu"],
    group: "export-import",
  },
  {
    id: "export-svg",
    label: { en: "Export SVG", ja: "SVGエクスポート" },
    contexts: ["workspace-menu"],
    group: "export-import",
  },
  {
    id: "export-png",
    label: { en: "Export PNG", ja: "PNGエクスポート" },
    contexts: ["workspace-menu"],
    group: "export-import",
  },
  {
    id: "import-json",
    label: { en: "Import JSON", ja: "JSONインポート" },
    contexts: ["workspace-menu"],
    group: "export-import",
  },
  {
    id: "open-collection",
    label: { en: "My Collection", ja: "コレクションを開く" },
    contexts: ["workspace-menu"],
    group: "collection",
    note: "Collection enabled only",
  },

  // --- キーボードショートカットのみ ---
  {
    id: "copy",
    label: { en: "Copy", ja: "コピー" },
    contexts: ["keyboard-shortcut"],
    shortcut: "Cmd+C",
    group: "node-edit",
  },
  {
    id: "cut",
    label: { en: "Cut", ja: "切り取り" },
    contexts: ["keyboard-shortcut"],
    shortcut: "Cmd+X",
    group: "node-edit",
  },
  {
    id: "select-all",
    label: { en: "Select All", ja: "全選択" },
    contexts: ["keyboard-shortcut"],
    shortcut: "Cmd+A",
    group: "selection",
  },
  {
    id: "escape",
    label: { en: "Cancel / Deselect", ja: "キャンセル / 選択解除" },
    contexts: ["keyboard-shortcut"],
    shortcut: "Escape",
    group: "selection",
  },
  {
    id: "open-search",
    label: { en: "Search", ja: "検索" },
    contexts: ["keyboard-shortcut", "command-palette"],
    shortcut: "Cmd+F",
    group: "navigation",
  },
  {
    id: "open-command-palette",
    label: { en: "Command Palette", ja: "コマンドパレット" },
    contexts: ["keyboard-shortcut"],
    shortcut: "/",
    group: "navigation",
  },
  {
    id: "zoom-in",
    label: { en: "Zoom In", ja: "ズームイン" },
    contexts: ["keyboard-shortcut"],
    shortcut: "Cmd++",
    group: "navigation",
  },
  {
    id: "zoom-out",
    label: { en: "Zoom Out", ja: "ズームアウト" },
    contexts: ["keyboard-shortcut"],
    shortcut: "Cmd+-",
    group: "navigation",
  },
  {
    id: "zoom-to-selection",
    label: { en: "Zoom to Selection", ja: "選択にズーム" },
    contexts: ["keyboard-shortcut"],
    shortcut: "Shift+2",
    group: "navigation",
  },
  {
    id: "pan",
    label: {
      en: "Pan (Arrow keys / Shift+Arrow)",
      ja: "パン（矢印キー / Shift+矢印）",
    },
    contexts: ["keyboard-shortcut"],
    shortcut: "Arrow / Shift+Arrow",
    group: "navigation",
  },
  {
    id: "space-pan",
    label: { en: "Space Pan Mode", ja: "スペースパンモード" },
    contexts: ["keyboard-shortcut"],
    shortcut: "Space",
    group: "navigation",
  },
];

// --- Pure filter functions ---

/** 指定コンテキストのメニューアクションをフィルタ */
export function filterByContext(
  actions: readonly MenuActionDefinition[],
  context: MenuContext,
): readonly MenuActionDefinition[] {
  return actions.filter((a) => a.contexts.includes(context));
}

/** 指定グループのメニューアクションをフィルタ */
export function filterByGroup(
  actions: readonly MenuActionDefinition[],
  group: MenuGroup,
): readonly MenuActionDefinition[] {
  return actions.filter((a) => a.group === group);
}

/** ロケールに応じたラベルを取得 */
export function getLabel(
  action: MenuActionDefinition,
  locale: "en" | "ja",
): string {
  return action.label[locale];
}

// --- Markdown generation ---

/** コンテキスト名の表示ラベル */
const contextDisplayNames: Record<MenuContext, I18nLabel> = {
  toolbar: { en: "Toolbar", ja: "ツールバー（ヘッダー）" },
  "workspace-menu": {
    en: "Workspace Menu (\u22EF)",
    ja: "ワークスペースメニュー (\u22EF)",
  },
  "node-context-menu": {
    en: "Node Context Menu",
    ja: "ノードコンテキストメニュー",
  },
  "canvas-context-menu": {
    en: "Canvas Context Menu",
    ja: "キャンバスコンテキストメニュー",
  },
  "line-context-menu": {
    en: "Line Context Menu",
    ja: "接続コンテキストメニュー",
  },
  "keyboard-shortcut": {
    en: "Keyboard Shortcuts",
    ja: "キーボードショートカット",
  },
  "command-palette": { en: "Command Palette", ja: "コマンドパレット" },
};

/**
 * メニューアクション定義から Markdown のアクション一覧セクションを生成する。
 *
 * dev/menu-ux-design.md の「現状のアクション一覧と起点」セクションを
 * この関数の出力で置換する。
 */
export function generateMenuDocMarkdown(
  actions: readonly MenuActionDefinition[],
  /* v8 ignore start -- デフォルト値: テストでlocale省略呼び出しをカバー済みだがv8集約で未カバー扱い */
  locale: "ja" | "en" = "ja",
  /* v8 ignore stop */
): string {
  const lines: string[] = [];
  lines.push("## 現状のアクション一覧と起点");
  lines.push("");
  lines.push(
    "<!-- このセクションは menuActionDefinition.ts から自動生成されています -->",
  );
  lines.push("");

  const contextsToShow: readonly MenuContext[] = [
    "toolbar",
    "workspace-menu",
    "canvas-context-menu",
    "node-context-menu",
    "line-context-menu",
    "keyboard-shortcut",
    "command-palette",
  ];

  for (const context of contextsToShow) {
    const contextActions = filterByContext(actions, context);
    if (contextActions.length === 0) continue;

    const contextName: string = contextDisplayNames[context][locale];
    lines.push(`### ${contextName satisfies string}`);
    lines.push("");
    lines.push("| アクション | ショートカット | 備考 |");
    lines.push("| --- | --- | --- |");

    for (const action of contextActions) {
      const label: string = getLabel(action, locale);
      const shortcut: string = action.shortcut ?? "";
      const note: string = action.note ?? "";
      lines.push(
        `| ${label satisfies string} | ${shortcut satisfies string} | ${note satisfies string} |`,
      );
    }

    lines.push("");
  }

  return lines.join("\n");
}
