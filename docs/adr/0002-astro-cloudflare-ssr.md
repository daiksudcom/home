---
type: "Architecture Decision Record"
title: "ADR 0002: Astro と Cloudflare による SSR"
description: "Astro 7のserver outputとCloudflare adapterを採用し、Cloudflare WorkersでSSRすることを定める。"
resource: "https://github.com/daiksudcom/home/blob/main/docs/adr/0002-astro-cloudflare-ssr.md"
tags: [home, adr, architecture, astro, cloudflare, ssr]
status: stable
generated:
  by: "codex/gpt-5.6-sol"
  at: 2026-08-11T21:36:04Z
---

# ADR 0002: Astro と Cloudflare による SSR

## ステータス

承認済み

## 日付

2026-08-10

## コンテキスト

Home は現在の Content から最新記事を取得して HTML を生成し、Cloudflare edge から配信する必要がある。

## 決定

Astro 7、Astro コンポーネント、`@astrojs/cloudflare`、`output: server` を採用し、Cloudflare Workers で SSR する。Worker の runtime contract は Fetch、Request、Response などの Web 標準 API とする。

## 検討した選択肢

- deploy 時だけ静的生成する構成
- 汎用 Node.js server で SSR する構成
- Astro Cloudflare adapter で SSR する構成

## 結果

要求時に Content と Home 固有情報を合成できる一方、実行環境は Cloudflare Workers と Astro の adapter contract に拘束される。実行コードを Web 標準 API に限定し、runtime 固有 API への依存を adapter 境界へ閉じ込める。

## 関連文書

- [Home ページ仕様](../features/home-page.feature)
- [ADR 0003: Content API へのアクセス](0003-content-api-access.md)
- [ADR 0004](0004-cloudflare-native-isr.md)
