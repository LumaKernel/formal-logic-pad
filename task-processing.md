## 現在のタスク

**ソース:** `tasks/prd-logic-pad-world.md`

- [ ] Don't eliminate cutの例を載せたい。 https://www.jstor.org/stable/30226313 (./dont-elim-cut.pdf を参照)

### 周辺情報

- George Boolos (1984) "Don't Eliminate Cut" - カット除去で証明が指数関数的に爆発する具体例 H_n
- H_n の前提: (x)(y)(z)+x+yz = ++xyz, (x)dx = +xx, L1, (x)(Lx → L+x1)
- 結論: Ld...d1（dが2^n個）
- ツリー法(カットなし)では 2^(2^n) 以上のシンボル、自然演繹(カットあり)では 16(2^n + 8n + 21) シンボル
- リファレンスエントリとして追加し、カット除去の計算量的コストを解説する
