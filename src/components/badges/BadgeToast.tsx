import { AnimatePresence, motion } from 'framer-motion';
import { getRarityStyles } from './RarityPill';
import type { BadgeDefinition } from './types';
import { BadgeVisual } from './BadgeVisual';

interface NewBadge {
    id: string;
    name: string;
    rarity: BadgeDefinition['rarity'];
    category: string;
}

interface BadgeToastProps {
    badges: NewBadge[];
    onDismiss: (id: string) => void;
}

/**
 * Renders a stack of slide-in toast notifications (bottom-right) for newly
 * awarded badges. Call it in the root component or wherever sync responses
 * are processed; pass the array of newly earned badges from the API response.
 */
export function BadgeToast({ badges, onDismiss }: BadgeToastProps) {
    return (
        <div className="fixed bottom-24 sm:bottom-6 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
            <AnimatePresence>
                {badges.map((badge) => {
                    const styles = getRarityStyles(badge.rarity);
                    return (
                        <motion.div
                            key={badge.id}
                            initial={{ opacity: 0, x: 80, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 80, scale: 0.95 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                            className={[
                                'pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl',
                                'border backdrop-blur-md shadow-xl',
                                styles.border,
                                styles.bg,
                                `shadow-lg ${styles.glow}`,
                                'min-w-[220px] max-w-[300px] cursor-pointer',
                            ].join(' ')}
                            onClick={() => onDismiss(badge.id)}
                        >
                            {/* Premium visual badge */}
                            <BadgeVisual
                                id={badge.id}
                                rarity={badge.rarity}
                                earned={true}
                                size="sm"
                            />

                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                                    Achievement Unlocked
                                </p>
                                <p className={['text-sm font-bold truncate', styles.text].join(' ')}>
                                    {badge.name}
                                </p>
                                <p className="text-[10px] text-muted-foreground capitalize">
                                    {badge.rarity} · {badge.category}
                                </p>
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
