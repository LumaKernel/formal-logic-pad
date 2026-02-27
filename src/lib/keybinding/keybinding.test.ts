import { describe, it, expect } from "vitest";
import {
  type KeyEventData,
  type KeyBindingMap,
  INITIAL_CHORD_STATE,
  CHORD_TIMEOUT_MS,
  detectOS,
  matchModifiers,
  matchKeyStroke,
  processKeyEvent,
  charKey,
  specialKey,
  codeKey,
  chord,
  charStroke,
  specialStroke,
  codeStroke,
  resolveBindingsForOS,
} from "./keybinding";

// --- Test helpers ---

function makeEvent(overrides: Partial<KeyEventData> = {}): KeyEventData {
  return {
    key: "",
    code: "",
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    altKey: false,
    repeat: false,
    ...overrides,
  };
}

// --- detectOS ---

describe("detectOS", () => {
  it("Mac系プラットフォームを判定", () => {
    expect(detectOS("MacIntel")).toBe("mac");
    expect(detectOS("MacPPC")).toBe("mac");
    expect(detectOS("iPhone")).toBe("mac");
    expect(detectOS("iPad")).toBe("mac");
  });

  it("Windowsプラットフォームを判定", () => {
    expect(detectOS("Win32")).toBe("windows");
    expect(detectOS("Win64")).toBe("windows");
  });

  it("その他はLinuxとして判定", () => {
    expect(detectOS("Linux x86_64")).toBe("linux");
    expect(detectOS("Linux armv7l")).toBe("linux");
    expect(detectOS("")).toBe("linux");
    expect(detectOS("FreeBSD")).toBe("linux");
  });
});

// --- matchModifiers ---

describe("matchModifiers", () => {
  it("修飾キーなしでイベントも修飾キーなし → true", () => {
    expect(matchModifiers(makeEvent(), [], "mac")).toBe(true);
    expect(matchModifiers(makeEvent(), [], "windows")).toBe(true);
  });

  it("修飾キーなしだがイベントにctrl → false", () => {
    expect(matchModifiers(makeEvent({ ctrlKey: true }), [], "mac")).toBe(false);
  });

  it("mod修飾キー: macOSではmetaKeyにマッチ", () => {
    expect(matchModifiers(makeEvent({ metaKey: true }), ["mod"], "mac")).toBe(
      true,
    );
    expect(matchModifiers(makeEvent({ ctrlKey: true }), ["mod"], "mac")).toBe(
      false,
    );
  });

  it("mod修飾キー: WindowsではctrlKeyにマッチ", () => {
    expect(
      matchModifiers(makeEvent({ ctrlKey: true }), ["mod"], "windows"),
    ).toBe(true);
    expect(
      matchModifiers(makeEvent({ metaKey: true }), ["mod"], "windows"),
    ).toBe(false);
  });

  it("mod修飾キー: LinuxではctrlKeyにマッチ", () => {
    expect(matchModifiers(makeEvent({ ctrlKey: true }), ["mod"], "linux")).toBe(
      true,
    );
  });

  it("shift修飾キー", () => {
    expect(
      matchModifiers(makeEvent({ shiftKey: true }), ["shift"], "mac"),
    ).toBe(true);
    expect(matchModifiers(makeEvent(), ["shift"], "mac")).toBe(false);
  });

  it("alt修飾キー", () => {
    expect(matchModifiers(makeEvent({ altKey: true }), ["alt"], "mac")).toBe(
      true,
    );
    expect(matchModifiers(makeEvent(), ["alt"], "mac")).toBe(false);
  });

  it("複数修飾キーの組み合わせ", () => {
    expect(
      matchModifiers(
        makeEvent({ metaKey: true, shiftKey: true }),
        ["mod", "shift"],
        "mac",
      ),
    ).toBe(true);
    expect(
      matchModifiers(
        makeEvent({ ctrlKey: true, shiftKey: true }),
        ["mod", "shift"],
        "windows",
      ),
    ).toBe(true);
  });

  it("余分な修飾キーがあるとfalse", () => {
    expect(
      matchModifiers(
        makeEvent({ metaKey: true, shiftKey: true }),
        ["mod"],
        "mac",
      ),
    ).toBe(false);
  });

  it("物理ctrl修飾キー", () => {
    expect(matchModifiers(makeEvent({ ctrlKey: true }), ["ctrl"], "mac")).toBe(
      true,
    );
    expect(
      matchModifiers(makeEvent({ ctrlKey: true }), ["ctrl"], "windows"),
    ).toBe(true);
  });

  it("物理meta修飾キー", () => {
    expect(matchModifiers(makeEvent({ metaKey: true }), ["meta"], "mac")).toBe(
      true,
    );
    expect(
      matchModifiers(makeEvent({ metaKey: true }), ["meta"], "windows"),
    ).toBe(true);
  });
});

