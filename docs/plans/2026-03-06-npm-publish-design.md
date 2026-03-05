# NPM Publishing Pipeline Design

## Overview

Publish `@matangot/react-pdf-viewer` to the npm public registry via GitHub Actions, triggered by git tags.

## Workflow

Single GitHub Actions workflow: `.github/workflows/publish.yml`

**Trigger:** Push of tags matching `v*`

**Steps:**

1. Checkout code
2. Setup Node.js v20 with npm registry auth
3. `npm ci`
4. `npm test`
5. `npm run build`
6. `npm publish --access public`

## Developer Flow

```bash
npm version patch    # or minor/major — bumps version, creates git tag
git push && git push --tags   # triggers CI -> tests -> publish
```

## Setup Required

- Generate an npm access token (Automation type) at npmjs.com
- Add it as `NPM_TOKEN` secret in GitHub repo settings (Settings > Secrets > Actions)
- Ensure `@matangot` scope exists on npm (first publish may need `npm login` locally)

## Future Considerations

- Migrate from npm to pnpm (separate task)
- Add coverage thresholds if needed
- Add GitHub Packages publishing if org use case arises
