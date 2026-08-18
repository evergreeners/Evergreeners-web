// ─── Academy Curriculum (single source for seeding the academy_lessons table) ──

export interface AcademyLessonSeed {
    id: string;
    week: number;
    weekTitle: string;
    title: string;
    duration: string;
    description: string;
    content: string;
    lab: string;
}

export const ACADEMY_LESSONS: AcademyLessonSeed[] = [
    // ── Week 1: Git Fundamentals ────────────────────────────────────────────────
    {
        id: '1.1',
        week: 1,
        weekTitle: 'Git Fundamentals',
        title: 'Why Git? (Understanding local repositories)',
        duration: '10:15',
        lab: 'intro1',
        description: 'An absolute zero-to-one guide to local version control.',
        content: `### Why local Git is your foundation

Git is not GitHub. Git is a local version control system that tracks the snapshots of your files. In this lesson, you will learn:
- How Git stores snapshots (not differences).
- The three stages of Git: **Working Directory**, **Staging Area**, and **Git Directory (Repository)**.
- Running \`git init\`, staging changes with \`git add\`, and creating history with \`git commit\`.
- Understanding the difference between unstaged, staged, and committed states.`,
    },
    {
        id: '1.2',
        week: 1,
        weekTitle: 'Git Fundamentals',
        title: "Writing Commit Messages That Don't Suck",
        duration: '08:45',
        lab: 'intro2',
        description: 'The anatomy of professional commit logs.',
        content: `### Commit message engineering

Your Git history is your resume. Learn how to write conventional commit messages that communicate clear intent.
- Why \`git commit -m "fix"\` or \`git commit -m "added files"\` destroys readability and developer collaboration.
- **Conventional Commits** structure: \`type(scope): description\` (e.g. \`feat(auth): add Paystack callback endpoint\`).
- Writing descriptive 50-character subject lines and detailed bodies when making complex updates.`,
    },
    {
        id: '1.3',
        week: 1,
        weekTitle: 'Git Fundamentals',
        title: 'Undoing Mistakes: reset, revert, and reflog',
        duration: '12:30',
        lab: 'rampup4',
        description: 'How to fix errors without losing your hard work.',
        content: `### The safety nets of Git

Every developer makes mistakes. Git provides tools to safely step back in time.
- \`git reset --soft\`: Uncommit files but keep changes in your staging area.
- \`git reset --hard\`: Nuclear option. Wipe changes. Learn when (and when NOT) to use it.
- \`git revert [commit]\`: Create a new commit that undoes the changes of a previous one. Safe for public branches.
- \`git reflog\`: The master log of all actions. How to recover even deleted commits.`,
    },

    // ── Week 2: GitHub Mechanics ───────────────────────────────────────────────
    {
        id: '2.1',
        week: 2,
        weekTitle: 'GitHub Mechanics',
        title: 'Forks, Pull Requests, and Remote Syncing',
        duration: '11:00',
        lab: 'remote1',
        description: 'Collab mechanics: upstream vs origin.',
        content: `### Collaboration under the hood

Working with remote servers requires mastering forks and pull requests.
- **Upstream vs Origin**: Origin is your copy of the fork. Upstream is the source-of-truth repo.
- Synchronizing local forks with the upstream repository using command line: \`git remote add upstream [url]\` and \`git fetch upstream\`.
- Branching strategies: creating clean branches off the latest upstream updates before making PRs.`,
    },
    {
        id: '2.2',
        week: 2,
        weekTitle: 'GitHub Mechanics',
        title: 'Portfolio READMEs that sell your work',
        duration: '09:15',
        lab: 'remote4',
        description: 'Designing landing pages for your repositories.',
        content: `### Writing README files that invite engagement

A repository without a clean README is a repository that doesn't exist to recruiters.
- Structuring your README: Title, description, quick start, installation, usage, and license.
- Using Markdown templates: including screenshots, badges, and tech stacks.
- Creating a personal Profile README: showcasing your developer identity on \`github.com/username/username\`.`,
    },
    {
        id: '2.3',
        week: 2,
        weekTitle: 'GitHub Mechanics',
        title: 'Pinned Repositories & Digital Gardens',
        duration: '07:30',
        lab: 'remote3',
        description: 'Curating your public profile.',
        content: `### Curating your developer workspace

Do not pin half-finished projects. Curate your public profile like an art gallery.
- Selection criteria: Pinned repositories should represent your best work, and have clean READMEs and commit graphs.
- Maintaining active logs: keeping a digital garden of projects you actively nurture.`,
    },

    // ── Week 3: Open Source Contribution ───────────────────────────────────────
    {
        id: '3.1',
        week: 3,
        weekTitle: 'Open Source Contribution',
        title: 'Finding Beginner-Friendly Issues',
        duration: '10:45',
        lab: 'rampup2',
        description: 'Locating repository entrance gates.',
        content: `### Navigating the open-source landscape

Where do you start? Finding the right issue is half the battle.
- Using GitHub search queries to locate beginner-friendly items: \`is:issue is:open label:"good first issue"\`.
- Highlighting Hacktoberfest tags, repository labels, and community boards.
- Reviewing issues to ensure active maintainers and helpful guidelines.`,
    },
    {
        id: '3.2',
        week: 3,
        weekTitle: 'Open Source Contribution',
        title: 'Reading a Codebase before editing',
        duration: '13:20',
        lab: 'move1',
        description: 'Familiarizing yourself with external architectures.',
        content: `### Becoming a codebase detective

Do not jump straight to editing. Read first.
- Locate the entry point: package.json, main script files, or routing sheets.
- Follow the imports: tracing how data flows between helper scripts and index files.
- Understanding test structures: reviewing existing tests to understand input/output expectations.`,
    },
    {
        id: '3.3',
        week: 3,
        weekTitle: 'Open Source Contribution',
        title: 'Handling Reviews and PR Feedback',
        duration: '08:15',
        lab: 'move2',
        description: 'Communicating with maintainers professionally.',
        content: `### The collaboration feedback loop

PR rejected? That is part of open source. Here is how to handle reviews.
- Best practices in communication: thank the maintainer, explain your solution, and don't take critiques personally.
- Re-triggering checks: making updates on your branch to automatically update the open PR.
- Staying active: what to do if a PR goes stale.`,
    },

    // ── Week 4: Consistency Systems ────────────────────────────────────────────
    {
        id: '4.1',
        week: 4,
        weekTitle: 'Consistency Systems',
        title: 'Building Sustainable Habits (Habit Loops)',
        duration: '09:40',
        lab: 'remoteAdvanced3',
        description: 'Keeping coding routines sustainable.',
        content: `### Constructing consistency systems

Green contribution graphs are not built overnight. They are built through habit triggers.
- Understanding the Habit Loop: Cue, Craving, Response, and Reward.
- Integrating a coding slot: setting a daily 30-minute block that is non-negotiable.
- Setting goals: using Evergreeners goals feature to track streaks without pressure.`,
    },
    {
        id: '4.2',
        week: 4,
        weekTitle: 'Consistency Systems',
        title: 'Accountability Pods & Communities',
        duration: '07:15',
        lab: 'remoteAdvanced4',
        description: 'Leaning on your peers for consistency.',
        content: `### Leveraging social proof

You do not have to walk this path alone. Accountability pods keep you on track.
- Accountability checks: Daily updates in your 4-5 person WhatsApp or Discord pods.
- Code reviews: Reviewing each other's code to stay on top of the learning materials.`,
    },
    {
        id: '4.3',
        week: 4,
        weekTitle: 'Consistency Systems',
        title: 'Capstone PR Verification',
        duration: '11:50',
        lab: 'remote5',
        description: 'Unlocking graduation certificates.',
        content: `### Graduation and verification

Your final task is to merge one real contribution to any external GitHub repository.
- Contribution guidelines: Fix a bug, write documentation, or implement a minor feature on a repository you don't own.
- PR must be merged on GitHub.
- Submit the PR URL on this page to trigger verification and receive your graduation badge & cert!`,
    },
];