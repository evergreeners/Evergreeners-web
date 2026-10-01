import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getApiUrl } from '@/lib/api-config';
import { githubService } from '@/lib/githubService';

/**
 * Hook to prefetch all critical app data in parallel when user logs in.
 * Ensures instant navigation without loading states between Dashboard, Analytics, and Repositories.
 */
export function usePrefetchAppData(token: string | undefined) {
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!token) return;

        const prefetchData = async () => {
            try {
                await Promise.allSettled([
                    // 1. User Profile Data (used by Analytics, Dashboard, Profile)
                    queryClient.prefetchQuery({
                        queryKey: ['userProfile', 'me'],
                        queryFn: async () => {
                            const res = await fetch(getApiUrl('/api/user/profile'), {
                                credentials: "include",
                                headers: {
                                    Authorization: `Bearer ${token}`
                                }
                            });
                            if (!res.ok) throw new Error('Failed to fetch profile');
                            const data = await res.json();
                            return data.user;
                        },
                        staleTime: 5 * 60 * 1000,
                    }),

                    // 2. User Repositories Data (used by Analytics Repositories tab)
                    queryClient.prefetchQuery({
                        queryKey: ['userRepos', token],
                        queryFn: async () => {
                            const repos = await githubService.getUserRepos(token);
                            return Array.isArray(repos) ? repos : [];
                        },
                        staleTime: 5 * 60 * 1000,
                    }),

                    // 3. Leaderboard data
                    queryClient.prefetchQuery({
                        queryKey: ['leaderboard'],
                        queryFn: async () => {
                            const res = await fetch(getApiUrl('/api/leaderboard'));
                            if (!res.ok) throw new Error('Failed to fetch leaderboard');
                            const data = await res.json();
                            return data.leaderboard.map((entry: any) => ({
                                ...entry,
                                previousRank: entry.rank,
                                avatar: entry.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(entry.username)}&background=random`
                            }));
                        },
                        staleTime: 5 * 60 * 1000,
                    }),

                    // 4. Quests data
                    queryClient.prefetchQuery({
                        queryKey: ['quests'],
                        queryFn: async () => {
                            const res = await fetch(getApiUrl('/api/quests'), {
                                credentials: "include",
                            });
                            if (!res.ok) throw new Error('Failed to fetch quests');
                            const data = await res.json();
                            return data.quests;
                        },
                        staleTime: 2 * 60 * 1000,
                    }),

                    // 5. Notifications
                    queryClient.prefetchQuery({
                        queryKey: ['notifications'],
                        queryFn: async () => {
                            const res = await fetch(getApiUrl('/api/notifications'), {
                                credentials: "include",
                            });
                            if (!res.ok) throw new Error('Failed to fetch notifications');
                            const data = await res.json();
                            return data.notifications;
                        },
                        staleTime: 1 * 60 * 1000,
                    }),

                    // 6. Watchlist cached stats
                    queryClient.prefetchQuery({
                        queryKey: ['watchlist', 'refresh'],
                        queryFn: async () => {
                            const res = await fetch(getApiUrl('/api/eye/watchlist/refresh'), {
                                method: 'POST',
                                credentials: "include",
                            });
                            if (!res.ok) throw new Error('Failed to refresh watchlist');
                            return res.json();
                        },
                        staleTime: 1 * 60 * 1000,
                    }),
                ]);

                console.log('⚡ All app and analytics data prefetched in parallel');
            } catch (error) {
                console.debug('Prefetch skipped:', error);
            }
        };

        // Fire parallel prefetch immediately on login / session boot
        prefetchData();
    }, [token, queryClient]);
}
