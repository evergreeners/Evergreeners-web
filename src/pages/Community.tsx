import { useState, useEffect, useCallback } from 'react';
import { PublicHeader } from '@/components/PublicHeader';
import { Header } from '@/components/Header';
import { CosmicButton } from '@/components/ui/cosmic-button';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Github, Twitter, X, Send, ArrowRight, Star, Users,
    Flame, Calendar, MessageSquare, GitPullRequest, Trophy,
    BookOpen, ExternalLink, Clock, Zap, Loader2, Image as ImageIcon,
    Upload, Link as LinkIcon, Check, Trash2, ShieldCheck
} from 'lucide-react';
import { getApiUrl } from '@/lib/api-config';
import { useSession } from '@/lib/auth-client';
import './Community.css';

/* ─────────────── DATA ─────────────── */

const AVATAR_LAYOUTS = [
    { style: { top: '18%', left: '8%' }, size: 'lg', delay: '0s' },
    { style: { top: '10%', left: '22%' }, size: 'md', delay: '0.5s' },
    { style: { top: '55%', left: '5%' }, size: 'sm', delay: '1s' },
    { style: { top: '75%', left: '18%' }, size: 'md', delay: '1.5s' },
    { style: { top: '12%', right: '20%' }, size: 'lg', delay: '0.3s' },
    { style: { top: '8%', right: '7%' }, size: 'md', delay: '0.8s' },
    { style: { top: '55%', right: '8%' }, size: 'sm', delay: '1.2s' },
    { style: { top: '72%', right: '20%' }, size: 'md', delay: '0.6s' },
];

/* ─────────────── COMPONENTS ─────────────── */

function StoryCard({ story, isAdmin, onAction }: { story: any; isAdmin?: boolean; onAction?: (action: string, id: number) => void }) {
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const handleAction = async (action: string) => {
        if (!onAction) return;
        setActionLoading(action);
        await onAction(action, story.id);
        setActionLoading(null);
    };

    return (
        <div className={`comm-card ${story.featured ? 'comm-card--featured' : ''} ${!story.approved ? 'comm-card--pending' : ''}`}>
            {story.featured && <div className="comm-card-featured-badge">⭐ Featured</div>}
            {!story.approved && <div className="comm-card-pending-badge">⏳ Pending Approval</div>}
            
            <div className="comm-card-header">
                <img src={story.image} alt={story.name} className="comm-card-avatar" loading="lazy" />
                <div className="comm-card-user">
                    <span className="comm-card-name">{story.name}</span>
                    <span className="comm-card-handle">@{story.handle} · {story.role}</span>
                </div>
                <div className="comm-card-platform">
                    {story.platform === 'github' ? <Github size={14} /> : <Twitter size={14} />}
                </div>
            </div>
            <p className="comm-card-quote">"{story.quote}"</p>

            {isAdmin && (
                <div className="comm-card-admin-actions">
                    {!story.approved && (
                        <button 
                            className="comm-admin-btn comm-admin-btn--approve" 
                            onClick={() => handleAction('approve')}
                            disabled={actionLoading === 'approve'}
                        >
                            {actionLoading === 'approve' ? <Loader2 className="animate-spin" size={12} /> : <Check size={12} />}
                            Approve
                        </button>
                    )}
                    <button 
                        className={`comm-admin-btn ${story.heroFeatured ? 'comm-admin-btn--unhero' : 'comm-admin-btn--hero'}`}
                        onClick={() => handleAction('toggle-hero')}
                        disabled={actionLoading === 'toggle-hero'}
                    >
                        {actionLoading === 'toggle-hero' ? <Loader2 className="animate-spin" size={12} /> : <Star size={12} />}
                        {story.heroFeatured ? 'Remove Hero' : 'Hero Wall'}
                    </button>
                    <button 
                        className="comm-admin-btn comm-admin-btn--delete" 
                        onClick={() => handleAction('delete')}
                        disabled={actionLoading === 'delete'}
                    >
                        {actionLoading === 'delete' ? <Loader2 className="animate-spin" size={12} /> : <Trash2 size={12} />}
                        Delete
                    </button>
                </div>
            )}
        </div>
    );
}

