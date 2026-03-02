## タスク: Edge scroll のシャドーアフォーダンス表現

**元ファイル:** `tasks/prd-inserted-tasks.md`

> Edge scrollableは実際にオンになってていいかなと思う。（実際にはエッジが色が変わるやつは要らなくて、ただ、ちょっとシャドーが効いた感じの光り方をして、スクロールしてくれるとわかるアフォーダンス表現をしたい)

### 現状

- Edge scroll はすでに ProofWorkspace で有効（`useEdgeScroll` hook）
- EdgeScrollDemo ストーリーには色付きエッジインジケーター（dashed border + 青い背景）がある → 不要
- ProofWorkspace にはビジュアルフィードバックなし → シャドーグローを追加したい

### 実装計画

1. **`edgeScrollLogic.ts` に per-edge penetration 計算関数を追加**
   - `computePerEdgePenetration(cursor, containerSize, config)` → `{ left, right, top, bottom }` (0~1)
   - 既存の `computeEdgePenetration` を内部利用

2. **`EdgeScrollIndicator` React コンポーネントを新規作成**
   - 4辺それぞれに CSS inset box-shadow を描画
   - penetration 値に応じて shadow の強さ（opacity, spread）を変化
   - `pointerEvents: none` でインタラクションを妨げない

3. **`useEdgeScroll` を拡張して現在の per-edge penetration を公開**
   - 返り値に `edgePenetration: EdgePenetration | null` を追加（null = ドラッグ中でない）

4. **ProofWorkspace に EdgeScrollIndicator を統合**

5. **EdgeScrollDemo ストーリーを更新**
   - 色付きインジケーターを削除
   - EdgeScrollIndicator を使用
   - play関数を更新

### テスト計画

- `edgeScrollLogic.test.ts`: `computePerEdgePenetration` のユニットテスト
- `EdgeScrollIndicator` の Storybook play関数でアサーション

### ストーリー計画

- EdgeScrollDemo: 既存ストーリーを更新（shadow indicator に切り替え）
- EdgeScrollIndicator 単体ストーリーは不要（Demo内で確認可能）
