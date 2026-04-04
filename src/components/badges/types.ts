// ─── Shared Badge Types (frontend) ────────────────────────────────────────────
// These mirror the server-side definitions but live in the frontend for
// type safety across all badge components.

export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface BadgeDefinition {
    id: string;
    name: string;
    description: string;
    rarity: BadgeRarity;
    category: string;
    isSecret?: boolean;
}

export interface UserBadge extends BadgeDefinition {
    earned: boolean;
    earnedAt: string | null;
}