// --- matchKeyStroke ---

describe("matchKeyStroke", () => {
  it("charタイプ: 大文字小文字を無視してマッチ", () => {
    expect(
      matchKeyStroke(
        makeEvent({ key: "f" }),
        { type: "char", char: "f", modifiers: [] },
        "mac",
      ),
    ).toBe(true);
    expect(
      matchKeyStroke(
        makeEvent({ key: "F" }),
        { type: "char", char: "f", modifiers: [] },
        "mac",
      ),
    ).toBe(true);
  });

  it("charタイプ: 不一致", () => {
    expect(
      matchKeyStroke(
        makeEvent({ key: "g" }),
        { type: "char", char: "f", modifiers: [] },
        "mac",
      ),
    ).toBe(false);
  });

  it("charタイプ: 修飾キー付き", () => {
    expect(
      matchKeyStroke(
        makeEvent({ key: "f", metaKey: true }),
        { type: "char", char: "f", modifiers: ["mod"] },
        "mac",
      ),
    ).toBe(true);
  });

  it("specialタイプ: Enterにマッチ", () => {
    expect(
      matchKeyStroke(
        makeEvent({ key: "Enter" }),
        { type: "special", special: "enter", modifiers: [] },
        "mac",
      ),
    ).toBe(true);
  });

  it("specialタイプ: Spaceにマッチ", () => {
    expect(
      matchKeyStroke(
        makeEvent({ key: " " }),
        { type: "special", special: "space", modifiers: [] },
        "mac",
      ),
    ).toBe(true);
  });

  it("specialタイプ: 矢印キーにマッチ", () => {
    expect(
      matchKeyStroke(
        makeEvent({ key: "ArrowUp" }),
        { type: "special", special: "arrowUp", modifiers: [] },
        "mac",
      ),
    ).toBe(true);
    expect(
      matchKeyStroke(
        makeEvent({ key: "ArrowDown" }),
        { type: "special", special: "arrowDown", modifiers: [] },
        "mac",
      ),
    ).toBe(true);
    expect(
      matchKeyStroke(
        makeEvent({ key: "ArrowLeft" }),
        { type: "special", special: "arrowLeft", modifiers: [] },
        "mac",
      ),
    ).toBe(true);
    expect(
      matchKeyStroke(
        makeEvent({ key: "ArrowRight" }),
        { type: "special", special: "arrowRight", modifiers: [] },
        "mac",
      ),
    ).toBe(true);
  });

  it("specialタイプ: 不一致", () => {
    expect(
      matchKeyStroke(
        makeEvent({ key: "Escape" }),
        { type: "special", special: "enter", modifiers: [] },
        "mac",
      ),
    ).toBe(false);
  });

  it("specialタイプ: Delete/Backspace/Tab/Escape", () => {
    expect(
      matchKeyStroke(
        makeEvent({ key: "Delete" }),
        { type: "special", special: "delete", modifiers: [] },
        "mac",
      ),
    ).toBe(true);
    expect(
      matchKeyStroke(
        makeEvent({ key: "Backspace" }),
        { type: "special", special: "backspace", modifiers: [] },
        "mac",
      ),
    ).toBe(true);
    expect(
      matchKeyStroke(
        makeEvent({ key: "Tab" }),
        { type: "special", special: "tab", modifiers: [] },
        "mac",
      ),
    ).toBe(true);
    expect(
      matchKeyStroke(
        makeEvent({ key: "Escape" }),
        { type: "special", special: "escape", modifiers: [] },
        "mac",
      ),
    ).toBe(true);
  });

  it("codeタイプ: コードにマッチ", () => {
    expect(
      matchKeyStroke(
        makeEvent({ code: "Digit2", shiftKey: true }),
        { type: "code", code: "Digit2", modifiers: ["shift"] },
        "mac",
      ),
    ).toBe(true);
  });

  it("codeタイプ: 不一致", () => {
    expect(
      matchKeyStroke(
        makeEvent({ code: "Digit3", shiftKey: true }),
        { type: "code", code: "Digit2", modifiers: ["shift"] },
        "mac",
      ),
    ).toBe(false);
  });

  it("修飾キーが合わないとfalse", () => {
    expect(
      matchKeyStroke(
        makeEvent({ key: "f" }),
        { type: "char", char: "f", modifiers: ["mod"] },
        "mac",
      ),
    ).toBe(false);
  });
});

