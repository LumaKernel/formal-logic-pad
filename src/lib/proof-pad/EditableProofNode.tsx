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
import type { Formula } from "../logic-core/formula";
import type { EditTrigger, EditorMode } from "../formula-input/editorLogic";
import { FormulaDisplay } from "../formula-input/FormulaDisplay";
import { FormulaEditor } from "../formula-input/FormulaEditor";
import { computeParseState } from "../formula-input/FormulaInput";
import type { ProofNodeKind } from "./proofNodeUI";
import { getProofNodeStyle } from "./proofNodeUI";
import type { NodeRole, NodeClassification } from "./nodeRoleLogic";
import type { DetailLevel, DetailVisibilityOverrides } from "./levelOfDetail";
import { getDetailVisibility } from "./levelOfDetail";

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
  /** ステータスメッセージの種類（エラー/成功） */
  readonly statusType?: "error" | "success";
  /** ノードの分類（nodeRoleLogicで計算） */
  readonly classification?: NodeClassification;
  /** ノードの役割変更時のコールバック */
  readonly onRoleChange?: (id: string, role: NodeRole | undefined) => void;
  /** ノードが保護されているか（クエストモードのゴールノードなど） */
  readonly isProtected?: boolean;
  /** 自動判別された公理名（例: "A1 (K)"）。undefined = 公理でない or 判別不能 */
  readonly axiomName?: string;
  /** 依存する公理ノードのリスト（導出ノードのみ表示） */
  readonly dependencies?: readonly DependencyInfo[];
  /** 表示詳細度（ズームレベルに応じた簡略表示、デフォルト: "full"） */
  readonly detailLevel?: DetailLevel;
  /** ユーザー設定による表示オーバーライド（DetailLevelの自動判定を上書き） */
  readonly visibilityOverrides?: DetailVisibilityOverrides;
  /** 編集モードに入るトリガー（デフォルト: "click"） */
  readonly editTrigger?: EditTrigger;
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

function getRoleBadgeStyle(classification: NodeClassification): CSSProperties {
  switch (classification) {
    case "root-axiom":
      return {
        ...roleBadgeBaseStyle,
        background: "var(--color-badge-bg, #e8eaf0)",
        color: "var(--color-badge-text, #718096)",
      };
    case "root-goal":
      return {
        ...roleBadgeBaseStyle,
        background: "var(--color-warning-bg, rgba(255,215,0,0.3))",
        color: "var(--color-warning, #d9944a)",
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
  }
}

function getRoleBadgeLabel(classification: NodeClassification): string {
  switch (classification) {
    case "root-axiom":
      return "AXIOM";
    case "root-goal":
      return "GOAL";
    case "root-unmarked":
      return "ROOT";
    case "derived":
      return "DERIVED";
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
  onRoleChange,
  isProtected = false,
  axiomName,
  dependencies,
  detailLevel = "full",
  visibilityOverrides,
  editTrigger,
  testId,
}: EditableProofNodeProps) {
  const nodeStyle = useMemo(() => getProofNodeStyle(kind), [kind]);
  const visibility = useMemo(
    () => getDetailVisibility(detailLevel, visibilityOverrides),
    [detailLevel, visibilityOverrides],
  );
  const [isHovered, setIsHovered] = useState(false);

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

  /** 役割バッジクリック時: axiom → goal → unmarked → axiom のサイクル */
  const handleRoleBadgeClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      /* v8 ignore start -- 防御コード: isProtected時はonClickがundefinedなので到達不能 */
      if (isProtected) return;
      /* v8 ignore stop */
      if (!onRoleChange || !classification) return;
      /* v8 ignore start -- 防御コード: onClick自体がderivedでundefinedなので到達不能 */
      if (classification === "derived") return;
      /* v8 ignore stop */

      switch (classification) {
        case "root-unmarked":
          onRoleChange(id, "axiom");
          break;
        case "root-axiom":
          onRoleChange(id, "goal");
          break;
        case "root-goal":
          onRoleChange(id, undefined);
          break;
      }
    },
    [id, classification, onRoleChange, isProtected],
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
          <div
            style={axiomNameBadgeStyle}
            title={`Identified as axiom: ${axiomName satisfies string}`}
            data-testid={
              testId ? `${testId satisfies string}-axiom-name` : undefined
            }
          >
            {axiomName}
          </div>
        ) : null}
        {visibility.showProtectedBadge && isProtected ? (
          <div
            style={protectedBadgeStyle}
            title="Protected quest goal (read-only)"
            data-testid={
              testId ? `${testId satisfies string}-protected-badge` : undefined
            }
          >
            QUEST
          </div>
        ) : null}
        {visibility.showRoleBadge && classification ? (
          <div
            style={getRoleBadgeStyle(classification)}
            onClick={
              classification !== "derived" && !isProtected
                ? handleRoleBadgeClick
                : undefined
            }
            title={
              isProtected
                ? "Protected quest goal (role is locked)"
                : classification !== "derived"
                  ? "Click to cycle role: Root → Axiom → Goal"
                  : "Derived node (role is automatic)"
            }
            data-testid={
              testId ? `${testId satisfies string}-role-badge` : undefined
            }
          >
            {getRoleBadgeLabel(classification)}
          </div>
        ) : null}
      </div>
      {visibility.showFormula ? (
        effectiveEditable ? (
          <FormulaEditor
            value={formulaText}
            onChange={handleFormulaChange}
            onParsed={handleFormulaParsed}
            onModeChange={handleModeChange}
            displayRenderer="unicode"
            placeholder="Click to edit formula..."
            editTrigger={editTrigger}
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
      {visibility.showStatus && statusMessage ? (
        <div
          style={statusType === "error" ? statusErrorStyle : statusSuccessStyle}
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
          data-testid={
            testId ? `${testId satisfies string}-dependencies` : undefined
          }
        >
          <div style={dependencyLabelStyle}>Depends on:</div>
          <div>
            {dependencies.map((dep) => (
              <span key={dep.nodeId} style={dependencyItemStyle}>
                {dep.displayName}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
