import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { RarityPill, getRarityStyles } from './RarityPill';
import type { UserBadge } from './types';

interface BadgeCardProps {
    badge: UserBadge;
    /** Whether this badge has already been earned */
    earned: boolean;
    earnedAt?: Date | null;
}

export function BadgeCard({ badge, earned, earnedAt }: BadgeCardProps) {
    const styles = getRarityStyles(badge.rarity);
    const isLegendary = badge.rarity === 'legendary';
    const isSecret = badge.isSecret && !earned;

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className={cn(
                'relative flex flex-col items-center gap-2 p-4 rounded-2xl border',
                'backdrop-blur-sm transition-all duration-300',
                'hover:scale-[1.02] hover:-translate-y-0.5',
                // earned state styling
                earned
                    ? [styles.border, styles.bg, `shadow-lg ${styles.glow}`]
                    : 'border-border bg-secondary/20 opacity-40 grayscale',
                // legendary pulse
                isLegendary && earned && 'animate-pulse-slow',
            )}
        >
            {/* Badge image placeholder */}
            <div
                className={cn(
                    'w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold select-none',
                    earned ? styles.placeholder : 'bg-secondary text-muted-foreground',
                )}
            >
                {/* TODO: replace with <img> when SVG assets are added */}
                {isSecret ? '?' : badge.name.charAt(0).toUpperCase()}
            </div>

            {/* Name */}
            <p className={cn('text-xs font-semibold text-center leading-tight', earned ? 'text-foreground' : 'text-muted-foreground')}>
                {badge.name}
            </p>

            {/* Description */}
            <p className="text-[10px] text-muted-foreground text-center leading-snug line-clamp-2">
                {badge.description}
            </p>

            {/* Rarity pill */}
            <RarityPill rarity={badge.rarity} />

            {/* Earned date */}
            {earned && earnedAt && (
                <p className="text-[9px] text-muted-foreground/70 mt-0.5">
                    {new Date(earnedAt).toLocaleDateString()}
                </p>
            )}

            {/* Lock overlay for unearned badges */}
            {!earned && (
                <div className="absolute top-3 right-3 flex items-center justify-center">
                    <span className="text-sm opacity-70">🔒</span>
                </div>
            )}
        </motion.div>
    );
}
