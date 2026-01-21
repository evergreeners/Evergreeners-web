import { db } from '../db/index.js';
import * as schema from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export async function updateUserGoals(userId: string, stats: {
    currentStreak: number,
    weeklyCommits: number,
    activeDays: number,
    totalProjects: number,
    contributionCalendar: any[]
}) {
    const { currentStreak, weeklyCommits, activeDays, totalProjects, contributionCalendar } = stats;

    const userGoals = await db.select().from(schema.goals).where(eq(schema.goals.userId, userId));

    for (const goal of userGoals) {
        let newCurrent = goal.current;

        if (goal.type === 'streak') {
            newCurrent = currentStreak;
        } else if (goal.type === 'commits' && goal.title.toLowerCase().includes('weekly')) {
            newCurrent = weeklyCommits;
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
        }
    }
}
