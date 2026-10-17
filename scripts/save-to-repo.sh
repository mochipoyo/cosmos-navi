#!/usr/bin/env bash
# 宇宙実測ナビ：更新したデータをリポジトリに保存します（GitHub Actions から使います）。
# 使い方： bash scripts/save-to-repo.sh "コミットメッセージ" ファイル1 ファイル2 ...
# - 変更がなければ何もしません（成功）。
# - ほかの更新と重なったときは、最新を取り込んで最大3回まで保存し直します。
# - 3回とも失敗したら終了コード1（ワークフローを失敗として通知します。サイトの公開は続けます）。
set -u
msg="$1"; shift
for f in "$@"; do if [ -f "$f" ]; then git add -- "$f"; fi; done
if git diff --cached --quiet; then echo "変更はありません"; exit 0; fi
git config user.name "github-actions[bot]"
git config user.email "41898290+github-actions[bot]@users.noreply.github.com"
git commit -q -m "$msg" || { echo "::error::コミットできませんでした"; exit 1; }
for i in 1 2 3; do
  if git push -q 2>/dev/null; then echo "保存しました（${i}回目）"; exit 0; fi
  echo "保存が重なりました。最新を取り込んで再試行します（${i}/3）"
  if ! git pull -q --rebase --autostash; then
    git rebase --abort 2>/dev/null || true
    # データファイルが競合した場合は、今回生成した内容を優先して取り込み直す
    git pull -q --rebase -X theirs --autostash || { git rebase --abort 2>/dev/null || true; }
  fi
  sleep $((i * 3))
done
echo "::error::リポジトリへの保存に3回失敗しました（公開は今回のデータで続けます）"
exit 1
