/**
 * ゴミ箱モジュールのパブリック API。
 *
 * ノート・自作クエスト・スクリプト・コレクションエントリの
 * ソフトデリート（ゴミ箱移動）と復元・完全削除・期限切れ管理を提供する。
 *
 * 変更時は trashState.ts, useTrash.ts, *.test.ts も同期すること。
 */

export {
  type TrashItemKind,
  type TrashItem,
  type TrashState,
  TRASH_EXPIRY_DAYS,
  TRASH_EXPIRY_MS,
  createEmptyTrash,
  addToTrash,
  getTrashItem,
  restoreFromTrash,
  permanentlyDelete,
  emptyTrash,
  purgeExpiredItems,
  getTrashItemsByKind,
  getTrashItemCount,
  isExpired,
  getRemainingDays,
  serializeTrashState,
  deserializeTrashState,
} from "./trashState";
export {
  useTrash,
  loadTrashState,
  saveTrashState,
  TRASH_STORAGE_KEY,
  type UseTrashResult,
  type UseTrashOptions,
  type GetNow,
} from "./useTrash";