// --- processKeyEvent - single bindings ---

type TestAction = "save" | "search" | "delete" | "zoom-to-selection";

const singleBindings: KeyBindingMap<TestAction> = [
  { action: "save", binding: charKey("s", "mod") },
  { action: "search", binding: charKey("f", "mod") },
  { action: "delete", binding: specialKey("delete") },
  { action: "zoom-to-selection", binding: codeKey("Digit2", "shift") },
];

describe("processKeyEvent - 単一バインディング", () => {
  it("Cmd+Sでsaveアクションにマッチ (macOS)", () => {
    const result = processKeyEvent(
      makeEvent({ key: "s", metaKey: true }),
      singleBindings,
      "mac",
      INITIAL_CHORD_STATE,
      1000,
    );
    expect(result.action).toBe("save");
    expect(result.chordInProgress).toBe(false);
  });

  it("Ctrl+Sでsaveアクションにマッチ (Windows)", () => {
    const result = processKeyEvent(
      makeEvent({ key: "s", ctrlKey: true }),
      singleBindings,
      "windows",
      INITIAL_CHORD_STATE,
      1000,
    );
    expect(result.action).toBe("save");
    expect(result.chordInProgress).toBe(false);
  });

  it("Deleteでdeleteアクションにマッチ", () => {
    const result = processKeyEvent(
      makeEvent({ key: "Delete" }),
      singleBindings,
      "mac",
      INITIAL_CHORD_STATE,
      1000,
    );
    expect(result.action).toBe("delete");
  });

  it("Shift+Digit2でzoom-to-selectionにマッチ", () => {
    const result = processKeyEvent(
      makeEvent({ key: "@", code: "Digit2", shiftKey: true }),
      singleBindings,
      "mac",
      INITIAL_CHORD_STATE,
      1000,
    );
    expect(result.action).toBe("zoom-to-selection");
  });

  it("マッチしないキーはnull", () => {
    const result = processKeyEvent(
      makeEvent({ key: "a" }),
      singleBindings,
      "mac",
      INITIAL_CHORD_STATE,
      1000,
    );
    expect(result.action).toBe(null);
    expect(result.chordInProgress).toBe(false);
  });
});

// --- processKeyEvent - chord bindings ---

type ChordAction = "goto-line" | "quick-save";

const chordBindings: KeyBindingMap<ChordAction> = [
  {
    action: "goto-line",
    binding: chord(charStroke("k", "mod"), charStroke("g", "mod")),
  },
  {
    action: "quick-save",
    binding: charKey("s", "mod"),
  },
];

