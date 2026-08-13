# GitHub、Deploy、Release の運用

## 操作モデル

Homeはfeature flagを保持しません。flagの状態はflags repositoryが正本として管理し、Homeはそれを参照して機能のオンオフを決めます。

したがってHomeで起こるproduction操作はDeployだけです。

- **Deploy**: PRがmergeされるたびに必ず実施する。`main`のrevisionをWorkerへ反映する。**機能は公開しない。** 不具合修正の反映は許容する。
- **Product Release**: flags repositoryでflagをONにすること。**Homeを再deployせずに機能が公開される。**

`Deploy` workflowはproduction全体で直列化されています。実行中runは完了させ、concurrency queueには最新のpending runだけを残します。Deploy中にmergeされた中間revisionは次のDeployへ畳み込まれます。

## Version、tag、Deployの関係

PRがmergeされると、単一のDeploy workflowが次を順に実行します。

1. PRタイトルの型に対して`package.json#version`が正しいかを検証する
2. tagを打ってpushする
3. WorkerをDeployする
4. deployment receiptを記録する
5. SemVer coreが上がっていればGitHub Releaseを作る

tag打ちとDeployを別workflowに分けていないのは、`GITHUB_TOKEN`によるpushが新しいworkflow runを起動しないためです。分離するとPATが必要になります。

| PRタイトル | 必須bump | 打たれるtag | GitHub Release |
| --- | --- | --- | --- |
| `feat:` / `perf:` | minor | `vX.Y.Z` | 作る |
| `fix:` / `revert:` | patch | `vX.Y.Z` | 作る |
| breaking change | major（`0.x`の間はminor） | `vX.Y.Z` | 作る |
| `docs:` `chore:` `ci:` `test:` `build:` `refactor:` `style:` | なし | `vX.Y.Z+YYYYMMDDHHmmss` | 作らない |

minor bumpは「**flagでこの機能をオンオフできるようにした**」というcapabilityの宣言です。機能はまだOFFであり、公開はflags側の操作で行います。

ビルド番号`+YYYYMMDDHHmmss`はmerge commitのcommitter時刻をUTC変換したものです。実行時刻ではなくcommitの属性なので、**再実行しても同じtagになります**。これがリトライでtagを打ち直さないことを構造的に保証します。

SemVerはbuild metadataを優先順位の比較に使いません。したがって最新tagを辞書順で判定してはならず、deployment receiptとcommit topologyで判定します。

## 不変条件: 最新tag == 本番バージョン

Deploy workflowの最後に`drift-check.mjs`が最新tagとdeployment receiptを比較し、乖離していればCIを失敗させます。

乖離が起こるのはproduction smoke失敗による自動rollbackのときだけです。このときtagは残り本番は直前versionへ戻るため、次のいずれかで解消します。

- 外部要因だった場合: `workflow_dispatch`で**同じtagのまま**再Deployする
- 内部要因だった場合: 新しいversionとtagでfix-forwardする

**tagは削除も移動もしません。**

## Deployのリトライ

外部要因と判断できる失敗だけを**最大3回**リトライします。

| 分類 | 例 | 挙動 |
| --- | --- | --- |
| 外部要因 | Cloudflare APIの5xx、429、タイムアウト、接続リセット、DNS解決失敗 | 指数バックオフで最大3回 |
| 内部要因 | build失敗、test失敗、version不一致、401/403、429以外の4xx | 即座にfailしfix-forward |

## Branchとlabel

versionへの影響は**PRタイトル**から決まります。squash mergeによりタイトルがcommit件名として履歴に残るためです。branch名はlabel付けの補助にのみ使います。

Dependabot branchだけはbranch規約を免除します。Labelerは`pull_request_target`でbase側の設定だけをAPIから読み、PRコードをcheckoutしません。

## 初期設定

workflowは初期状態で停止します。次の順序で有効化します。

1. この変更をmergeし、`CI success`と`Policy success`のcheck名をGitHubへ登録する。
2. `gh infra validate .github/settings.yml`と`gh infra plan .github/settings.yml`をreviewしてからapplyする。labelとrulesetはadditive reconciliationなので、未宣言の既存設定を削除しない。
3. merge queueを有効化しsquashを選択する。**同時mergeによるversion衝突はmerge queueの再検証だけが防げます。**
4. reviewerを追加しない`production` Environmentを作る。PRのmergeを本番承認として扱う。
5. Astro Cloudflare adapter、Worker source、production Wrangler設定を実装する。version preview URLを有効にする。
6. 下記の変数とsecretを設定し、Deployを手動実行してpreviewとproduction smokeを確認する。
7. `DEPLOY_ENABLED=true`にする。

Repository variables:

| 名前 | 用途 |
| --- | --- |
| `DEPLOY_ENABLED` | `true`のときだけmainをDeployする |
| `CLOUDFLARE_ACCOUNT_ID` | Workerを所有するaccount |
| `CLOUDFLARE_WORKER_NAME` | production Worker名 |
| `PRODUCTION_ORIGIN` | smoke対象の`https://daiksud.me` |

Environment secrets:

| Environment | 名前 | 最小権限 |
| --- | --- | --- |
| `production` | `CLOUDFLARE_DEPLOY_API_TOKEN` | 対象Workerのversion upload/deployと設定read |

**Deploy tokenにFlagship権限を与えてはいけません。** flagを変更できるのはflags repositoryだけです。GitHub workflowのdefault permissionはreadで、すべてのthird-party Actionはfull commit SHAで固定します。

## Feature実装とflag参照

flagを伴う機能を追加するPRは`feat:`とし、minor bumpを行います。flag定義そのものはflags repositoryの`registry/<key>.json`へ追加し、`consumers[].minVersion`にこのminor versionを記録します。

Workerはrequestごとに一度だけflagを評価し、その結果を分岐とcache keyへ再利用します。未定義key、評価失敗、型不一致、**flag serviceへの到達不能**はすべて`off`として扱います。自分のversionが`minVersion`より古い場合も`off`とします。

## Repository settings

`.github/settings.yml`はlabels、main/tag ruleset、squash merge、Release immutability、ActionsのSHA pinningを宣言します。現在のgh-infra schemaはmerge queue ruleを管理しないため、queue自体はGitHub repository settingsで手動有効化します。GitHub Actionsだけがprotected `v*` tagを作成できます。設定変更時も必ず`gh infra plan`をreviewし、workflowから自動applyしません。
