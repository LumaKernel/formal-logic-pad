# 差し込みタスク

- [-] Next.jsの機能を用いた最適化
  - [x] ロード時間の調査（LCP 443-573ms, CLS 0.00 — Core Web Vitals良好）
  - [x] Hubタブ遅延ロード調査 → 効果なし（全タブがantd Button共有、タブ自体は軽量）
  - [x] Effect.ts tree-shaking 調査 → 改善不可（Effect.gen/runSync使用のためruntime全体が必要。Turbopackはルートごとにチャンク重複）
  - [ ] antd → 軽量代替検討（1.0MB×2チャンク、gzip 304KB×2。Button/Tabs/Menu/ConfigProviderのみ使用）
  - [ ] スクリプトに関連する要素(コンポーネントやライブラリ)の遅延ロード
  - [ ] ドキュメントの遅延ロード、Suspense利用?
