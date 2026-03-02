/**
 * js-interpreter パッケージの型定義。
 *
 * Neil Fraser の JS-Interpreter の npm パッケージ (js-interpreter@6.x) 向け。
 * 完全な型定義ではなく、script-runner で使用するAPIのみを型付けしている。
 *
 * 変更時は scriptRunner.ts, scriptRunner.test.ts も確認すること。
 */

/** JS-Interpreter のサンドボックス内オブジェクト */
export interface JsInterpreterObject {
  readonly _isInterpreterObject: true;
}

/** JS-Interpreter のプリミティブ値またはオブジェクト */
export type JsInterpreterValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | JsInterpreterObject;

/** JS-Interpreter の実行ステータス */
export interface JsInterpreterStatusEnum {
  readonly DONE: 0;
  readonly STEP: 1;
  readonly TASK: 2;
  readonly ASYNC: 3;
}

/** JS-Interpreter の初期化関数 */
export type JsInterpreterInitFunc = (
  interpreter: JsInterpreterInstance,
  globalObject: JsInterpreterObject,
) => void;

/** JS-Interpreter のインスタンス */
export interface JsInterpreterInstance {
  /** 1ステップ実行。まだステップが残っていれば true を返す */
  step(): boolean;
  /** 全ステップ実行（無限ループ注意）。async で一時停止中なら true を返す */
  run(): boolean;
  /** 現在の実行ステータスを取得 */
  getStatus(): number;
  /** 最後に評価された値 */
  value: JsInterpreterValue;

  /** ネイティブ値を JS-Interpreter のオブジェクトに変換 */
  nativeToPseudo(nativeObj: unknown): JsInterpreterValue;
  /** JS-Interpreter のオブジェクトをネイティブ値に変換 */
  pseudoToNative(pseudoObj: JsInterpreterValue): unknown;
  /** ネイティブ関数を JS-Interpreter の関数オブジェクトとして作成 */
  createNativeFunction(
    nativeFunc: (...args: readonly JsInterpreterValue[]) => JsInterpreterValue,
    isConstructor?: boolean,
  ): JsInterpreterObject;
  /** JS-Interpreter オブジェクトにプロパティを設定 */
  setProperty(
    obj: JsInterpreterObject,
    name: string,
    value: JsInterpreterValue | JsInterpreterObject,
    descriptor?: object,
  ): void;
  /** JS-Interpreter オブジェクトからプロパティを取得 */
  getProperty(obj: JsInterpreterObject, name: string): JsInterpreterValue;
}

/** JS-Interpreter のコンストラクタ */
export interface JsInterpreterConstructor {
  new (code: string, initFunc?: JsInterpreterInitFunc): JsInterpreterInstance;
  Status: JsInterpreterStatusEnum;
}
