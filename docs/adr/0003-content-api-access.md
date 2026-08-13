---
type: "Architecture Decision Record"
title: "ADR 0003: Content API へのアクセス"
description: "OpenAPIからHome用consumerを生成し、本番はService Binding、previewとローカルはHTTPSで記事を取得することを定める。"
resource: "https://github.com/daiksudme/home/blob/main/docs/adr/0003-content-api-access.md"
tags: [home, adr, architecture, content-api-access]
status: stable
generated:
  by: "codex/gpt-5.6-sol"
  at: 2026-08-13T04:30:00Z
---

# ADR 0003: Content API へのアクセス

## ステータス

承認済み

## 日付

2026-08-10

## コンテキスト

Home の production SSR と preview・ローカル開発は通信経路が異なるが、Content が公開する同じ OpenAPI contract に従って最新 Blog 記事を取得する必要がある。Content 固有の配布 package は設けない。

## 決定

Content の versioned OpenAPI document から Home 内に型と runtime validator を生成し、Blog 一覧 operation を呼ぶ薄い consumer を実装する。production SSR は Cloudflare Service Binding を使う custom Fetch transport、preview とローカルは `https://content.daiksud.me` または preview origin を使う HTTPS transport とする。どちらも同じ生成済みvalidatorでresponseを検証する。

## 検討した選択肢

- Home 固有の fetch と type を実装する構成
- 全環境で public HTTPS を使う構成
- Content package と交換可能な transport
- OpenAPIから各consumerを生成する構成

## 結果

production は Cloudflare 内の低遅延経路を使い、preview は同じ API contract を実 origin で検証できる。通信経路にかかわらず、Home は同じ検証済みの return type と error contract を扱う。Content packageのpublishを待つ必要はない一方、OpenAPI更新時には生成差分をreviewし、Homeが対応するmajor routeを明示する必要がある。

## 関連文書

- [Home ページ仕様](../features/home-page.feature)
- [ADR 0006: ツールチェーンとバージョン固定](0006-toolchain-and-version-pinning.md)
- [Content API 仕様](https://github.com/daiksudme/content/blob/main/docs/features/content-api.feature)
