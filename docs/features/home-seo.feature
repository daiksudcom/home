@home @seo @analytics
Feature: Home の正規 URL と発見情報を公開する
  訪問者と crawler として
  Home の唯一の公開 identity を認識するために
  canonical、robots、sitemap、analytics を利用したい

  Scenario: Home の canonical を取得する
    When crawler が "https://daiksud.com/" を取得する
    Then canonical URL は "https://daiksud.com/" である
    And Open Graph URL は "https://daiksud.com/" である

  Scenario: robots 方針を取得する
    When crawler が "https://daiksud.com/robots.txt" を取得する
    Then Home の公開ページを crawl できる
    And sitemap の絶対 URL を発見できる

  Scenario: sitemap を取得する
    When crawler が "https://daiksud.com/sitemap.xml" を取得する
    Then canonical の "https://daiksud.com/" を発見できる

  Scenario: production の利用を計測する
    When 訪問者が production の Home を表示する
    Then production analytics で privacy-preserving な page view を観測できる
