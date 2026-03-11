/**
 * 編集可能な証明ノードコンポーネント。
 *
 * FormulaEditor を使って、公理ノードなどの論理式を編集可能にする。
 * ノード種別に応じた色分け・ラベル・ポートを表示する。
 *
 * 変更時は EditableProofNode.test.tsx, EditableProofNode.stories.tsx, proofNodeUI.ts, index.ts も同期すること。
 */

import type { CSSProperties } from "react";
import { useCallback, useMemo, useState } from "react";
import { Either } from "effect";
import type { Formula } from "../logic-core/formula";
import type { EditTrigger, EditorMode } from "../formula-input/editorLogic";
import { FormulaDisplay } from "../formula-input/FormulaDisplay";
import { TermDisplay } from "../formula-input/TermDisplay";
import { FormulaEditor } from "../formula-input/FormulaEditor";
import { computeParseState } from "../formula-input/FormulaInput";
import {
  parseString as parseFormula,
  parseTermString,
} from "../logic-lang/parser";
import type { ProofNodeKind } from "./proofNodeUI";
import { getProofNodeStyle, getNodeClassificationStyle } from "./proofNodeUI";
import type { NodeClassification } from "./nodeRoleLogic";
import type { DetailLevel, DetailVisibilityOverrides } from "./levelOfDetail";
import { getDetailVisibility } from "./levelOfDetail";
import type {
  SubstitutionEntries,
  SubstitutionEntry,
} from "./substitutionApplicationLogic";
import { useProofMessages } from "./ProofMessagesContext";
import type { ProofMessages } from "./proofMessages";
import { formatMessage } from "./proofMessages";

// --- Props ---

/** 依存する公理ノードの情報 */
export interface DependencyInfo {
  /** 公理ノードのID */
  readonly nodeId: string;
  /** 公理の表示名（自動判別された名前 or ラベル） */
  readonly displayName: string;
}

export interface EditableProofNodeProps {
  /** ノードの一意識別子 */
  readonly id: string;
  /** ノードの種類 */
  readonly kind: ProofNodeKind;
  /** ノードのラベル（例: "A1", "A2", "MP"） */
  readonly label: string;
  /** 論理式のテキスト（DSL形式） */
  readonly formulaText: string;
  /** テキスト変更時のコールバック */
  readonly onFormulaTextChange: (id: string, text: string) => void;
  /** パース成功時にFormula ASTを通知するコールバック */
  readonly onFormulaParsed?: (id: string, formula: Formula) => void;
  /** 編集モード変更時のコールバック */
  readonly onModeChange?: (id: string, mode: EditorMode) => void;
  /** 編集を許可するか（デフォルト: true） */
  readonly editable?: boolean;
  /** ノード下部に表示するステータスメッセージ */
  readonly statusMessage?: string;
  /** ステータスメッセージの種類（エラー/警告/成功） */
  readonly statusType?: "error" | "warning" | "success";
  /** ノードの分類（nodeRoleLogicで計算） */
  readonly classification?: NodeClassification;
  /** ノードが保護されているか（クエストモードのゴールノードなど） */
  readonly isProtected?: boolean;
  /** 自動判別された公理名（例: "A1 (K)"）。undefined = 公理でない or 判別不能 */
  readonly axiomName?: string;
  /** 公理名バッジクリック時のコールバック。指定時はバッジがボタンになる */
  readonly onClickAxiomBadge?: () => void;
  /** 依存する公理ノードのリスト（導出ノードのみ表示） */
  readonly dependencies?: readonly DependencyInfo[];
  /** 表示詳細度（ズームレベルに応じた簡略表示、デフォルト: "full"） */
  readonly detailLevel?: DetailLevel;
  /** ユーザー設定による表示オーバーライド（DetailLevelの自動判定を上書き） */
  readonly visibilityOverrides?: DetailVisibilityOverrides;
  /** 編集モードに入るトリガー（デフォルト: "click"） */
  readonly editTrigger?: EditTrigger;
  /** 構文ヘルプを開くコールバック（指定時にFormulaEditor編集モードで?ボタンを表示） */
  readonly onOpenSyntaxHelp?: () => void;
  /** 拡大編集を開くコールバック（指定時にFormulaEditor編集モードで拡大ボタンを表示） */
  readonly onOpenExpanded?: (id: string) => void;
  /** 代入ノードの代入エントリ一覧（表示用） */
  readonly substitutionEntries?: SubstitutionEntries;
  /** 外部から編集モードを強制的に開始するフラグ */
  readonly forceEditMode?: boolean;
  /** ノートノードの編集開始コールバック（kind="note"のダブルクリック時） */
  readonly onEditNote?: (id: string) => void;
  /** data-testid */
  readonly testId?: string;
}

