# できたこと日記

日々の「できたこと」だけを明るく残して振り返るための PWA です。  
サーバには送らず、使っている端末のブラウザ内だけに保存します。

## できること

- 日付ごとのリストで記録を眺める
- 今日を既定にした簡単な追加（自由記述・種別の選択、どちらでも可）
- 家事・運動・成長などのプリセットと、自分で追加した分類
- カレンダーで「できた数」を確認する
- JSON のエクスポート／インポートで端末間の移行（インポートは置き換え）
- ホーム画面への追加（PWA）

## 開発

```bash
npm install
npm run dev
```

```bash
npm test
npm run check
npm run build
npm run preview
```

設計の契約は [`docs/architecture.md`](docs/architecture.md) にあります。

## GitHub Pages

`main` への push で `.github/workflows/pages.yml` が `dist` を公開します。  
`base` / マニフェストの `id`・`scope`・`start_url` は `/positive_possible_dialy/` 固定です（同じ `*.github.io` 上の別 PWA と WebAPK が衝突しないようにするため）。

リポジトリの Settings → Pages で Source を **GitHub Actions** にしてください。
