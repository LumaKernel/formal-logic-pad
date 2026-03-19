import { useCallback, useMemo, useRef, useState } from "react";
import type { Size, ViewportState } from "./types";
import type { ZoomItemBounds } from "./zoom";
import { ZOOM_PRESETS } from "./zoom";
import {
  computeFitViewport,
  computePresetZoomViewport,
  computeResetZoomViewport,
  computeZoomButtonStates,
  computeZoomControlsPlacementStyle,
  computeZoomDisplayLabel,
  computeZoomInViewport,
  computeZoomOutViewport,
} from "./zoomControls";
import type { ZoomControlsPosition } from "./zoomControls";

/** Translatable labels for ZoomControlsComponent.
 *  All fields are optional — English defaults are used when not provided. */
export type ZoomControlsLabels = {
  readonly zoomOut?: string;
  readonly zoomIn?: string;
  readonly currentZoom?: string;
  readonly selectZoomPreset?: string;
  readonly resetZoom?: string;
  readonly fitToContent?: string;
  readonly zoomToSelection?: string;
};

const defaultLabels: Required<ZoomControlsLabels> = {
  zoomOut: "Zoom out",
  zoomIn: "Zoom in",
  currentZoom: "Current zoom",
  selectZoomPreset: "Select zoom preset",
  resetZoom: "Reset zoom to 100%",
  fitToContent: "Fit to content",
  zoomToSelection: "Zoom to selection (Shift+2)",
};

export interface ZoomControlsProps {
  /** Current viewport state */
  readonly viewport: ViewportState;
  /** Size of the canvas container */
  readonly containerSize: Size;
  /** Callback when viewport changes */
  readonly onViewportChange?: (viewport: ViewportState) => void;
  /** Position within the canvas */
  readonly position?: ZoomControlsPosition;
  /** Whether the controls are visible */
  readonly visible?: boolean;
  /** Items on the canvas (for fit-to-content) */
  readonly items?: readonly ZoomItemBounds[];
  /** Custom min scale */
  readonly minScale?: number;
  /** Custom max scale */
  readonly maxScale?: number;
  /** Whether to show the fit-to-content button */
  readonly showFitButton?: boolean;
  /** Whether to show the reset button */
  readonly showResetButton?: boolean;
  /** Whether to show preset dropdown */
  readonly showPresets?: boolean;
  /** Selected item bounds (for zoom-to-selection) */
  readonly selectedItems?: readonly ZoomItemBounds[];
  /** Callback when zoom-to-selection is triggered */
  readonly onZoomToSelection?: () => void;
  /** Translatable labels (optional, English defaults used when omitted) */
  readonly labels?: ZoomControlsLabels;
}

const NOOP = () => {};

const buttonBaseStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "32px",
  height: "32px",
  border: "none",
  borderRadius: "4px",
  backgroundColor: "transparent",
  cursor: "pointer",
  color: "var(--color-zoom-controls-text, #333)",
  fontSize: "16px",
  lineHeight: 1,
  padding: 0,
  transition:
    "background-color 0.15s ease, color var(--theme-transition-duration, 0s) ease",
};

const buttonDisabledStyle: React.CSSProperties = {
  opacity: 0.3,
  cursor: "default",
};

const separatorStyle: React.CSSProperties = {
  width: "1px",
  height: "20px",
  backgroundColor: "var(--color-zoom-controls-separator, rgba(0, 0, 0, 0.15))",
  margin: "0 2px",
  transition: "background-color var(--theme-transition-duration, 0s) ease",
};

const dropdownStyle: React.CSSProperties = {
  position: "absolute",
  bottom: "100%",
  left: "50%",
  transform: "translateX(-50%)",
  marginBottom: "4px",
  backgroundColor: "var(--color-zoom-controls-bg, rgba(255, 255, 255, 0.95))",
  border: "1px solid var(--color-zoom-controls-border, rgba(0, 0, 0, 0.15))",
  borderRadius: "6px",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
  zIndex: 20,
  overflow: "hidden",
  transition:
    "background-color var(--theme-transition-duration, 0s) ease, border-color var(--theme-transition-duration, 0s) ease",
};

const dropdownItemStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "6px 16px",
  border: "none",
  backgroundColor: "transparent",
  cursor: "pointer",
  color: "var(--color-zoom-controls-text, #333)",
  fontSize: "13px",
  textAlign: "right",
  whiteSpace: "nowrap",
  transition:
    "background-color 0.15s ease, color var(--theme-transition-duration, 0s) ease",
};

/** Zoom controls overlay component for InfiniteCanvas.
 *  Provides zoom in/out buttons, percentage display, reset, fit-to-content, and preset zoom levels. */
export function ZoomControlsComponent({
  viewport,
  containerSize,
  onViewportChange = NOOP,
  position = "bottom-left",
  visible = true,
  items = [],
  minScale,
  maxScale,
  showFitButton = true,
  showResetButton = true,
  showPresets = true,
  selectedItems,
  onZoomToSelection,
  labels: labelsInput,
}: ZoomControlsProps) {
  const labels = useMemo(
    () => ({ ...defaultLabels, ...labelsInput }),
    [labelsInput],
  );
  const [isPresetOpen, setIsPresetOpen] = useState(false);
  const presetRef = useRef<HTMLDivElement>(null);

  const placementStyle = useMemo(
    () => computeZoomControlsPlacementStyle(position),
    [position],
  );

  const zoomLabel = useMemo(
    () => computeZoomDisplayLabel(viewport.scale),
    [viewport.scale],
  );

  const { zoomInDisabled, zoomOutDisabled } = useMemo(
    () => computeZoomButtonStates(viewport.scale, minScale, maxScale),
    [viewport.scale, minScale, maxScale],
  );

  const handleZoomIn = useCallback(() => {
    /* v8 ignore start -- disabled状態ではボタンがdisabledのため到達不能 */
    if (zoomInDisabled) return;
    /* v8 ignore stop */
    const next = computeZoomInViewport(
      viewport,
      containerSize,
      minScale,
      maxScale,
    );
    onViewportChange(next);
  }, [
    viewport,
    containerSize,
    minScale,
    maxScale,
    zoomInDisabled,
    onViewportChange,
  ]);

  const handleZoomOut = useCallback(() => {
    /* v8 ignore start -- disabled状態ではボタンがdisabledのため到達不能 */
    if (zoomOutDisabled) return;
    /* v8 ignore stop */
    const next = computeZoomOutViewport(
      viewport,
      containerSize,
      minScale,
      maxScale,
    );
    onViewportChange(next);
  }, [
    viewport,
    containerSize,
    minScale,
    maxScale,
    zoomOutDisabled,
    onViewportChange,
  ]);

  const handleReset = useCallback(() => {
    onViewportChange(computeResetZoomViewport());
  }, [onViewportChange]);

  const handleFit = useCallback(() => {
    const next = computeFitViewport(items, containerSize);
    onViewportChange(next);
  }, [items, containerSize, onViewportChange]);

  const handlePresetSelect = useCallback(
    (presetScale: number) => {
      const next = computePresetZoomViewport(
        viewport,
        containerSize,
        presetScale,
        minScale,
        maxScale,
      );
      onViewportChange(next);
      setIsPresetOpen(false);
    },
    [viewport, containerSize, minScale, maxScale, onViewportChange],
  );

  const togglePresets = useCallback(() => {
    setIsPresetOpen((prev) => !prev);
  }, []);

  const closePresets = useCallback(() => {
    setIsPresetOpen(false);
  }, []);

  if (!visible) return null;

  return (
    <div
      data-testid="zoom-controls"
      style={{
        position: "absolute",
        ...placementStyle,
        display: "flex",
        alignItems: "center",
        gap: "2px",
        backgroundColor:
          "var(--color-zoom-controls-bg, rgba(255, 255, 255, 0.95))",
        borderRadius: "6px",
        border:
          "1px solid var(--color-zoom-controls-border, rgba(0, 0, 0, 0.15))",
        padding: "2px",
        pointerEvents: "auto",
        zIndex: 10,
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        transition:
          "background-color var(--theme-transition-duration, 0s) ease, border-color var(--theme-transition-duration, 0s) ease",
        userSelect: "none",
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Zoom Out */}
      <button
        data-testid="zoom-out-button"
        type="button"
        style={{
          ...buttonBaseStyle,
          ...(zoomOutDisabled ? buttonDisabledStyle : {}),
        }}
        disabled={zoomOutDisabled}
        onClick={handleZoomOut}
        aria-label={labels.zoomOut}
        title={labels.zoomOut}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M3 8h10"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {/* Separator */}
      <div style={separatorStyle} aria-hidden="true" />

      {/* Zoom Percentage / Preset Dropdown Trigger */}
      <div style={{ position: "relative" }} ref={presetRef}>
        <button
          data-testid="zoom-percentage"
          type="button"
          style={{
            ...buttonBaseStyle,
            width: "auto",
            minWidth: "52px",
            padding: "0 6px",
            fontSize: "12px",
            fontWeight: 500,
            fontVariantNumeric: "tabular-nums",
          }}
          onClick={showPresets ? togglePresets : undefined}
          aria-label={`${labels.currentZoom satisfies string}: ${zoomLabel satisfies string}`}
          title={
            showPresets
              ? labels.selectZoomPreset
              : `${labels.currentZoom satisfies string}: ${zoomLabel satisfies string}`
          }
        >
          {zoomLabel}
        </button>

        {/* Preset Dropdown */}
        {isPresetOpen && showPresets && (
          <>
            {/* Backdrop to close dropdown */}
            <div
              data-testid="zoom-preset-backdrop"
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 15,
              }}
              onClick={closePresets}
              onKeyDown={undefined}
            />
            <div style={dropdownStyle} data-testid="zoom-preset-dropdown">
              {ZOOM_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  data-testid={`zoom-preset-${Math.round(preset * 100) satisfies number}`}
                  style={{
                    ...dropdownItemStyle,
                    fontWeight:
                      Math.abs(preset - viewport.scale) < 0.01 ? 600 : 400,
                  }}
                  onClick={() => handlePresetSelect(preset)}
                >
                  {`${Math.round(preset * 100) satisfies number}%`}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Separator */}
      <div style={separatorStyle} aria-hidden="true" />

      {/* Zoom In */}
      <button
        data-testid="zoom-in-button"
        type="button"
        style={{
          ...buttonBaseStyle,
          ...(zoomInDisabled ? buttonDisabledStyle : {}),
        }}
        disabled={zoomInDisabled}
        onClick={handleZoomIn}
        aria-label={labels.zoomIn}
        title={labels.zoomIn}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M8 3v10M3 8h10"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {/* Reset button */}
      {showResetButton && (
        <>
          <div style={separatorStyle} aria-hidden="true" />
          <button
            data-testid="zoom-reset-button"
            type="button"
            style={buttonBaseStyle}
            onClick={handleReset}
            aria-label={labels.resetZoom}
            title={labels.resetZoom}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M2 8a6 6 0 1 1 1.76 4.24"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M2 12V8h4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </>
      )}

      {/* Fit to content button */}
      {showFitButton && (
        <>
          <div style={separatorStyle} aria-hidden="true" />
          <button
            data-testid="zoom-fit-button"
            type="button"
            style={buttonBaseStyle}
            onClick={handleFit}
            aria-label={labels.fitToContent}
            title={labels.fitToContent}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M2 6V3a1 1 0 0 1 1-1h3M10 2h3a1 1 0 0 1 1 1v3M14 10v3a1 1 0 0 1-1 1h-3M6 14H3a1 1 0 0 1-1-1v-3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </>
      )}

      {/* Zoom to selection button (shown when items are selected) */}
      {selectedItems !== undefined &&
        selectedItems.length > 0 &&
        onZoomToSelection !== undefined && (
          <>
            <div style={separatorStyle} aria-hidden="true" />
            <button
              data-testid="zoom-to-selection-button"
              type="button"
              style={buttonBaseStyle}
              onClick={onZoomToSelection}
              aria-label={labels.zoomToSelection}
              title={labels.zoomToSelection}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
              >
                <rect
                  x="4"
                  y="4"
                  width="8"
                  height="8"
                  rx="1"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeDasharray="2 1.5"
                />
                <path
                  d="M2 6V3a1 1 0 0 1 1-1h3M10 2h3a1 1 0 0 1 1 1v3M14 10v3a1 1 0 0 1-1 1h-3M6 14H3a1 1 0 0 1-1-1v-3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </>
        )}
    </div>
  );
}
