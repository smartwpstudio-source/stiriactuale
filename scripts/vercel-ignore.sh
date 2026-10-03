#!/bin/bash
# Vercel „Ignored Build Step”: exit 0 = fără build, exit 1 = build.
# Fără build când s-au schimbat doar lucruri care nu ajung pe site: documentație,
# scripturi, workflow-uri, migrații, arhiva de poze a pipeline-ului.
# Build-ul se plătește la minut-procesor — vezi vercel.json.
prev="$VERCEL_GIT_PREVIOUS_SHA"
[ -n "$prev" ] && git cat-file -e "$prev" 2>/dev/null || exit 1
git diff --quiet "$prev" HEAD -- . ':!docs' ':!scripts' ':!.github' ':!drizzle' ':!*.md' \
  ':!content/locuri/locuri.json' ':!content/locuri/surse.json'