describe("processKeyEvent - コード(シーケンス)バインディング", () => {
  it("コードの最初のキーでchordInProgressがtrue", () => {
    const result = processKeyEvent(
      makeEvent({ key: "k", metaKey: true }),
      chordBindings,
      "mac",
      INITIAL_CHORD_STATE,
      1000,
    );
    // Cmd+K doesn't match quick-save (Cmd+S), so should be in chord progress
    expect(result.action).toBe(null);
    expect(result.chordInProgress).toBe(true);
    expect(result.chordState.pending).toHaveLength(1);
  });

  it("コードの2番目のキーでアクションが完了", () => {
    // First key: Cmd+K
    const result1 = processKeyEvent(
      makeEvent({ key: "k", metaKey: true }),
      chordBindings,
      "mac",
      INITIAL_CHORD_STATE,
      1000,
    );

    // Second key: Cmd+G
    const result2 = processKeyEvent(
      makeEvent({ key: "g", metaKey: true }),
      chordBindings,
      "mac",
      result1.chordState,
      1100,
    );
    expect(result2.action).toBe("goto-line");
    expect(result2.chordInProgress).toBe(false);
  });

  it("コードの2番目のキーが不一致ならリセット", () => {
    // First key: Cmd+K
    const result1 = processKeyEvent(
      makeEvent({ key: "k", metaKey: true }),
      chordBindings,
      "mac",
      INITIAL_CHORD_STATE,
      1000,
    );

    // Wrong second key: Cmd+X
    const result2 = processKeyEvent(
      makeEvent({ key: "x", metaKey: true }),
      chordBindings,
      "mac",
      result1.chordState,
      1100,
    );
    expect(result2.action).toBe(null);
    expect(result2.chordInProgress).toBe(false);
  });

  it("タイムアウトでコード状態がリセット", () => {
    // First key: Cmd+K
    const result1 = processKeyEvent(
      makeEvent({ key: "k", metaKey: true }),
      chordBindings,
      "mac",
      INITIAL_CHORD_STATE,
      1000,
    );

    // Second key after timeout
    const result2 = processKeyEvent(
      makeEvent({ key: "g", metaKey: true }),
      chordBindings,
      "mac",
      result1.chordState,
      1000 + CHORD_TIMEOUT_MS + 1,
    );
    expect(result2.action).toBe(null);
    expect(result2.chordInProgress).toBe(false);
  });

  it("単一バインディングとコードの同時マッチ: 単一が優先", () => {
    // Cmd+S matches quick-save directly
    const result = processKeyEvent(
      makeEvent({ key: "s", metaKey: true }),
      chordBindings,
      "mac",
      INITIAL_CHORD_STATE,
      1000,
    );
    expect(result.action).toBe("quick-save");
  });
});

// --- 3-stroke chord ---

type TripleChordAction = "triple-action";

const tripleChordBindings: KeyBindingMap<TripleChordAction> = [
  {
    action: "triple-action",
    binding: chord(charStroke("a"), charStroke("b"), charStroke("c")),
  },
];

describe("processKeyEvent - 3ストロークコード", () => {
  it("3ストロークの中間ステップでchordInProgress", () => {
    const r1 = processKeyEvent(
      makeEvent({ key: "a" }),
      tripleChordBindings,
      "mac",
      INITIAL_CHORD_STATE,
      1000,
    );
    expect(r1.action).toBe(null);
    expect(r1.chordInProgress).toBe(true);
    expect(r1.chordState.pending).toHaveLength(1);

    // 2nd stroke
    const r2 = processKeyEvent(
      makeEvent({ key: "b" }),
      tripleChordBindings,
      "mac",
      r1.chordState,
      1100,
    );
    expect(r2.action).toBe(null);
    expect(r2.chordInProgress).toBe(true);
    expect(r2.chordState.pending).toHaveLength(1);

    // 3rd stroke → match
    const r3 = processKeyEvent(
      makeEvent({ key: "c" }),
      tripleChordBindings,
      "mac",
      r2.chordState,
      1200,
    );
    expect(r3.action).toBe("triple-action");
    expect(r3.chordInProgress).toBe(false);
  });
});

// --- OS-specific bindings ---

type OSAction = "mac-only" | "all-os";

const osBindings: KeyBindingMap<OSAction> = [
  { action: "mac-only", binding: charKey("m", "mod"), os: ["mac"] },
  { action: "all-os", binding: charKey("a", "mod") },
];

