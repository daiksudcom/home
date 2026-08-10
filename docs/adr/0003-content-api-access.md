---
type: "Architecture Decision Record"
title: "ADR 0003: Content API へのアクセス"
description: "共通Content clientを採用し、本番はService Binding、previewとローカルはHTTPSで記事を取得することを定める。"
resource: "https://github.com/daiksudcom/home/blob/main/docs/adr/0003-content-api-access.md"
tags: [home, adr, architecture, content-api-access]
status: stable
generated:
  by: "codex/gpt-5.6-sol"
  at: 2026-08-10T07:07:01Z
---

# ADR 0003: Content API へのアクセス

## ステータス

承認済み

## 日付

2026-08-10

## コンテキスト

Home の production SSR と preview・ローカル開発は通信経路が異なるが、同じ型、schema、error contract で最新 Blog 記事を取得する必要がある。

## 決定

厳密な SemVer の `@daiksudcom/content` を使い、`createContentClient({ transport })` から `client.blog.list({ limit: 6 })` を呼ぶ。production SSR は Cloudflare Service Binding transport、preview とローカルは `https://content.daiksud.com` または preview origin の HTTPS transport を使う。client は Zod で response を検証する。

## 検討した選択肢

- Home 固有の fetch と type を実装する構成
- 全環境で public HTTPS を使う構成
- 共通 client と交換可能な transport

## 結果

production は Cloudflare 内の低遅延経路を使い、preview は同じ API contract を実 origin で検証できる。取得失敗はプロフィールを保つ unavailable state に変換される。

## 関連文書

- [Home ページ仕様](../features/home-page.feature)
- [Content package 仕様](https://github.com/daiksudcom/content/blob/main/docs/features/content-package.feature)
