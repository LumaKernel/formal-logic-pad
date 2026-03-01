/**
 * エッジパラメータ編集ポップオーバー。
 *
 * InferenceEdgeBadgeをクリックした際に表示される編集UIコンポーネント。
 * Gen: 量化変数名の入力
 * Substitution: 代入エントリの編集
 *
 * ProofWorkspace上のオーバーレイとしてレンダリングされる。
 *
 * 変更時は EdgeParameterPopover.test.tsx も同期すること。
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { EdgeBadgeEditState, SubstEditEntry } from "./edgeBadgeEditLogic";
import {
  canConfirmGenEdit,
  updateGenEditVariableName,
  toSubstEditEntries,
  fromSubstEditEntries,
  canConfirmSubstEdit,
  updateSubstEditEntryValue,
} from "./edgeBadgeEditLogic";
import type { SubstitutionEntries } from "./substitutionApplicationLogic";

// --- Props ---

export interface EdgeParameterPopoverProps {
  /** 編集状態 */
  readonly editState: EdgeBadgeEditState;
  /** Gen変数名確定コールバック */
  readonly onConfirmGen?: (
    conclusionNodeId: string,
    variableName: string,
  ) => void;
  /** Substitution代入確定コールバック */
  readonly onConfirmSubstitution?: (
    conclusionNodeId: string,
    entries: SubstitutionEntries,
  ) => void;
  /** キャンセルコールバック */
  readonly onCancel: () => void;
  /** 構文ヘルプを開くコールバック（指定時に代入入力欄に?ボタンを表示） */
  readonly onOpenSyntaxHelp?: () => void;
  /** data-testid */
  readonly testId?: string;
}

// --- スタイル ---

const popoverStyle: React.CSSProperties = {
  position: "absolute",
  zIndex: 1000,
  backgroundColor: "var(--color-surface, #2d3436)",
  border: "1px solid var(--color-border, #636e72)",
  borderRadius: 8,
  padding: 8,
  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
  minWidth: 200,
};

const inputStyle: React.CSSProperties = {
  backgroundColor: "var(--color-input-bg, #1a1a2e)",
  color: "var(--color-input-text, #fff)",
  border: "1px solid var(--color-border, #636e72)",
  borderRadius: 4,
  padding: "4px 8px",
  fontSize: 12,
  fontFamily: "var(--font-mono, monospace)",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

const buttonStyle: React.CSSProperties = {
  padding: "4px 10px",
  fontSize: 11,
  fontWeight: 600,
  borderRadius: 4,
  border: "1px solid var(--color-border, #636e72)",
  cursor: "pointer",
  backgroundColor: "var(--color-surface, #2d3436)",
  color: "var(--color-text, #dfe6e9)",
};

const confirmButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  backgroundColor: "var(--color-badge-gen, #00b894)",
  color: "#fff",
  border: "none",
};

const selectStyle: React.CSSProperties = {
  backgroundColor: "var(--color-input-bg, #1a1a2e)",
  color: "var(--color-input-text, #fff)",
  border: "1px solid var(--color-border, #636e72)",
  borderRadius: 4,
  padding: "4px",
  fontSize: 12,
};

const syntaxHelpButtonStyle: React.CSSProperties = {
  flexShrink: 0,
  width: 18,
  height: 18,
  borderRadius: "50%",
  border: "1px solid currentColor",
  background: "transparent",
  color: "inherit",
  fontSize: 11,
  fontWeight: 700,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  opacity: 0.6,
};

// --- Gen Popover ---

function GenPopover({
  editState,
  onConfirm,
  onCancel,
  testId,
}: {
  readonly editState: EdgeBadgeEditState & { readonly _tag: "gen" };
  readonly onConfirm: (conclusionNodeId: string, variableName: string) => void;
  readonly onCancel: () => void;
  readonly testId?: string;
}) {
  const [state, setState] = useState(editState);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleConfirm = useCallback(() => {
    if (canConfirmGenEdit(state)) {
      onConfirm(state.conclusionNodeId, state.variableName.trim());
    }
  }, [state, onConfirm]);

  return (
    <div
      data-testid={testId}
      style={popoverStyle}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div
        style={{
          marginBottom: 6,
          fontSize: 11,
          color: "var(--color-text-muted, #b2bec3)",
          fontWeight: 600,
        }}
      >
        Gen variable
      </div>
      <input
        ref={inputRef}
        type="text"
        value={state.variableName}
        onChange={(e) => {
          setState(updateGenEditVariableName(state, e.target.value));
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleConfirm();
          } else if (e.key === "Escape") {
            onCancel();
          }
        }}
        style={inputStyle}
        data-testid={
          testId
            ? `${testId satisfies string}-gen-input`
            : "edge-popover-gen-input"
        }
      />
      <div
        style={{
          display: "flex",
          gap: 4,
          marginTop: 6,
          justifyContent: "flex-end",
        }}
      >
        <button
          type="button"
          style={buttonStyle}
          onClick={onCancel}
          data-testid={
            testId ? `${testId satisfies string}-cancel` : "edge-popover-cancel"
          }
        >
          Cancel
        </button>
        <button
          type="button"
          style={confirmButtonStyle}
          onClick={handleConfirm}
          disabled={!canConfirmGenEdit(state)}
          data-testid={
            testId
              ? `${testId satisfies string}-confirm`
              : "edge-popover-confirm"
          }
        >
          Apply
        </button>
      </div>
    </div>
  );
}

