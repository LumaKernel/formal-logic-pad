/**
 * サンドボックス化された JavaScript 実行環境。
 *
 * JS-Interpreter (Neil Fraser) をラップし、安全なコード実行・ステップ実行・
 * 実行制限（ステップ数・時間）を提供する。ネイティブ関数ブリッジも可能。
 *
 * 変更時は scriptRunner.test.ts, jsInterpreterTypes.ts も同期すること。
 */

import type {
  JsInterpreterConstructor,
  JsInterpreterInitFunc,
  JsInterpreterInstance,
  JsInterpreterObject,
  JsInterpreterValue,
} from "./jsInterpreterTypes";

// --- 型定義 ---

/** ネイティブ関数ブリッジの定義 */
export interface NativeFunctionBridge {
  /** サンドボックス内で公開する関数名 */
  readonly name: string;
  /** ネイティブ側の実装。引数・戻り値は自動でネイティブ変換される */
  readonly fn: (...args: readonly unknown[]) => unknown;
}

/** ScriptRunner の設定 */
export interface ScriptRunnerConfig {
  /** 最大ステップ数（デフォルト: 10,000） */
  readonly maxSteps?: number;
  /** 最大実行時間(ミリ秒)（デフォルト: 5,000） */
  readonly maxTimeMs?: number;
  /** ネイティブ関数ブリッジ一覧 */
  readonly bridges?: readonly NativeFunctionBridge[];
  /** 現在時刻取得関数（テスト用DI、デフォルト: Date.now） */
  readonly getNow?: () => number;
}

/** 実行結果の成功 */
export interface ScriptRunResultOk {
  readonly _tag: "Ok";
  readonly value: unknown;
  readonly steps: number;
  readonly elapsedMs: number;
}

/** 実行結果のエラー */
export interface ScriptRunResultError {
  readonly _tag: "Error";
  readonly error: ScriptRunError;
  readonly steps: number;
  readonly elapsedMs: number;
}

/** 実行結果 */
export type ScriptRunResult = ScriptRunResultOk | ScriptRunResultError;

/** エラー種別 */
export type ScriptRunError =
  | { readonly _tag: "StepLimitExceeded"; readonly maxSteps: number }
  | { readonly _tag: "TimeLimitExceeded"; readonly maxTimeMs: number }
  | { readonly _tag: "RuntimeError"; readonly message: string }
  | { readonly _tag: "SyntaxError"; readonly message: string };

/** ステップ実行時の現在位置情報 */
export interface StepLocation {
  /** 1-indexed の行番号 */
  readonly line: number;
  /** 0-indexed の列番号 */
  readonly column: number;
}

/** ステップ実行の状態 */
export type StepStatus =
  | {
      readonly _tag: "Running";
      readonly steps: number;
      readonly location: StepLocation | null;
    }
  | { readonly _tag: "Done"; readonly value: unknown; readonly steps: number }
  | {
      readonly _tag: "Error";
      readonly error: ScriptRunError;
      readonly steps: number;
    };

/** ScriptRunner インスタンス */
export interface ScriptRunnerInstance {
  /** 1ステップ実行して状態を返す */
  readonly step: () => StepStatus;
  /** 全ステップ実行して結果を返す */
  readonly run: () => ScriptRunResult;
  /** 現在のステップ数を取得 */
  readonly getSteps: () => number;
}

// --- デフォルト値 ---

const DEFAULT_MAX_STEPS = 10_000;
const DEFAULT_MAX_TIME_MS = 5_000;

// --- JS-Interpreter の動的ロード ---

let interpreterModuleCache: {
  readonly Interpreter: JsInterpreterConstructor;
} | null = null;

const loadInterpreter = (): JsInterpreterConstructor => {
  if (interpreterModuleCache === null) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("js-interpreter") as
      | JsInterpreterConstructor
      | { default: JsInterpreterConstructor };
    // モジュール形式に応じて default export を取得（CJS/ESM両対応）
    /* v8 ignore start — モジュール形式により片方のみ到達 */
    const Ctor = "default" in mod ? mod.default : mod;
    /* v8 ignore stop */
    interpreterModuleCache = { Interpreter: Ctor };
  }
  return interpreterModuleCache.Interpreter;
};

// --- ファクトリ関数 ---

/**
 * ScriptRunner を作成する。
 *
 * @param code 実行するJavaScriptコード
 * @param config 設定（ステップ数制限、時間制限、ブリッジ関数）
 * @returns ScriptRunnerInstance（step/run で実行）
 * @throws SyntaxError のコードを渡した場合は作成時にエラーを返す可能性がある
 */
