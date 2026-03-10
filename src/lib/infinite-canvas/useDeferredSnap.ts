import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEFERRED_SNAP_MIN_DISTANCE,
  easeOutCubic,
  interpolatePosition,
  isSnapAnimationNeeded,
} from "./deferredSnap";
import { applySnap, SNAP_DISABLED, type SnapConfig } from "./snap";
import type { Point } from "./types";

/** Default animation duration for deferred snap (ms). */
const DEFAULT_DEFERRED_SNAP_DURATION_MS = 150;

/** Configuration for deferred snap behavior. */
export interface DeferredSnapConfig {
  /** Grid snap configuration. */
  readonly snapConfig: SnapConfig;
  /** Animation duration in ms. */
  readonly durationMs: number;
}

export const DEFERRED_SNAP_CONFIG_DISABLED: DeferredSnapConfig = {
  snapConfig: SNAP_DISABLED,
  durationMs: DEFAULT_DEFERRED_SNAP_DURATION_MS,
};

export interface DeferredSnapState {
  /** The snap target position (shown as preview during drag, null when no snap). */
  readonly snapTarget: Point | null;
  /** Whether the item is currently animating to the snap target. */
  readonly isAnimating: boolean;
  /** Call this when drag ends to trigger the snap animation.
   *  @param currentPosition The position when the drag ended. */
  readonly triggerSnap: (currentPosition: Point) => void;
}

/** Hook that provides deferred grid snap with smooth animation.
 *
 *  During drag: computes snap preview target without moving the item.
 *  On drag end: call `triggerSnap(pos)` to smoothly animate to the snap target.
 *
 *  @param rawPosition       Current unsnapped position (for snap target preview)
 *  @param config            Deferred snap configuration
 *  @param onPositionChange  Callback when position changes (animated updates)
 */
export function useDeferredSnap(
  rawPosition: Point,
  config: DeferredSnapConfig,
  onPositionChange: (pos: Point) => void,
): DeferredSnapState {
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef<number | null>(null);
  const animationStartRef = useRef<{
    readonly from: Point;
    readonly to: Point;
    readonly startTime: number;
  } | null>(null);

  // Keep latest callback ref
  const onPositionChangeRef = useRef(onPositionChange);
  useEffect(() => {
    onPositionChangeRef.current = onPositionChange;
  }, [onPositionChange]);

  const durationMsRef = useRef(config.durationMs);
  useEffect(() => {
    durationMsRef.current = config.durationMs;
  }, [config.durationMs]);

  // Compute snap target for current raw position (preview)
  const snapTarget = config.snapConfig.enabled
    ? applySnap(rawPosition, config.snapConfig)
    : null;

  // Trigger snap animation from event handler (not effect)
  const triggerSnap = useCallback(
    (currentPosition: Point) => {
      if (!config.snapConfig.enabled) return;

      // Cancel any running animation
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }

      const from = currentPosition;
      const to = applySnap(from, config.snapConfig);

      if (!isSnapAnimationNeeded(from, to, DEFERRED_SNAP_MIN_DISTANCE)) {
        // Too close, snap immediately
        onPositionChangeRef.current(to);
        return;
      }

      // Start animation
      const startTime = performance.now();
      animationStartRef.current = { from, to, startTime };
      setIsAnimating(true);

      const animate = (now: number) => {
        const anim = animationStartRef.current;
        if (anim === null) return;

        const elapsed = now - anim.startTime;
        const progress = Math.min(elapsed / durationMsRef.current, 1);
        const eased = easeOutCubic(progress);
        const pos = interpolatePosition(anim.from, anim.to, eased);

        onPositionChangeRef.current(pos);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          // Ensure exact final position
          onPositionChangeRef.current(anim.to);
          animationRef.current = null;
          animationStartRef.current = null;
          setIsAnimating(false);
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    },
    [config.snapConfig],
  );

  // Cleanup on unmount
  useEffect(
    () => () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    },
    [],
  );

  return {
    snapTarget,
    isAnimating,
    triggerSnap,
  };
}