// --- スタイル ---

const labelStyle: CSSProperties = {
  fontSize: 10,
  fontFamily: "var(--font-ui)",
  fontWeight: 700,
  opacity: 0.8,
  marginBottom: 2,
  letterSpacing: 1,
  textTransform: "uppercase",
};

const formulaContainerReadonlyStyle: CSSProperties = {
  fontFamily: "var(--font-formula)",
  fontStyle: "italic",
  whiteSpace: "nowrap",
  fontSize: 13,
};

const noteTextStyle: CSSProperties = {
  fontFamily: "var(--font-ui)",
  fontStyle: "normal",
  fontSize: 12,
  lineHeight: 1.5,
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  textAlign: "left",
  maxWidth: 240,
  cursor: "pointer",
};

const noteEmptyStyle: CSSProperties = {
  ...noteTextStyle,
  opacity: 0.5,
  fontStyle: "italic",
};

const statusErrorStyle: CSSProperties = {
  fontSize: 10,
  fontFamily: "var(--font-ui)",
  fontStyle: "normal",
  marginTop: 4,
  padding: "2px 6px",
  background: "var(--color-error-bg, rgba(255,60,60,0.25))",
  borderRadius: 4,
  color: "var(--color-error, #e06060)",
};

const statusWarningStyle: CSSProperties = {
  fontSize: 10,
  fontFamily: "var(--font-ui)",
  fontStyle: "normal",
  marginTop: 4,
  padding: "2px 6px",
  background: "var(--color-warning-bg, rgba(255,215,0,0.3))",
  borderRadius: 4,
  color: "var(--color-warning, #d9944a)",
};

const statusSuccessStyle: CSSProperties = {
  fontSize: 10,
  fontFamily: "var(--font-ui)",
  fontStyle: "normal",
  marginTop: 4,
  padding: "2px 6px",
  background: "var(--color-success-bg, rgba(60,255,60,0.25))",
  borderRadius: 4,
  color: "var(--color-success, #2ecc71)",
};

const roleBadgeBaseStyle: CSSProperties = {
  fontSize: 9,
  fontFamily: "var(--font-ui)",
  fontWeight: 600,
  padding: "1px 6px",
  borderRadius: 3,
  cursor: "pointer",
  userSelect: "none",
  letterSpacing: 0.5,
};

const headerRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  marginBottom: 2,
};

const protectedBadgeStyle: CSSProperties = {
  fontSize: 9,
  fontFamily: "var(--font-ui)",
  fontWeight: 600,
  padding: "1px 6px",
  borderRadius: 3,
  userSelect: "none",
  letterSpacing: 0.5,
  background: "var(--color-warning-bg, rgba(255,215,0,0.3))",
  color: "var(--color-warning, #d9944a)",
  border: "1px solid var(--color-warning-border, rgba(255,215,0,0.5))",
};

const axiomNameBadgeStyle: CSSProperties = {
  fontSize: 9,
  fontFamily: "var(--font-ui)",
  fontWeight: 600,
  padding: "1px 6px",
  borderRadius: 3,
  userSelect: "none",
  letterSpacing: 0.5,
  background: "var(--color-badge-bg, #e8eaf0)",
  color: "var(--color-badge-text, #718096)",
  border: "1px solid var(--color-node-card-border, rgba(0,0,0,0.08))",
};

const axiomNameBadgeClickableStyle: CSSProperties = {
  ...axiomNameBadgeStyle,
  cursor: "pointer",
  textDecoration: "underline",
  textDecorationStyle: "dotted",
  textUnderlineOffset: 2,
  fontFamily: "inherit",
};

const dependencyContainerStyle: CSSProperties = {
  fontSize: 9,
  fontFamily: "var(--font-ui)",
  fontStyle: "normal",
  marginTop: 4,
  padding: "3px 6px",
  background: "var(--color-badge-bg, #e8eaf0)",
  borderRadius: 4,
  color: "var(--color-badge-text, #718096)",
  textAlign: "left",
};

