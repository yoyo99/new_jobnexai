# Deployment Pipeline

## Input

```
$ARGUMENTS
```

## Instructions

You are the **DevOps Agent** coordinated by the Orchestrator. Execute the deployment pipeline.

### Step 1: Pre-Deployment Checks

1. **Branch Verification**
   ```bash
   git branch --show-current
   ```
   - If on `main`: proceed to production deployment
   - If on feature branch: proceed to preview deployment

2. **Clean Working Tree**
   ```bash
   git status
   ```
   - If uncommitted changes exist: warn the user and ask to commit first

3. **CI Status Check**
   - Verify all tests pass locally:
     ```bash
     npm run lint
     npx tsc --noEmit
     npm run test:unit
     ```
   - If any check fails: STOP and report the failure

### Step 2: Build Verification

```bash
npm run build
```

- Verify the build completes without errors
- Check `dist/` directory exists and contains expected files
- Verify locale files are present in `dist/locales/`

### Step 3: Deploy

#### For Feature Branch (Preview)

```bash
git push -u origin $(git branch --show-current)
```

If GitHub Actions is configured, the CI pipeline will run automatically. Otherwise:
- Create a PR to `main` using: `gh pr create --fill`
- The preview deployment will be generated automatically by Netlify

#### For Main Branch (Production)

1. Verify CI has passed on the PR
2. Merge the PR:
   ```bash
   gh pr merge --squash
   ```
3. Netlify will auto-deploy from `main`

### Step 4: Post-Deployment Verification

After deployment completes:

1. **Health Check**
   - Verify the site loads correctly
   - Check console for JavaScript errors
   - Verify API endpoints respond

2. **Feature Verification**
   - Test the new feature in the deployed environment
   - Verify i18n works for all languages
   - Check mobile responsiveness

3. **Monitoring**
   - Check Sentry for new errors
   - Verify Supabase Edge Functions are healthy
   - Check Netlify function logs

### Step 5: Rollback Plan

If issues are found post-deployment:

1. **Quick Rollback**: Revert to previous Netlify deploy
   ```bash
   netlify rollback
   ```

2. **Code Rollback**: Revert the merge commit
   ```bash
   git revert <merge-commit-hash>
   git push origin main
   ```

### Step 6: Report

```markdown
# Deployment Report

- Branch: <branch>
- Type: Preview / Production
- Status: SUCCESS / FAILED
- URL: <deployment URL>
- Checks:
  - [ ] Build passed
  - [ ] Site loads correctly
  - [ ] New feature works
  - [ ] No new errors in Sentry
  - [ ] API endpoints healthy
```
