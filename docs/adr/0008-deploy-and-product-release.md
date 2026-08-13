---
type: "Architecture Decision Record"
title: "ADR 0008: Deploy と Product Release の分離"
description: "mainのmergeごとにDeployし、PRタイトルからversionとtagを決め、機能公開をflags repositoryへ委譲する。"
resource: "https://github.com/daiksudme/home/blob/main/docs/adr/0008-deploy-and-product-release.md"
tags: [home, adr, architecture, deploy, release, semver]
status: stable
generated:
  by: "codex/gpt-5.6-sol"
  at: 2026-08-13T17:00:00Z
---

# ADR 0008: Deploy と Product Release の分離

## ステータス

承認済み

## 日付

2026-08-13

## コンテキスト

本番環境へ修正と機能コードを継続的に届けながら、利用者が新機能を使い始める時点を独立して選び、監査可能にする必要がある。Deployを機能公開と同義にすると、機能ごとにコードの再Deployが必要になり、rollbackもWorker全体へ及ぶ。

一方で、機能公開の状態をHome自身が持つと、公開操作のたびにHomeのmergeとDeployが必要になり、Deployの成否と公開の成否が同じworkflowで絡み合う。

## 決定

feature flagはHomeで管理せず、flags repositoryを正本とする。Homeはflagを参照するだけで、変更する権限を持たない。したがってHomeで起こるproduction操作はDeployだけであり、Product Releaseはflags repositoryでflagをONにする操作として、**Homeを再Deployせずに**完了する。

PRのmergeはすべてDeployの対象とする。Deployは既存機能の不具合を修正できるが、新しい機能を公開しない。minor bumpは「flagでその機能をオンオフできるcapabilityを出荷した」という宣言であり、機能自体はOFFのままである。

versionへの影響はPRタイトルのConventional Commits型から決める。squash mergeによりタイトルがcommit件名として履歴へ残り、branch名はmerge後に失われるためである。`feat:`と`perf:`はminor、`fix:`と`revert:`はpatch、breaking changeは`0.x`ではminor、`1.x`以降ではmajorとする。`docs:` `chore:` `ci:` `test:` `build:` `refactor:` `style:`はversionを変更してはならない。

versionを上げない変更もDeployし、`vX.Y.Z+YYYYMMDDHHmmss`のtagを打つ。build識別子はmerge commitのcommitter時刻をUTCへ変換したものであり、実行時刻ではなくcommitの属性なので、再実行しても同じtag名へ解決する。build識別子付きtagはGitHub Releaseを作らない。

tag打ちとDeployは単一のworkflowで実行する。`GITHUB_TOKEN`によるpushは新しいworkflow runを起動しないため、分離するとPATなしにtag pushからDeployを起動できない。

最新tagとproduction versionが一致することを不変条件とし、Deployの最後に`drift-check.mjs`がdeployment receiptと比較して検証する。SemVerはbuild metadataを優先順位へ含めないため、最新tagは辞書順ではなくSemVer precedenceとcommit topologyで判定する。

Deployのリトライは外部要因と判断できる失敗だけを最大3回に限る。5xx、429、タイムアウト、接続リセット、DNS解決失敗を外部要因とし、build失敗、test失敗、401/403、429以外の4xxは即座にfailさせる。リトライはtagを打ち直さない。Deployの失敗はtagを削除も移動もせず、`workflow_dispatch`による同一tagの再Deployか、新しいversionによるfix-forwardで解消する。

production操作は一つのconcurrency groupで直列化し、実行中のDeployを完了させながら最新pendingだけを残す。`DEPLOY_ENABLED`を明示的な導入gateとする。

## 検討した選択肢

- Deployのたびに新機能も公開する構成
- Home内のRelease descriptorとflag操作workflowで機能を公開する構成（旧設計。Cloudflare Flagship credentialをHomeが保持し、`RELEASE_ENABLED`で守った独立のRelease workflowがcache purgeと45秒の伝播待機を行った上でflagを更新していた）
- tag専用workflowとDeploy workflowを分離する構成
- 実行時刻からbuild識別子を作る構成
- flagsをflags repositoryの正本とし、Homeは参照だけを行う構成

## 結果

コードの配送と機能公開を別のrepositoryの別の操作として扱え、機能公開でHomeのDeployが発生しない。Deploy用tokenはflagを変更できないため、Deployの障害が公開状態へ波及しない。旧設計が抱えていたCloudflare Flagship credentialの管理、cache purgeの契約、45秒の伝播待機はHomeから完全になくなり、flags repositoryへ一元化される。

versionの正しさはPRタイトルに依存するため、同時mergeによる衝突はmerge queueの再検証で防ぐ必要がある。build識別子付きtagは増えるが、GitHub Releaseはcapabilityの変化にだけ対応する。flagを参照するWorkerは、未定義key、評価失敗、型不一致、flag serviceへの到達不能をすべて`off`として扱う必要がある。

## 関連文書

- [Deploy と Product Release 仕様](../features/home-delivery.feature)
- [Cloudflare native ISR](0004-cloudflare-native-isr.md)
- [GitHub、Deploy、Release の運用](../../.github/README.md)
- [ADR 0007: Git 品質ゲート](0007-git-quality-gates.md)
