# Conflu2md - Confluence Markdown Downloader

Confluence ページを Markdown 形式でダウンロードする Chrome 拡張機能です。

## 機能

- **複数のコンテンツ取得モード**
  - スペースホーム配下: スペース全体のページツリーを取得
  - 今見ているページ配下: 現在表示中のページの子ページを取得
  - 階層指定: 同階層のページから選択して取得

- **高度なMarkdown変換**
  - テーブル（ヘッダー行・データ行の正確な処理）
  - コードブロック・コードスニペット
  - 見出し（H1-H6）
  - リスト（順序付き・順序なし）
  - 引用ブロック
  - 画像・添付ファイル

- **Confluenceマクロ対応**
  - info/note/warning/tip マクロ
  - expand（折りたたみ）マクロ
  - status（ステータスラベル）マクロ
  - quote（引用）マクロ
  - panel マクロ
  - anchor（アンカー）マクロ
  - table of contents マクロ

- **パフォーマンス最適化**
  - 並列処理による高速化
  - 大量ページでの負荷制御（最大50,000件制限）
  - 低速モードオプション
  - プログレスバー表示

- **ユーザビリティ**
  - 階層構造の視覚的表示
  - チェックボックスによる一括選択・個別選択
  - 日本語・英語の国際化対応
  - 認証情報の安全な保存

## インストール

1. このリポジトリをクローンまたはダウンロード
2. `npm install` で依存関係をインストール
3. `npm run build` でビルド
4. Chrome の拡張機能管理画面で「デベロッパーモード」を有効化
5. 「パッケージ化されていない拡張機能を読み込む」で `dist` フォルダを指定

## 開発

### 必要な環境
- Node.js 16+
- npm または yarn

### セットアップ
```bash
git clone https://github.com/ambit1977/conflu2md.git
cd conflu2md
npm install
```

### ビルド
```bash
# 開発ビルド
npm run build

# リリースパッケージ作成
npm run release
```

### テスト
```bash
npm test
```

## 使用方法

1. Confluence ページで拡張機能アイコンをクリック
2. 認証情報を設定（メールアドレス + API トークン）
3. 取得モードを選択
4. ページツリーを読み込み
5. ダウンロードしたいページを選択
6. 「選択したページをダウンロード」をクリック

### API トークンの取得

1. [Atlassian API tokens](https://id.atlassian.com/manage-profile/security/api-tokens) にアクセス
2. 「Create API token」をクリック
3. 生成されたトークンをコピーして拡張機能に設定

## 技術仕様

- **Manifest Version**: 3（最新のChrome拡張仕様）
- **言語**: JavaScript (ES6 modules)
- **ビルドツール**: Webpack, Gulp
- **テストフレームワーク**: Jest
- **パッケージマネージャー**: npm

## ファイル構成

```
├── src/                    # ソースコード
│   ├── api.js             # Confluence API クライアント
│   ├── authManager.js     # 認証管理
│   ├── contentTree.js     # ページツリー取得
│   ├── markdownConverter.js # HTML→Markdown変換
│   ├── progressManager.js # 進捗管理
│   └── ...
├── test/                  # テストファイル
├── icons/                 # アイコンファイル
├── _locales/             # 国際化リソース
├── manifest.json         # Chrome拡張機能マニフェスト
├── popup.html           # ポップアップUI
└── popup.js             # UIロジック
```

## ライセンス

MIT License

## 貢献

プルリクエストやイシューの報告を歓迎します。

## 既知の問題

- 非常に大きなページ（画像多数）の場合、変換に時間がかかる場合があります
- 一部の複雑なConfluenceマクロは完全に対応していない場合があります

## 更新履歴

### v1.2
- テーブル変換の改善（ヘッダー行とデータ行の正確な処理）
- 複数のConfluenceマクロ対応を追加
- マクロ処理の正規表現を改善

### v1.1
- 階層指定モードの追加
- パフォーマンス改善
- 国際化対応

### v1.0
- 初回リリース
- 基本的なMarkdown変換機能
- ページツリー表示機能
