/**
 * Keybinding definition and matching system.
 *
 * Provides a structured, OS-aware keybinding system where shortcuts
 * are defined declaratively and matched against keyboard events.
 *
 * Key concepts:
 * - KeyStroke: a single key press (with optional modifiers)
 * - KeyBinding: a single stroke or a sequence of strokes (chord)
 * - "mod" modifier: abstracts Cmd (macOS) / Ctrl (Windows/Linux)
 * - OS-specific defaults with customization support
 */

// --- OS detection ---

/** Supported operating system categories */
export type OS = "mac" | "windows" | "linux";

/** Detect the current OS from navigator.platform or userAgent.
 *  Pure function — pass the platform string for testability. */
export function detectOS(platform: string): OS {
  if (
    platform.startsWith("Mac") ||
    platform === "iPhone" ||
    platform === "iPad"
  ) {
    return "mac";
  }
  if (platform.startsWith("Win")) {
    return "windows";
  }
  return "linux";
}

// --- Modifier types ---

/** Logical modifiers for keybinding definitions.
 * - "mod": Cmd on macOS, Ctrl on Windows/Linux
 * - "shift": Shift key
 * - "alt": Alt/Option key
 * - "ctrl": physical Ctrl key (rarely needed; prefer "mod")
 * - "meta": physical Meta/Cmd key (rarely needed; prefer "mod")
 */
export type Modifier = "mod" | "shift" | "alt" | "ctrl" | "meta";

// --- KeyStroke types ---

/** A keystroke matching by the `key` property (character produced).
 *  Case-insensitive matching is applied. */
export type CharKeyStroke = {
  readonly type: "char";
  readonly char: string;
  readonly modifiers: readonly Modifier[];
};

/** Well-known special keys mapped to KeyboardEvent.key values */
export type SpecialKey =
  | "enter"
  | "escape"
  | "space"
  | "tab"
  | "delete"
  | "backspace"
  | "arrowUp"
  | "arrowDown"
  | "arrowLeft"
  | "arrowRight";

/** Mapping from SpecialKey to KeyboardEvent.key */
const SPECIAL_KEY_MAP: Record<SpecialKey, string> = {
  enter: "Enter",
  escape: "Escape",
  space: " ",
  tab: "Tab",
  delete: "Delete",
  backspace: "Backspace",
  arrowUp: "ArrowUp",
  arrowDown: "ArrowDown",
  arrowLeft: "ArrowLeft",
  arrowRight: "ArrowRight",
};

/** A keystroke matching by a well-known special key */
export type SpecialKeyStroke = {
  readonly type: "special";
  readonly special: SpecialKey;
  readonly modifiers: readonly Modifier[];
};

/** A keystroke matching by the `code` property (physical key position).
 *  Useful for layout-independent shortcuts (e.g. Digit2 for Shift+2). */
export type CodeKeyStroke = {
  readonly type: "code";
  readonly code: string;
  readonly modifiers: readonly Modifier[];
};

/** A single keystroke definition */
export type KeyStroke = CharKeyStroke | SpecialKeyStroke | CodeKeyStroke;

// --- KeyBinding types ---

/** A keybinding that triggers on a single keystroke */
export type SingleKeyBinding = {
  readonly type: "single";
  readonly stroke: KeyStroke;
};

/** A keybinding that triggers on a sequence of keystrokes (chord).
 *  Each stroke must be pressed in order. */
export type SeqKeyBinding = {
  readonly type: "seq";
  readonly seq: readonly KeyStroke[];
};

/** A keybinding definition — either a single stroke or a chord sequence */
export type KeyBinding = SingleKeyBinding | SeqKeyBinding;

// --- Keybinding entry ---

/** A keybinding entry mapping an action to its keybinding(s).
 *  Supports OS-specific overrides with a fallback default. */
export type KeyBindingEntry<A extends string> = {
  readonly action: A;
  readonly binding: KeyBinding;
  readonly os?: readonly OS[];
};

