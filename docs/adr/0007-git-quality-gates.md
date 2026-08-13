---
type: "Architecture Decision Record"
title: "ADR 0007: Git 品質ゲート"
description: "stagedファイル、コミットメッセージ、pull requestタイトルをローカルとCIで検証する。"
resource: "https://github.com/daiksudme/home/blob/main/docs/adr/0007-git-quality-gates.md"
tags: [home, adr, architecture, git-hooks, conventional-commits]
status: stable
generated:
  by: "codex/gpt-5.6-sol"
  at: 2026-08-13T00:35:00Z
---

# ADR 0007: Git 品質ゲート

## ステータス

承認済み

## 日付

2026-08-13

## コンテキスト

リポジトリ全体を対象にする CI の品質検査に加え、コミット時に変更中のファイルを短時間で検査し、履歴と pull request の表題を機械的に一貫させる必要がある。ローカルの Git hook は開発者へ早いフィードバックを返せる一方、明示的に省略できるため、それだけでは共有履歴を保証できない。

## 決定

コミットメッセージと pull request のタイトルには Conventional Commits を採用し、Commitlint の conventional config で検証する。Husky を pnpm の `prepare` script から有効化し、`commit-msg` hook でコミットメッセージを検証する。`pre-commit` hook では lint-staged を実行し、staged ファイルだけを既存 tool の担当範囲に分け、整形してから lint する。整形結果の再 stage は lint-staged に委ねる。

CI は pull request のタイトルと base 以降の全コミットを個別に検証する。`main` への通常の fast-forward push では直前の revision から新しい `HEAD` までの追加コミットを検証する。直前の revision が all-zero、取得不能、または新しい `HEAD` の祖先でない場合は、履歴置換を含む検証範囲を安全に限定できない push として扱い、fail-closed で新しい `HEAD` から到達可能な全履歴を検証する。GitHub 形式の件名と two-parent topology を持つ pull request merge commit 本体だけは、検証済みタイトルを含む merge metadata として除外する。Dependabot が作成するコミットと pull request のタイトルにも dependency 種別を表す Conventional Commits prefix を設定する。型検査、未使用検出、build を含むリポジトリ全体の検証は引き続き CI と `pnpm validate` が担当する。

## 検討した選択肢

- Git hook だけでコミット規約を検証する構成
- CI だけで整形、lint、コミット規約を検証する構成
- pre-commit でリポジトリ全体の品質検査と build を実行する構成
- staged ファイルをローカルで検査し、共有履歴の規約を CI でも検証する構成

## 結果

通常のコミット操作で対象ファイルが整形・検査され、問題を共有前に発見できる。Git hook を省略したコミットも CI で検証され、pull request のタイトルを含めて一貫した履歴を維持できる。force-push や初回 push では全履歴の検証コストが発生するが、履歴の置換によって未検証コミットが共有されることはない。pre-commit は変更対象だけを扱うため応答時間を抑えられるが、リポジトリ全体の品質を確定するには `pnpm validate` または CI が必要である。

## 関連文書

- [ADR 0006: ツールチェーンとバージョン固定](0006-toolchain-and-version-pinning.md)
- [ローカル開発とコミット時の検査](../../README.md#コミット時の検査)