export const createScriptRunner = (
  code: string,
  config: ScriptRunnerConfig = {},
): ScriptRunResult | ScriptRunnerInstance => {
  const {
    maxSteps = DEFAULT_MAX_STEPS,
    maxTimeMs = DEFAULT_MAX_TIME_MS,
    bridges = [],
    getNow = Date.now,
  } = config;

  const Interpreter = loadInterpreter();

  // 初期化関数: ブリッジ関数をサンドボックスに登録
  const initFunc: JsInterpreterInitFunc = (
    interpreter: JsInterpreterInstance,
    globalObject: JsInterpreterObject,
  ) => {
    for (const bridge of bridges) {
      const wrapper = (
        ...args: readonly JsInterpreterValue[]
      ): JsInterpreterValue => {
        const nativeArgs = args.map((a) => interpreter.pseudoToNative(a));
        const result = bridge.fn(...nativeArgs);
        return interpreter.nativeToPseudo(result) as JsInterpreterValue;
      };
      interpreter.setProperty(
        globalObject,
        bridge.name,
        interpreter.createNativeFunction(wrapper),
      );
    }
  };

  let interpreter: JsInterpreterInstance;
  try {
    interpreter = new Interpreter(code, initFunc);
  } catch (e: unknown) {
    /* v8 ignore start — JS-Interpreter は常に Error を投げるが、防御的に String(e) も対応 */
    const message = e instanceof Error ? e.message : String(e);
    /* v8 ignore stop */
    return {
      _tag: "Error",
      error: { _tag: "SyntaxError", message },
      steps: 0,
      elapsedMs: 0,
    };
  }

  let steps = 0;
  const startTime = getNow();

  const checkLimits = (): ScriptRunError | null => {
    if (steps >= maxSteps) {
      return { _tag: "StepLimitExceeded", maxSteps };
    }
    const elapsed = getNow() - startTime;
    if (elapsed >= maxTimeMs) {
      return { _tag: "TimeLimitExceeded", maxTimeMs };
    }
    return null;
  };

  const extractValue = (): unknown => {
    return interpreter.pseudoToNative(interpreter.value);
  };

  const getCurrentLocation = (): StepLocation | null => {
    const stack = interpreter.stateStack;
    /* v8 ignore start — JS-Interpreter は常に stateStack にエントリを持ち、
       Acorn の locations:true オプションにより node.loc は常に存在する。
       防御的チェックのため到達不能。 */
    if (stack.length === 0) return null;
    const currentState = stack[stack.length - 1];
    const loc = currentState?.node?.loc;
    if (loc === undefined || loc === null) return null;
    /* v8 ignore stop */
    return { line: loc.start.line, column: loc.start.column };
  };

  const stepOnce = (): StepStatus => {
    const limitError = checkLimits();
    if (limitError !== null) {
      return { _tag: "Error", error: limitError, steps };
    }

    let hasMore: boolean;
    try {
      hasMore = interpreter.step();
    } catch (e: unknown) {
      /* v8 ignore start — JS-Interpreter は常に Error を投げるが、防御的に String(e) も対応 */
      const message = e instanceof Error ? e.message : String(e);
      /* v8 ignore stop */
      return {
        _tag: "Error",
        error: { _tag: "RuntimeError", message },
        steps,
      };
    }
    steps += 1;

    if (!hasMore) {
      return { _tag: "Done", value: extractValue(), steps };
    }

    // ステップ後にも制限チェック
    const postLimitError = checkLimits();
    if (postLimitError !== null) {
      return { _tag: "Error", error: postLimitError, steps };
    }

    return { _tag: "Running", steps, location: getCurrentLocation() };
  };

  const runAll = (): ScriptRunResult => {
    for (;;) {
      const status = stepOnce();
      switch (status._tag) {
        case "Running":
          continue;
        case "Done":
          return {
            _tag: "Ok",
            value: status.value,
            steps: status.steps,
            elapsedMs: getNow() - startTime,
          };
        case "Error":
          return {
            _tag: "Error",
            error: status.error,
            steps: status.steps,
            elapsedMs: getNow() - startTime,
          };
      }
    }
  };

  return {
    step: stepOnce,
    run: runAll,
    getSteps: () => steps,
  };
};

// --- 型ガード ---

/** ScriptRunResult かどうか判定する（createScriptRunner の戻り値が結果かインスタンスか区別） */
export const isScriptRunResult = (
  value: ScriptRunResult | ScriptRunnerInstance,
) => {
  return "_tag" in value;
};
