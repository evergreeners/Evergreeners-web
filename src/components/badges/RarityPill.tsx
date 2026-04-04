import { cn } from '@/lib/utils';
import type { BadgeRarity } from './types';

interface RarityPillProps {
    rarity: BadgeRarity;
    className?: string;
}

const rarityConfig: Record<BadgeRarity, { label: string; className: string }> = {
    common: {
        label: 'Common',
        className:
            'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
    },
    rare: {
        label: 'Rare',
        className:
            'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    },
    epic: {
        label: 'Epic',
        className:
            'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
    },
    legendary: {
        label: 'Legendary',
        className:
            'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    },
};

export function RarityPill({ rarity, className }: RarityPillProps) {
    const config = rarityConfig[rarity];
    return (
        <span
            className={cn(
                'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider',
                config.className,
                className,
            )}
        >
            {config.label}
        </span>
    );
}

/** Utility — get the rarity-specific Tailwind classes for borders / glows */
export function getRarityStyles(rarity: BadgeRarity) {
    switch (rarity) {
        case 'legendary':
            return {
                border: 'border-amber-400/70',
                glow: 'shadow-amber-400/30',
                text: 'text-amber-400',
                bg: 'bg-amber-400/10',
                placeholder: 'bg-amber-400/20 text-amber-400',
            };
        case 'epic':
            return {
                border: 'border-purple-500/70',
                glow: 'shadow-purple-500/30',
                text: 'text-purple-400',
                bg: 'bg-purple-500/10',
                placeholder: 'bg-purple-500/20 text-purple-400',
            };
        case 'rare':
            return {
                border: 'border-blue-500/70',
                glow: 'shadow-blue-500/30',
                text: 'text-blue-400',
                bg: 'bg-blue-500/10',
                placeholder: 'bg-blue-500/20 text-blue-400',
            };
        default: // common
            return {
                border: 'border-border',
                glow: 'shadow-gray-500/10',
                text: 'text-muted-foreground',
                bg: 'bg-secondary/30',
                placeholder: 'bg-secondary text-muted-foreground',
            };
    }
}