function EventCard({ event }: { event: any }) {
    return (
        <div className="comm-event-card">
            <div className="comm-event-icon">{event.icon}</div>
            <div className="comm-event-body">
                <div className="comm-event-meta">
                    <span className="comm-event-type">{event.type}</span>
                    <span className="comm-event-date">
                        <Calendar size={12} /> {event.date}
                    </span>
                    <span className="comm-event-time">
                        <Clock size={12} /> {event.time}
                    </span>
                </div>
                <h3 className="comm-event-title">{event.title}</h3>
                <p className="comm-event-desc">{event.desc}</p>
                <div className="comm-event-footer">
                    <span className="comm-event-attendees">
                        <Users size={13} /> {event.attendees} going
                    </span>
                    <button className="comm-event-join">Register →</button>
                </div>
            </div>
        </div>
    );
}

function MemberRow({ member }: { member: any }) {
    return (
        <div className="comm-member-row">
            <span className={`comm-member-rank ${member.rank <= 3 ? 'top3' : ''}`}>
                {member.badge ?? `#${member.rank}`}
            </span>
            <img src={member.image || member.avatar} alt={member.name} className="comm-member-avatar" loading="lazy" />
            <div className="comm-member-info">
                <span className="comm-member-name">{member.name}</span>
                <span className="comm-member-handle">@{member.handle} · {member.role}</span>
            </div>
            <div className="comm-member-streak">
                <Flame size={14} className="text-orange-400" />
                <span>{member.streak} days</span>
            </div>
        </div>
    );
}

function OpenSourceCard({ item }: { item: any }) {
    return (
        <a href={item.link} target="_blank" rel="noopener noreferrer" className="comm-oss-card">
            <div className="comm-oss-header">
                <div className="comm-oss-title">
                    <BookOpen size={16} className="text-green-400" />
                    {item.title}
                </div>
                <ExternalLink size={14} className="comm-oss-ext" />
            </div>
            <p className="comm-oss-desc">{item.desc}</p>
            <div className="comm-oss-footer">
                <span className="comm-oss-lang">
                    <span className="comm-oss-dot" style={{ background: item.color }} />
                    {item.lang}
                </span>
                <span className="comm-oss-stat"><Star size={12} /> {item.stars}</span>
                <span className="comm-oss-stat comm-oss-issues">{item.issues} issues</span>
            </div>
        </a>
    );
}

interface SubmitFormData {
    name: string; handle: string; role: string;
    platform: 'github' | 'twitter'; story: string; image: string;
    email: string;
}

