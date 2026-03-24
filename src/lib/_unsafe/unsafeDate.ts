/**
 * Date APIのラッパーユーティリティ。
 *
 * @luma-dev/luma-ts/no-date ルールにより Date の直接使用は禁止されている。
 * このファイルに Date 使用を集約し、eslint-disable を1箇所に限定する。
 *
 * このファイルは vitest coverage 除外対象。
 *
 * 変更時は unsafeDate.test.ts も同期すること。
 */

/* eslint-disable @luma-dev/luma-ts/no-date -- Date使用の集約先 */

/** 日付コンポーネント */
export type DateComponents = {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly hour: number;
  readonly minute: number;
};

/** 現在のタイムスタンプ（ミリ秒）を取得する */
export function getCurrentTimestamp(): number {
  return Date.now();
}

/**
 * 現在のUTC日付コンポーネントを取得する。
 * エクスポートファイル名生成などに使用。
 */
export function getCurrentUtcDateComponents(): DateComponents {
  const d = new Date();
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
  };
}

/**
 * タイムスタンプからローカル日付コンポーネントを取得する。
 * 保存日時の表示フォーマットなどに使用。
 */
export function timestampToLocalDateComponents(
  timestamp: number,
): DateComponents {
  const date = new Date(timestamp);
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hour: date.getHours(),
    minute: date.getMinutes(),
  };
}
