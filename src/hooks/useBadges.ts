import { useQuery } from '@tanstack/react-query';
import { getApiUrl } from '@/lib/api-config';
import type { UserBadge } from '@/components/badges/types';

interface UseBadgesResult {
    badges: UserBadge[];
    earnedCount: number;
    totalCount: number;
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
}

/**
 * Fetches a user's badge data from the server.
 *
 * @param username - The profile username to fetch badges for.
 *                   Pass null/undefined to skip fetching.
 */
export function useBadges(username: string | null | undefined): UseBadgesResult {
    const { data, isLoading, error, refetch } = useQuery<{
        badges: UserBadge[];
        earnedCount: number;
        totalCount: number;
    }>({
        queryKey: ['badges', username],
        queryFn: async () => {
            if (!username) throw new Error('No username provided');
            const res = await fetch(getApiUrl(`/api/users/${username}/badges`), {
                credentials: 'include',
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error((data as any).message ?? 'Failed to fetch badges');
            }
            return res.json();
        },
        enabled: !!username,
        // Stale after 5 minutes — badges don't change constantly
        staleTime: 5 * 60 * 1000,
    });

    return {
        badges: data?.badges ?? [],
        earnedCount: data?.earnedCount ?? 0,
        totalCount: data?.totalCount ?? 0,
        isLoading,
        error: error as Error | null,
        refetch,
    };
}
