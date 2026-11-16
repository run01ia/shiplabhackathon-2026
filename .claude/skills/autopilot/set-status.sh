#!/usr/bin/env bash
# Issue の Project ステータスを変える。Done のときは Issue も閉じる
# (既定ブランチが main なので、dev へのマージでは `Closes #N` が効かないため)。
# 使い方: set-status.sh <Issue番号> Backlog|Ready|"In progress"|"In review"|Done [閉じるときのコメント]
set -euo pipefail
R=run01ia/shiplabhackathon-2026
N="$1"; ST="$2"; MSG="${3:-dev にマージ済み}"
case "$ST" in
  Backlog) O=f75ad846;; Ready) O=61e4505c;; "In progress") O=47fc9ee4;;
  "In review") O=df73e18b;; Done) O=98236657;;
  *) echo "不明なステータス: $ST" >&2; exit 1;;
esac
IID=$(gh project item-list 1 --owner run01ia --format json --limit 200 --jq ".items[]|select(.content.number==$N)|.id")
[ -n "$IID" ] || { echo "#$N は Project にありません" >&2; exit 1; }
gh project item-edit --id "$IID" --project-id PVT_kwHODGX05s4Brr7P --field-id PVTSSF_lAHODGX05s4Brr7Pzhp9d_0 --single-select-option-id "$O" >/dev/null
echo "#$N → $ST"
if [ "$ST" = Done ]; then
  gh issue close "$N" -R "$R" -c "$MSG" >/dev/null || echo "#$N を閉じられませんでした (手で閉じる)" >&2
fi
