/**
 * カット除去ステッパーコンポーネント。
 *
 * シーケント計算のワークスペースで、カット除去の各ステップを
 * 前進/後退しながら確認するパネル。
 *
 * 変更時は CutEliminationStepper.test.tsx, ProofWorkspace.tsx, index.ts も同期すること。
 */

import { useCallback } from "react";
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

// --- スタイル (Tailwind className) ---

const panelClassName =
  "absolute bottom-3 left-3 z-10 bg-[var(--color-panel-bg,rgba(252,249,243,0.96))] rounded-lg border border-[var(--color-panel-border,rgba(180,160,130,0.2))] shadow-[0_2px_12px_var(--color-panel-shadow,rgba(120,100,70,0.1))] px-3 py-2 font-[var(--font-ui)] text-xs min-w-60 max-w-[360px] pointer-events-auto";

const headerClassName =
  "font-bold text-[11px] uppercase tracking-[1px] text-[var(--color-text-secondary,#666)] mb-1.5 flex justify-between items-center";

const controlsClassName = "flex items-center gap-1 mb-1.5";

const buttonClassName =
  "px-2 py-0.5 text-xs rounded border border-[var(--color-panel-border,rgba(180,160,130,0.3))] bg-[var(--color-panel-bg,rgba(252,249,243,0.96))] cursor-pointer text-[var(--color-text-primary,#333)] font-[var(--font-ui)]";

const disabledButtonClassName = `${buttonClassName satisfies string} opacity-40 cursor-default`;

const infoRowClassName =
  "flex justify-between items-center text-[11px] text-[var(--color-text-secondary,#666)] mb-1";

const descriptionClassName =
  "text-[11px] text-[var(--color-text-primary,#333)] py-1 border-t border-[var(--color-panel-rule-line,rgba(180,160,130,0.15))] whitespace-nowrap overflow-hidden text-ellipsis";

const conclusionClassName =
  "text-[11px] font-[var(--font-formula)] italic text-[var(--color-text-secondary,#666)] whitespace-nowrap overflow-hidden text-ellipsis";

const successClassName =
  "text-[var(--color-proof-complete-text,#2d6a3f)] font-bold text-[10px]";

const failureClassName =
  "text-[var(--color-error,#c53030)] font-bold text-[10px]";

const stepLimitClassName =
  "text-[var(--color-warning,#c57600)] font-bold text-[10px]";

const cutFreeClassName =
  "text-[var(--color-proof-complete-text,#2d6a3f)] font-semibold text-[10px]";

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
      <div className={panelClassName} data-testid={testId}>
        <div className={headerClassName}>
          <span>{messages.cutEliminationTitle}</span>
          <span className={cutFreeClassName}>
            {messages.cutEliminationCutFree}
          </span>
        </div>
        <div className={conclusionClassName}>{initialInfo.conclusionText}</div>
        <div className={`${infoRowClassName satisfies string} mb-0`}>
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
      className={panelClassName}
      data-testid={testId}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <div className={headerClassName}>
        <span>{messages.cutEliminationTitle}</span>
        <span>{cutCountText}</span>
      </div>

      {/* コントロール */}
      <div className={controlsClassName}>
        <button
          type="button"
          className={backward ? buttonClassName : disabledButtonClassName}
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
          className={backward ? buttonClassName : disabledButtonClassName}
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
          className={forward ? buttonClassName : disabledButtonClassName}
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
          className={forward ? buttonClassName : disabledButtonClassName}
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
          <div className={infoRowClassName}>
            <span>
              {formatMessage(messages.cutEliminationStepInfo, {
                depth: String(currentStep.depth),
                rank: String(currentStep.rank),
              })}
            </span>
          </div>
          <div className={descriptionClassName} title={currentStep.description}>
            {currentStep.description}
          </div>
        </>
      ) : null}

      {/* 結論 */}
      <div className={conclusionClassName}>
        {/* v8 ignore start -- 防御的コード: currentStepIndex >= 0 なら steps[i] は存在する */}
        {currentStepIndex === -1
          ? initialInfo.conclusionText
          : (currentStep?.conclusionText ?? initialInfo.conclusionText)}
        {/* v8 ignore stop */}
      </div>

      {/* 結果ステータス */}
      {isAtEnd ? (
        <div
          className={`${infoRowClassName satisfies string} mb-0 mt-1`}
        >
          {result._tag === "Success" ? (
            <span
              className={successClassName}
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
              className={stepLimitClassName}
              data-testid={
                testId !== undefined
                  ? `${testId satisfies string}-result`
                  : undefined
              }
            >
              {/* v8 ignore start -- defaultProofMessagesでは常に定義済み */}
              {formatMessage(
                messages.cutEliminationStepLimitExceeded ??
                  "Step limit exceeded ({stepsUsed} steps)",
                {
                  stepsUsed: String(result.stepsUsed),
                },
              )}
              {/* v8 ignore stop */}
            </span>
          ) : (
            <span
              className={failureClassName}
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
