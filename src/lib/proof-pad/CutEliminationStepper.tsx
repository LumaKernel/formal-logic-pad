/**
 * カット除去ステッパーコンポーネント。
 *
 * シーケント計算のワークスペースで、カット除去の各ステップを
 * 前進/後退しながら確認するパネル。
 *
 * 変更時は CutEliminationStepper.test.tsx, ProofWorkspace.tsx, index.ts も同期すること。
 */

import { type CSSProperties, useCallback } from "react";
import type { CutEliminationStepperData } from "./cutEliminationStepperLogic";
import {
  applyStepperAction,
  canStepForward,
  canStepBackward,
} from "./cutEliminationStepperLogic";
import type { ProofMessages } from "./proofMessages";
import { formatMessage } from "./proofMessages";

// --- Props ---

export interface CutEliminationStepperProps {
  /** ステッパーデータ */
  readonly data: CutEliminationStepperData;
  /** ステップ変更コールバック */
  readonly onStepChange: (stepIndex: number) => void;
  /** メッセージ（i18n） */
  readonly messages: ProofMessages;
  /** data-testid */
  readonly testId?: string;
}

// --- スタイル ---

const panelStyle: CSSProperties = {
  position: "absolute",
  bottom: 12,
  left: 12,
  zIndex: 10,
  background: "var(--color-panel-bg, rgba(252, 249, 243, 0.96))",
  borderRadius: 8,
  border: "1px solid var(--color-panel-border, rgba(180, 160, 130, 0.2))",
  boxShadow: "0 2px 12px var(--color-panel-shadow, rgba(120, 100, 70, 0.1))",
  padding: "8px 12px",
  fontFamily: "var(--font-ui)",
  fontSize: 12,
  minWidth: 240,
  maxWidth: 360,
  pointerEvents: "auto" as const,
};

const headerStyle: CSSProperties = {
  fontWeight: 700,
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: 1,
  color: "var(--color-text-secondary, #666)",
  marginBottom: 6,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const controlsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 4,
  marginBottom: 6,
};

const buttonStyle: CSSProperties = {
  padding: "2px 8px",
  fontSize: 12,
  borderRadius: 4,
  border: "1px solid var(--color-panel-border, rgba(180, 160, 130, 0.3))",
  background: "var(--color-panel-bg, rgba(252, 249, 243, 0.96))",
  cursor: "pointer",
  color: "var(--color-text-primary, #333)",
  fontFamily: "var(--font-ui)",
};

const disabledButtonStyle: CSSProperties = {
  ...buttonStyle,
  opacity: 0.4,
  cursor: "default",
};

const infoRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  fontSize: 11,
  color: "var(--color-text-secondary, #666)",
  marginBottom: 4,
};

