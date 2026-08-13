---
type: "Architecture Decision Record Index"
title: "Architecture Decision Records"
description: "Homeのリポジトリ境界、SSR、Content API、ISR、SEO、ツールチェーン、Git品質ゲートに関する設計判断への索引である。"
resource: "https://github.com/daiksudme/home/blob/main/docs/adr/README.md"
tags: [home, adr, architecture, index]
status: stable
generated:
  by: "codex/gpt-5.6-sol"
  at: 2026-08-13T00:35:00Z
---

# Architecture Decision Records

| 番号 | 決定 | ステータス | 日付 |
| --- | --- | --- | --- |
| 0001 | [リポジトリ境界](0001-repository-boundary.md) | 承認済み | 2026-08-10 |
| 0002 | [Astro と Cloudflare による SSR](0002-astro-cloudflare-ssr.md) | 承認済み | 2026-08-10 |
| 0003 | [Content API へのアクセス](0003-content-api-access.md) | 承認済み | 2026-08-10 |
| 0004 | [Cloudflare native ISR](0004-cloudflare-native-isr.md) | 承認済み | 2026-08-10 |
| 0005 | [domain と SEO の所有権](0005-domain-and-seo-ownership.md) | 承認済み | 2026-08-10 |
| 0006 | [ツールチェーンとバージョン固定](0006-toolchain-and-version-pinning.md) | 承認済み | 2026-08-10 |
| 0007 | [Git 品質ゲート](0007-git-quality-gates.md) | 承認済み | 2026-08-13 |

実装前で、まだコードや利用者へ影響していない決定は、既存 ADR を直接改訂して `generated.at` を更新できます。実装後に変更が必要になった決定は、新しい ADR で置き換え関係を明示します。

ADR は判断の背景、理由、選択肢、トレードオフ、結果を記録します。具体的な値、URL、入出力、エラー、境界条件などの受け入れ条件は繰り返さず、対応する[振る舞い仕様](../features/README.md)を参照します。
