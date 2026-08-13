---
type: "Architecture Decision Record"
title: "ADR 0005: domain と SEO の所有権"
description: "daiksud.meをHomeの公開originとcanonicalに定め、SEO metadataとanalyticsの所有権をHomeに置く。"
resource: "https://github.com/daiksudme/home/blob/main/docs/adr/0005-domain-and-seo-ownership.md"
tags: [home, adr, architecture, domain, seo, ownership]
status: stable
generated:
  by: "codex/gpt-5.6-sol"
  at: 2026-08-13T00:35:00Z
---

# ADR 0005: domain と SEO の所有権

## ステータス

承認済み

## 日付

2026-08-10

## コンテキスト

プロフィールの公開 identity と、Blog・Content の各 origin の役割を crawler と共有サービスへ明確に伝える必要がある。

## 決定

`https://daiksud.me/` を Home の公開 origin と canonical authority にする。Home は自身の discovery metadata を所有し、外部 resource には所有 origin が定める canonical URL でリンクする。production の page view は Cloudflare Web Analytics で計測する。公開する URL と metadata の具体的な契約は [Home SEO 仕様](../features/home-seo.feature)を正本とする。

## 検討した選択肢

- Blog origin を main identity にする構成
- 外部 SEO service に metadata を委譲する構成
- 各公開 origin が自身の discovery metadata を所有する構成

## 結果

Home、Blog、Content の URL authority が分離され、crawler は Home と記事をそれぞれの canonical origin で識別できる。

## 関連文書

- [Home SEO 仕様](../features/home-seo.feature)
- [Home ページ仕様](../features/home-page.feature)
- [Blog の feed と SEO ADR](https://github.com/daiksudme/blog/blob/main/docs/adr/0007-feed-and-seo.md)
