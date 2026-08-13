---
type: "Architecture Decision Record"
title: "ADR 0006: ツールチェーンとバージョン固定"
description: "Node.js、pnpm、Astroと品質検査toolを標準とし、依存関係を厳密なversionに固定する。"
resource: "https://github.com/daiksudme/home/blob/main/docs/adr/0006-toolchain-and-version-pinning.md"
tags: [home, adr, architecture, toolchain, version-pinning]
status: stable
generated:
  by: "codex/gpt-5.6-sol"
  at: 2026-08-13T00:35:00Z
---

# ADR 0006: ツールチェーンとバージョン固定

## ステータス

承認済み

## 日付

2026-08-10

## コンテキスト

Home を単独で build、検証、Cloudflare Workers へ deploy し、同じ入力から同じ成果物を再現する必要がある。

## 決定

Node.js 24.16.0 以降、pnpm 11、Astro 7.2.0 を標準とする。Astro と品質検査 tool は `package.json` に exact version を指定し、repository 固有の lockfile で解決結果を固定する。開発、build、型検査、lint、整形は pnpm script から各 tool を直接実行する。将来導入する Wrangler は `4.107.0` 以上から採用した一つの patch version、`@astrojs/cloudflare` とほかの build dependency も採用した exact version に固定する。`@daiksudme/content` と `@daiksudme/ui` を導入するときも厳密な SemVer を指定する。実行コードは Web 標準 API を基準とする。

## 検討した選択肢

- version range で自動更新する構成
- 全 repository が一つの lockfile を共有する構成
- 複数の品質検査 tool を統合する追加の runner を導入する構成
- repository ごとに toolchain と依存を固定する構成

## 結果

repository ごとに固定した toolchain と lockfile から再現可能な成果物を生成できる。各 tool を pnpm script から直接実行するため、失敗した検査とその責務が明確になる。Home と Blog は共有 package の異なる version を安全に利用できる。

## 関連文書

- [ADR 0001: Home のリポジトリ境界](0001-repository-boundary.md)
- [Content package 仕様](https://github.com/daiksudme/content/blob/main/docs/features/content-package.feature)
- [UI](https://github.com/daiksudme/ui)
