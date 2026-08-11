@home @content
Feature: Home から人物と最新記事を知る
  訪問者として
  Daiki Sudo と公開活動への入口を一画面で得るために
  プロフィール、主要リンク、最新ブログ記事を見たい

  Rule: 基本情報は Content の状態から独立して表示する

    Scenario: Home を表示する
      When 訪問者が "https://daiksud.com/" を開く
      Then Daiki Sudo のプロフィールを表示する
      And GitHub の公開プロフィールへのリンクを表示する
      And "https://blog.daiksud.com/" への Blog リンクを表示する

    Scenario: 最新記事を取得できない
      Given Content から有効な最新記事を取得できない
      When 訪問者が "https://daiksud.com/" を要求する
      Then プロフィール、GitHub リンク、Blog リンクを表示する
      And 最新記事領域を利用不能状態として明示する
      And ページは HTTP ステータス 200 で応答する

  Rule: 最新記事は Content の公開順を保持する

    Scenario: 最新6件を表示する
      Given Content に公開済み Blog 記事が8件ある
      When 訪問者が "https://daiksud.com/" を要求する
      Then 公開日時の降順で最初の6件を表示する
      And 各項目は title、description、公開日、tags を表示する
      And 各項目は "https://blog.daiksud.com/{slug}/" にリンクする

    Scenario: 公開記事が6件未満である
      Given Content に公開済み Blog 記事が3件ある
      When 訪問者が "https://daiksud.com/" を要求する
      Then 3件すべてを公開日時の降順で表示する
