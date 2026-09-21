# Contributing to Evergreeners-web

Target branch for all contributions: **`main`**.

This is the agent + human workflow. Follow it exactly so issues, branches,
and PRs stay linked and cleanup actually happens.

## 1. Full workflow (issue → branch → PR → cleanup)

```
1. Create an issue      → describes WHAT + acceptance criteria
2. Create a branch      → from `main`, named `<type>/<issue>-<slug>`
3. Open a PR            → tied to the issue with `Closes #<n>`
4. Merge                → squash-merge into `main`
5. Delete the branch    → remote + local (do this AFTER merge)
```

### Step 1 — Create the issue first

No code without an issue. Use `gh`:

```bash
gh issue create \
  --title "feat: short description" \
  --body "## Context
...
## Acceptance
- [ ] ..."
```

Or use the templates in `.github/ISSUE_TEMPLATE/` (bug report / feature request).
Note the issue number (e.g. `#135`) — you need it for steps 2–3.

### Step 2 — Create a branch for the issue

Always branch off fresh `main`:

```bash
git fetch origin
git checkout main
git pull origin main
git checkout -b <type>/<issue>-<slug>
```

Branch naming:

| Type | Use for |
|------|---------|
| `feat/` | new feature |
| `fix/` | bug fix |
| `docs/` | docs only (this PR is `docs/135-contribution-workflow`) |
| `chore/` | tooling, CI, gitignore |
| `academy/` | Academy curriculum work |

Example:

```bash
git checkout -b docs/135-contribution-workflow
```

### Step 3 — Work, commit, push

Small atomic commits, conventional messages:

```bash
git status
git add <files>          # never `git add -A` blindly — check .env is ignored
git commit -m "docs: add contribution workflow (closes #135)"
git push -u origin HEAD
```

### Step 4 — Open a PR tied to the issue

The PR body **must** contain `Closes #<issue>` so merge auto-closes it:

```bash
gh pr create \
  --base main \
  --head docs/135-contribution-workflow \
  --title "docs: contribution workflow + automation onboarding" \
  --body "Closes #135

## What
...

## How to test
- [ ] ..."
```

A template is provided at `.github/PULL_REQUEST_TEMPLATE.md` — it
pre-fills the `Closes #` line. Just replace `<issue-number>`.

### Step 5 — After merge: delete remote + local branch

> Do NOT delete before merge — the PR needs the remote branch.

```bash
# Remote is auto-deleted if "auto-delete head branches" is on,
# otherwise delete explicitly:
git push origin --delete docs/135-contribution-workflow

# Then clean up locally:
git checkout main
git pull origin main
git branch -d docs/135-contribution-workflow   # -D only if unmerged
git fetch --prune                               # drop stale remote-tracking refs
```

Verify:

```bash
git branch -a | grep 135   # should return nothing
git status                 # should be clean on main
```

---

## 2. Evergreeners automation integration (Hack Club-style onboarding)

Goal: web signup → GitHub org invite → first PR → streak tracking.
Modeled on Hack Club's `draw-dino` → `hackclub/dinosaurs` flow.

```
[ Web signup ] --GitHub OAuth--> [ Better Auth ] --invite--> [ evergreeners org ]
      |                                                              |
      +--> POST /api/user/welcome-email                              +-- user accepts at
      +--> redirect /dashboard                                        |   github.com/orgs/evergreeners/invitation
                                                                     v
                                              [ welcome-seedlings PR ] → [ Academy / Quests verify ] → [ badge + streak ]
```

### Where it plugs in (current code)

| Stage | File |
|-------|------|
| GitHub OAuth + profile mapping | `server/src/auth.ts` (socialProviders.github, databaseHooks.user.create.after) |
| Signup buttons | `src/pages/auth/Signup.tsx` (signIn.social github) |
| Welcome email | `server/src/lib/email.ts` (sendWelcomeEmail) |
| Stats sync | `server/src/index.ts` (POST /api/user/sync-github) |
| User-token PR create | `src/lib/githubService.ts`, `src/pages/Generator.tsx` (createBranch → createOrUpdateFile → openPullRequest) |
| Quest PR verification | `server/src/lib/github.ts` (checkQuestProgress), `server/src/index.ts` (POST /api/quests/:id/check) |

### Org-invite automation (to be implemented)

Server needs a PAT with `admin:org` on the `evergreeners` org
(`GITHUB_ORG_ADMIN_TOKEN` — never commit it, see `.env.example`):

```ts
// pseudo-code for server/src/auth.ts databaseHooks.user.create.after
import { Octokit } from "octokit";
const octokit = new Octokit({ auth: process.env.GITHUB_ORG_ADMIN_TOKEN });
await octokit.rest.orgs.createInvitation({
  org: "evergreeners",
  invitee_id: ghUserId, // or `email:` for email invites
});
```

Rules:

- Invite by GitHub `username`, not email, when OAuth is used.
- GitHub requires the user to **accept** the invite (email or
  `github.com/orgs/evergreeners/invitation`) — it cannot be force-joined.
- Invites expire after 7 days — re-invite on next login if membership check fails:
  `GET /orgs/evergreeners/memberships/{username}` → `active`?
- Show an "Accept org invite" banner in Settings/Dashboard until `active`.
- On merge of the welcome PR, the existing badge pipeline
  (`server/src/badges/award-badges.ts` via sync-github / quest-check) awards
  the onboarding badge.

### Contributor repo ("branch to contribute to")

- **Code contributions:** branch off `main` in `evergreeners/Evergreeners-web`
  (this repo), PR back to `main` per §1.
- **First-PR onboarding (new members):** fork
  `evergreeners/welcome-seedlings` (proposed), add
  `members/<github-username>.md`, PR to its `main`. Academy verifies the merge,
  then the member is routed to real `Evergreeners-web` quests.
- Never commit directly to `main`. Never open a PR with no linked issue.

---

## 3. Agent scratch files (.gitignore)

Agent workflow temp output must not be committed. Ignored patterns
(see `.gitignore` → `Agent / workflow scratch`):

```
.agent/
.opencode/
.tool-output/
*.agent.log
agent-scratch/
```

If your tool writes elsewhere, either move it under one of the above or
append the pattern to `.gitignore` in the same PR that introduces the tool.

## 4. Checklist before requesting review

- [ ] Issue exists and PR body says `Closes #<n>`
- [ ] Branch is off fresh `main`, name matches `<type>/<issue>-<slug>`
- [ ] `npm run lint` / relevant tests pass (or note why skipped)
- [ ] No `.env`, tokens, or `*.tsbuildinfo` in the diff (`git status --porcelain`)
- [ ] After merge: remote + local branch deleted, `git fetch --prune` run