/** A complete keybinding map: array of entries, potentially with
 *  OS-specific variants for the same action. */
export type KeyBindingMap<A extends string> = readonly KeyBindingEntry<A>[];

// --- Keyboard event input ---

/** Minimal keyboard event data for matching (testable without DOM) */
export type KeyEventData = {
  readonly key: string;
  readonly code: string;
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
  readonly shiftKey: boolean;
  readonly altKey: boolean;
  readonly repeat: boolean;
};

// --- Matching logic ---

/** Check if the modifier state of a key event matches a modifier set.
 *  "mod" maps to metaKey on macOS, ctrlKey on others. */
export function matchModifiers(
  event: KeyEventData,
  modifiers: readonly Modifier[],
  os: OS,
): boolean {
  const wantMod = modifiers.includes("mod");
  const wantShift = modifiers.includes("shift");
  const wantAlt = modifiers.includes("alt");
  const wantCtrl = modifiers.includes("ctrl");
  const wantMeta = modifiers.includes("meta");

  // Compute expected physical key state
  const expectCtrl = wantCtrl || (wantMod && os !== "mac");
  const expectMeta = wantMeta || (wantMod && os === "mac");
  const expectShift = wantShift;
  const expectAlt = wantAlt;

  return (
    event.ctrlKey === expectCtrl &&
    event.metaKey === expectMeta &&
    event.shiftKey === expectShift &&
    event.altKey === expectAlt
  );
}

/** Check if a keyboard event matches a single keystroke */
export function matchKeyStroke(
  event: KeyEventData,
  stroke: KeyStroke,
  os: OS,
): boolean {
  if (!matchModifiers(event, stroke.modifiers, os)) {
    return false;
  }

  switch (stroke.type) {
    case "char":
      return event.key.toLowerCase() === stroke.char.toLowerCase();
    case "special":
      return event.key === SPECIAL_KEY_MAP[stroke.special];
    case "code":
      return event.code === stroke.code;
  }
}

// --- Chord state ---

/** State for tracking chord (sequence) keybinding progress */
export type ChordState = {
  /** The entries currently being tracked (partially matched sequences) */
  readonly pending: readonly {
    readonly action: string;
    readonly seq: readonly KeyStroke[];
    readonly index: number;
  }[];
  /** Timestamp of last keystroke (for timeout) */
  readonly lastKeyTime: number;
};

/** Initial (empty) chord state */
export const INITIAL_CHORD_STATE: ChordState = {
  pending: [],
  lastKeyTime: 0,
};

/** Chord timeout in milliseconds. If more time than this passes between
 *  keystrokes in a chord, the chord is reset. */
export const CHORD_TIMEOUT_MS = 1500;

/** Result of processing a key event against the keybinding map */
export type KeyMatchResult<A extends string> = {
  /** The matched action, or null if no match */
  readonly action: A | null;
  /** Whether a chord is in progress (waiting for next key) */
  readonly chordInProgress: boolean;
  /** Updated chord state */
  readonly chordState: ChordState;
};

/** Process a key event against a keybinding map.
 *
 *  Handles both single-stroke bindings and chord sequences.
 *  Returns the matched action (if any) and updated chord state.
 *
 *  Pure function — no side effects.
 */
