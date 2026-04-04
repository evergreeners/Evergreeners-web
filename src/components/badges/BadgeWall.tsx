import { cn } from '@/lib/utils';
import { BadgeCard } from './BadgeCard';
import type { UserBadge } from './types';
import { useState } from 'react';

interface BadgeWallProps {
    badges: UserBadge[];
    earnedCount: number;
    totalCount: number;
    className?: string;
}

// All categories in display order
const CATEGORY_ORDER = [
    'Onboarding',
    'Streaks',
    'Commits',
    'Quests & Goals',
    'Social',
    'Digital Garden',
    'Secret',
];

export function BadgeWall({ badges, earnedCount, totalCount, className }: BadgeWallProps) {
    const [activeCategory, setActiveCategory] = useState<string>('Earned');

    // Group by category, preserving display order
    const grouped = CATEGORY_ORDER.reduce<Record<string, UserBadge[]>>((acc, cat) => {
        acc[cat] = badges.filter((b) => b.category === cat);
        return acc;
    }, {});

    return (
        <div className={cn('space-y-8', className)}>
            {/* Header and Filter Tabs */}
            <div className="flex flex-col gap-4">
                <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{earnedCount}</span>
                    {' / '}
                    <span className="font-semibold text-foreground">{totalCount}</span>
                    {' badges earned'}
                </p>

                {/* Filter Pills with horizontal scrolling */}
                <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-hide snap-x">
                    <button
                        onClick={() => setActiveCategory('Earned')}
                        className={cn(
                            "px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors snap-start flex items-center gap-1.5",
                            activeCategory === 'Earned'
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                        )}
                    >
                        <span>Earned Badges</span>
                        <span className={cn(
                            "px-1.5 py-0.5 rounded-full text-[10px]",
                            activeCategory === 'Earned' ? "bg-background/20" : "bg-background/50"
                        )}>
                            {earnedCount}
                        </span>
                    </button>
                    {CATEGORY_ORDER.map((cat) => {
                        // Don't show category pill if no badges in it (shouldn't happen with full static config, but safe)
                        if (!grouped[cat]?.length) return null;
                        const catEarned = grouped[cat].filter(b => b.earned).length;
                        return (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={cn(
                                    "px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 snap-start",
                                    activeCategory === cat
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                                )}
                            >
                                <span>{cat}</span>
                                <span className={cn(
                                    "px-1.5 py-0.5 rounded-full text-[10px]",
                                    activeCategory === cat ? "bg-background/20" : "bg-background/50"
                                )}>
                                    {catEarned}/{grouped[cat].length}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="space-y-6">
                {activeCategory === 'Earned' ? (
                    (() => {
                        const earnedBadges = badges.filter(b => b.earned);
                        if (!earnedBadges.length) return <p className="text-sm text-muted-foreground">No badges earned yet. Complete quests or edit your profile!</p>;

                        const RARITY_WEIGHT: Record<string, number> = {
                            legendary: 4,
                            epic: 3,
                            rare: 2,
                            common: 1
                        };

                        const sorted = [...earnedBadges].sort((a, b) => RARITY_WEIGHT[b.rarity] - RARITY_WEIGHT[a.rarity]);

                        return (
                            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 cursor-default">
                                {sorted.map((badge) => (
                                    <BadgeCard
                                        key={badge.id}
                                        badge={badge}
                                        earned={badge.earned}
                                        earnedAt={badge.earnedAt ? new Date(badge.earnedAt) : null}
                                    />
                                ))}
                            </div>
                        );
                    })()
                ) : (
                    (() => {
                        const categoryBadges = grouped[activeCategory] ?? [];
                        if (!categoryBadges.length) return null;

                        const sorted = [
                            ...categoryBadges.filter((b) => b.earned),
                            ...categoryBadges.filter((b) => !b.earned),
                        ];

                        return (
                            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 cursor-default">
                                {sorted.map((badge) => (
                                    <BadgeCard
                                        key={badge.id}
                                        badge={badge}
                                        earned={badge.earned}
                                        earnedAt={badge.earnedAt ? new Date(badge.earnedAt) : null}
                                    />
                                ))}
                            </div>
                        );
                    })()
                )}
            </div>
        </div>
    );
}