const descriptionStyle: CSSProperties = {
  fontSize: 11,
  color: "var(--color-text-primary, #333)",
  padding: "4px 0",
  borderTop:
    "1px solid var(--color-panel-rule-line, rgba(180, 160, 130, 0.15))",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const conclusionStyle: CSSProperties = {
  fontSize: 11,
  fontFamily: "var(--font-formula)",
  fontStyle: "italic",
  color: "var(--color-text-secondary, #666)",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const successStyle: CSSProperties = {
  color: "var(--color-proof-complete-text, #2d6a3f)",
  fontWeight: 700,
  fontSize: 10,
};

const failureStyle: CSSProperties = {
  color: "var(--color-error, #c53030)",
  fontWeight: 700,
  fontSize: 10,
};

const stepLimitStyle: CSSProperties = {
  color: "var(--color-warning, #c57600)",
  fontWeight: 700,
  fontSize: 10,
};

const cutFreeStyle: CSSProperties = {
  color: "var(--color-proof-complete-text, #2d6a3f)",
  fontWeight: 600,
  fontSize: 10,
};

// --- コンポーネント ---

export function CutEliminationStepper({
  data,
  onStepChange,
  messages,
  testId,
}: CutEliminationStepperProps) {
  const { currentStepIndex, totalSteps, initialInfo, steps, result } = data;

  const forward = canStepForward(currentStepIndex, totalSteps);
  const backward = canStepBackward(currentStepIndex);

  const handleFirst = useCallback(() => {
    onStepChange(
      applyStepperAction(currentStepIndex, totalSteps, { type: "first" }),
    );
  }, [onStepChange, currentStepIndex, totalSteps]);

  const handlePrev = useCallback(() => {
    onStepChange(
      applyStepperAction(currentStepIndex, totalSteps, { type: "prev" }),
    );
  }, [onStepChange, currentStepIndex, totalSteps]);

  const handleNext = useCallback(() => {
    onStepChange(
      applyStepperAction(currentStepIndex, totalSteps, { type: "next" }),
    );
  }, [onStepChange, currentStepIndex, totalSteps]);

  const handleLast = useCallback(() => {
    onStepChange(
      applyStepperAction(currentStepIndex, totalSteps, { type: "last" }),
    );
  }, [onStepChange, currentStepIndex, totalSteps]);

  // カットフリーな証明の場合はコンパクト表示
  if (initialInfo.isCutFree) {
    return (
      <div style={panelStyle} data-testid={testId}>
        <div style={headerStyle}>
          <span>{messages.cutEliminationTitle}</span>
          <span style={cutFreeStyle}>{messages.cutEliminationCutFree}</span>
        </div>
        <div style={conclusionStyle}>{initialInfo.conclusionText}</div>
        <div style={{ ...infoRowStyle, marginBottom: 0 }}>
          <span>{messages.cutEliminationNoCuts}</span>
        </div>
      </div>
    );
  }

  // 現在のステップ情報
  const currentStep =
    currentStepIndex >= 0 ? steps[currentStepIndex] : undefined;

  // 進捗テキスト
  const progressText =
    currentStepIndex === -1
      ? messages.cutEliminationInitialState
      : formatMessage(messages.cutEliminationStepProgress, {
          current: String(currentStepIndex + 1),
          total: String(totalSteps),
        });

  // カット数テキスト
  const cutCountText =
    data.currentCutCount === 0
      ? messages.cutEliminationCutFree
      : formatMessage(messages.cutEliminationCuts, {
          cutCount: String(data.currentCutCount),
        });

  // 結果ステータス（最後のステップにいるとき表示）
  const isAtEnd = currentStepIndex === totalSteps - 1;

  return (
    <div
      style={panelStyle}
      data-testid={testId}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <div style={headerStyle}>
        <span>{messages.cutEliminationTitle}</span>
        <span>{cutCountText}</span>
      </div>

      {/* コントロール */}
      <div style={controlsStyle}>
        <button
          type="button"
          style={backward ? buttonStyle : disabledButtonStyle}
          disabled={!backward}
          onClick={handleFirst}
          data-testid={
            testId !== undefined
              ? `${testId satisfies string}-first`
              : undefined
          }
        >
          ⏮
        </button>
        <button
          type="button"
          style={backward ? buttonStyle : disabledButtonStyle}
          disabled={!backward}
          onClick={handlePrev}
          data-testid={
            testId !== undefined ? `${testId satisfies string}-prev` : undefined
          }
        >
          ◀
        </button>
        <span
          style={{ flex: 1, textAlign: "center", fontSize: 11 }}
          data-testid={
            testId !== undefined
              ? `${testId satisfies string}-progress`
              : undefined
          }
        >
          {progressText}
        </span>
        <button
          type="button"
          style={forward ? buttonStyle : disabledButtonStyle}
          disabled={!forward}
          onClick={handleNext}
          data-testid={
            testId !== undefined ? `${testId satisfies string}-next` : undefined
          }
        >
          ▶
        </button>
        <button
          type="button"
          style={forward ? buttonStyle : disabledButtonStyle}
          disabled={!forward}
          onClick={handleLast}
          data-testid={
            testId !== undefined ? `${testId satisfies string}-last` : undefined
          }
        >
          ⏭
        </button>
      </div>

      {/* ステップ情報 */}
      {currentStep !== undefined ? (
        <>
          <div style={infoRowStyle}>
            <span>
              {formatMessage(messages.cutEliminationStepInfo, {
                depth: String(currentStep.depth),
                rank: String(currentStep.rank),
              })}
            </span>
          </div>
          <div style={descriptionStyle} title={currentStep.description}>
            {currentStep.description}
          </div>
        </>
      ) : null}

      {/* 結論 */}
      <div style={conclusionStyle}>
        {currentStepIndex === -1
          ? initialInfo.conclusionText
          : (currentStep?.conclusionText ?? initialInfo.conclusionText)}
      </div>

      {/* 結果ステータス */}
      {isAtEnd ? (
        <div style={{ ...infoRowStyle, marginBottom: 0, marginTop: 4 }}>
          {result._tag === "Success" ? (
            <span
              style={successStyle}
              data-testid={
                testId !== undefined
                  ? `${testId satisfies string}-result`
                  : undefined
              }
            >
              {messages.cutEliminationSuccess}
            </span>
          ) : result._tag === "StepLimitExceeded" ? (
            <span
              style={stepLimitStyle}
              data-testid={
                testId !== undefined
                  ? `${testId satisfies string}-result`
                  : undefined
              }
            >
              {formatMessage(
                messages.cutEliminationStepLimitExceeded ??
                  "Step limit exceeded ({stepsUsed} steps)",
                {
                  stepsUsed: String(result.stepsUsed),
                },
              )}
            </span>
          ) : (
            <span
              style={failureStyle}
              data-testid={
                testId !== undefined
                  ? `${testId satisfies string}-result`
                  : undefined
              }
            >
              {messages.cutEliminationFailure}
            </span>
          )}
        </div>
      ) : null}
    </div>
  );
}
