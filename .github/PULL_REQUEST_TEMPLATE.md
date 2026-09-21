# Pull Request

Closes #<issue-number> — replace with the actual issue (required).

## What
<!-- 1-3 sentences: what changed and why -->

## How to test
- [ ] <!-- steps for reviewer -->
- [ ] `git status --porcelain` is clean of secrets (no `.env`)

## Checklist
- [ ] Branch is off fresh `main`, named `<type>/<issue>-<slug>`
- [ ] Linked issue will auto-close on merge (`Closes #`)
- [ ] After merge I will delete the remote + local branch (`git push origin --delete <branch>` + `git branch -d <branch>`)
