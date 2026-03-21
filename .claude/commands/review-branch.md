---
description: Review the current branch against main
---

Perform a structured review of the current branch compared to main:

1. **Branch info**: Show current branch name, number of commits ahead of main, and any commits behind.

2. **Commit log**: List all commits on this branch since diverging from main with short hashes and messages.

3. **Changes summary**: Summarize the files changed, grouped by type (new, modified, deleted). Note the overall scope of changes.

4. **Code review**: Review the diff for:
   - Bugs or logic errors
   - Security issues (SQL injection, XSS, missing auth checks, exposed secrets)
   - Missing error handling at API boundaries
   - Performance concerns
   - Leftover debug code (console.log, TODO comments)

5. **Merge readiness**: Check for merge conflicts with main. Give an overall assessment: ready to merge, needs fixes, or needs discussion.

Present findings in a clear, actionable format with file paths and line numbers.
