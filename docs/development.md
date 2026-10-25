# 開発メモ

## 状態

2026-10-26 時点で、パスワード生成 Skill、Node.js ヘルパー、テスト、バンドル、ローカル配備コマンドを整備しました。初版のローカル実装・検証と配布 ZIP の作成は完了しています。

初期確認時のリポジトリには `LICENSE` のみがあり、作業ツリーはクリーンでした。

## 互換性の参照元

- リポジトリ: <https://github.com/igapyon/local-html-tools>
- 確認日: 2026-10-26
- 確認コミット: `9e4e8fcb71ddecc055fcc0add6b75c97df70e9d9`
- [既定値と規則の説明](https://github.com/igapyon/local-html-tools/blob/9e4e8fcb71ddecc055fcc0add6b75c97df70e9d9/docs/password/README.md)
- [画面の既定値](https://github.com/igapyon/local-html-tools/blob/9e4e8fcb71ddecc055fcc0add6b75c97df70e9d9/docs/password/password-gen-src.html)
- [生成処理](https://github.com/igapyon/local-html-tools/blob/9e4e8fcb71ddecc055fcc0add6b75c97df70e9d9/docs/password/src/password-gen/js/main.js)

上記3ファイルにローカルの未コミット変更がないことを確認しました。

ローカル checkout の HEAD は上記参照コミットと一致します。参照元の `LICENSE` は Apache-2.0 で、生成処理の JavaScript に個別の著作権ヘッダーはありません。初版ヘルパーは文字集合と振る舞いを参照して書き直し、上流ソースをそのまま複製していません。

## miku-soft の参照

- 確認日: 2026-10-26
- 参照元リポジトリ: <https://github.com/igapyon/igapyon-agent-skills>
- 確認コミット: `019b6c18dd92381cd3bff354c2ed0aa03d292ec9`
- 主に使う手順: `references/40-agent-skills-workflow.md` の Skill-only Product Convention
- 併せて確認した手順: concept/naming、new project、repository operations

インストール済み `igapyon-miku-soft-developer` の `SKILL.md`、architecture、concept/naming、Agent Skills workflow、Agent Skills basic design が、このコミットのファイルと一致することを確認しました。

共通文書への導線は [miku-soft Reference](miku-soft-reference.md) にまとめます。

## 姉妹プロジェクトの確認

ローカルの `miku-ms-office-skills` の README とファイル構成を確認しました。

取り入れる構成は、リポジトリ名の `-skills` とインストールする Skill 名を分けること、`skills/<skill-name>/` を正本とすること、一つの Skill から機能を振り分けることです。

同プロジェクトは既存の変換 CLI/runtime をまとめる構成です。今回の初版は、Node.js の実行用ヘルパーを Skill 内に持つ Skill-only として設計します。姉妹プロジェクトからは skill 名の分離、配布バンドルの配置、名前付きローカル配備、リリース ZIP の考え方を採用します。runtime artifacts、runtime smoke、複数機能向け reference index は採用しません。

## 実装構成

- `skills/igapyon-miku-toolbox/SKILL.md`: Skill の起動条件、機能選択、参照先
- `skills/igapyon-miku-toolbox/references/password-generation.md`: 文字集合、入力規則、CLI 契約
- `skills/igapyon-miku-toolbox/lib/password-generator.mjs`: 暗号学的乱数を使う生成処理と CLI
- `skills/igapyon-miku-toolbox/LICENSE`: 配布物に含める Apache-2.0 本文。ルートの `LICENSE` との一致をテストする
- `tests/`: ヘルパーの動作と配布物の内容を検証するコード
- `scripts/`: バンドル、ZIP 検査、`.codex/skills/` への同期と共通の配布ファイル検査
- `.github/workflows/`: Node.js 22/24 のテスト・ビルド CI と GitHub Release asset workflow

パスワード生成の実装は、入力検証、文字列生成、入出力の境界を確認できる構成です。乱数取得には `node:crypto` の `randomInt` を使います。

## 初版の実装決定

- 初版の作業開始時には `0.1.0` を置いていました。現在の製品バージョンは `0.4.0`、タグ規約は `v0.4.0`、配布 ZIP は `igapyon-miku-toolbox-skills-<version>.zip` です。
- Node.js 公式リリース情報を2026-10-26に確認しました。保守中 LTS の Node.js 22 を最低対応版、Node.js 24 を最新 LTS とし、CI は両方を対象にします。
- `package.json` は npm 公開用ではなく、バンドルとローカル配備のコマンド用です。`private: true` を維持します。
- helper は Skill 内の JavaScript ファイルとして同梱し、`node` で直接実行します。成功時はパスワード1行、失敗時は日本語エラーを標準エラーへ出力します。
- 生成インデックスは採用しません。Skill 本体から一つの参照文書へ直接リンクします。
- Node.js の公式情報: <https://github.com/nodejs/Release#release-schedule>、<https://nodejs.org/en/about/previous-releases>

## 検証結果（2026-10-26）

- Node.js `22.23.4`、`24.18.0`、`26.12.1` で全35件のテストが成功しました。
- Node.js `24.18.0` で `npm run build` が成功し、`bundle/igapyon-miku-toolbox-skills-0.1.0.zip` を生成しました。
- 作成した ZIP を Node.js `22.23.4` で検証し、固定した必須ファイルの一時配置から既定パスワードを生成できました。
- インストール元と生成バンドルの両方について、`skill-creator` の `quick_validate.py` が `Skill is valid!` を返しました。
- CI と Release workflow の YAML、および埋め込み shell の構文をローカルで検証しました。GitHub の hosted runner での実行は未実施です。

テスト対象は全12種類の有効な文字種の組み合わせ、各最小長、使用可能文字数の前後、既定条件、入力エラーと CLI の出力・終了コードです。ZIP は必要な4ファイル、作業用ファイルの除外、入れ子の参照ディレクトリ、独立した一時配置からの実行を確認します。欠損・空ファイル・余分なルートを持つ ZIP は拒否します。

同期コマンドは一時ディレクトリ内で、古いファイルの除去、ほかの Skill の保持、繰り返し実行、必須ファイルが欠けた際の既存配備の保持を検証しました。リポジトリの `.codex/skills/` への実配備は行っていません。

一時配置で、macOS の別名パスやシンボリックリンク経由だと CLI が何も出力しない不具合を発見し、起動ファイルを実体パスで比較するよう修正しました。空白を含むパスとシンボリックリンク経由の回帰テストを追加しています。

## バージョン更新

- miku-scm の `version.status` で `package.json` を SemVer の権威ソースとして確認しました。更新前の値は `0.1.0` でした。
- 利用者の指定により `package.json` と製品文書を `0.4.0` に更新しました。対応タグ候補は `v0.4.0` です。
- 配布 ZIP は新しい版で再生成し、`bundle/igapyon-miku-toolbox-skills-0.4.0.zip` に出力します。
