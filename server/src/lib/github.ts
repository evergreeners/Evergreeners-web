import { Octokit } from "octokit";

export async function getGithubContributions(username: string, token: string) {
    const query = `
        query($username: String!) {
            user(login: $username) {
                pullRequests(first: 0) {
                    totalCount
                }
                issues(first: 0) {
                    totalCount
                }
                repositoriesContributedTo(first: 100, contributionTypes: [COMMIT, ISSUE, PULL_REQUEST, REPOSITORY], orderBy: {field: UPDATED_AT, direction: DESC}) {
                    totalCount
                    nodes {
                        nameWithOwner
                        url
                        updatedAt
                        languages(first: 3, orderBy: {field: SIZE, direction: DESC}) {
                            edges {
                                size
                                node {
                                    name
                                    color
                                }
                            }
                        }
                    }
                }
                contributionsCollection {
                    contributionCalendar {
                        totalContributions
                        weeks {
                            contributionDays {
                                contributionCount
                                date
                            }
                        }
                    }
                }
            }
        }
    `;

    const response = await fetch("https://api.github.com/graphql", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "User-Agent": "Evergreeners-App"
        },
        body: JSON.stringify({ query, variables: { username } })
    });

    if (!response.ok) {
        throw new Error("GitHub GraphQL API failed");
    }

    const data: any = await response.json();
    if (data.errors) {
        throw new Error(data.errors[0].message);
    }

    const user = data.data.user;
    const calendar = user.contributionsCollection.contributionCalendar;
    const totalCommits = calendar.totalContributions;
    const totalProjects = user.repositoriesContributedTo.totalCount;
    const totalPullRequests = user.pullRequests.totalCount;

    const allDays = calendar.weeks
        .flatMap((w: any) => w.contributionDays)
        .reverse();

    let currentStreak = 0;
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Check if user has contributed today or yesterday to start the streak count
    let startIndex = allDays.findIndex((d: any) => d.contributionCount > 0);

    // Calculate Today's Commits
    const todayData = allDays.find((d: any) => d.date === todayStr);
    const todayCommits = todayData ? todayData.contributionCount : 0;

    if (startIndex !== -1) {
        const lastContribDate = allDays[startIndex].date;
        // If the last contribution was more than 1 day ago, the current streak is 0
        if (lastContribDate < yesterdayStr && lastContribDate !== todayStr) {
            currentStreak = 0;
        } else {
            // Count backwards
            for (let i = startIndex; i < allDays.length; i++) {
                if (allDays[i].contributionCount > 0) {
                    currentStreak++;
                } else {
                    break;
                }
            }
        }
    }

    // Calculate Yesterday's Commits
    const yesterdayData = allDays.find((d: any) => d.date === yesterdayStr);
    const yesterdayCommits = yesterdayData ? yesterdayData.contributionCount : 0;

    // Calculate ROLLING 7-day window for "Weekly commits" goal (last 7 days including today)
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setUTCDate(now.getUTCDate() - 6); // 6 days ago + today = 7 days total
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    // Filter contributions for the last 7 days (including today)
    const last7DaysData = allDays.filter((d: any) => d.date >= sevenDaysAgoStr && d.date <= todayStr);

    // Weekly commits = sum of all commits in last 7 days (rolling window)
    const weeklyCommits = last7DaysData.reduce((acc: number, d: any) => acc + d.contributionCount, 0);

    // Calculate CALENDAR WEEK (Mon-Sun) for "Code X days/week" goal
    const dayOfWeek = now.getUTCDay(); // 0 (Sun) - 6 (Sat)
    const distToMon = (dayOfWeek + 6) % 7; // Distance to Monday
    const mondayDate = new Date(now);
    mondayDate.setUTCDate(now.getUTCDate() - distToMon);
    const mondayStr = mondayDate.toISOString().split('T')[0];

    // Filter contributions for this calendar week (Mon -> Today)
    const currentWeekData = allDays.filter((d: any) => d.date >= mondayStr && d.date <= todayStr);

    // Active days = number of days with at least 1 commit in the current calendar week
    const activeDays = currentWeekData.filter((d: any) => d.contributionCount > 0).length;

    const projects = user.repositoriesContributedTo.nodes;

    // Aggregate languages
    const languageMap = new Map<string, { size: number, color: string }>();
    projects.forEach((repo: any) => {
        if (repo.languages && repo.languages.edges) {
            repo.languages.edges.forEach((edge: any) => {
                const { name, color } = edge.node;
                const size = edge.size;
                if (languageMap.has(name)) {
                    const existing = languageMap.get(name)!;
                    languageMap.set(name, { size: existing.size + size, color });
                } else {
                    languageMap.set(name, { size, color });
                }
            });
        }
    });

    // Convert map to array and sort by size
    const languages = Array.from(languageMap.entries())
        .map(([name, { size, color }]) => ({ name, value: size, color }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5); // Top 5

    return {
        totalCommits,
        currentStreak,
        todayCommits,
        yesterdayCommits,
        weeklyCommits,
        activeDays,
        totalProjects,
        projects,
        contributionCalendar: allDays,
        totalPullRequests,
        languages
    };
}

export async function checkQuestProgress(username: string, token: string, questRepoUrl: string) {
    const octokit = new Octokit({ auth: token });

    // Parse owner/repo from quest URL
    // Format: https://github.com/owner/repo
    const parts = questRepoUrl.replace("https://github.com/", "").split("/");
    if (parts.length < 2) return { status: 'error', message: 'Invalid repo URL' };

    const [originalOwner, repoName] = parts;

    try {
        // 1. Check if user has a fork (assuming same name for MVP)
        // We check /repos/{username}/{repoName}
        // If it exists and is a fork, we proceed.

        const { data: userRepo } = await octokit.rest.repos.get({
            owner: username,
            repo: repoName
        });

        if (!userRepo.fork) {
            return { status: 'not_started', message: 'Repo found but not a fork' };
        }

        // 2. Check for recent activity (commits)
        // We want to know if they contributed. 
        // Simple check: get commits by author
        const { data: commits } = await octokit.rest.repos.listCommits({
            owner: username,
            repo: repoName,
            author: username,
            since: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // Last 7 days
        });

        if (commits.length > 0) {
            return { status: 'completed', commits: commits.length, forkUrl: userRepo.html_url };
        }

        // 3. Alternatively, check PRs to upstream
        const { data: prs } = await octokit.rest.pulls.list({
            owner: originalOwner,
            repo: repoName,
            head: `${username}:${userRepo.default_branch}`, // Assuming PR from default branch
            state: 'all'
        });

        // Also check simplified "any PR from this user"
        const { data: userPrs } = await octokit.request('GET /repos/{owner}/{repo}/pulls', {
            owner: originalOwner,
            repo: repoName,
            head: `${username}`, // Filter by user prefix if possible, but 'head' param expects user:ref
        });
        // The above might fail or be inexact. 
        // Let's stick to listing PRs and filtering by user.login

        const { data: allPrs } = await octokit.rest.pulls.list({
            owner: originalOwner,
            repo: repoName,
            state: 'all',
            per_page: 100
        });

        const myPr = allPrs.find(pr => pr.user?.login === username);

        if (myPr) {
            return { status: 'completed', prUrl: myPr.html_url, forkUrl: userRepo.html_url };
        }

        return { status: 'in_progress', forkUrl: userRepo.html_url };

    } catch (error: any) {
        if (error.status === 404) {
            return { status: 'not_started', message: 'Fork not found' };
        }
        console.error("Error checking quest progress:", error);
        return { status: 'error', message: error.message };
    }
}

