#!/usr/bin/env bash
# Issue を起票して Project に入れ、Status / Priority / Size を設定する。
# 使い方: new-issue.sh "タイトル" 本文ファイル P0|P1|P2 XS|S|M|L Ready|Backlog|"In progress" [assignee] [milestone]
set -euo pipefail
R=run01ia/shiplabhackathon-2026; PID=PVT_kwHODGX05s4Brr7P
T="$1"; BODY="$2"; PR="$3"; SZ="$4"; ST="$5"; AS="${6:-}"; MS="${7:-Phase 2: MVP コア}"
sid(){ case "$1" in Backlog) echo f75ad846;; Ready) echo 61e4505c;; "In progress") echo 47fc9ee4;; "In review") echo df73e18b;; Done) echo 98236657;; esac; }
pid(){ case "$1" in P0) echo 79628723;; P1) echo 0a877460;; P2) echo da944a9c;; esac; }
zid(){ case "$1" in XS) echo 6c6483d2;; S) echo f784b110;; M) echo 7515a9f1;; L) echo 817d0097;; esac; }
args=(-R $R --title "$T" --body-file "$BODY")
[ -n "$AS" ] && args+=(--assignee "$AS")
gh api repos/$R/milestones --jq '.[].title' | grep -qx "$MS" || gh api repos/$R/milestones -f title="$MS" >/dev/null
args+=(--milestone "$MS")
URL=$(gh issue create "${args[@]}" | tail -1)
IID=$(gh project item-add 1 --owner run01ia --url "$URL" --format json --jq '.id')
gh project item-edit --id "$IID" --project-id $PID --field-id PVTSSF_lAHODGX05s4Brr7Pzhp9d_0 --single-select-option-id "$(sid "$ST")" >/dev/null
gh project item-edit --id "$IID" --project-id $PID --field-id PVTSSF_lAHODGX05s4Brr7Pzhp9eBw --single-select-option-id "$(pid "$PR")" >/dev/null
gh project item-edit --id "$IID" --project-id $PID --field-id PVTSSF_lAHODGX05s4Brr7Pzhp9eB0 --single-select-option-id "$(zid "$SZ")" >/dev/null
echo "$URL"
