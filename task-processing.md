## タスク: 各種ウィンドウが「証明完了」より上にくるようにして
- 元ファイル: tasks/inserted-tasks.md (1行目)

### 対応方針
証明完了バナーのz-indexを30→5に下げる。バナーはpointerEvents: "none"で装飾的なので、パネル群(z-index: 10)より下で良い。
