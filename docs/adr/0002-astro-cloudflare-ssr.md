---
type: "Architecture Decision Record"
title: "ADR 0002: Astro と Cloudflare による SSR"
description: "Astro 7のserver outputとCloudflare adapterを採用し、Cloudflare WorkersでSSRすることを定める。"
resource: "https://github.com/daiksudcom/home/blob/main/docs/adr/0002-astro-cloudflare-ssr.md"
tags: [home, adr, architecture, astro, cloudflare, ssr]
timestamp: 2026-08-10T06:56:15Z
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

Cloudflare Service Binding と native Workers Caching を Astro の server output に統合できる。Content が cold failure の場合も Home 固有情報を SSR できる。

## 関連文書

- [Home ページ仕様](../features/home-page.feature)
- [ADR 0004](0004-cloudflare-native-isr.md)
