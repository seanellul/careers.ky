---
description: Build, verify, and deploy the application
---

Run the deployment workflow for careers.ky:

1. **Pre-flight checks**: Run `git status` to verify working tree is clean. If there are uncommitted changes, warn and ask whether to proceed.

2. **Build**: Run `next build` (via `npm run build`) and verify it completes with no errors.

3. **Post-build**: Report the build output — note any warnings, bundle size info, or issues.

4. **Push**: Ask the user to confirm, then push the current branch to origin.

5. **Summary**: Report what was deployed (branch, latest commit, build status).

If any step fails, stop and report the error — do not continue to the next step.
