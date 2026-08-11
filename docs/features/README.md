---
type: "Gherkin Specification Index"
title: "振る舞い仕様"
description: "Homeページ、ISR、SEOの観測可能な振る舞いを定義するGherkin仕様への索引である。"
resource: "https://github.com/daiksudcom/home/blob/main/docs/features/README.md"
tags: [home, gherkin, specification, index]
status: stable
generated:
  by: "codex/gpt-5.6-sol"
  at: 2026-08-11T21:36:04Z
---

# 振る舞い仕様

各ファイルでは Gherkin キーワードを英語、シナリオ本文を日本語で記述します。

振る舞い仕様は、現在有効な観測可能かつ検証可能な契約の正本です。具体的な値、URL、入出力、エラー、境界条件を記述し、内部の実現方式とその理由は [Architecture Decision Records](../adr/README.md) に委ねます。

- [Home ページ](home-page.feature)
- [Home の ISR](home-isr.feature)
- [Home の SEO](home-seo.feature)

各ファイルは一つの観測可能な能力を扱い、`@home` と能力別タグで分類します。
