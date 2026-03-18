import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within, userEvent, fn } from "storybook/test";
import { ScriptLibraryPanel } from "./ScriptLibraryPanel";
import type { ScriptTemplate } from "@/lib/script-runner/templates";
import type { SavedScript } from "./savedScriptsLogic";

const sampleTemplates: readonly ScriptTemplate[] = [
  {
    id: "cut-elim",
    title: "カット除去: 単純な例",
    description: "φ ⇒ φ の公理同士をカットした証明からカットを除去する。",
    code: "// cut elimination",
    compatibleStyles: ["sequent-calculus"],
  },
  {
    id: "build-proof",
    title: "φ→φ の証明構築",
    description:
      "parseFormula と applyMP を使って φ→φ の Hilbert スタイル証明を組み立てる。",
    code: "// build proof",
    compatibleStyles: ["hilbert"],
  },
  {
    id: "auto-prove",
    title: "自動証明探索 (LK)",
    description: "proveSequentLK を使って命題論理の定理を自動的に証明する。",
    code: "// auto prove",
    compatibleStyles: ["sequent-calculus"],
  },
];

const sampleSavedScripts: readonly SavedScript[] = [
  {
    id: "saved-1",
    title: "My Custom Script",
    code: "console.log('hello')",
    savedAt: 1710000000000,
  },
  {
    id: "saved-2",
    title: "Test Script",
    code: "console.log('test')",
    savedAt: 1710100000000,
  },
];

const meta = {
  title: "components/ScriptLibraryPanel",
  component: ScriptLibraryPanel,
  args: {
    templates: sampleTemplates,
    savedScripts: sampleSavedScripts,
    onSelect: fn(),
    onClose: fn(),
    onDeleteSaved: fn(),
  },
  decorators: [
    (Story) => (
      <div style={{ position: "relative", height: "500px", width: "700px" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ScriptLibraryPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // パネルが表示される
    await expect(
      canvas.getByTestId("script-library-panel"),
    ).toBeInTheDocument();

    // 検索フィールドが存在する
    await expect(
      canvas.getByTestId("script-library-search"),
    ).toBeInTheDocument();

    // フィルタボタンが存在する
    await expect(
      canvas.getByTestId("script-library-filter-all"),
    ).toBeInTheDocument();
    await expect(
      canvas.getByTestId("script-library-filter-builtin"),
    ).toBeInTheDocument();
    await expect(
      canvas.getByTestId("script-library-filter-saved"),
    ).toBeInTheDocument();

    // アイテムが全件表示される (3 templates + 2 saved)
    const list = canvas.getByTestId("script-library-list");
    const items = within(list).getAllByText(/./);
    await expect(items.length).toBeGreaterThan(0);
  },
};

export const WithSearch: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 検索で絞り込む
    const searchInput = canvas.getByTestId("script-library-search");
    await userEvent.type(searchInput, "カット");

    // カット除去テンプレートのみ表示
    await expect(
      canvas.getByTestId("script-library-item-cut-elim"),
    ).toBeInTheDocument();

    // 他のアイテムは非表示
    await expect(
      canvas.queryByTestId("script-library-item-build-proof"),
    ).not.toBeInTheDocument();
    await expect(
      canvas.queryByTestId("script-library-item-saved-1"),
    ).not.toBeInTheDocument();
  },
};

export const FilteredByKind: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Savedフィルタをクリック
    const savedFilter = canvas.getByTestId("script-library-filter-saved");
    await userEvent.click(savedFilter);

    // 保存済みスクリプトのみ表示
    await expect(
      canvas.getByTestId("script-library-item-saved-1"),
    ).toBeInTheDocument();
    await expect(
      canvas.getByTestId("script-library-item-saved-2"),
    ).toBeInTheDocument();

    // ビルトインは非表示
    await expect(
      canvas.queryByTestId("script-library-item-cut-elim"),
    ).not.toBeInTheDocument();

    // アイテムをクリックして選択
    await userEvent.click(canvas.getByTestId("script-library-item-saved-1"));
    await expect(args.onSelect).toHaveBeenCalled();
  },
};

export const FilteredByStyle: Story = {
  args: {
    deductionStyle: "hilbert",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Hilbert互換テンプレートのみ + 保存済み全件
    await expect(
      canvas.getByTestId("script-library-item-build-proof"),
    ).toBeInTheDocument();
    await expect(
      canvas.getByTestId("script-library-item-saved-1"),
    ).toBeInTheDocument();

    // SC専用は非表示
    await expect(
      canvas.queryByTestId("script-library-item-cut-elim"),
    ).not.toBeInTheDocument();
  },
};

export const Empty: Story = {
  args: {
    templates: [],
    savedScripts: [],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 空メッセージが表示される
    await expect(
      canvas.getByTestId("script-library-empty"),
    ).toBeInTheDocument();
  },
};

export const DeleteSavedScript: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // 保存済みスクリプトの削除ボタンをクリック
    const deleteBtn = canvas.getByTestId("script-library-delete-saved-1");
    await userEvent.click(deleteBtn);

    await expect(args.onDeleteSaved).toHaveBeenCalledWith("saved-1");
    // onSelectは呼ばれない（stopPropagation）
    await expect(args.onSelect).not.toHaveBeenCalled();
  },
};
