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
import { FormulaEditor } from "../formula-input/FormulaEditor";
import { TermEditor } from "../formula-input/TermEditor";
import { useProofMessages } from "./ProofMessagesContext";
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

const popoverClassName =
  "absolute z-[1000] bg-[var(--color-surface,#2d3436)] border border-solid border-[var(--color-border,#636e72)] rounded-lg p-2 shadow-[0_4px_12px_rgba(0,0,0,0.3)] min-w-[200px]";

const inputClassName =
  "bg-[var(--color-input-bg,#1a1a2e)] text-[var(--color-input-text,#fff)] border border-solid border-[var(--color-border,#636e72)] rounded-[4px] px-2 py-1 text-xs font-[var(--font-mono,monospace)] outline-none w-full box-border";

const buttonClassName =
  "px-2.5 py-1 text-[11px] font-semibold rounded-[4px] border border-solid border-[var(--color-border,#636e72)] cursor-pointer bg-[var(--color-surface,#2d3436)] text-[var(--color-text,#dfe6e9)]";

const confirmButtonClassName =
  `${buttonClassName satisfies string} bg-[var(--color-badge-gen,#00b894)] text-white border-none` satisfies string;

const substConfirmButtonClassName =
  `${buttonClassName satisfies string} bg-[var(--color-badge-subst,#e17055)] text-white border-none` satisfies string;

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
    /* v8 ignore start -- 防御的: ボタンがdisabledなので空文字列では呼ばれない */
    if (!canConfirmGenEdit(state)) return;
    /* v8 ignore stop */
    onConfirm(state.conclusionNodeId, state.variableName.trim());
  }, [state, onConfirm]);

  return (
    <div
      data-testid={testId}
      className={popoverClassName}
      /* v8 ignore start -- stopPropagation: ポップオーバー内クリックがキャンバスに伝播するのを防止 */
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      /* v8 ignore stop */
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
        className={inputClassName}
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
          className={buttonClassName}
          onClick={onCancel}
          data-testid={
            testId ? `${testId satisfies string}-cancel` : "edge-popover-cancel"
          }
        >
          Cancel
        </button>
        <button
          type="button"
          className={confirmButtonClassName}
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
  const msg = useProofMessages();
  const [entries, setEntries] = useState<readonly SubstEditEntry[]>(() =>
    toSubstEditEntries(editState.entries, editState.premiseFormulaText),
  );

  const handleConfirm = useCallback(() => {
    /* v8 ignore start -- 防御的: ボタンがdisabledなので無効エントリでは呼ばれない */
    if (!canConfirmSubstEdit(entries)) return;
    /* v8 ignore stop */
    onConfirm(editState.conclusionNodeId, fromSubstEditEntries(entries));
  }, [entries, editState.conclusionNodeId, onConfirm]);

  return (
    <div
      data-testid={testId}
      className={`${popoverClassName satisfies string} min-w-[280px]` satisfies string}
      /* v8 ignore start -- stopPropagation/Escapeキー: ポップオーバーUIイベント */
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          onCancel();
        }
      }}
      /* v8 ignore stop */
    >
      <div
        style={{
          marginBottom: 6,
          fontSize: 11,
          color: "var(--color-text-muted, #b2bec3)",
          fontWeight: 600,
        }}
      >
        {msg.substEntryPrompt}
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
              display: "inline-block",
              minWidth: 52,
              padding: "4px 0",
              fontSize: 11,
              color: "var(--color-text-muted, #b2bec3)",
              flexShrink: 0,
            }}
            data-testid={
              testId
                ? `${testId satisfies string}-kind-${String(i) satisfies string}`
                : undefined
            }
          >
            {entry.kind === "formula"
              ? msg.substitutionKindFormula
              : msg.substitutionKindTerm}
          </span>
          <span
            style={{
              width: 30,
              flexShrink: 0,
              display: "inline-block",
              padding: "4px 0",
              fontSize: 12,
              fontFamily: "var(--font-mono, monospace)",
              fontWeight: 600,
              color: "var(--color-input-text, #fff)",
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
          {entry.kind === "formula" ? (
            <FormulaEditor
              value={entry.value}
              onChange={(value) => {
                setEntries(updateSubstEditEntryValue(entries, i, value));
              }}
              placeholder="alpha -> beta"
              fontSize={12}
              style={{ flex: 1, minWidth: 0 }}
              onOpenSyntaxHelp={onOpenSyntaxHelp}
              editTrigger="none"
              forceEditMode={true}
              /* v8 ignore start -- testId分岐: テスト用属性の有無 */
              testId={
                testId
                  ? `${testId satisfies string}-value-${String(i) satisfies string}`
                  : undefined
              }
              /* v8 ignore stop */
            />
          ) : (
            <TermEditor
              value={entry.value}
              onChange={(value) => {
                setEntries(updateSubstEditEntryValue(entries, i, value));
              }}
              placeholder="S(0)"
              fontSize={12}
              style={{ flex: 1, minWidth: 0 }}
              onOpenSyntaxHelp={onOpenSyntaxHelp}
              editTrigger="none"
              forceEditMode={true}
              /* v8 ignore start -- testId分岐: テスト用属性の有無 */
              testId={
                testId
                  ? `${testId satisfies string}-value-${String(i) satisfies string}`
                  : undefined
              }
              /* v8 ignore stop */
            />
          )}
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
          className={buttonClassName}
          onClick={onCancel}
          data-testid={
            testId ? `${testId satisfies string}-cancel` : "edge-popover-cancel"
          }
        >
          Cancel
        </button>
        <button
          type="button"
          className={substConfirmButtonClassName}
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
          onConfirm={
            /* v8 ignore start -- 防御的: 呼び出し元が必ず提供 */ onConfirmGen ??
            (() => {}) /* v8 ignore stop */
          }
          onCancel={onCancel}
          testId={testId}
        />
      );
    case "substitution":
      return (
        <SubstitutionPopover
          editState={editState}
          onConfirm={
            /* v8 ignore start -- 防御的: 呼び出し元が必ず提供 */ onConfirmSubstitution ??
            (() => {}) /* v8 ignore stop */
          }
          onCancel={onCancel}
          onOpenSyntaxHelp={onOpenSyntaxHelp}
          testId={testId}
        />
      );
  }
}
