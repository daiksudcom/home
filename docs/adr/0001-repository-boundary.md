---
type: "Architecture Decision Record"
title: "ADR 0001: Home のリポジトリ境界"
description: "Homeが所有する表示と配信の責務を、Blog、Content、UIの責務から分離することを定める。"
resource: "https://github.com/daiksudcom/home/blob/main/docs/adr/0001-repository-boundary.md"
tags: [home, adr, architecture, repository-boundary]
status: stable
generated:
  by: "codex/gpt-5.6-sol"
  at: 2026-08-11T21:36:04Z
---

# ADR 0001: Home のリポジトリ境界

## ステータス

承認済み

## 日付

2026-08-10

## コンテキスト

Home はプロフィールと主要な入口を提供し、Blog、Content、UI と異なる責務、変更頻度、デプロイ判断を持つ。

## 決定

`home` リポジトリは Home 公開 origin のアプリケーションと配信 release を独立して所有する。最新記事のデータは [Content](https://github.com/daiksudcom/content)、記事の公開ページは [Blog](https://github.com/daiksudcom/blog)、共有表示契約は [UI](https://github.com/daiksudcom/ui) が所有する。SSR、cache、SEO の設計判断はそれぞれの ADR で管理する。

## 検討した選択肢

- Home と Blog を一つの site release にする構成
- 四つの責務を monorepo の単一 version にする構成
- repository と release を責務ごとに分離する構成

## 結果

Home の変更だけを build、検証、デプロイでき、Blog、Content、UI の変更と同じ pull request を要求しない。

## 関連文書

- [Home の振る舞い仕様](../features/README.md)
- [ADR 0002: Astro と Cloudflare による SSR](0002-astro-cloudflare-ssr.md)
- [ADR 0004: Cloudflare native ISR](0004-cloudflare-native-isr.md)
- [ADR 0005: domain と SEO の所有権](0005-domain-and-seo-ownership.md)
- [ADR 0006: ツールチェーンとバージョン固定](0006-toolchain-and-version-pinning.md)
