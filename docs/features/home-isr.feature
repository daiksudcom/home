@home @isr @cloudflare @cache
Feature: Home を Cloudflare キャッシュから再生成する
  運用者として
  高速な Home と現在の Content を両立するために
  native Workers Caching を ISR として運用したい

  Scenario: production の cache policy を確認する
    When 訪問者が production の Home を要求する
    Then Cache-Control は "public, max-age=0" である
    And Cloudflare-CDN-Cache-Control は "public, max-age=300, stale-while-revalidate=3600, stale-if-error=86400" である
    And Blog 由来の応答の Cache-Tag は "content-blog-current" を含む

  Scenario: cache miss から現在の Home を返す
    Given 現在の Home deployment の応答が edge cache にない
    When 訪問者が Home を要求する
    Then 現在の Content の最新記事を含む Home 応答を返す
    And CF-Cache-Status で MISS を観測できる
    And 同じ Home URL の後続要求で CF-Cache-Status の HIT を観測できる

  Scenario: cache hit を返す
    Given 同じ Home URL に有効な応答が edge cache にある
    When 訪問者が Home を要求する
    Then cache 済みの Home 応答を返す
    And CF-Cache-Status で HIT を観測できる

  Scenario: deployment 間で cache を分離する
    Given 以前の Home deployment の応答が edge cache にある
    When 新しい Home version を deploy して初めて Home を要求する
    Then 以前の deployment の応答を返さない
    And 現在の Content の最新記事を含む Home 応答を返す
    And CF-Cache-Status で MISS を観測できる

  Scenario: 期限切れ Home を更新する
    Given edge TTLを過ぎSWR期間内の Home 応答がある
    When 訪問者が Home を要求する
    Then stale 応答を直ちに返す
    And 後続の Home 要求は現在の Content を反映した応答を返す

  Scenario: Content 障害時に stale Home を返す
    Given 86400秒以内の stale Home 応答がある
    And Home の更新に必要な Content を取得できない
    When 訪問者が Home を要求する
    Then 利用可能な stale 応答を返す

  Scenario: Content release 後に Home を再生成する
    Given 新しい Blog resource revision が production に昇格した
    And 以前の revision に由来する Home 応答が cache 済みである
    When Content release が "content-blog-current" を purge する
    And 訪問者が Home を要求する
    Then 現在の Blog resource revision の記事を含む Home 応答を返す
    And CF-Cache-Status で MISS を観測できる
    And 同じ Home URL の後続要求で CF-Cache-Status の HIT を観測できる
