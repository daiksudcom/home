@home @isr @cloudflare @cache
Feature: Home を Cloudflare キャッシュから再生成する
  運用者として
  高速な Home と現在の Content を両立するために
  native Workers Caching を ISR として運用したい

  Background:
    Given production Worker で cache.enabled が true である
    And Blog 由来の応答には cache tag "content-blog-current" が付く
    And browser TTL は0秒、edge TTLは300秒、SWRは3600秒、stale-if-errorは86400秒である

  Scenario: cache miss を SSR して保存する
    Given Worker version 固有 cache key に Home の応答がない
    When 訪問者が Home を要求する
    Then Worker は Content から最新記事を取得して SSR する
    And 応答を Cloudflare cache へ保存する
    And CF-Cache-Status で MISS を観測できる

  Scenario: cache hit を返す
    Given 同じ Worker version 固有 key に有効な Home 応答がある
    When 訪問者が Home を要求する
    Then Cloudflare は Worker の SSR 処理を迂回して応答する
    And CF-Cache-Status で HIT を観測できる

  Scenario: 期限切れ Home を background 更新する
    Given edge TTLを過ぎSWR期間内の Home 応答がある
    When 訪問者が Home を要求する
    Then stale 応答を直ちに返す
    And background で現在の Content から Home を再生成する

  Scenario: Content 障害時に stale Home を返す
    Given 86400秒以内の stale Home 応答がある
    And 再生成時の Content 取得が失敗する
    When 訪問者が Home を要求する
    Then 利用可能な stale 応答を返す

  Scenario: Content release 後に Home を再生成する
    Given Content release が "content-blog-current" を purge した
    When 訪問者が Home を要求する
    Then 現在の Blog resource revision から Home を SSR して保存する
