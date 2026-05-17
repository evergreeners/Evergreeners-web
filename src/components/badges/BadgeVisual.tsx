import { cn } from '@/lib/utils';
import {
    Sprout,
    GitMerge,
    Leaf,
    Target,
    UserCheck,
    Flame,
    Shield,
    Crown,
    Infinity as InfinityIcon,
    RotateCcw,
    Send,
    Award,
    Zap,
    Cpu,
    Moon,
    Compass,
    CheckCircle,
    Trophy,
    Dumbbell,
    Sparkles,
    Globe,
    TrendingUp,
    Medal,
    Eye,
    Trees,
    TreePine,
    TreeDeciduous,
    Flower2,
    Calendar,
    Clock,
    AlarmClock,
    Flag,
    Lock
} from 'lucide-react';

interface BadgeVisualProps {
    id: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    earned: boolean;
    isSecret?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

function getBadgeIcon(id: string) {
    switch (id) {
        // Onboarding
        case 'first_seed':
            return Sprout;
        case 'root_system':
            return GitMerge;
        case 'first_leaf':
            return Leaf;
        case 'planted':
            return Target;
        case 'sprouting':
            return UserCheck;
        // Streaks
        case 'week_warrior':
            return Flame;
        case 'iron_coder':
            return Shield;
        case 'centurion':
            return Crown;
        case 'evergreener':
            return InfinityIcon;
        case 'comeback_kid':
            return RotateCcw;
        // Commits
        case 'first_push':
            return Send;
        case 'century_club':
            return Award;
        case 'code_machine':
            return Zap;
        case 'ten_k_club':
            return Cpu;
        case 'night_owl':
            return Moon;
        // Quests & Goals
        case 'quest_taker':
            return Compass;
        case 'goal_setter':
            return CheckCircle;
        case 'quest_master':
            return Trophy;
        case 'relentless':
            return Dumbbell;
        case 'overachiever':
            return Sparkles;
        // Social
        case 'in_the_open':
            return Globe;
        case 'rising_star':
            return TrendingUp;
        case 'top_10':
            return Medal;
        case 'the_goat':
            return Trophy;
        case 'spotlight':
            return Eye;
        // Digital Garden
        case 'seedling':
            return Sprout;
        case 'sapling':
            return TreeDeciduous;
        case 'young_tree':
            return TreePine;
        case 'ancient_oak':
            return Trees;
        case 'full_bloom':
            return Flower2;
        // Secret
        case 'new_years_commit':
            return Calendar;
        case 'lunch_break_coder':
            return Clock;
        case 'four_am_commit':
            return AlarmClock;
        case 'speed_runner':
            return Zap;
        case 'country_leader':
            return Flag;
        default:
            return Award;
    }
}

export function BadgeVisual({ id, rarity, earned, isSecret = false, size = 'md' }: BadgeVisualProps) {
    const Icon = getBadgeIcon(id);

    // Dimension scales
    const sizeClasses = {
        sm: 'w-10 h-10 rounded-xl',
        md: 'w-14 h-14 rounded-2xl',
        lg: 'w-16 h-16 rounded-2xl',
    };

    const iconSizes = {
        sm: 'w-5 h-5',
        md: 'w-7 h-7',
        lg: 'w-8 h-8',
    };

    // If badge has not been earned, display locked visual
    if (!earned) {
        return (
            <div className={cn(
                'relative flex items-center justify-center bg-zinc-800/40 border border-zinc-700/50 shadow-inner opacity-50 shrink-0',
                sizeClasses[size]
            )}>
                <Lock className={cn('text-zinc-500', size === 'sm' ? 'w-4 h-4' : 'w-5 h-5')} />
                {isSecret && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-purple-500/20 text-[9px] font-bold text-purple-400 border border-purple-500/40 select-none">
                        ?
                    </span>
                )}
            </div>
        );
    }

    // Dynamic gradient backgrounds, border highlights, drop-shadow glow effects, and micro-interactions
    let containerClass = '';
    let iconClass = '';
    let glowClass = '';

    switch (rarity) {
        case 'legendary':
            containerClass = 'bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-600 border border-yellow-300 shadow-[0_0_15px_rgba(245,158,11,0.45)]';
            iconClass = 'text-amber-950 drop-shadow-[0_2px_3px_rgba(0,0,0,0.35)]';
            glowClass = 'absolute inset-0 rounded-2xl bg-yellow-400/20 blur-md animate-pulse pointer-events-none';
            break;
        case 'epic':
            containerClass = 'bg-gradient-to-br from-purple-400 via-fuchsia-500 to-purple-700 border border-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.4)]';
            iconClass = 'text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.3)]';
            glowClass = 'absolute inset-0 rounded-2xl bg-purple-500/10 blur-sm pointer-events-none';
            break;
        case 'rare':
            containerClass = 'bg-gradient-to-br from-blue-400 via-indigo-500 to-cyan-600 border border-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.35)]';
            iconClass = 'text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.25)]';
            break;
        default: // common
            containerClass = 'bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-600 border border-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.25)]';
            iconClass = 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]';
            break;
    }

    return (
        <div className="relative shrink-0 group/badge-visual">
            {glowClass && <div className={glowClass} />}
            <div className={cn(
                'relative flex items-center justify-center transition-all duration-300 overflow-hidden',
                'group-hover/badge-visual:scale-110 group-hover/badge-visual:rotate-3',
                containerClass,
                sizeClasses[size]
            )}>
                {/* Visual Glass Reflection overlay */}
                <div className="absolute inset-[1px] rounded-[inherit] border border-white/20 pointer-events-none z-10" />
                <div className="absolute top-0 left-0 right-0 h-[50%] bg-gradient-to-b from-white/20 to-transparent rounded-t-[inherit] pointer-events-none z-10" />

                {/* Main Vector Icon */}
                <Icon className={cn(
                    'transition-transform duration-300 group-hover/badge-visual:scale-105 z-0',
                    iconSizes[size],
                    iconClass
                )} />
            </div>
        </div>
    );
}