// --- Substitution Popover ---

function SubstitutionPopover({
  editState,
  onConfirm,
  onCancel,
  onOpenSyntaxHelp,
  testId,
}: {
  readonly editState: EdgeBadgeEditState & { readonly _tag: "substitution" };
  readonly onConfirm: (
    conclusionNodeId: string,
    entries: SubstitutionEntries,
  ) => void;
  readonly onCancel: () => void;
  readonly onOpenSyntaxHelp?: () => void;
  readonly testId?: string;
}) {
  const [entries, setEntries] = useState<readonly SubstEditEntry[]>(() =>
    toSubstEditEntries(editState.entries, editState.premiseFormulaText),
  );

  const handleConfirm = useCallback(() => {
    if (canConfirmSubstEdit(entries)) {
      onConfirm(editState.conclusionNodeId, fromSubstEditEntries(entries));
    }
  }, [entries, editState.conclusionNodeId, onConfirm]);

  return (
    <div
      data-testid={testId}
      style={{ ...popoverStyle, minWidth: 280 }}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div
        style={{
          marginBottom: 6,
          fontSize: 11,
          color: "var(--color-text-muted, #b2bec3)",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span>Substitution entries</span>
        {onOpenSyntaxHelp !== undefined ? (
          <button
            type="button"
            style={syntaxHelpButtonStyle}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onOpenSyntaxHelp();
            }}
            title="Syntax help"
            data-testid={
              testId
                ? `${testId satisfies string}-syntax-help`
                : "edge-popover-syntax-help"
            }
          >
            ?
          </button>
        ) : null}
      </div>
      {entries.map((entry, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            gap: 4,
            marginBottom: 4,
            alignItems: "center",
          }}
        >
          <span
            style={{
              ...selectStyle,
              display: "inline-block",
              minWidth: 52,
            }}
            data-testid={
              testId
                ? `${testId satisfies string}-kind-${String(i) satisfies string}`
                : undefined
            }
          >
            {entry.kind === "formula" ? "Formula" : "Term"}
          </span>
          <span
            style={{
              ...inputStyle,
              width: 30,
              flexShrink: 0,
              display: "inline-block",
            }}
            data-testid={
              testId
                ? `${testId satisfies string}-metavar-${String(i) satisfies string}`
                : undefined
            }
          >
            {entry.metaVar}
          </span>
          <span
            style={{
              color: "var(--color-text-muted, #b2bec3)",
              fontSize: 12,
              flexShrink: 0,
            }}
          >
            :=
          </span>
          <input
            type="text"
            value={entry.value}
            onChange={(e) => {
              setEntries(updateSubstEditEntryValue(entries, i, e.target.value));
            }}
            placeholder={entry.kind === "formula" ? "alpha -> beta" : "S(0)"}
            style={{ ...inputStyle, flex: 1 }}
            autoFocus={i === 0}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                onCancel();
              }
            }}
            data-testid={
              testId
                ? `${testId satisfies string}-value-${String(i) satisfies string}`
                : undefined
            }
          />
        </div>
      ))}
      <div
        style={{
          display: "flex",
          gap: 4,
          marginTop: 6,
          justifyContent: "flex-end",
        }}
      >
        <button
          type="button"
          style={buttonStyle}
          onClick={onCancel}
          data-testid={
            testId ? `${testId satisfies string}-cancel` : "edge-popover-cancel"
          }
        >
          Cancel
        </button>
        <button
          type="button"
          style={{
            ...confirmButtonStyle,
            backgroundColor: "var(--color-badge-subst, #e17055)",
          }}
          onClick={handleConfirm}
          disabled={!canConfirmSubstEdit(entries)}
          data-testid={
            testId
              ? `${testId satisfies string}-confirm`
              : "edge-popover-confirm"
          }
        >
          Apply
        </button>
      </div>
    </div>
  );
}

// --- Main Component ---

/**
 * エッジパラメータ編集ポップオーバー。
 * GenまたはSubstitutionの編集UIを表示する。
 */
export function EdgeParameterPopover({
  editState,
  onConfirmGen,
  onConfirmSubstitution,
  onCancel,
  onOpenSyntaxHelp,
  testId,
}: EdgeParameterPopoverProps) {
  switch (editState._tag) {
    case "gen":
      return (
        <GenPopover
          editState={editState}
          onConfirm={onConfirmGen ?? (() => {})}
          onCancel={onCancel}
          testId={testId}
        />
      );
    case "substitution":
      return (
        <SubstitutionPopover
          editState={editState}
          onConfirm={onConfirmSubstitution ?? (() => {})}
          onCancel={onCancel}
          onOpenSyntaxHelp={onOpenSyntaxHelp}
          testId={testId}
        />
      );
  }
}
