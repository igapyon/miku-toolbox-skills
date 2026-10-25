# miku-toolbox-skills

小さな実用機能を会話から呼び出す Skill-only の Agent Skills 製品です。インストールする Skill 名は `igapyon-miku-toolbox` です。Skill 内のパスワード生成ヘルパーには Node.js 22 以上が必要です。

`local-html-tools` の機能を段階的に移植し、一つの Skill にまとめます。最初の対象はパスワード生成です。

## 現在の状態

初版のパスワード生成、テスト、バンドル、ローカル配備コマンドを整備しました。Node.js 22・24・26 で35件のテストが通り、Node.js 24 で作成した配布 ZIP を Node.js 22 でも検証済みです。同期コマンドは一時ディレクトリで検証しています。

- 製品名: `miku-toolbox`
- リポジトリ名: `miku-toolbox-skills`
- Skill 名: `igapyon-miku-toolbox`
- 製品形態: Skill-only
- 実行環境: Node.js
- バージョン: `0.4.0`（Git タグ候補 `v0.4.0`）
- 配布 ZIP: `igapyon-miku-toolbox-skills-0.4.0.zip`
- 初版機能: パスワード生成。既定は8文字・全4文字種・1件生成

機能の仕様は [仕様書](docs/specification.md)、未完了作業は [TODO](TODO.md)、参照元と実装構成案は [開発メモ](docs/development.md) に記録します。

## 利用

Node.js 22 以上を用意し、`npm run sync:codex` でこのリポジトリの Skill を `.codex/skills/` に配備します。このコマンドは既存の `.codex/skills/igapyon-miku-toolbox/` を正本から置き換えます。一般の Agent Skills 環境では、`skills/igapyon-miku-toolbox/` を環境の Skill 配置先へコピーします。

会話では次のように使います。

```text
igapyon-miku-toolbox でパスワードを生成
16文字、記号なしで生成
もう一つ
```

Skill 名だけで呼び出すと、利用可能な機能を案内します。

生成ヘルパーは次のように実行できます。

```sh
node skills/igapyon-miku-toolbox/lib/password-generator.mjs
node skills/igapyon-miku-toolbox/lib/password-generator.mjs --length 16 --exclude symbols
```

引数を省略すると既定条件で1件生成します。`--exclude` は `upper`、`lower`、`digits`、`symbols` を複数回指定できます。

## 開発コマンド

開発用の検証・ZIP 作成には Node.js 22 以上と `zip`、`unzip` コマンドを使います。追加の npm 依存パッケージはありません。

```sh
npm test
npm run build
npm run build:bundle
npm run build:bundle:zip
npm run sync:codex
```

`npm run build` はテスト後に ZIP を作り、ZIP 内のヘルパーを一時配置して実行します。テストと同期の検証では一時ディレクトリを使います。

## リポジトリの運用

- Skill 正本は `skills/igapyon-miku-toolbox/` に配置します。
- `workplace/` はローカル作業用です。Git 管理対象は `workplace/.gitkeep` のみです。
- `.codex/skills/` はローカル配備先として扱い、Git 管理から除きます。
- `node_modules/`、`dist/`、`bundle/`、`coverage/`、ローカルログは生成物として除外します。
- `npm run build:bundle:zip` は `bundle/igapyon-miku-toolbox-skills-0.4.0.zip` を生成します。
- GitHub 上のリポジトリ作成、push、PR、タグ、Release の操作は利用者が担当します。

共通設計の参照先は [miku-soft Reference](docs/miku-soft-reference.md) です。

## ライセンス

[Apache License 2.0](LICENSE)
