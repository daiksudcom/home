# language: ja
@home @content
機能: Home から人物と最新記事を知る
  訪問者として
  Daiki Sudo と公開活動への入口を一画面で得るために
  プロフィール、主要リンク、最新ブログ記事を見たい

  ルール: 基本情報は Content の状態から独立して表示する

    シナリオ: Home を表示する
      もし訪問者が "https://daiksud.com/" を開く
      ならばDaiki Sudo のプロフィールを表示する
      かつGitHub の公開プロフィールへのリンクを表示する
      かつ"https://blog.daiksud.com/" への Blog リンクを表示する

    シナリオ: Content がコールド障害である
      前提Content から有効な最新記事を取得できない
      もしHome を SSR する
      ならばプロフィール、GitHub リンク、Blog リンクを表示する
      かつ最新記事領域を利用不能状態として明示する
      かつページは HTTP ステータス 200 で応答する

  ルール: 最新記事は Content の公開順を保持する

    シナリオ: 最新6件を表示する
      前提Content API に公開済み Blog 記事が8件ある
      もしHome を SSR する
      ならば公開日時の降順で最初の6件を表示する
      かつ各項目は title、description、公開日、tags を表示する
      かつ各項目は "https://blog.daiksud.com/{slug}/" にリンクする

    シナリオ: 公開記事が6件未満である
      前提Content API に公開済み Blog 記事が3件ある
      もしHome を SSR する
      ならば3件すべてを公開日時の降順で表示する
