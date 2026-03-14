
import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { 
    Check, Star, Trash2, Award, 
    MessageSquare, Users, Image as ImageIcon,
    Loader2, AlertCircle, ExternalLink, ShieldCheck
} from 'lucide-react';
import { getApiUrl } from '@/lib/api-config';
import { toast } from 'sonner';
import './AdminDashboard.css';

interface Story {
    id: number;
    name: string;
    handle: string;
    quote: string;
    approved: boolean;
    featured: boolean;
    heroFeatured: boolean;
    image: string;
    platform: string;
    role: string;
    createdAt: string;
}

export default function AdminDashboard() {
    const [stories, setStories] = useState<Story[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');

    const fetchStories = async () => {
        try {
            const res = await fetch(getApiUrl('/api/community/stories'));
            const data = await res.json();
            
            if (!data.isAdmin) {
                window.location.href = '/dashboard';
                return;
            }
            
            setStories(data.stories || []);
        } catch (err) {
            console.error('Fetch error:', err);
            toast.error('Failed to load stories');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStories();
    }, []);

    const handleAction = async (id: number, action: 'approve' | 'toggle-featured' | 'toggle-hero' | 'delete') => {
        const loadingId = `${action}-${id}`;
        setActionLoading(loadingId);
        
        try {
            let method = 'PATCH';
            if (action === 'delete') {
                if (!confirm('Are you sure you want to delete this story?')) return;
                method = 'DELETE';
            }

            let url = getApiUrl(`/api/community/stories/${id}`);
            if (action !== 'delete') {
                url = getApiUrl(`/api/community/stories/${id}/${action}`);
            }

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' }
            });

            if (res.ok) {
                toast.success(`Story ${action.replace('toggle-', '')}d successfully`);
                fetchStories();
            } else {
                throw new Error('Action failed');
            }
        } catch (err) {
            toast.error(`Failed to ${action}`);
        } finally {
            setActionLoading(null);
        }
    };

    const filteredStories = stories.filter(s => {
        if (filter === 'pending') return !s.approved;
        if (filter === 'approved') return s.approved;
        return true;
    });

    const stats = {
        total: stories.length,
        pending: stories.filter(s => !s.approved).length,
        featured: stories.filter(s => s.featured).length,
        hero: stories.filter(s => s.heroFeatured).length
    };

    if (loading) {
        return (
            <div className="admin-page flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={40} />
            </div>
        );
    }

    return (
        <div className="admin-page">
            <Header />
            <div className="admin-container">
                <div className="admin-header">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl border border-primary/20">
                            <ShieldCheck className="text-primary" size={24} />
                        </div>
                        <h1>Admin Dashboard</h1>
                    </div>
                    <div className="text-sm text-muted-foreground bg-secondary/50 px-4 py-2 rounded-full border border-primary/10">
                        Community Management
                    </div>
                </div>

                <div className="admin-stats">
                    <div className="admin-stat-card">
                        <div className="admin-stat-label">Total Stories</div>
                        <div className="admin-stat-value">{stats.total}</div>
                    </div>
                    <div className="admin-stat-card">
                        <div className="admin-stat-label">Pending Approval</div>
                        <div className="admin-stat-value text-yellow-500">{stats.pending}</div>
                    </div>
                    <div className="admin-stat-card">
                        <div className="admin-stat-label">Featured stories</div>
                        <div className="admin-stat-value text-purple-500">{stats.featured}</div>
                    </div>
                    <div className="admin-stat-card">
                        <div className="admin-stat-label">Hero Wall</div>
                        <div className="admin-stat-value text-amber-500">{stats.hero}</div>
                    </div>
                </div>

                <div className="admin-tabs">
                    <button className={`admin-tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All Stories</button>
                    <button className={`admin-tab ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>
                        Pending {stats.pending > 0 && <span className="ml-1 bg-yellow-500 text-black px-1.5 rounded-full text-[10px]">{stats.pending}</span>}
                    </button>
                    <button className={`admin-tab ${filter === 'approved' ? 'active' : ''}`} onClick={() => setFilter('approved')}>Approved</button>
                </div>

                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Story Preview</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStories.map(story => (
                                <tr key={story.id}>
                                    <td>
                                        <div className="admin-user-cell">
                                            <img src={story.image} className="admin-user-avatar" alt="" />
                                            <div className="admin-user-info">
                                                <span className="admin-user-name">{story.name}</span>
                                                <span className="admin-user-handle">@{story.handle}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="max-w-md truncate text-muted-foreground text-sm italic">
                                            "{story.quote}"
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex gap-2">
                                            {!story.approved && <span className="admin-badge admin-badge--pending">Pending</span>}
                                            {story.approved && <span className="admin-badge admin-badge--approved">Approved</span>}
                                            {story.featured && <span className="admin-badge admin-badge--featured">Featured</span>}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="admin-actions">
                                            {!story.approved && (
                                                <button 
                                                    className="admin-btn admin-btn--approve" 
                                                    onClick={() => handleAction(story.id, 'approve')}
                                                    disabled={!!actionLoading}
                                                    title="Approve Story"
                                                >
                                                    {actionLoading === `approve-${story.id}` ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                                                </button>
                                            )}
                                            <button 
                                                className={`admin-btn admin-btn--feature ${story.featured ? 'active' : ''}`}
                                                onClick={() => handleAction(story.id, 'toggle-featured')}
                                                disabled={!!actionLoading}
                                                title="Toggle Featured"
                                            >
                                                {actionLoading === `toggle-featured-${story.id}` ? <Loader2 className="animate-spin" size={16} /> : <Star size={16} />}
                                            </button>
                                            <button 
                                                className={`admin-btn admin-btn--hero ${story.heroFeatured ? 'active' : ''}`}
                                                onClick={() => handleAction(story.id, 'toggle-hero')}
                                                disabled={!!actionLoading}
                                                title="Toggle Hero Wall"
                                            >
                                                {actionLoading === `toggle-hero-${story.id}` ? <Loader2 className="animate-spin" size={16} /> : <Award size={16} />}
                                            </button>
                                            <button 
                                                className="admin-btn admin-btn--delete"
                                                onClick={() => handleAction(story.id, 'delete')}
                                                disabled={!!actionLoading}
                                                title="Delete Story"
                                            >
                                                {actionLoading === `delete-${story.id}` ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredStories.length === 0 && (
                        <div className="admin-empty">
                            <MessageSquare size={40} className="mx-auto mb-4 opacity-20" />
                            <p>No stories found in this category.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
