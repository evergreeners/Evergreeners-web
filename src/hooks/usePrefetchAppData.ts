import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getApiUrl } from '@/lib/api-config';


/**
 * Hook to prefetch all app data when user logs in
 * This prevents loading states when navigating between pages
 */
export function usePrefetchAppData(token: string | undefined) {
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!token) return;

        const prefetchData = async () => {
            try {
                // Prefetch leaderboard data
                await queryClient.prefetchQuery({
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
                    staleTime: 5 * 60 * 1000, // 5 minutes
                });

                // Prefetch user profile data
                await queryClient.prefetchQuery({
                    queryKey: ['userProfile'],
                    queryFn: async () => {
                        const res = await fetch(getApiUrl('/api/user/profile'), {
                            headers: {
                                Authorization: `Bearer ${token}`
                            }
                        });
                        if (!res.ok) throw new Error('Failed to fetch profile');
                        const data = await res.json();
                        return data.user;
                    },
                    staleTime: 5 * 60 * 1000,
                });

                // Prefetch dashboard profile (same endpoint, different query key for Index page)
                await queryClient.prefetchQuery({
                    queryKey: ['dashboardProfile'],
                    queryFn: async () => {
                        const url = getApiUrl('/api/user/profile');
                        const res = await fetch(url, {
                            credentials: "include",
                            headers: {
                                Authorization: `Bearer ${token}`
                            }
                        });
                        if (!res.ok) throw new Error('Failed to fetch dashboard profile');
                        const data = await res.json();
                        return data.user;
                    },
                    staleTime: 5 * 60 * 1000,
                });

                // Prefetch quests data
                await queryClient.prefetchQuery({
                    queryKey: ['quests'],
                    queryFn: async () => {
                        const res = await fetch(getApiUrl('/api/quests'), {
                            credentials: "include",
                        });
                        if (!res.ok) throw new Error('Failed to fetch quests');
                        const data = await res.json();
                        return data.quests;
                    },
                    staleTime: 2 * 60 * 1000, // 2 minutes (quests change more frequently)
                });



                // Prefetch notifications for instant badge count
                await queryClient.prefetchQuery({
                    queryKey: ['notifications'],
                    queryFn: async () => {
                        const res = await fetch(getApiUrl('/api/notifications'), {
                            credentials: "include",
                        });
                        if (!res.ok) throw new Error('Failed to fetch notifications');
                        const data = await res.json();
                        return data.notifications;
                    },
                    staleTime: 1 * 60 * 1000, // 1 minute (notifications change frequently)
                });

                console.log('✅ App data prefetched successfully');
            } catch (error) {
                // Silent fail - prefetching is an optimization, not critical
                console.debug('Prefetch skipped:', error);
            }
        };

        // Prefetch immediately on login
        prefetchData();
    }, [token, queryClient]);
}
