# Home

`daiksud.com` のプロフィール、主要リンク、最新ブログ記事、SEO、キャッシュの振る舞いを定義するリポジトリです。

## 現在の状態

実装開始前の基準として、観測可能な振る舞いを Gherkin、技術的な決定を Architecture Decision Records（ADR）で確定しています。

## 仕様書

- [文書の案内](docs/README.md)
- [振る舞い仕様](docs/features/README.md)
- [Architecture Decision Records](docs/adr/README.md)

## ローカル開発

Node.js 24.16.0 以降と pnpm 11 を使います。`.nvmrc`、`package.json` の `engines`、`packageManager` で必要な version を宣言し、依存関係は manifest と lockfile に正確に固定しています。

```sh
pnpm install
pnpm dev
```

型検査、lint、整形確認は個別に実行できます。

```sh
pnpm check
pnpm lint
pnpm format:check
```

整形を適用するには `pnpm format`、すべての品質検査とビルドをまとめて実行するには `pnpm validate` を使います。本番用の成果物を確認する場合は、ビルド後にプレビューします。

```sh
pnpm build
pnpm preview
```

| ツール | 担当範囲 | 実行コマンド |
| --- | --- | --- |
| Astro | 型と Astro コンポーネントの検査 | `pnpm check` |
| Biome | JavaScript / TypeScript / JSON / CSS の整形と lint | `pnpm lint:biome` |
| ESLint | 型情報を使う TypeScript と Astro の意味的検査 | `pnpm lint:eslint` |
| Stylelint | CSS と Astro の `<style>` ブロックの検査 | `pnpm lint:stylelint` |
| rumdl | Markdown / MDX の lint と整形 | `pnpm lint:rumdl`、`pnpm format`、`pnpm format:check` |
| Prettier | Astro / YAML の整形 | `pnpm format`、`pnpm format:check` |
| knip | 未使用の依存関係、exports、files の検出 | `pnpm lint:knip` |

`.vscode/` には推奨拡張と formatter / lint の設定があります。ほかのエディターでも `.editorconfig` と上記コマンドを使って同じ規約を適用してください。

## 関連リポジトリ

- [Blog](https://github.com/daiksudcom/blog)
- [Content](https://github.com/daiksudcom/content)
- [UI](https://github.com/daiksudcom/ui)
