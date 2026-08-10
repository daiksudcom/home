# ADR 0005: domain と SEO の所有権

## ステータス

承認済み

## 日付

2026-08-10

## コンテキスト

プロフィールの公開 identity と、Blog・Content の各 origin の役割を crawler と共有サービスへ明確に伝える必要がある。

## 決定

`https://daiksud.com/` を Home の公開 origin と canonical にする。Home Worker が `/robots.txt`、`/sitemap.xml`、canonical、Open Graph metadata を所有し、すべての Home URL を同 origin に揃える。Blog へのリンクは `https://blog.daiksud.com/` と各記事の canonical URL を使う。production の page view は Cloudflare Web Analytics で計測する。

## 検討した選択肢

- Blog origin を main identity にする構成
- 外部 SEO service に metadata を委譲する構成
- 各公開 origin が自身の discovery metadata を所有する構成

## 結果

Home、Blog、Content の URL authority が分離され、crawler は Home と記事をそれぞれの canonical origin で識別できる。

## 関連文書

- [Home SEO 仕様](../features/home-seo.feature)
- [Blog の feed と SEO ADR](https://github.com/daiksudcom/blog/blob/main/docs/adr/0007-feed-and-seo.md)
