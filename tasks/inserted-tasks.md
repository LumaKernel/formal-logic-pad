# 差し込みタスク

- [-] Next.jsの機能を用いた最適化
  - [x] ロード時間の調査（LCP 443-573ms, CLS 0.00 — Core Web Vitals良好）
  - [x] Hubタブ遅延ロード調査 → 効果なし（全タブがantd Button共有、タブ自体は軽量）
  - [x] Effect.ts tree-shaking 調査 → 改善不可（Effect.gen/runSync使用のためruntime全体が必要。Turbopackはルートごとにチャンク重複）
  - [x] antd → 軽量UIコンポーネント自前実装に置換（バンドル9.4MB→8.7MB、antd+@ant-design/icons削除）
  - [-] スクリプトに関連する要素(コンポーネントやライブラリ)の遅延ロード
  - [ ] ドキュメントの遅延ロード、Suspense利用?
