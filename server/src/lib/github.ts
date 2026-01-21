
export async function getGithubContributions(username: string, token: string) {
    const query = `
        query($username: String!) {
            user(login: $username) {
                repositoriesContributedTo(first: 100, contributionTypes: [COMMIT, ISSUE, PULL_REQUEST, REPOSITORY], orderBy: {field: UPDATED_AT, direction: DESC}) {
                    totalCount
                    nodes {
                        nameWithOwner
                        url
                        updatedAt
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

    return { totalCommits, currentStreak, todayCommits, yesterdayCommits, weeklyCommits, activeDays, totalProjects, projects, contributionCalendar: allDays };
}
