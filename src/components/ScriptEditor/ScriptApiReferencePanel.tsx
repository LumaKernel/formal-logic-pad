/**
 * スクリプト API リファレンスパネル。
 *
 * 全ブリッジ API 関数をカテゴリ別に一覧表示し、
 * テキスト検索でフィルタリングできる。
 *
 * 変更時は scriptApiReferenceLogic.ts, index.ts も同期すること。
 */
"use client";

import { useState, useCallback, useMemo } from "react";
import type { CSSProperties } from "react";
import type { ProofBridgeApiDef } from "@/lib/script-runner";
import {
  API_CATEGORIES,
  filterCategories,
  getTotalApiCount,
} from "./scriptApiReferenceLogic";
import type { ApiCategoryInfo } from "./scriptApiReferenceLogic";
import {
  type ScriptEditorMessages,
  defaultScriptEditorMessages,
} from "./scriptEditorMessages";

// ── Styles ─────────────────────────────────────────────────────

const panelStyle: Readonly<CSSProperties> = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
  backgroundColor: "var(--color-code-bg,#1e1e1e)",
  color: "var(--color-code-text,#d4d4d4)",
  fontFamily: "monospace",
  fontSize: "var(--font-size-xs,11px)",
  overflow: "hidden",
};

const searchBarStyle: Readonly<CSSProperties> = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "8px 12px",
  borderBottom: "1px solid var(--color-border,#333333)",
};

const searchInputStyle: Readonly<CSSProperties> = {
  flex: 1,
  padding: "4px 8px",
  border: "1px solid var(--color-border,#555555)",
  borderRadius: "4px",
  backgroundColor: "var(--color-surface,#2d2d2d)",
  color: "var(--color-code-text,#d4d4d4)",
  fontSize: "var(--font-size-xs,11px)",
  fontFamily: "monospace",
  outline: "none",
};

const categoryHeaderStyle: Readonly<CSSProperties> = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  padding: "6px 12px",
  cursor: "pointer",
  backgroundColor: "var(--color-surface,#2d2d2d)",
  borderBottom: "1px solid var(--color-border,#333333)",
  userSelect: "none",
};

const apiItemStyle: Readonly<CSSProperties> = {
  padding: "6px 12px 6px 20px",
  borderBottom: "1px solid var(--color-border,#2a2a2a)",
};

const signatureStyle: Readonly<CSSProperties> = {
  color: "#9cdcfe",
  fontWeight: 500,
};

const descriptionStyle: Readonly<CSSProperties> = {
  color: "#999999",
  marginTop: "2px",
  lineHeight: 1.4,
};

// ── Sub-components ─────────────────────────────────────────────

function ApiItem({ api }: { readonly api: ProofBridgeApiDef }) {
  return (
    <div
      style={apiItemStyle}
      data-testid={`api-item-${api.name satisfies string}`}
    >
      <div style={signatureStyle}>
        <span style={{ color: "#dcdcaa" }}>{api.name}</span>
        <span style={{ color: "#808080" }}>{api.signature}</span>
      </div>
      <div style={descriptionStyle}>{api.description}</div>
    </div>
  );
}

function CategorySection({
  category,
  defaultExpanded,
}: {
  readonly category: ApiCategoryInfo;
  readonly defaultExpanded: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const toggle = useCallback(() => setExpanded((prev) => !prev), []);

  return (
    <div data-testid={`api-category-${category.id satisfies string}`}>
      <div
        style={categoryHeaderStyle}
        onClick={toggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") toggle();
        }}
        data-testid={`api-category-header-${category.id satisfies string}`}
      >
        <span style={{ fontSize: "10px" }}>{expanded ? "▼" : "▶"}</span>
        <span style={{ fontWeight: 600, color: "#e0e0e0" }}>
          {category.label}
        </span>
        <span style={{ color: "#666666" }}>
          ({String(category.apis.length) satisfies string})
        </span>
      </div>
      {expanded &&
        category.apis.map((api) => <ApiItem key={api.name} api={api} />)}
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────

export interface ScriptApiReferencePanelProps {
  /** パネルを閉じるコールバック */
  readonly onClose?: () => void;
  /** i18nメッセージ（省略時は英語デフォルト） */
  readonly messages?: ScriptEditorMessages;
}

// ── Main Component ─────────────────────────────────────────────

export const ScriptApiReferencePanel: React.FC<
  ScriptApiReferencePanelProps
> = ({ onClose, messages: msg = defaultScriptEditorMessages }) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCategories = useMemo(
    () => filterCategories(API_CATEGORIES, searchQuery),
    [searchQuery],
  );

  const totalCount = useMemo(() => getTotalApiCount(API_CATEGORIES), []);

  const filteredCount = useMemo(
    () => getTotalApiCount(filteredCategories),
    [filteredCategories],
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    [],
  );

  return (
    <div style={panelStyle} data-testid="api-reference-panel">
      <div style={searchBarStyle}>
        <span
          style={{ fontWeight: 600, color: "#e0e0e0", whiteSpace: "nowrap" }}
        >
          API Reference
        </span>
        <input
          type="text"
          style={searchInputStyle}
          placeholder={msg.searchApis}
          value={searchQuery}
          onChange={handleSearchChange}
          data-testid="api-reference-search"
        />
        <span style={{ color: "#666666", whiteSpace: "nowrap" }}>
          {searchQuery.trim() !== ""
            ? `${String(filteredCount) satisfies string}/${String(totalCount) satisfies string}`
            : `${String(totalCount) satisfies string} APIs`}
        </span>
        {onClose !== undefined && (
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#999999",
              cursor: "pointer",
              fontSize: "14px",
              padding: "0 4px",
              lineHeight: 1,
            }}
            data-testid="api-reference-close"
            title="Close"
          >
            ×
          </button>
        )}
      </div>
      <div
        style={{ flex: 1, overflowY: "auto" }}
        data-testid="api-reference-content"
      >
        {filteredCategories.length === 0 ? (
          <div
            style={{
              padding: "16px",
              textAlign: "center",
              color: "#666666",
            }}
            data-testid="api-reference-no-results"
          >
            No matching APIs found
          </div>
        ) : (
          filteredCategories.map((cat) => (
            <CategorySection
              key={cat.id}
              category={cat}
              defaultExpanded={
                searchQuery.trim() !== "" || filteredCategories.length <= 3
              }
            />
          ))
        )}
      </div>
    </div>
  );
};
