# Google Maps API セットアップガイド

このアプリケーションはGoogle Maps JavaScript APIを使用しています。以下の手順でAPIキーを取得・設定してください。

## 1. Google Cloud Consoleでプロジェクトを作成

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成（または既存のプロジェクトを選択）

## 2. Maps JavaScript APIを有効化

1. 左側のメニューから「APIとサービス」→「ライブラリ」を選択
2. 「Maps JavaScript API」を検索
3. 「有効にする」をクリック

## 3. APIキーを作成

1. 左側のメニューから「APIとサービス」→「認証情報」を選択
2. 「認証情報を作成」→「APIキー」をクリック
3. 作成されたAPIキーをコピー

## 4. APIキーを制限（推奨）

セキュリティのため、以下の制限を設定することを推奨します：

### アプリケーションの制限
- **HTTP リファラー（ウェブサイト）** を選択
- ウェブサイトの制限を追加：
  - `localhost:*`（開発環境）
  - `*.pages.dev`（Cloudflare Pages）
  - あなたのカスタムドメイン

### APIの制限
- 「キーを制限」を選択
- 「Maps JavaScript API」のみを選択

## 5. ローカル開発環境での設定

プロジェクトルートの `.dev.vars` ファイルを編集：

```bash
GOOGLE_MAPS_API_KEY=あなたのAPIキー
```

**注意**: `.dev.vars` ファイルは `.gitignore` に含まれているため、Gitにコミットされません。

## 6. 本番環境での設定

Cloudflare Pagesにデプロイする場合：

```bash
# Cloudflare Pagesの環境変数として設定
npx wrangler pages secret put GOOGLE_MAPS_API_KEY --project-name webapp
```

プロンプトでAPIキーを入力します。

## 7. 動作確認

1. サーバーを再起動：
```bash
npm run build
pm2 restart webapp
```

2. ブラウザでアクセス：
```
http://localhost:3000
```

3. 地図が正しく表示されることを確認

## トラブルシューティング

### 「Google Maps APIキーが設定されていません」というエラー

- `.dev.vars` ファイルが存在するか確認
- `GOOGLE_MAPS_API_KEY=` の形式で記述されているか確認
- サーバーを再起動したか確認

### 地図が表示されない（「このページでは Google マップが正しく読み込まれませんでした」）

- APIキーが正しいか確認
- Maps JavaScript APIが有効化されているか確認
- APIキーの制限設定を確認（制限が厳しすぎないか）
- ブラウザのコンソールでエラーメッセージを確認

### 料金について

- Google Maps JavaScript APIは月額$200の無料クレジットがあります
- 通常の使用では無料範囲内で利用可能
- 詳細：https://cloud.google.com/maps-platform/pricing

## 参考リンク

- [Google Maps Platform](https://developers.google.com/maps)
- [Maps JavaScript API ドキュメント](https://developers.google.com/maps/documentation/javascript)
- [APIキーのベストプラクティス](https://developers.google.com/maps/api-security-best-practices)