describe("processKeyEvent - OS制限付きバインディング", () => {
  it("mac-onlyはmacOSでのみマッチ", () => {
    const macResult = processKeyEvent(
      makeEvent({ key: "m", metaKey: true }),
      osBindings,
      "mac",
      INITIAL_CHORD_STATE,
      1000,
    );
    expect(macResult.action).toBe("mac-only");

    const winResult = processKeyEvent(
      makeEvent({ key: "m", ctrlKey: true }),
      osBindings,
      "windows",
      INITIAL_CHORD_STATE,
      1000,
    );
    expect(winResult.action).toBe(null);
  });

  it("os制限なしはすべてのOSでマッチ", () => {
    const macResult = processKeyEvent(
      makeEvent({ key: "a", metaKey: true }),
      osBindings,
      "mac",
      INITIAL_CHORD_STATE,
      1000,
    );
    expect(macResult.action).toBe("all-os");

    const winResult = processKeyEvent(
      makeEvent({ key: "a", ctrlKey: true }),
      osBindings,
      "windows",
      INITIAL_CHORD_STATE,
      1000,
    );
    expect(winResult.action).toBe("all-os");
  });
});

// --- resolveBindingsForOS ---

describe("resolveBindingsForOS", () => {
  it("指定OSに該当するエントリのみ返す", () => {
    const resolved = resolveBindingsForOS(osBindings, "mac");
    expect(resolved).toHaveLength(2);
  });

  it("非該当OSのエントリは除外", () => {
    const resolved = resolveBindingsForOS(osBindings, "windows");
    expect(resolved).toHaveLength(1);
    expect(resolved[0]?.action).toBe("all-os");
  });
});

// --- Helper constructors ---

describe("ヘルパーコンストラクタ", () => {
  it("charKey", () => {
    const binding = charKey("s", "mod", "shift");
    expect(binding).toEqual({
      type: "single",
      stroke: { type: "char", char: "s", modifiers: ["mod", "shift"] },
    });
  });

  it("specialKey", () => {
    const binding = specialKey("enter", "mod");
    expect(binding).toEqual({
      type: "single",
      stroke: { type: "special", special: "enter", modifiers: ["mod"] },
    });
  });

  it("codeKey", () => {
    const binding = codeKey("Digit2", "shift");
    expect(binding).toEqual({
      type: "single",
      stroke: { type: "code", code: "Digit2", modifiers: ["shift"] },
    });
  });

  it("chord", () => {
    const binding = chord(charStroke("k", "mod"), specialStroke("enter"));
    expect(binding).toEqual({
      type: "seq",
      seq: [
        { type: "char", char: "k", modifiers: ["mod"] },
        { type: "special", special: "enter", modifiers: [] },
      ],
    });
  });

  it("codeStroke", () => {
    const stroke = codeStroke("KeyA", "mod");
    expect(stroke).toEqual({
      type: "code",
      code: "KeyA",
      modifiers: ["mod"],
    });
  });
});

// --- Edge cases ---

describe("エッジケース", () => {
  it("空のバインディングマップではnull", () => {
    const result = processKeyEvent(
      makeEvent({ key: "a" }),
      [],
      "mac",
      INITIAL_CHORD_STATE,
      1000,
    );
    expect(result.action).toBe(null);
  });

  it("1要素のシーケンスは即座にマッチ", () => {
    const bindings: KeyBindingMap<"test"> = [
      {
        action: "test",
        binding: chord(charStroke("a")),
      },
    ];
    const result = processKeyEvent(
      makeEvent({ key: "a" }),
      bindings,
      "mac",
      INITIAL_CHORD_STATE,
      1000,
    );
    expect(result.action).toBe("test");
  });

  it("pendingコードとタイムアウトの境界値", () => {
    const bindings: KeyBindingMap<"test"> = [
      {
        action: "test",
        binding: chord(charStroke("a"), charStroke("b")),
      },
    ];

    // First key
    const result1 = processKeyEvent(
      makeEvent({ key: "a" }),
      bindings,
      "mac",
      INITIAL_CHORD_STATE,
      1000,
    );
    expect(result1.chordInProgress).toBe(true);

    // ちょうどタイムアウト境界: CHORD_TIMEOUT_MS以内ならOK
    const result2 = processKeyEvent(
      makeEvent({ key: "b" }),
      bindings,
      "mac",
      result1.chordState,
      1000 + CHORD_TIMEOUT_MS,
    );
    expect(result2.action).toBe("test");

    // タイムアウト超過
    const result3 = processKeyEvent(
      makeEvent({ key: "b" }),
      bindings,
      "mac",
      result1.chordState,
      1000 + CHORD_TIMEOUT_MS + 1,
    );
    expect(result3.action).toBe(null);
  });
});