const dependencyLabelStyle: CSSProperties = {
  fontWeight: 600,
  marginBottom: 2,
  letterSpacing: 0.5,
  opacity: 0.7,
};

const dependencyItemStyle: CSSProperties = {
  display: "inline-block",
  padding: "1px 4px",
  margin: "1px 2px",
  background: "var(--color-node-card-border, rgba(0,0,0,0.08))",
  borderRadius: 3,
  fontSize: 9,
};

const substEntriesContainerStyle: CSSProperties = {
  fontSize: 10,
  fontFamily: "var(--font-formula)",
  fontStyle: "italic",
  marginTop: 4,
  padding: "3px 6px",
  background: "var(--color-badge-bg, #e8eaf0)",
  borderRadius: 4,
  color: "var(--color-badge-text, #718096)",
  textAlign: "left",
};

const substEntryStyle: CSSProperties = {
  padding: "1px 0",
  whiteSpace: "nowrap",
  display: "flex",
  alignItems: "baseline",
  gap: 2,
};

const substEntryValueFontSize = 10;

const substEntryFallbackStyle: CSSProperties = {
  fontFamily: "var(--font-formula)",
  fontStyle: "italic",
  fontSize: substEntryValueFontSize,
  whiteSpace: "nowrap",
};

/** 代入エントリの値部分を数式レンダリングするコンポーネント */
function SubstitutionEntryValue({
  entry,
}: {
  readonly entry: SubstitutionEntry;
}) {
  if (entry._tag === "FormulaSubstitution") {
    const parsed = parseFormula(entry.formulaText);
    if (Either.isRight(parsed)) {
      return (
        <FormulaDisplay
          formula={parsed.right}
          fontSize={substEntryValueFontSize}
        />
      );
    }
    return <span style={substEntryFallbackStyle}>{entry.formulaText}</span>;
  }
  const parsed = parseTermString(entry.termText);
  if (Either.isRight(parsed)) {
    return (
      <TermDisplay term={parsed.right} fontSize={substEntryValueFontSize} />
    );
  }
  return <span style={substEntryFallbackStyle}>{entry.termText}</span>;
}

/** メタ変数名（添字含む）を数式フォントで表示する */
function MetaVariableLabel({ entry }: { readonly entry: SubstitutionEntry }) {
  const subscriptPart = entry.metaVariableSubscript
    ? `_${entry.metaVariableSubscript satisfies string}`
    : "";
  return (
    <span
      style={{
        fontFamily: "var(--font-formula)",
        fontStyle: "italic",
      }}
      role="math"
      aria-label={`${entry.metaVariableName satisfies string}${subscriptPart satisfies string}`}
    >
      {entry.metaVariableName}
      {subscriptPart}
    </span>
  );
}

function getRoleBadgeStyle(classification: NodeClassification): CSSProperties {
  switch (classification) {
    case "root-axiom":
      return {
        ...roleBadgeBaseStyle,
        background: "var(--color-badge-bg, #e8eaf0)",
        color: "var(--color-badge-text, #718096)",
      };
    case "root-unmarked":
      return {
        ...roleBadgeBaseStyle,
        background: "transparent",
        color: "var(--color-badge-text, #718096)",
        border: "1px dashed var(--color-node-card-border, rgba(0,0,0,0.08))",
      };
    case "derived":
      return {
        ...roleBadgeBaseStyle,
        background: "var(--color-badge-bg, #e8eaf0)",
        color: "var(--color-badge-text, #718096)",
      };
    case "note":
      return {
        ...roleBadgeBaseStyle,
        background: "var(--color-badge-bg, #e8eaf0)",
        color: "var(--color-badge-text, #718096)",
      };
  }
}

function getRoleBadgeLabel(
  classification: NodeClassification,
  msg: ProofMessages,
): string {
  switch (classification) {
    case "root-axiom":
      return msg.roleAxiom;
    case "root-unmarked":
      return msg.roleRoot;
    case "derived":
      return msg.roleDerived;
    case "note":
      return "Note";
  }
}

