import { db } from '../db/index.js';
import * as schema from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { sendGoalCompletedEmail } from './email.js';
import { createNotification } from './notifications.js';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export async function notifyGoalCompletion(userId: string, goal: { title: string; type: string; target: number; current: number }) {
    // In-app + web push (independent of email opt-in)
    await createNotification(userId, {
        type: 'goal',
        title: 'Goal complete! 🎯',
        message: `"${goal.title}" is complete — ${goal.current}/${goal.target} reached.`,
        link: '/goals',
    });

    try {
        const userRows = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
        const user = userRows[0];
        if (!user?.email || user.emailNotifications !== true) return;

        const goalsUrl = (process.env.APP_URL || 'https://evergreeners.dev') + '/goals';
        await sendGoalCompletedEmail({
            to: user.email,
            name: user.name || user.username || 'there',
            goalTitle: goal.title,
            goalType: goal.type,
            target: goal.target,
            current: goal.current,
            goalsUrl,
        });
    } catch (err) {
        console.error("Goal completed email failed:", err);
    }
}

export async function updateUserGoals(userId: string, stats: {
    currentStreak: number,
    weeklyCommits: number,
    activeDays: number,
    totalProjects: number,
    contributionCalendar: any[]
}) {
    const { currentStreak, weeklyCommits, activeDays, totalProjects, contributionCalendar } = stats;

    const userGoals = await db.select().from(schema.goals).where(eq(schema.goals.userId, userId));

    const now = new Date();
    const currentMonth = now.getUTCMonth();
    const currentYear = now.getUTCFullYear();

    const newlyCompletedGoals: { title: string; type: string; target: number; current: number }[] = [];

    for (const goal of userGoals) {
        let newCurrent = goal.current;

        if (goal.type === 'streak') {
            newCurrent = currentStreak;
        } else if (goal.type === 'commits' && goal.title.toLowerCase().includes('weekly')) {
            newCurrent = weeklyCommits;
        } else if (goal.type === 'commits_monthly') {
            let monthlyCommits = 0;
            for (const day of contributionCalendar) {
                const d = new Date(day.date);
                if (d.getUTCMonth() === currentMonth && d.getUTCFullYear() === currentYear) {
                    monthlyCommits += day.contributionCount || 0;
                }
            }
            newCurrent = monthlyCommits;
        } else if (goal.type === 'commits_yearly') {
            let yearlyCommits = 0;
            for (const day of contributionCalendar) {
                const d = new Date(day.date);
                if (d.getUTCFullYear() === currentYear) {
                    yearlyCommits += day.contributionCount || 0;
                }
            }
            newCurrent = yearlyCommits;
        } else if (goal.type === 'days') {
            if (goal.dueDate && daysOfWeek.includes(goal.dueDate)) {
                const startIndex = daysOfWeek.indexOf(goal.dueDate);
                const now = new Date();
                const dayOfWeek = now.getUTCDay();
                const distToMon = (dayOfWeek + 6) % 7;
                const mondayDate = new Date(now);
                mondayDate.setUTCDate(now.getUTCDate() - distToMon);

                let count = 0;
                for (let i = 0; i < goal.target; i++) {
                    const checkIndex = startIndex + i;
                    if (checkIndex > 6) break;

                    const d = new Date(mondayDate);
                    d.setUTCDate(mondayDate.getUTCDate() + checkIndex);
                    const dStr = d.toISOString().split('T')[0];

                    const dayData = contributionCalendar.find((day: any) => day.date === dStr);
                    if (dayData && dayData.contributionCount > 0) {
                        count++;
                    } else {
                        break;
                    }
                }
                newCurrent = count;
            } else {
                newCurrent = activeDays;
            }
        } else if (goal.type === 'projects') {
            newCurrent = totalProjects;
        } else {
            continue;
        }

        const newCompleted = newCurrent >= goal.target;

        if (newCurrent !== goal.current || newCompleted !== goal.completed) {
            await db.update(schema.goals)
                .set({ current: newCurrent, completed: newCompleted, updatedAt: new Date() })
                .where(eq(schema.goals.id, goal.id));

            if (newCompleted && !goal.completed) {
                newlyCompletedGoals.push({ title: goal.title, type: goal.type, target: goal.target, current: newCurrent });
            }
        }
    }

    for (const goal of newlyCompletedGoals) {
        await notifyGoalCompletion(userId, goal);
    }
}
