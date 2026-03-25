/**
 * Hub タブとURLパスの双方向マッピング（純粋ロジック）。
 *
 * 変更時は HubContent.tsx, HubPageView.tsx も同期すること。
 */
import type { HubTab } from "./HubPageView";

/** パスからタブへのマッピング */
const pathToTabMap: ReadonlyMap<string, HubTab> = new Map<string, HubTab>([
  ["/", "notebooks"],
  ["/quests", "quests"],
  ["/custom-quests", "custom-quests"],
  ["/collection", "collection"],
  ["/reference", "reference"],
  ["/scripts", "scripts"],
  ["/trash", "trash"],
]);

/** タブからパスへのマッピング */
const tabToPathMap: ReadonlyMap<HubTab, string> = new Map<HubTab, string>(
  [...pathToTabMap].map(([path, tab]) => [tab, path]),
);

/**
 * URLパスからアクティブなHubタブを判定する。
 * マッチしない場合は null を返す。
 */
export const resolveTabFromPath = (pathname: string): HubTab | null =>
  pathToTabMap.get(pathname) ?? null;

/**
 * HubタブからURLパスを取得する。
 */
export const resolvePathFromTab = (tab: HubTab): string =>
  tabToPathMap.get(tab) ?? "/";
