---
type: "Documentation Index"
title: "文書"
description: "Homeの受け入れ基準となる振る舞い仕様と技術判断への入口を提供する。"
resource: "https://github.com/daiksudcom/home/blob/main/docs/README.md"
tags: [home, documentation, index]
status: stable
generated:
  by: "codex/gpt-5.6-sol"
  at: 2026-08-11T21:36:04Z
---

# 文書

このディレクトリは `daiksud.com` の受け入れ基準と技術判断を管理します。

## 文書の責務

- [振る舞い仕様](features/README.md)は、現在有効な観測可能かつ検証可能な契約の正本です。具体的な値、URL、入出力、エラー、境界条件を Gherkin で定義します。
- [Architecture Decision Records](adr/README.md)は、技術判断の背景、理由、選択肢、トレードオフ、結果を記録します。受け入れ条件を繰り返さず、対応する振る舞い仕様を参照します。

観測可能な契約について両者の記述が異なる場合は、振る舞い仕様を現在の仕様として扱います。

Home は [Content](https://github.com/daiksudcom/content) から最新記事を取得し、[Blog](https://github.com/daiksudcom/blog) の恒久 URL へ読者を案内します。
