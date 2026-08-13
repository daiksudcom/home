@home @delivery @release @cloudflare
Feature: Deploy と Product Release を独立して運用する
  運用者として
  修正を継続的に本番へ届けながら機能の公開時点を監査するために
  PR mergeごとのDeployとflags repositoryによるProduct Releaseを区別したい

  Background:
    Given feature flagの正本はflags repositoryである
    And Homeはflagを参照するだけで変更する権限を持たない
    And 未定義、評価失敗、型不一致、flag serviceへの到達不能はoffとして扱う

  Rule: PRのmergeは必ず最新の有効なWorkerへ収束する

    Scenario: mergeされたrevisionをDeployする
      Given PRがmainへsquash mergeされた
      When production deployを実行する
      Then そのexact commitから作ったimmutable Worker versionをproductionへ100% Deployする
      And flagの状態は変更しない
      And 既存機能の不具合修正は利用できる

    Scenario: Deployが続けて要求される
      Given 一つのproduction Deployが実行中である
      When mainに複数の更新が続けてmergeされる
      Then 実行中のDeployは中断しない
      And pendingには最新のmain revisionだけを残す
      And 完了後のproductionは最新の有効なmain revisionへ収束する

    Scenario: preview smokeとproduction smokeを検証する
      Given 新しいWorker versionをuploadした
      When preview URLとproduction originのsmokeを実行する
      Then "/" が成功応答を返す

    Scenario: production smokeが失敗する
      Given 直前のproduction Worker versionが記録されている
      When 新しいWorkerのproduction smokeが失敗する
      Then 直前のWorker versionへrollbackする
      And 打たれたtagは削除も移動もしない
      And drift checkは最新tagと本番versionの乖離を報告する

  Rule: versionはPRタイトルから決まる

    Scenario Outline: PRタイトルの型が必須bumpを決める
      Given base revisionのpackage versionは "<previous>" である
      When PRタイトルが "<title>" である
      Then package versionは "<next>" でなければならない

      Examples:
        | title                     | previous | next  |
        | feat: add profile section | 0.1.0    | 0.2.0 |
        | perf: cache the home page | 0.1.0    | 0.2.0 |
        | fix: correct the layout   | 0.1.0    | 0.1.1 |
        | revert: undo the section  | 0.1.0    | 0.1.1 |
        | feat!: drop legacy route  | 0.1.0    | 0.2.0 |
        | docs: explain deploy      | 0.1.0    | 0.1.0 |
        | chore: tidy config        | 0.1.0    | 0.1.0 |

    Scenario: 要求されたbumpを行っていないPR
      Given base revisionのpackage versionは "0.1.0" である
      And PRタイトルが "feat: add profile section" である
      When package versionが "0.1.1" のままである
      Then Policy checkは必須bumpの不一致として失敗する

  Rule: version、tag、GitHub Releaseが一対一に対応する

    Scenario: capabilityを出荷したmergeにtagとReleaseを作る
      Given SemVer coreを上げるPRがmergeされた
      When Deployが成功する
      Then そのrevisionへ "vX.Y.Z" のannotated tagを作る
      And 同じtagのGitHub Releaseを公開する
      And 対象機能はflagがOFFのため読者から観測できない

    Scenario: versionを変えないmergeにbuild識別子のtagを作る
      Given SemVer coreを変えないPRがmergeされた
      When Deployが成功する
      Then merge commitのcommitter時刻をUTC変換した "vX.Y.Z+YYYYMMDDHHmmss" のtagを作る
      And GitHub Releaseは作らない

    Scenario: 中断したDeployを同じrevisionで再実行する
      Given 直前のrunがtagを作った後に失敗した
      When 同じrevisionをworkflow_dispatchで再実行する
      Then 解決されるtag名は最初のrunと同一である
      And 既存tagを移動せず作り直さない
      And Deployだけをやり直す

    Scenario: 最新tagを辞書順で判定しない
      Given tag "v0.9.0" と "v0.10.0" が存在する
      When 最新tagを判定する
      Then SemVer precedenceにより "v0.10.0" を最新とする

  Rule: 機能の公開はflags repositoryだけが行う

    Scenario: flagをONにして機能を公開する
      Given 対象flagを参照するHomeのversionがproductionへDeploy済みである
      When flags repositoryで対象flagをONにする
      Then Homeを再Deployせずに機能が公開される
      And Homeのversionとtagは変化しない

    Scenario: 公開済み機能を停止する
      Given 一つの機能がProduct Release済みである
      When flags repositoryで対象flagをOFFにする
      Then 訪問者はflag導入前の振る舞いを観測する
      And Homeのproduction Worker versionは変化しない

  Rule: 失敗の分類がリトライを決める

    Scenario Outline: 外部要因だけをリトライする
      Given Deployが "<failure>" で失敗した
      When 失敗を分類する
      Then 挙動は "<behavior>" である

      Examples:
        | failure                       | behavior     |
        | Cloudflare APIの503            | 最大3回リトライ |
        | 429 Too Many Requests         | 最大3回リトライ |
        | 接続タイムアウト                 | 最大3回リトライ |
        | DNS解決失敗                     | 最大3回リトライ |
        | 401 Unauthorized              | 即座にfail    |
        | 403 Forbidden                 | 即座にfail    |
        | build失敗                      | 即座にfail    |

    Scenario: リトライはtagを打ち直さない
      Given Deployが外部要因でリトライされている
      When リトライが成功する
      Then 作成されたtagは一つだけである

  Rule: 導入gateが閉じている間は外部状態を変更しない

    Scenario: Deploy gateが無効である
      Given repository variable "DEPLOY_ENABLED" は "true" ではない
      When mainが更新される
      Then deploy workflowは意図的なskipを報告する
      And Cloudflare Worker、tag、GitHub Releaseを変更しない