function SubmitModal({ onClose, onRefresh }: { onClose: () => void; onRefresh: () => void }) {
    const { data: session } = useSession();
    const [form, setForm] = useState<SubmitFormData>({
        name: session?.user?.name || '',
        handle: (session?.user as any)?.username || '',
        role: '',
        platform: 'github',
        story: '',
        image: (session?.user as any)?.image || '',
        email: session?.user?.email || ''
    });
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const avatarUrl = form.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(form.name || 'User')}&background=random`;

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch(getApiUrl('/api/community/upload'), {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) throw new Error('Upload failed');
            const data = await res.json();
            setForm(f => ({ ...f, image: data.url }));
        } catch (err: any) {
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(getApiUrl('/api/community/stories'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    quote: form.story,
                    image: avatarUrl
                }),
            });

            if (!res.ok) throw new Error('Failed to submit story');

            setSubmitted(true);
            onRefresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="comm-modal-overlay" onClick={onClose}>
            <div className="comm-modal" onClick={e => e.stopPropagation()}>
                <button className="comm-modal-close" onClick={onClose}><X size={18} /></button>
                {submitted ? (
                    <div className="comm-modal-success">
                        <div className="comm-modal-success-icon">🎉</div>
                        <h3>Story submitted!</h3>
                        <p>Thanks for sharing. We'll review your story and notify you via email at <strong>{form.email}</strong> once it's published on the community wall.</p>
                        <button className="comm-add-btn" onClick={onClose}>Close</button>
                    </div>
                ) : (
                    <>
                        <div className="comm-modal-header">
                            <div className="comm-modal-avatar-preview">
                                <img src={avatarUrl} alt="Preview" />
                                <div className="comm-modal-avatar-badge"><ImageIcon size={10} /></div>
                            </div>
                            <h2>Share your story</h2>
                            <p>Tell the community how Evergreeners changed your journey.</p>
                        </div>
                        <form className="comm-form" onSubmit={handleSubmit}>
                            <div className="comm-form-row">
                                <div className="comm-form-group">
                                    <label>Full name</label>
                                    <input type="text" placeholder="Ada Lovelace" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                                </div>
                                <div className="comm-form-group">
                                    <label>Handle</label>
                                    <input type="text" placeholder="@username" value={form.handle} onChange={e => setForm(f => ({ ...f, handle: e.target.value }))} required />
                                </div>
                            </div>
                            <div className="comm-form-row">
                                <div className="comm-form-group">
                                    <label>Role</label>
                                    <input type="text" placeholder="Software Engineer" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} required />
                                </div>
                                <div className="comm-form-group">
                                    <label>Platform</label>
                                    <select value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value as 'github' | 'twitter' }))}>
                                        <option value="github">GitHub</option>
                                        <option value="twitter">Twitter / X</option>
                                    </select>
                                </div>
                            </div>

                            <div className="comm-form-group">
                                <label>Email address</label>
                                <input type="email" placeholder="ada@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
                                <p style={{ fontSize: '0.7rem', color: '#4b5563', marginTop: '4px' }}>Used to link your story to your account and notify you when it's published.</p>
                            </div>

                            <div className="comm-form-group">
                                <label>Profile Image</label>
                                <div className="comm-upload-options">
                                    <div className="comm-upload-btn-wrapper">
                                        <button type="button" className="comm-upload-btn" disabled={uploading}>
                                            {uploading ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
                                            {uploading ? 'Upload photo' : 'Upload photo'}
                                        </button>
                                        <input type="file" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
                                    </div>
                                    <div className="comm-upload-divider">or</div>
                                    <div className="comm-link-input">
                                        <LinkIcon size={14} />
                                        <input type="url" placeholder="Paste image URL..." value={form.image} onChange={e => setForm(f => ({ ...f, image: e.target.value }))} />
                                    </div>
                                </div>
                            </div>

                            <div className="comm-form-group">
                                <label>Your story</label>
                                <textarea rows={5} placeholder="Tell us what Evergreeners has meant for your journey as a developer..." value={form.story} onChange={e => setForm(f => ({ ...f, story: e.target.value }))} required />
                            </div>
                            <button type="submit" className="comm-add-btn" style={{ gap: '10px' }} disabled={loading}>
                                {loading ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                                {loading ? 'Submitting...' : 'Submit my story'}
                            </button>
                            {error && <p className="comm-form-error" style={{ color: '#ff4d4d', fontSize: '0.8rem', marginTop: '10px', textAlign: 'center' }}>{error}</p>}
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}

/* ─────────────── PAGE ─────────────── */

type Tab = 'stories' | 'events' | 'members' | 'opensource' | 'admin';

export default function Community() {
    const { data: session } = useSession();
    const [tab, setTab] = useState<Tab>('stories');
    const [storyFilter, setStoryFilter] = useState<'all' | 'featured' | 'github' | 'twitter'>('all');
    const [showModal, setShowModal] = useState(false);

    const queryClient = useQueryClient();

    // 1. Stories Query (caches stories list and admin flag)
    const { data: storiesData, refetch: refetchStories, isLoading: isLoadingStories } = useQuery({
        queryKey: ['communityStories'],
        queryFn: async () => {
            const res = await fetch(getApiUrl('/api/community/stories'));
            if (!res.ok) throw new Error('Failed to fetch stories');
            return res.json();
        }
    });
    const apiStories = storiesData?.stories || [];
    const isAdmin = storiesData?.isAdmin || false;

    // 2. Events Query
    const { data: eventsData, isLoading: isLoadingEvents } = useQuery({
        queryKey: ['communityEvents'],
        queryFn: async () => {
            const res = await fetch(getApiUrl('/api/community/events'));
            if (!res.ok) throw new Error('Failed to fetch events');
            return res.json();
        }
    });
    const apiEvents = eventsData?.events || [];

    // 3. Stats Query
    const { data: statsData, isLoading: isLoadingStats } = useQuery({
        queryKey: ['communityStats'],
        queryFn: async () => {
            const res = await fetch(getApiUrl('/api/community/stats'));
            if (!res.ok) throw new Error('Failed to fetch stats');
            const data = await res.json();
            if (data.stats) {
                const iconMap: Record<string, React.ReactNode> = {
                    'Users': <Users size={18} />,
                    'Flame': <Flame size={18} />,
                    'Star': <Star size={18} />,
                    'GitPullRequest': <GitPullRequest size={18} />
                };
                return data.stats.map((s: any) => ({
                    ...s,
                    icon: iconMap[s.icon] || <Zap size={18} />
                }));
            }
            return [];
        }
    });
    const apiStats = statsData || [];

    // 4. Leaderboard Query
    const { data: leaderboardData, isLoading: isLoadingLeaderboard } = useQuery({
        queryKey: ['leaderboard'],
        queryFn: async () => {
            const res = await fetch(getApiUrl('/api/leaderboard'));
            if (!res.ok) throw new Error('Failed to fetch leaderboard');
            return res.json();
        }
    });
    const leaderboard = leaderboardData?.leaderboard || [];

    // 5. Hero Avatars Query
    const { data: heroAvatarsData, refetch: refetchHeroAvatars, isLoading: isLoadingHero } = useQuery({
        queryKey: ['communityHeroAvatars'],
        queryFn: async () => {
            const res = await fetch(getApiUrl('/api/community/hero-avatars'));
            if (!res.ok) throw new Error('Failed to fetch hero avatars');
            return res.json();
        }
    });
    const apiHeroAvatars = heroAvatarsData?.avatars || [];

    const loading = {
        stories: isLoadingStories,
        events: isLoadingEvents,
        stats: isLoadingStats,
        leaderboard: isLoadingLeaderboard,
        hero: isLoadingHero
    };

    const handleAdminAction = async (action: string, id: number) => {
        try {
            let res;
            if (action === 'approve') {
                res = await fetch(getApiUrl(`/api/community/stories/${id}/approve`), { method: 'PATCH' });
            } else if (action === 'toggle-hero') {
                res = await fetch(getApiUrl(`/api/community/stories/${id}/toggle-hero`), { method: 'PATCH' });
            } else if (action === 'delete') {
                if (!confirm('Are you sure you want to delete this story?')) return;
                res = await fetch(getApiUrl(`/api/community/stories/${id}`), { method: 'DELETE' });
            }

            if (res && res.ok) {
                // Invalidate query cache to trigger fresh background reload
                queryClient.invalidateQueries({ queryKey: ['communityStories'] });
                if (action === 'toggle-hero' || action === 'approve') {
                    queryClient.invalidateQueries({ queryKey: ['communityHeroAvatars'] });
                }
            }
        } catch (err) {
            console.error('Admin action error:', err);
        }
    };

    const mappedHeroAvatars = apiHeroAvatars.map((avatar: any, i: number) => {
        const layout = AVATAR_LAYOUTS[i % AVATAR_LAYOUTS.length];
        return { ...avatar, ...layout };
    });

    const displayStories = apiStories;
    const displayEvents = apiEvents;
    const displayStats = apiStats;
    const displayMembers = leaderboard;

    const filteredStories = displayStories.filter(s => {
        if (storyFilter === 'all') return true;
        if (storyFilter === 'featured') return s.featured;
        return s.platform === storyFilter;
    });

    return (
        <div className="comm-page relative">
            {/* Viewport Corner Tech Lines */}
            <div className="fixed top-6 left-6 w-6 h-6 border-t-2 border-l-2 border-primary z-50 pointer-events-none" />
            <div className="fixed top-6 right-6 w-6 h-6 border-t-2 border-r-2 border-primary z-50 pointer-events-none" />
            <div className="fixed bottom-6 left-6 w-6 h-6 border-b-2 border-l-2 border-primary z-50 pointer-events-none" />
            <div className="fixed bottom-6 right-6 w-6 h-6 border-b-2 border-r-2 border-primary z-50 pointer-events-none" />

            {session ? <Header /> : <PublicHeader />}
            <div className="comm-bg"><div className="comm-bg-grid" /></div>

            <main className="comm-main">
                <section className="comm-hero">
                    {mappedHeroAvatars.map((a, i) => (
                        <div key={i} className={`comm-float-avatar comm-float-avatar--${a.size}`} style={{ ...a.style, animationDelay: a.delay } as any}>
                            <img src={a.image} alt={a.name} loading="lazy" />
                        </div>
                    ))}

                    <div className="comm-hero-content">
                        <h1>Welcome to the<br /><span className="comm-hero-accent">Evergreeners</span> community</h1>
                        <p>Build in public. Stay consistent. Grow together. Whether you're on day 1 or day 500, there's a place for you here.</p>

                        <div className="comm-hero-actions">
                            <a href="https://github.com/evergreeners" target="_blank" rel="noopener noreferrer">
                                <CosmicButton className="cosmic-button--sm">
                                    <Github size={16} style={{ marginRight: 8 }} />
                                    Join us on GitHub
                                </CosmicButton>
                            </a>
                            <div className="comm-story-btn" onClick={() => setShowModal(true)}>
                                <CosmicButton className="cosmic-button--sm">
                                    <ArrowRight size={16} style={{ marginRight: 8 }} />
                                    Share your story
                                </CosmicButton>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="comm-stats">
                    {displayStats.length > 0 && displayStats.map((s, i) => (
                        <div key={i} className="comm-stat">
                            <div className="comm-stat-icon">{s.icon}</div>
                            <div className="comm-stat-value">{s.value}</div>
                            <div className="comm-stat-label">{s.label}</div>
                        </div>
                    ))}
                </section>

                <div className="comm-tabs">
                    {([
                        { id: 'stories', label: 'Stories', icon: <MessageSquare size={15} /> },
                        { id: 'events', label: 'Events', icon: <Calendar size={15} /> },
                        { id: 'members', label: 'Top Members', icon: <Trophy size={15} /> },
                        { id: 'opensource', label: 'Open Source', icon: <GitPullRequest size={15} /> },
                        isAdmin && { id: 'admin', label: 'Moderation', icon: <ShieldCheck size={15} /> },
                    ].filter(Boolean) as any).map((t: any) => (
                        <button key={t.id} onClick={() => setTab(t.id)} className={`comm-tab-btn ${tab === t.id ? 'active' : ''}`}>
                            {t.icon} {t.label}
                        </button>
                    ))}
                </div>

                <div className="comm-tab-content">
                    {tab === 'stories' && (
                        <>
                            <div className="comm-filters">
                                {(['all', 'featured', 'github', 'twitter'] as const).map(f => (
                                    <button key={f} className={`comm-filter-btn ${storyFilter === f ? 'active' : ''}`} onClick={() => setStoryFilter(f)}>
                                        {f === 'all' ? 'All Stories' : f === 'featured' ? '⭐ Featured' : f === 'github' ? 'GitHub' : 'Twitter / X'}
                                    </button>
                                ))}
                            </div>
                            <div className="comm-grid">
                                {filteredStories.length > 0 ? (
                                    filteredStories.map((story) => (
                                        <StoryCard key={story.id} story={story} isAdmin={isAdmin} onAction={handleAdminAction} />
                                    ))
                                ) : !loading.stories && (
                                    <div className="comm-empty-state">
                                        <p>No stories found in this category.</p>
                                    </div>
                                )}
                                <button className="comm-card comm-card--submit" onClick={() => setShowModal(true)}>
                                    <div className="comm-card-submit-inner">
                                        <div className="comm-card-submit-icon"><ArrowRight size={22} /></div>
                                        <p className="comm-card-submit-title">Your story here</p>
                                        <p className="comm-card-submit-sub">Inspire the next developer. Share your Evergreeners journey.</p>
                                        <span className="comm-card-submit-action">Write my story →</span>
                                    </div>
                                </button>
                            </div>
                        </>
                    )}

                    {tab === 'events' && (
                        <div className="comm-events-grid">
                            {displayEvents.length > 0 ? (
                                displayEvents.map((e, idx) => {
                                    if (typeof e.icon === 'string') {
                                        const iconMap: any = { 
                                            Flame: <Flame size={20} className="text-orange-400" />, 
                                            Calendar: <Calendar size={20} className="text-purple-400" />, 
                                            MessageSquare: <MessageSquare size={20} className="text-blue-400" />, 
                                            GitPullRequest: <GitPullRequest size={20} className="text-purple-400" />, 
                                            Trophy: <Trophy size={20} className="text-yellow-400" />, 
                                            Zap: <Zap size={20} className="text-green-400" /> 
                                        };
                                        e = { ...e, icon: iconMap[e.icon] || <Calendar size={20} /> };
                                    }
                                    return <EventCard key={e.id || idx} event={e} />;
                                })
                            ) : !loading.events && (
                                <div className="comm-empty-state">
                                    <p>No upcoming events at the moment. Stay tuned!</p>
                                </div>
                            )}
                        </div>
                    )}

                    {tab === 'members' && (
                        <div className="comm-members-section">
                            <div className="comm-members-header">
                                <h2>Streak Leaderboard</h2>
                                <p>The top developers by longest active streak. Updated daily.</p>
                            </div>
                            <div className="comm-members-list">
                                {displayMembers.length > 0 ? (
                                    displayMembers.map((m, idx) => (
                                        <MemberRow key={m.rank || idx} member={{...m, image: m.avatar || m.image}} />
                                    ))
                                ) : !loading.leaderboard && (
                                    <div className="comm-empty-state">
                                        <p>Leaderboard is being updated. Join now to be the first!</p>
                                    </div>
                                )}
                            </div>
                            <div className="comm-members-cta">
                                <Link to="/signup"><CosmicButton>Join & track your streak</CosmicButton></Link>
                            </div>
                        </div>
                    )}

                    {tab === 'opensource' && (
                        <div className="comm-oss-section">
                            <div className="comm-oss-intro">
                                <h2>Contribute to Evergreeners</h2>
                                <p>Evergreeners is built in the open. Pick a repo, find a good first issue, and start contributing today.</p>
                            </div>
                            <div className="comm-oss-grid">
                                <div className="comm-empty-state">
                                    <p>Open source repository information will be available soon.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {tab === 'admin' && isAdmin && (
                        <div className="comm-admin-section">
                            <div className="comm-members-header">
                                <h2>Community Moderation</h2>
                                <p>Manage pending stories and community content.</p>
                            </div>
                            <Link to="/admin">
                                <CosmicButton className="mx-auto block">Open Admin Dashboard</CosmicButton>
                            </Link>
                        </div>
                    )}
                </div>
            </main>

            {showModal && <SubmitModal onClose={() => setShowModal(false)} onRefresh={refetchStories} />}
        </div>
    );
}
