import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { ScriptFileExplorer } from "./ScriptFileExplorer";
import type { SavedScript } from "./savedScriptsLogic";

const sampleScripts: readonly SavedScript[] = [
  {
    id: "s1",
    title: "Hello World",
    code: 'console.log("hello")',
    savedAt: 1718_441_400_000, // 2024-06-15 10:30 UTC
  },
  {
    id: "s2",
    title: "Proof Demo",
    code: 'parseFormula("phi -> psi")',
    savedAt: 1718_540_400_000, // 2024-06-16 14:00 UTC
  },
  {
    id: "s3",
    title: "Cut Elimination Test",
    code: "// cut elimination test",
    savedAt: 1718_348_400_000, // 2024-06-14 09:00 UTC
  },
];

const meta: Meta<typeof ScriptFileExplorer> = {
  title: "components/ScriptFileExplorer",
  component: ScriptFileExplorer,
  args: {
    scripts: sampleScripts,
    onOpen: fn(),
    onRename: fn(),
    onDelete: fn(),
  },
  decorators: [
    (Story) => (
      <div
        style={{ width: "260px", height: "300px", border: "1px solid #ccc" }}
      >
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ScriptFileExplorer>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const explorer = canvas.getByTestId("script-file-explorer");
    await expect(explorer).toBeDefined();

    const list = canvas.getByTestId("file-explorer-list");
    await expect(list).toBeDefined();

    // 3 items rendered
    const items = list.querySelectorAll("[role='listitem']");
    await expect(items.length).toBe(3);

    // Newest first (Proof Demo > Hello World > Cut Elimination)
    const firstItem = canvas.getByTestId("file-explorer-item-s2");
    await expect(firstItem).toBeDefined();
  },
};

export const EmptyState: Story = {
  args: {
    scripts: [],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const empty = canvas.getByTestId("file-explorer-empty");
    await expect(empty.textContent).toBe("No saved scripts");
  },
};

export const OpenFile: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const item = canvas.getByTestId("file-explorer-item-s1");
    await userEvent.dblClick(item);
    await expect(args.onOpen).toHaveBeenCalledWith("s1");
  },
};

export const RenameFlow: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Hover to show action buttons
    const item = canvas.getByTestId("file-explorer-item-s1");
    await userEvent.hover(item);

    // Click rename button
    const renameBtn = canvas.getByTestId("file-explorer-rename-btn-s1");
    await userEvent.click(renameBtn);

    // Type new name
    const input = canvas.getByTestId("file-explorer-rename-input-s1");
    await expect(input).toBeDefined();
    await userEvent.clear(input);
    await userEvent.type(input, "Renamed Script{Enter}");

    await expect(args.onRename).toHaveBeenCalledWith("s1", "Renamed Script");
  },
};

export const DeleteFlow: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Hover to show action buttons
    const item = canvas.getByTestId("file-explorer-item-s2");
    await userEvent.hover(item);

    // Click delete button
    const deleteBtn = canvas.getByTestId("file-explorer-delete-btn-s2");
    await userEvent.click(deleteBtn);

    // Confirm delete
    const confirmYes = canvas.getByTestId("file-explorer-confirm-yes-s2");
    await expect(confirmYes).toBeDefined();
    await userEvent.click(confirmYes);

    await expect(args.onDelete).toHaveBeenCalledWith("s2");
  },
};

export const RenameCancelEscape: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Hover to show action buttons
    const item = canvas.getByTestId("file-explorer-item-s1");
    await userEvent.hover(item);

    // Click rename button
    const renameBtn = canvas.getByTestId("file-explorer-rename-btn-s1");
    await userEvent.click(renameBtn);

    // Type something then press Escape
    const input = canvas.getByTestId("file-explorer-rename-input-s1");
    await userEvent.clear(input);
    await userEvent.type(input, "Should Not Save{Escape}");

    // onRename should NOT be called
    await expect(args.onRename).not.toHaveBeenCalled();

    // Input should disappear (back to normal display)
    const inputAfter = canvasElement.querySelector(
      "[data-testid='file-explorer-rename-input-s1']",
    );
    await expect(inputAfter).toBeNull();
  },
};

export const RenameBlurConfirm: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Hover to show action buttons
    const item = canvas.getByTestId("file-explorer-item-s2");
    await userEvent.hover(item);

    // Click rename button
    const renameBtn = canvas.getByTestId("file-explorer-rename-btn-s2");
    await userEvent.click(renameBtn);

    // Type new name then blur (tab away)
    const input = canvas.getByTestId("file-explorer-rename-input-s2");
    await userEvent.clear(input);
    await userEvent.type(input, "Blur Renamed");
    await userEvent.tab();

    // onRename should be called via blur handler
    await expect(args.onRename).toHaveBeenCalledWith("s2", "Blur Renamed");
  },
};

export const HoverAndLeave: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Hover to show action buttons
    const item = canvas.getByTestId("file-explorer-item-s1");
    await userEvent.hover(item);

    // Action buttons should be visible
    const renameBtn = canvas.getByTestId("file-explorer-rename-btn-s1");
    await expect(renameBtn).toBeDefined();

    // Mouse leave
    await userEvent.unhover(item);

    // Action buttons should disappear
    const renameBtnAfter = canvasElement.querySelector(
      "[data-testid='file-explorer-rename-btn-s1']",
    );
    await expect(renameBtnAfter).toBeNull();
  },
};

export const RenameDoubleClick: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // ホバーしてリネームボタンを表示
    const item = canvas.getByTestId("file-explorer-item-s1");
    await userEvent.hover(item);

    // リネームボタンをクリック
    const renameBtn = canvas.getByTestId("file-explorer-rename-btn-s1");
    await userEvent.click(renameBtn);

    // リネーム入力をダブルクリック（onDoubleClick stopPropagation がカバーされる）
    const input = canvas.getByTestId("file-explorer-rename-input-s1");
    await userEvent.dblClick(input);

    // onOpen は呼ばれない（stopPropagation で伝播が防止される）
    await expect(args.onOpen).not.toHaveBeenCalled();
  },
};

export const DeleteCancel: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Hover to show action buttons
    const item = canvas.getByTestId("file-explorer-item-s3");
    await userEvent.hover(item);

    // Click delete button
    const deleteBtn = canvas.getByTestId("file-explorer-delete-btn-s3");
    await userEvent.click(deleteBtn);

    // Cancel delete
    const confirmNo = canvas.getByTestId("file-explorer-confirm-no-s3");
    await userEvent.click(confirmNo);

    await expect(args.onDelete).not.toHaveBeenCalled();

    // Confirm bar should be gone
    const confirmBar = canvasElement.querySelector(
      "[data-testid='file-explorer-confirm-delete-s3']",
    );
    await expect(confirmBar).toBeNull();
  },
};
