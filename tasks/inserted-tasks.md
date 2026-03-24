# 差し込みタスク

- [ ] v8 ignoreすべきところは、ひとつの場所に集約されているべきだと考える。
  - [x] まずは現在の v8 ignore を分析、分類。（851箇所/107ファイル。12カテゴリに分類。task-processing.mdに詳細記録）
  - [ ] map系は、 https://github.com/LumaKernel/const-map-ts の makeConstMap を利用できるところは利用する
    - 一旦、makeConstMapWithReturnTypeはバグってるので利用しない。
  - [ ] `.../_unsafe` のようなフォルダに v8 ignore をすべき対象を集約する。
    - このフォルダ自体はその近い関心の場所にローカルに作ってよい。が、なるべく数が少なくなるように、そして、ignoreしてしかるべきところがはっきりするように切り分ける。
