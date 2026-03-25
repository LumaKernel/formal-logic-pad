/**
 * ワークスペースタブバーコンポーネント。
 *
 * VSCode のようなタブ表示を提供する。
 * 各タブにはソースアイコン・タイトル・変更マーカー・閉じるボタンを表示。
 * タブ右クリックでコンテキストメニューを表示する。
 *
 * 変更時は tabBarLogic.ts, tabContextMenuLogic.ts, ScriptWorkspaceTabBar.stories.tsx も同期すること。
 */
"use client";

import { useCallback, useState } from "react";
import type { CSSProperties } from "react";
import type { WorkspaceTab } from "./scriptWorkspaceState";
import { computeAllTabDisplays, formatTabLabel } from "./tabBarLogic";
import type { TabDisplayInfo } from "./tabBarLogic";
import { computeTabContextMenuItems } from "./tabContextMenuLogic";
import type { TabContextMenuAction } from "./tabContextMenuLogic";
import { ContextMenuComponent } from "../../lib/infinite-canvas/ContextMenuComponent";
import { useContextMenu } from "../../lib/infinite-canvas/useContextMenu";

// ── Inline styles ──────────────────────────────────────────────

const tabBarContainerStyle: Readonly<CSSProperties> = {
  display: "flex",
  alignItems: "stretch",
  gap: "0px",
  backgroundColor: "var(--color-surface-secondary, #f1f3f5)",
  borderBottom: "1px solid var(--color-border, #e2e8f0)",
  minHeight: "32px",
  overflowX: "auto",
  overflowY: "hidden",
};

const tabBaseStyle: Readonly<CSSProperties> = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  paddingLeft: "12px",
  paddingRight: "4px",
  paddingTop: "4px",
  paddingBottom: "4px",
  fontSize: "var(--font-size-xs, 11px)",
  fontWeight: 400,
  lineHeight: 1,
  whiteSpace: "nowrap",
  cursor: "pointer",
  borderRight: "1px solid var(--color-border, #e2e8f0)",
  backgroundColor: "transparent",
  color: "var(--color-text-secondary, #666666)",
  border: "none",
  borderBottom: "2px solid transparent",
  userSelect: "none",
  transitionProperty: "background-color, color, border-color",
  transitionDuration: "100ms",
};

const tabActiveExtraStyle: Readonly<CSSProperties> = {
  backgroundColor: "var(--color-surface, #ffffff)",
  color: "var(--color-text-primary, #171717)",
  fontWeight: 500,
  borderBottom: "2px solid var(--color-accent, #3b82f6)",
};

const tabCloseStyle: Readonly<CSSProperties> = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "18px",
  height: "18px",
  borderRadius: "3px",
  border: "none",
  backgroundColor: "transparent",
  color: "var(--color-text-tertiary, #767676)",
  cursor: "pointer",
  fontSize: "12px",
  lineHeight: 1,
  padding: 0,
  transitionProperty: "background-color, color",
  transitionDuration: "100ms",
};

const newTabBtnStyle: Readonly<CSSProperties> = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "28px",
  minWidth: "28px",
  border: "none",
  backgroundColor: "transparent",
  color: "var(--color-text-tertiary, #767676)",
  cursor: "pointer",
  fontSize: "16px",
  lineHeight: 1,
  padding: 0,
  transitionProperty: "background-color, color",
  transitionDuration: "100ms",
};

const readonlyBadgeStyle: Readonly<CSSProperties> = {
  fontSize: "9px",
  color: "var(--color-text-tertiary, #767676)",
  marginLeft: "-2px",
};

// ── Props ──────────────────────────────────────────────────────

export interface ScriptWorkspaceTabBarProps {
  readonly tabs: readonly WorkspaceTab[];
  readonly activeTabId: string | undefined;
  readonly onSelectTab: (tabId: string) => void;
  readonly onCloseTab: (tabId: string) => void;
  readonly onNewTab: () => void;
  /** コンテキストメニューアクションのコールバック */
  readonly onTabContextMenuAction?: (
    action: TabContextMenuAction,
    tabId: string,
  ) => void;
}

// ── Single Tab ─────────────────────────────────────────────────

interface TabItemProps {
  readonly info: TabDisplayInfo;
  readonly onSelect: () => void;
  readonly onClose: () => void;
  readonly onContextMenu: (e: React.MouseEvent<HTMLElement>) => void;
}

const TabItem: React.FC<TabItemProps> = ({
  info,
  onSelect,
  onClose,
  onContextMenu,
}) => {
  const handleClose = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onClose();
    },
    [onClose],
  );

  const mergedStyle: Readonly<CSSProperties> = info.isActive
    ? { ...tabBaseStyle, ...tabActiveExtraStyle }
    : tabBaseStyle;

  return (
    <div
      role="tab"
      aria-selected={info.isActive}
      data-testid={`workspace-tab-${info.id satisfies string}`}
      style={mergedStyle}
      onClick={onSelect}
      onContextMenu={onContextMenu}
    >
      <span>{formatTabLabel(info)}</span>
      {info.isReadonly && <span style={readonlyBadgeStyle}>RO</span>}
      <button
        type="button"
        aria-label={`Close ${info.label satisfies string}`}
        data-testid={`workspace-tab-close-${info.id satisfies string}`}
        style={tabCloseStyle}
        onClick={handleClose}
      >
        ×
      </button>
    </div>
  );
};

// ── TabBar ─────────────────────────────────────────────────────

export const ScriptWorkspaceTabBar: React.FC<ScriptWorkspaceTabBarProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onNewTab,
  onTabContextMenuAction,
}) => {
  const tabDisplays = computeAllTabDisplays(tabs, activeTabId);
  const { menuState, open, close, menuRef } = useContextMenu();
  const [contextTabId, setContextTabId] = useState<string | undefined>(
    undefined,
  );

  const handleContextMenu = useCallback(
    (tabId: string, tabIndex: number, e: React.MouseEvent<HTMLElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setContextTabId(tabId);
      open(e.clientX, e.clientY);
    },
    [open],
  );

  const handleMenuSelect = useCallback(
    (actionId: string) => {
      if (contextTabId !== undefined && onTabContextMenuAction) {
        onTabContextMenuAction(actionId as TabContextMenuAction, contextTabId);
      }
      close();
    },
    [contextTabId, onTabContextMenuAction, close],
  );

  const contextTabIndex = contextTabId
    ? tabs.findIndex((t) => t.id === contextTabId)
    : -1;
  const menuItems =
    contextTabId !== undefined
      ? computeTabContextMenuItems({
          tabIndex: contextTabIndex,
          totalTabs: tabs.length,
        })
      : [];

  return (
    <div
      role="tablist"
      aria-label="Workspace tabs"
      data-testid="workspace-tab-bar"
      style={tabBarContainerStyle}
    >
      {tabDisplays.map((info, index) => (
        <TabItem
          key={info.id}
          info={info}
          onSelect={() => onSelectTab(info.id)}
          onClose={() => onCloseTab(info.id)}
          onContextMenu={(e) => handleContextMenu(info.id, index, e)}
        />
      ))}
      <button
        type="button"
        aria-label="New tab"
        data-testid="workspace-new-tab-btn"
        style={newTabBtnStyle}
        onClick={onNewTab}
      >
        +
      </button>
      {menuState.open && (
        <ContextMenuComponent
          items={menuItems}
          screenPosition={menuState.screenPosition}
          onSelect={handleMenuSelect}
          onClose={close}
          menuRef={menuRef}
        />
      )}
    </div>
  );
};
