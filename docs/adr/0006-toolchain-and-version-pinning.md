---
type: "Architecture Decision Record"
title: "ADR 0006: ツールチェーンとバージョン固定"
description: "Node.js、pnpm、Astro、Vite+を標準とし、build toolと共有packageを厳密なversionに固定する。"
resource: "https://github.com/daiksudcom/home/blob/main/docs/adr/0006-toolchain-and-version-pinning.md"
tags: [home, adr, architecture, toolchain, version-pinning]
status: stable
generated:
  by: "codex/gpt-5.6-sol"
  at: 2026-08-10T07:07:01Z
---

# ADR 0006: ツールチェーンとバージョン固定

## ステータス

承認済み

## 日付

2026-08-10

## コンテキスト

Home を単独で build、検証、Cloudflare Workers へ deploy し、同じ入力から同じ成果物を再現する必要がある。

## 決定

Node.js 24、pnpm 11、Astro 7、Vite+ を標準とする。Wrangler は `4.107.0` 以上から採用した一つのパッチ版、`@astrojs/cloudflare` と build dependency も採用パッチ版をマニフェストと lockfile に正確に固定する。`@daiksudcom/content` と `@daiksudcom/ui` は厳密な SemVer を指定する。実行コードは Web 標準 API を基準とする。

## 検討した選択肢

- version range で自動更新する構成
- 全 repository が一つの lockfile を共有する構成
- repository ごとに toolchain と依存を固定する構成

## 結果

Home の pull request は Home だけを build し、Blog との同時変更を必要としない。Home と Blog は共有 package の異なる version を安全に利用できる。

## 関連文書

- [Home ISR 仕様](../features/home-isr.feature)
- [Content](https://github.com/daiksudcom/content)
- [UI](https://github.com/daiksudcom/ui)
