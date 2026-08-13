---
type: "Architecture Decision Record"
title: "ADR 0004: Cloudflare native ISR"
description: "Cloudflare native Workers CachingをISR配信層に採用し、TTL、stale配信、resource tag purgeを定める。"
resource: "https://github.com/daiksudme/home/blob/main/docs/adr/0004-cloudflare-native-isr.md"
tags: [home, adr, architecture, cloudflare-native-isr]
status: stable
generated:
  by: "codex/gpt-5.6-sol"
  at: 2026-08-13T04:30:00Z
---

# ADR 0004: Cloudflare native ISR

## ステータス

承認済み

## 日付

2026-08-10

## コンテキスト

Home は edge cache の速度を保ちながら、Content release 後に最新記事を再生成し、一時障害時にも利用可能である必要がある。

## 決定

production Wrangler 設定で `cache.enabled=true` とし、Cloudflare native Workers Caching を ISR 相当の配信層にする。Content が定義する resource tag を応答へ付け、release 時に変更された resource の tag を purge する。複数 resource に由来するページには、由来するすべての tag を付ける。デプロイ間で古い応答を再利用しないため、Worker versionをcache keyへ含める。Feature Flagで応答が変わるrouteはrequest中に一度だけ評価したflag variationもcache keyへ含める。flagに依存する応答はflag variationがcache keyに含まれるため、flags repository側の状態変更でcacheを共有しない。したがってflag変更にHomeからの明示的なpurgeは不要であり、Flagshipの伝播が終わり次第、新しいvariationのcache keyが自然に使われる。具体的なcache policyと観測可能な更新動作は[Home ISR仕様](../features/home-isr.feature)を正本とする。

## 検討した選択肢

- 全要求を SSR する構成
- Astro の実験的 cache API
- Cloudflare native cache と resource-scoped purge

## 結果

edge からキャッシュ済み応答を配信しながら、期限切れ応答の再検証、更新障害時の stale 配信、Content release による resource 単位の無効化が可能になる。default-offコードをDeployした場合も既存variantのcacheを返し、Release後にoffのcacheがon利用者へ漏れることを防げる。cache policy の変更は利用者が観測する鮮度と障害耐性に影響するため、振る舞い仕様と同時に更新する。

## 関連文書

- [Home ISR 仕様](../features/home-isr.feature)
- [Content cache 仕様](https://github.com/daiksudme/content/blob/main/docs/features/content-cache.feature)
- [ADR 0008: Deploy と Product Release](0008-deploy-and-product-release.md)
