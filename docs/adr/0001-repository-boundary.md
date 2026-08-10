---
type: "Architecture Decision Record"
title: "ADR 0001: Home のリポジトリ境界"
description: "Homeが所有する表示と配信の責務を、Blog、Content、UIの責務から分離することを定める。"
resource: "https://github.com/daiksudcom/home/blob/main/docs/adr/0001-repository-boundary.md"
tags: [home, adr, architecture, repository-boundary]
timestamp: 2026-08-10T06:56:15Z
---

# ADR 0001: Home のリポジトリ境界

## ステータス

承認済み

## 日付

2026-08-10

## コンテキスト

Home はプロフィールと主要な入口を提供し、Blog、Content、UI と異なる責務、変更頻度、デプロイ判断を持つ。

## 決定

`home` リポジトリは `daiksud.com` の表示、SSR、cache、canonical、robots、sitemap、analytics を所有する。最新記事は [Content](https://github.com/daiksudcom/content)、記事の公開ページは [Blog](https://github.com/daiksudcom/blog)、共有表示契約は [UI](https://github.com/daiksudcom/ui) が所有する。

## 検討した選択肢

- Home と Blog を一つの site release にする構成
- 四つの責務を monorepo の単一 version にする構成
- repository と release を責務ごとに分離する構成

## 結果

Home の変更だけを build、検証、デプロイできる。依存 package は厳密な version を選び、Blog の変更と同じ pull request を要求しない。

## 関連文書

- [Home ページ仕様](../features/home-page.feature)
- [Blog](https://github.com/daiksudcom/blog)
