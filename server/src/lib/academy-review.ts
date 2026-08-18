// ─── Gemini PR Auto-Review ─────────────────────────────────────────────────────
// After a capstone PR passes structural verification, run a lightweight
// Gemini review (grade + strengths + improvements) and persist it so the
// certificate page can show the student the outcome.

import { Octokit } from 'octokit';

export interface PullRequestReview {
    score: number;         // 1–10
    strengths: string[];
    improvements: string[];
    summary: string;
}

const PR_URL_REGEX = /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/i;

/**
 * Fetch a merged PR's metadata + diff via the user's token and grade it.
 * Returns null if AI review is unavailable (no API key) or generation fails.
 */
export async function reviewPullRequest(
    prUrl: string,
    token: string,
    username: string,
): Promise<PullRequestReview | null> {
    const match = prUrl.match(PR_URL_REGEX);
    if (!match) return null;
    const [, owner, repo, pullNumberStr] = match;
    const pullNumber = Number(pullNumberStr);

    const octokit = new Octokit({ auth: token });
    const { data: pr } = await octokit.rest.pulls.get({ owner, repo, pull_number: pullNumber });
    const commits = await octokit.rest.pulls.listCommits({ owner, repo, pull_number: pullNumber });

    let diff = '';
    try {
        const compare = await octokit.request('GET /repos/{owner}/{repo}/compare/{base}...{head}', {
            owner,
            repo,
            base: pr.base.sha,
            head: pr.head.sha,
            headers: { accept: 'application/vnd.github.diff' },
        });
        diff = typeof compare.data === 'string' ? compare.data : JSON.stringify(compare.data);
    } catch {
        diff = pr.body || '(diff unavailable)';
    }

    const diffSnippet = diff.slice(0, 12000);

    const commitMessages = commits.data
        .map((c) => `- ${c.commit?.message?.split('\n')[0] || ''}`)
        .join('\n');

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.warn('AI PR review skipped (missing GEMINI_API_KEY).');
        return null;
    }

    const prompt = `You are a fair, senior open-source maintainer grading a student's first-ever external pull request for the Evergreeners Academy capstone.

The student (@${username}) contributed to:
- Repo: ${owner}/${repo}
- PR #${pullNumber}: "${pr.title || '(no title)'}"
- PR body: ${pr.body || '(no description provided)'}
- Adds ${pr.additions ?? '?'} / removes ${pr.deletions ?? '?'} lines across ${pr.changed_files ?? '?'} files, ${commits.data.length} commits.
- Commit messages:\n${commitMessages || '(none found)'}

Pull request diff (truncated):
${diffSnippet}

Grade this PR as an open-source maintainer would review a first contribution. Criteria:
1. Documentation & description (was the PR explained well?)
2. Commit message quality and logical commits
3. Diff clarity, scope, and reviewability
4. Code quality, tests, and following existing conventions
5. Overall enthusiasm of a genuine first-time contributor

Respond with STRICT JSON only, no markdown fences. Shape:
{
  "score": <integer 1-10>,
  "summary": "<one sentence overall>",
  "strengths": ["<2-4 short strengths>"],
  "improvements": ["<2-4 kind, specific suggestions>"]
}
Be encouraging but honest — the student is a beginner; constructive > harsh.`;

    try {
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' },
        });
        const text = result.response.text();

        let parsed: any;
        try {
            parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
        } catch {
            parsed = { score: null, summary: text, strengths: [], improvements: [] };
        }

        const clampedScore = Math.max(1, Math.min(10, Number(parsed?.score) || 5));
        return {
            score: clampedScore,
            summary: parsed?.summary || 'Review complete.',
            strengths: Array.isArray(parsed?.strengths) ? parsed.strengths.slice(0, 4) : [],
            improvements: Array.isArray(parsed?.improvements) ? parsed.improvements.slice(0, 4) : [],
        };
    } catch (err) {
        console.error('Gemini PR review failed:', err);
        return null;
    }
}