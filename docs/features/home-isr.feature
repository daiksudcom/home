# language: ja
@home @isr @cloudflare @cache
機能: Home を Cloudflare キャッシュから再生成する
  運用者として
  高速な Home と現在の Content を両立するために
  native Workers Caching を ISR として運用したい

  背景:
    前提production Worker で cache.enabled が true である
    かつBlog 由来の応答には cache tag "content-blog-current" が付く
    かつbrowser TTL は0秒、edge TTLは300秒、SWRは3600秒、stale-if-errorは86400秒である

  シナリオ: cache miss を SSR して保存する
    前提Worker version 固有 cache key に Home の応答がない
    もし訪問者が Home を要求する
    ならばWorker は Content から最新記事を取得して SSR する
    かつ応答を Cloudflare cache へ保存する
    かつCF-Cache-Status で MISS を観測できる

  シナリオ: cache hit を返す
    前提同じ Worker version 固有 key に有効な Home 応答がある
    もし訪問者が Home を要求する
    ならばCloudflare は Worker の SSR 処理を迂回して応答する
    かつCF-Cache-Status で HIT を観測できる

  シナリオ: 期限切れ Home を background 更新する
    前提edge TTLを過ぎSWR期間内の Home 応答がある
    もし訪問者が Home を要求する
    ならばstale 応答を直ちに返す
    かつbackground で現在の Content から Home を再生成する

  シナリオ: Content 障害時に stale Home を返す
    前提86400秒以内の stale Home 応答がある
    かつ再生成時の Content 取得が失敗する
    もし訪問者が Home を要求する
    ならば利用可能な stale 応答を返す

  シナリオ: Content release 後に Home を再生成する
    前提Content release が "content-blog-current" を purge した
    もし訪問者が Home を要求する
    ならば現在の Blog resource revision から Home を SSR して保存する
