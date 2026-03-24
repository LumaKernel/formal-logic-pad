/**
 * 防御的ルックアップのユーティリティ。
 *
 * 呼び出し元の不変条件により結果が常に存在することが保証されている
 * Map.get() や undefined チェックを集約する。
 *
 * このファイルは vitest coverage 除外対象。
 * v8 ignore コメントを個別ファイルに散在させず、ここに集約する。
 *
 * 変更時は unsafeLookup.test.ts も同期すること。
 */

/**
 * Map から値を取得する。存在しない場合は例外を投げる。
 *
 * 呼び出し元が「このキーは必ず存在する」と保証できる場合にのみ使用すること。
 * context 引数でデバッグ時の文脈情報を付加できる。
 */
export function unsafeMapGet<K, V>(
  map: ReadonlyMap<K, V>,
  key: K,
  context?: string,
): V {
  const value = map.get(key);
  if (value === undefined) {
    const keyStr: string = String(key);
    const suffix: string =
      context !== undefined ? ` (${context satisfies string})` : "";
    throw new Error(
      `unsafeMapGet: key not found: ${keyStr satisfies string}${suffix satisfies string}`,
    );
  }
  return value;
}

/**
 * 値が undefined でも null でもないことをアサートする。
 *
 * 呼び出し元が「この値は常に存在する」と保証できる場合にのみ使用すること。
 * context 引数でデバッグ時の文脈情報を付加できる。
 */
export function unsafeAssertDefined<T>(
  value: T | undefined | null,
  context?: string,
): T {
  if (value === undefined || value === null) {
    const valStr: string = String(value);
    const suffix: string =
      context !== undefined ? ` (${context satisfies string})` : "";
    throw new Error(
      `unsafeAssertDefined: value is ${valStr satisfies string}${suffix satisfies string}`,
    );
  }
  return value;
}
