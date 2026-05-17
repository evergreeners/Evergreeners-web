import { db } from '../db/index.js';
import * as schema from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';

/**
 * Retrieves the cached daily AI competitive intelligence report or generates a new one
 * using the Gemini API if there is no up-to-date insight for today.
 */
export async function getOrGenerateEyeInsight(userId: string): Promise<string | null> {
    try {
        const [user] = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
        if (!user) return null;

        const entries = await db.select()
            .from(schema.watchlist)
            .where(eq(schema.watchlist.userId, userId))
            .orderBy(desc(schema.watchlist.addedAt));

        if (entries.length === 0) return null;

        const todayStr = new Date().toISOString().split('T')[0];
        const lastUpdatedStr = user.eyeInsightUpdatedAt ? new Date(user.eyeInsightUpdatedAt).toISOString().split('T')[0] : null;
        const currentInsight = user.eyeInsight;

        // If we already have a valid insight for today, return it
        if (currentInsight && lastUpdatedStr === todayStr) {
            return currentInsight;
        }

        // Otherwise generate a new one using stats of the watchlist entries
        const withStats = entries.filter(e => e.cachedStats).map(e => e.cachedStats);
        if (withStats.length === 0) return currentInsight || null; // Fallback to stale if no stats cached yet

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.warn('AI analysis is not configured (missing GEMINI_API_KEY).');
            return currentInsight || null;
        }

        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const watchlistSummary = withStats.map((w: any) =>
            `- @${w.login}: ${w.weeklyCommits} commits/week, ${w.monthlyCommits} commits/month, ${w.currentStreak}-day streak, ${w.totalPRs} total PRs`
        ).join('\n');

        const prompt = `You are an elite software engineering coach and competitive intelligence analyst for a developer productivity platform called Evergreeners.

The user @${user.username || 'you'} is watching these GitHub developers:
${watchlistSummary}

The user's own stats:
- Weekly commits: ${user.weeklyCommits || 0}
- Streak: ${user.streak || 0} days
- Total commits: ${user.totalCommits || 0}
- Total PRs: ${user.totalPullRequests || 0}

Provide a sharp, motivating, brutally honest competitive analysis. Be direct, use personality, and make the user feel the heat of competition. Structure your response exactly like this (use markdown):

## 🧠 The Eye's Read

[1-2 sentences: Overall competitive situation - where does the user stand vs the watchlist?]

## 🔥 Threats

[Bullet points about users who are clearly outperforming or surging in activity. Be specific with numbers.]

## 📊 Your Position

[Honest assessment of the user's current momentum. Good AND bad.]

## ⚡ Intel Report

[2-3 specific, actionable things the user should do RIGHT NOW to compete. Be specific and motivating.]

Keep the total response under 300 words. Be like a hype coach mixed with a ruthless analyst. Don't soften the truth.`;

        const result = await model.generateContent(prompt);
        const analysis = result.response.text();

        // Save in DB on the users table
        await db.update(schema.users)
            .set({ 
                eyeInsight: analysis, 
                eyeInsightUpdatedAt: new Date(),
                eyeInsightCount: 1
            })
            .where(eq(schema.users.id, userId));

        return analysis;
    } catch (error) {
        console.error('Failed to get or generate eye insight:', error);
        return null;
    }
}
