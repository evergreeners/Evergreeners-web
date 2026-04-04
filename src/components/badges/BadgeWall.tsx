import { cn } from '@/lib/utils';
import { BadgeCard } from './BadgeCard';
import type { UserBadge } from './types';

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
    // Group by category, preserving display order
    const grouped = CATEGORY_ORDER.reduce<Record<string, UserBadge[]>>((acc, cat) => {
        acc[cat] = badges.filter((b) => b.category === cat);
        return acc;
    }, {});

    return (
        <div className={cn('space-y-8', className)}>
            {/* Earned counter */}
            <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{earnedCount}</span>
                {' / '}
                <span className="font-semibold text-foreground">{totalCount}</span>
                {' earned'}
            </p>

            {CATEGORY_ORDER.map((category) => {
                const categoryBadges = grouped[category] ?? [];
                if (!categoryBadges.length) return null;

                // Earned first within each category
                const sorted = [
                    ...categoryBadges.filter((b) => b.earned),
                    ...categoryBadges.filter((b) => !b.earned),
                ];

                return (
                    <section key={category}>
                        <h3 className={cn(
                            'text-sm font-semibold uppercase tracking-widest mb-3',
                            category === 'Secret' ? 'text-amber-500' : 'text-muted-foreground',
                        )}>
                            {category}
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                            {sorted.map((badge) => (
                                <BadgeCard
                                    key={badge.id}
                                    badge={badge}
                                    earned={badge.earned}
                                    earnedAt={badge.earnedAt ? new Date(badge.earnedAt) : null}
                                />
                            ))}
                        </div>
                    </section>
                );
            })}
        </div>
    );
}
