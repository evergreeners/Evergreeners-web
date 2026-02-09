import { useState, useEffect, useRef } from "react";
import { Bell, CheckCheck, X, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiUrl } from "@/lib/api-config";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Notification {
    id: number;
    type: string;
    title: string;
    message: string;
    read: boolean;
    link?: string;
    createdAt: string;
}

export function NotificationCenter() {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const prevCountRef = useRef<number>(0);

    // Fetch notifications
    const { data: notifications = [], isLoading } = useQuery({
        queryKey: ['notifications'],
        queryFn: async () => {
            const res = await fetch(getApiUrl('/api/notifications'), {
                credentials: "include",
            });
            if (!res.ok) throw new Error('Failed to fetch notifications');
            const data = await res.json();
            return data.notifications as Notification[];
        },
        staleTime: 1 * 60 * 1000, // 1 minute
        refetchOnWindowFocus: true,
    });

    const unreadCount = notifications.filter(n => !n.read).length;

    // Animate badge when new notification arrives
    useEffect(() => {
        if (unreadCount > prevCountRef.current && prevCountRef.current > 0) {
            // New notification arrived!
            toast.info("New notification received!", {
                duration: 2000,
            });
        }
        prevCountRef.current = unreadCount;
    }, [unreadCount]);

    // Polling for realtime updates (every 30 seconds)
    useEffect(() => {
        const interval = setInterval(() => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }, 30000);

        return () => clearInterval(interval);
    }, [queryClient]);

    // Mark as read mutation
    const markAsRead = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(getApiUrl(`/api/notifications/${id}/read`), {
                method: 'POST',
                credentials: "include",
            });
            if (!res.ok) throw new Error('Failed to mark as read');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    // Mark all as read mutation
    const markAllAsRead = useMutation({
        mutationFn: async () => {
            const res = await fetch(getApiUrl('/api/notifications/mark-all-read'), {
                method: 'POST',
                credentials: "include",
            });
            if (!res.ok) throw new Error('Failed to mark all as read');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            toast.success("All notifications marked as read");
        },
    });

    const handleNotificationClick = (notification: Notification) => {
        // Mark as read
        if (!notification.read) {
            markAsRead.mutate(notification.id);
        }

        // Navigate if there's a link
        if (notification.link) {
            setOpen(false);
            navigate(notification.link);
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'quest': return '⚡';
            case 'streak': return '🔥';
            case 'leaderboard': return '🏆';
            case 'goal': return '🎯';
            default: return '🔔';
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200 relative"
                    aria-label="Notifications"
                >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse-slow">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h3 className="font-semibold">Notifications</h3>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-1 text-xs"
                            onClick={() => markAllAsRead.mutate()}
                            disabled={markAllAsRead.isPending}
                        >
                            <CheckCheck className="w-3 h-3 mr-1" />
                            Mark all read
                        </Button>
                    )}
                </div>

                <ScrollArea className="h-[400px]">
                    {isLoading ? (
                        <div className="p-4 space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex gap-3">
                                    <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-3 w-full" />
                                        <Skeleton className="h-3 w-1/3" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                            <Bell className="w-12 h-12 text-muted-foreground/30 mb-3" />
                            <p className="text-sm font-medium text-foreground mb-1">No notifications</p>
                            <p className="text-xs text-muted-foreground">You're all caught up!</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {notifications.map((notification) => (
                                <button
                                    key={notification.id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={cn(
                                        "w-full p-4 text-left transition-colors hover:bg-secondary/50",
                                        !notification.read && "bg-primary/5"
                                    )}
                                >
                                    <div className="flex gap-3">
                                        <span className="text-2xl flex-shrink-0">
                                            {getNotificationIcon(notification.type)}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <p className={cn(
                                                    "text-sm font-medium",
                                                    !notification.read && "text-foreground"
                                                )}>
                                                    {notification.title}
                                                </p>
                                                {!notification.read && (
                                                    <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1" />
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                                                {notification.message}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground">
                                                    {formatTime(notification.createdAt)}
                                                </span>
                                                {notification.link && (
                                                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                {notifications.length > 0 && (
                    <div className="p-2 border-t border-border">
                        <Button
                            variant="ghost"
                            className="w-full text-xs"
                            onClick={() => {
                                setOpen(false);
                                navigate('/profile#notifications');
                            }}
                        >
                            See all notifications
                        </Button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}