function getStatusStyle(type: "error" | "warning" | "success"): CSSProperties {
  switch (type) {
    case "error":
      return statusErrorStyle;
    case "warning":
      return statusWarningStyle;
    case "success":
      return statusSuccessStyle;
  }
}

// --- コンポーネント ---

export function EditableProofNode({
  id,
  kind,
  label,
  formulaText,
  onFormulaTextChange,
  onFormulaParsed,
  onModeChange,
  editable = true,
  statusMessage,
  statusType,
  classification,
  isProtected = false,
  axiomName,
  onClickAxiomBadge,
  dependencies,
  detailLevel = "full",
  visibilityOverrides,
  editTrigger,
  onOpenSyntaxHelp,
  onOpenExpanded,
  substitutionEntries,
  forceEditMode,
  onEditNote,
  testId,
}: EditableProofNodeProps) {
  const nodeStyle = useMemo(
    () =>
      classification
        ? getNodeClassificationStyle(classification)
        : getProofNodeStyle(kind),
    [kind, classification],
  );
  const visibility = useMemo(
    () => getDetailVisibility(detailLevel, visibilityOverrides),
    [detailLevel, visibilityOverrides],
  );
  const [isHovered, setIsHovered] = useState(false);
  const msg = useProofMessages();

  const containerStyle: CSSProperties = useMemo(
    () => ({
      padding: "8px 12px 8px 16px",
      background: nodeStyle.backgroundColor,
      color: nodeStyle.textColor,
      borderRadius: nodeStyle.borderRadius,
      fontFamily: "var(--font-formula)",
      fontSize: 13,
      boxShadow: isHovered ? nodeStyle.boxShadowHover : nodeStyle.boxShadow,
      minWidth: 80,
      textAlign: "center" as const,
      border: nodeStyle.border,
      borderLeft: `4px solid ${nodeStyle.stripeColor satisfies string}`,
      transition: "box-shadow 0.15s ease, transform 0.15s ease",
      transform: isHovered ? "translateY(-1px)" : "none",
    }),
    [nodeStyle, isHovered],
  );

  const handleFormulaChange = useCallback(
    (text: string) => {
      onFormulaTextChange(id, text);
    },
    [id, onFormulaTextChange],
  );

  const handleFormulaParsed = useCallback(
    (formula: Formula) => {
      onFormulaParsed?.(id, formula);
    },
    [id, onFormulaParsed],
  );

  const handleModeChange = useCallback(
    (mode: EditorMode) => {
      onModeChange?.(id, mode);
    },
    [id, onModeChange],
  );

  const handleOpenExpanded = useMemo(
    () =>
      /* v8 ignore start -- both branches tested via Storybook; v8 ternary artifact */
      onOpenExpanded !== undefined ? () => onOpenExpanded(id) : undefined,
    /* v8 ignore stop */
    [id, onOpenExpanded],
  );

  /** 保護ノードかつ編集可能ノードの場合、編集を抑制する */
  const effectiveEditable = editable && !isProtected;

  /** read-only表示用: formulaTextをパースしてFormula ASTを取得 */
  const readonlyFormula: Formula | null = useMemo(() => {
    if (effectiveEditable) return null;
    const parsed = computeParseState(formulaText);
    return parsed.status === "success" ? parsed.formula : null;
  }, [effectiveEditable, formulaText]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);
  const handleNoteDoubleClick = useCallback(() => {
    onEditNote?.(id);
  }, [id, onEditNote]);

  return (
    <div
      data-testid={testId}
      style={containerStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        style={
          (visibility.showRoleBadge && classification) ||
          (visibility.showProtectedBadge && isProtected) ||
          (visibility.showAxiomName && axiomName)
            ? headerRowStyle
            : undefined
        }
      >
        <div style={labelStyle}>{label}</div>
        {visibility.showAxiomName && axiomName ? (
          onClickAxiomBadge ? (
            <button
              type="button"
              style={axiomNameBadgeClickableStyle}
              title={formatMessage(msg.axiomIdentifiedTooltip, {
                axiomName,
              })}
              onClick={(e) => {
                e.stopPropagation();
                onClickAxiomBadge();
              }}
              /* v8 ignore start -- testId分岐: テスト用属性の有無 */
              data-testid={
                testId ? `${testId satisfies string}-axiom-name` : undefined
              }
              /* v8 ignore stop */
            >
              {axiomName}
            </button>
          ) : (
            <span
              style={axiomNameBadgeStyle}
              title={formatMessage(msg.axiomIdentifiedTooltip, {
                axiomName,
              })}
              /* v8 ignore start -- testId分岐: テスト用属性の有無 */
              data-testid={
                testId ? `${testId satisfies string}-axiom-name` : undefined
              }
              /* v8 ignore stop */
            >
              {axiomName}
            </span>
          )
        ) : null}
        {visibility.showProtectedBadge && isProtected ? (
          <div
            style={protectedBadgeStyle}
            title={msg.protectedQuestTooltip}
            data-testid={
              testId ? `${testId satisfies string}-protected-badge` : undefined
            }
          >
            {msg.protectedBadge}
          </div>
        ) : null}
        {visibility.showRoleBadge &&
        classification &&
        classification !== "root-unmarked" ? (
          <div
            style={getRoleBadgeStyle(classification)}
            title={
              classification === "derived"
                ? msg.derivedNodeAutoTooltip
                : undefined
            }
            data-testid={
              testId ? `${testId satisfies string}-role-badge` : undefined
            }
          >
            {getRoleBadgeLabel(classification, msg)}
          </div>
        ) : null}
      </div>
      {visibility.showFormula ? (
        kind === "note" ? (
          <div
            style={formulaText.trim() ? noteTextStyle : noteEmptyStyle}
            onDoubleClick={handleNoteDoubleClick}
            data-testid={
              /* v8 ignore start -- testId always provided in tests */
              testId ? `${testId satisfies string}-note-text` : undefined
              /* v8 ignore stop */
            }
          >
            {formulaText.trim() || msg.noteEmptyPlaceholder}
          </div>
        ) : effectiveEditable ? (
          <FormulaEditor
            value={formulaText}
            onChange={handleFormulaChange}
            onParsed={handleFormulaParsed}
            onModeChange={handleModeChange}
            displayRenderer="unicode"
            placeholder={
              editTrigger === "dblclick"
                ? msg.formulaEditorPlaceholderDblclick
                : msg.formulaEditorPlaceholder
            }
            editTrigger={editTrigger}
            forceEditMode={forceEditMode}
            onOpenSyntaxHelp={onOpenSyntaxHelp}
            onOpenExpanded={handleOpenExpanded}
            testId={testId ? `${testId satisfies string}-editor` : undefined}
            style={{
              color: nodeStyle.textColor,
              minHeight: 20,
            }}
          />
        ) : (
          <div
            style={formulaContainerReadonlyStyle}
            data-testid={
              testId ? `${testId satisfies string}-formula` : undefined
            }
          >
            {readonlyFormula ? (
              <FormulaDisplay formula={readonlyFormula} fontSize={13} />
            ) : (
              formulaText
            )}
          </div>
        )
      ) : null}
      {visibility.showStatus && statusMessage && statusType ? (
        <div
          style={getStatusStyle(statusType)}
          data-testid={testId ? `${testId satisfies string}-status` : undefined}
        >
          {statusMessage}
        </div>
      ) : null}
      {visibility.showDependencies &&
      dependencies &&
      dependencies.length > 0 ? (
        <div
          style={dependencyContainerStyle}
          /* v8 ignore start -- testId分岐: テスト用属性の有無 */
          data-testid={
            testId ? `${testId satisfies string}-dependencies` : undefined
          }
          /* v8 ignore stop */
        >
          <div style={dependencyLabelStyle}>{msg.dependsOn}</div>
          <div>
            {dependencies.map((dep) => (
              <span key={dep.nodeId} style={dependencyItemStyle}>
                {dep.displayName}
              </span>
            ))}
          </div>
        </div>
      ) : null}
      {visibility.showFormula &&
      substitutionEntries &&
      substitutionEntries.length > 0 ? (
        <div
          style={substEntriesContainerStyle}
          /* v8 ignore start -- testId分岐: テスト用属性の有無 */
          data-testid={
            testId ? `${testId satisfies string}-subst-entries` : undefined
          }
          /* v8 ignore stop */
        >
          {substitutionEntries.map((entry, i) => (
            <div key={i} style={substEntryStyle}>
              <MetaVariableLabel entry={entry} />
              <span>{" := "}</span>
              <SubstitutionEntryValue entry={entry} />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
