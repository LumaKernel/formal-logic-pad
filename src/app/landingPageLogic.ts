/**
 * ランディングページ表示判定の純粋ロジック。
 *
 * 「ノートブックが0件」かつ「セッション中にノートを作成/表示したことがない」
 * ときにランディングページを表示する。
 *
 * - 初回起動（localStorageにノートブックなし）: ランディング表示
 * - ノートを作成後に全削除: ランディング非表示
 * - 上記状態でリロード: ランディング再表示（セッションフラグがリセットされるため）
 *
 * 変更時は landingPageLogic.test.ts も同期すること。
 */

/**
 * ランディングページを表示すべきかどうか判定する。
 *
 * @param notebookCount - 現在のノートブック数
 * @param hasEverHadNotebooks - セッション中にノートが1つ以上存在したことがあるか
 * @returns ランディングページを表示すべきかどうか
 */
export function shouldShowLandingPage(
  notebookCount: number,
  hasEverHadNotebooks: boolean,
): boolean {
  return notebookCount === 0 && !hasEverHadNotebooks;
}

/**
 * セッション中にノートが存在したことがあるかフラグを更新する。
 *
 * @param current - 現在のフラグ値
 * @param notebookCount - 現在のノートブック数
 * @returns 更新後のフラグ値
 */
export function updateHasEverHadNotebooks(
  current: boolean,
  notebookCount: number,
): boolean {
  if (current) return true;
  return notebookCount > 0;
}

/** おすすめクエストのID一覧（ランディングページに表示する初心者向けクエスト） */
export const recommendedQuestIds: readonly string[] = [
  "prop-01", // φ → φ（最も基本的な定理）
  "prop-03", // (φ→ψ) → ((ψ→χ) → (φ→ψ)) — 公理のインスタンス化
  "prop-05", // φ → (ψ → (χ → ψ)) — K公理の二重適用
];