export function processKeyEvent<A extends string>(
  event: KeyEventData,
  bindings: KeyBindingMap<A>,
  os: OS,
  chordState: ChordState,
  now: number,
): KeyMatchResult<A> {
  // Check if existing chord pending entries should be timed out
  const timedOut = now - chordState.lastKeyTime > CHORD_TIMEOUT_MS;
  const activePending = timedOut ? [] : [...chordState.pending];

  // 1. Check pending chord sequences
  const newPending: ChordState["pending"][number][] = [];
  for (const entry of activePending) {
    const nextStroke = entry.seq[entry.index];
    if (nextStroke !== undefined && matchKeyStroke(event, nextStroke, os)) {
      if (entry.index + 1 >= entry.seq.length) {
        // Chord completed
        return {
          action: entry.action as A,
          chordInProgress: false,
          chordState: INITIAL_CHORD_STATE,
        };
      }
      // Advance to next stroke in sequence
      newPending.push({
        action: entry.action,
        seq: entry.seq,
        index: entry.index + 1,
      });
    }
    // else: this pending chord doesn't match, drop it
  }

  // 2. Check for new matches (single bindings + start of chord sequences)
  for (const entry of bindings) {
    // Skip OS-specific entries that don't apply
    if (entry.os !== undefined && !entry.os.includes(os)) {
      continue;
    }

    switch (entry.binding.type) {
      case "single":
        if (matchKeyStroke(event, entry.binding.stroke, os)) {
          // Single binding matched — but if there are also pending chords, prefer exact
          return {
            action: entry.action,
            chordInProgress: newPending.length > 0,
            chordState: {
              pending: newPending,
              lastKeyTime: now,
            },
          };
        }
        break;
      case "seq": {
        const firstStroke = entry.binding.seq[0];
        if (
          firstStroke !== undefined &&
          matchKeyStroke(event, firstStroke, os)
        ) {
          if (entry.binding.seq.length === 1) {
            // Single-element sequence, treat as immediate match
            return {
              action: entry.action,
              chordInProgress: newPending.length > 0,
              chordState: {
                pending: newPending,
                lastKeyTime: now,
              },
            };
          }
          // Start tracking this chord
          newPending.push({
            action: entry.action,
            seq: entry.binding.seq,
            index: 1,
          });
        }
        break;
      }
    }
  }

  // 3. If we have pending chords, we're in a chord-in-progress state
  if (newPending.length > 0) {
    return {
      action: null,
      chordInProgress: true,
      chordState: {
        pending: newPending,
        lastKeyTime: now,
      },
    };
  }

  // No match
  return {
    action: null,
    chordInProgress: false,
    chordState: INITIAL_CHORD_STATE,
  };
}

// --- Helper constructors ---

/** Create a single-stroke keybinding from a char key */
export function charKey(
  char: string,
  ...modifiers: readonly Modifier[]
): SingleKeyBinding {
  return {
    type: "single",
    stroke: { type: "char", char, modifiers },
  };
}

/** Create a single-stroke keybinding from a special key */
export function specialKey(
  special: SpecialKey,
  ...modifiers: readonly Modifier[]
): SingleKeyBinding {
  return {
    type: "single",
    stroke: { type: "special", special, modifiers },
  };
}

/** Create a single-stroke keybinding from a key code */
export function codeKey(
  code: string,
  ...modifiers: readonly Modifier[]
): SingleKeyBinding {
  return {
    type: "single",
    stroke: { type: "code", code, modifiers },
  };
}

/** Create a chord (sequence) keybinding */
export function chord(...strokes: readonly KeyStroke[]): SeqKeyBinding {
  return {
    type: "seq",
    seq: strokes,
  };
}

/** Create a KeyStroke (for use in chord()) from a char key */
export function charStroke(
  char: string,
  ...modifiers: readonly Modifier[]
): CharKeyStroke {
  return { type: "char", char, modifiers };
}

/** Create a KeyStroke (for use in chord()) from a special key */
export function specialStroke(
  special: SpecialKey,
  ...modifiers: readonly Modifier[]
): SpecialKeyStroke {
  return { type: "special", special, modifiers };
}

/** Create a KeyStroke (for use in chord()) from a key code */
export function codeStroke(
  code: string,
  ...modifiers: readonly Modifier[]
): CodeKeyStroke {
  return { type: "code", code, modifiers };
}

// --- Resolve bindings for a specific OS ---

/** Given a keybinding map and an OS, return only the entries applicable to that OS.
 *  Entries without an `os` field apply to all OSes. */
export function resolveBindingsForOS<A extends string>(
  bindings: KeyBindingMap<A>,
  os: OS,
): KeyBindingMap<A> {
  return bindings.filter(
    (entry) => entry.os === undefined || entry.os.includes(os),
  );
}
