# language: ja
@home @seo @analytics
機能: Home の正規 URL と発見情報を公開する
  訪問者と crawler として
  Home の唯一の公開 identity を認識するために
  canonical、robots、sitemap、analytics を利用したい

  シナリオ: Home の canonical を取得する
    もしcrawler が "https://daiksud.com/" を取得する
    ならばcanonical URL は "https://daiksud.com/" である
    かつOpen Graph URL は "https://daiksud.com/" である

  シナリオ: robots 方針を取得する
    もしcrawler が "https://daiksud.com/robots.txt" を取得する
    ならばHome の公開ページを crawl できる
    かつsitemap の絶対 URL を発見できる

  シナリオ: sitemap を取得する
    もしcrawler が "https://daiksud.com/sitemap.xml" を取得する
    ならばcanonical の "https://daiksud.com/" を発見できる

  シナリオ: production の利用を計測する
    もし訪問者が production の Home を表示する
    ならばCloudflare Web Analytics が privacy-preserving な page view を記録する
