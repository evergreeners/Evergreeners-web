import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { 
    Check, Star, Trash2, Award, 
    MessageSquare, Loader2, AlertCircle, ExternalLink, ShieldCheck,
    BookOpen, GraduationCap, Plus, Save, X, Users, Inbox, Brain, Eye
} from 'lucide-react';
import { getApiUrl } from '@/lib/api-config';
import { useSession } from '@/lib/auth-client';
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

interface Lesson {
    id: string;
    week: number;
    weekTitle: string;
    title: string;
    duration: string;
    description: string;
    content: string;
    lab: string;
    sortOrder: number;
}

interface Student {
    id: string;
    name: string;
    email: string;
    username: string | null;
    image: string | null;
    academyStatus: string;
    academyJoinedAt: string | null;
    academyPrUrl: string | null;
    academyCertId: string | null;
    academyLessonsCompleted: number;
    academyLastActiveAt: string | null;
    prScore: number | null;
    totalLessons: number;
}

interface WaitlistEntry {
    id: number;
    email: string;
    createdAt: string;
}

interface ReviewRow {
    id: number;
    certId: string;
    prUrl: string;
    score: number;
    summary: string | null;
    strengths: string[] | null;
    improvements: string[] | null;
    checkedAt: string;
    userId: string;
}

interface AcademySummary {
    waitlistCount: number;
    lessonCount: number;
    graduates: number;
    enrolled: number;
    premium: number;
    reviewsSubmitted: number;
    avgReviewScore: number;
}

type Tab = 'stories' | 'courses' | 'academy';

const EMPTY_LESSON: Lesson = {
    id: '', week: 1, weekTitle: '', title: '', duration: '', description: '', content: '', lab: '', sortOrder: 0,
};

const STATUS_LABELS: Record<string, string> = {
    none: 'None',
    audit_completed: 'Audit',
    enrolled: 'Enrolled',
    premium: 'Premium',
    graduated: 'Graduated',
};

export default function AdminDashboard() {
    const { data: session, isPending: authLoading } = useSession();
    const [tab, setTab] = useState<Tab>('stories');
    const [isAdmin, setIsAdmin] = useState(false);

    const [stories, setStories] = useState<Story[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');

    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [lessonsLoading, setLessonsLoading] = useState(false);
    const [editingLesson, setEditingLesson] = useState<Lesson | 'new' | null>(null);
    const [lessonDraft, setLessonDraft] = useState<Lesson>(EMPTY_LESSON);

    const [summary, setSummary] = useState<AcademySummary | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
    const [reviews, setReviews] = useState<ReviewRow[]>([]);
    const [academyLoading, setAcademyLoading] = useState(false);

    const authHeaders = (): Record<string, string> => {
        const headers: Record<string, string> = {};
        if (session?.session?.token) headers['Authorization'] = `Bearer ${session.session.token}`;
        return headers;
    };

    const fetchStories = async () => {
        try {
            const res = await fetch(getApiUrl('/api/community/stories'), {
                headers: authHeaders(),
                credentials: 'include'
            });
            const data = await res.json();

            if (!data.isAdmin) {
                window.location.href = '/dashboard';
                return;
            }

            setIsAdmin(true);
            setStories(data.stories || []);
        } catch (err) {
            console.error('Fetch error:', err);
            toast.error('Failed to load stories');
        } finally {
            setLoading(false);
        }
    };

    const fetchAcademy = async () => {
        setAcademyLoading(true);
        try {
            const headers = authHeaders();
            const [sumRes, stuRes, wlRes, revRes] = await Promise.all([
                fetch(getApiUrl('/api/admin/academy/summary'), { headers, credentials: 'include' }),
                fetch(getApiUrl('/api/admin/academy/students'), { headers, credentials: 'include' }),
                fetch(getApiUrl('/api/admin/academy/waitlist'), { headers, credentials: 'include' }),
                fetch(getApiUrl('/api/admin/academy/reviews'), { headers, credentials: 'include' }),
            ]);

            const sum = await sumRes.json();
            const stu = await stuRes.json();
            const wl = await wlRes.json();
            const rev = await revRes.json();

            if (!sum.success) throw new Error('summary failed');
            setSummary(sum.summary);
            setStudents(stu.students || []);
            setWaitlist(wl.waitlist || []);
            setReviews(rev.reviews || []);
        } catch (err) {
            console.error('Academy fetch error:', err);
            toast.error('Failed to load Academy data');
        } finally {
            setAcademyLoading(false);
        }
    };

    const fetchLessons = async () => {
        setLessonsLoading(true);
        try {
            const res = await fetch(getApiUrl('/api/admin/academy/lessons'), {
                headers: authHeaders(),
                credentials: 'include'
            });
            const data = await res.json();
            if (!data.success) throw new Error('lessons failed');
            setLessons(data.lessons || []);
        } catch (err) {
            console.error('Lessons fetch error:', err);
            toast.error('Failed to load courses');
        } finally {
            setLessonsLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading) fetchStories();
    }, [authLoading]);

    useEffect(() => {
        if (isAdmin && tab === 'courses') fetchLessons();
        if (isAdmin && tab === 'academy') fetchAcademy();
    }, [isAdmin, tab]);

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
                headers: authHeaders(),
                credentials: 'include'
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

    const openLessonEditor = (lesson?: Lesson) => {
        if (lesson) {
            setEditingLesson(lesson);
            setLessonDraft({ ...lesson });
        } else {
            setEditingLesson('new');
            setLessonDraft({ ...EMPTY_LESSON, id: `lesson-${Date.now()}` });
        }
    };

    const saveLesson = async () => {
        if (!lessonDraft.title) {
            toast.error('Title is required');
            return;
        }
        try {
            const isNew = editingLesson === 'new';
            const url = isNew ? getApiUrl('/api/admin/academy/lessons') : getApiUrl(`/api/admin/academy/lessons/${lessonDraft.id}`);
            const res = await fetch(url, {
                method: isNew ? 'POST' : 'PUT',
                headers: { ...authHeaders(), 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(lessonDraft),
            });
            const data = await res.json();
            if (!data.success) throw new Error('save failed');
            toast.success(isNew ? 'Lesson created' : 'Lesson updated');
            setEditingLesson(null);
            fetchLessons();
        } catch (err) {
            console.error('Save lesson error:', err);
            toast.error('Failed to save lesson');
        }
    };

    const deleteLesson = async (id: string) => {
        if (!confirm(`Delete lesson "${id}"? This cannot be undone.`)) return;
        try {
            const res = await fetch(getApiUrl(`/api/admin/academy/lessons/${id}`), {
                method: 'DELETE',
                headers: authHeaders(),
                credentials: 'include',
            });
            const data = await res.json();
            if (!data.success) throw new Error('delete failed');
            toast.success('Lesson deleted');
            fetchLessons();
        } catch (err) {
            console.error('Delete lesson error:', err);
            toast.error('Failed to delete lesson');
        }
    };

    const updateStudent = async (student: Student, patch: Partial<Student>) => {
        try {
            const res = await fetch(getApiUrl(`/api/admin/academy/students/${student.id}`), {
                method: 'PATCH',
                headers: { ...authHeaders(), 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ status: patch.academyStatus, lessonsCompleted: patch.academyLessonsCompleted }),
            });
            const data = await res.json();
            if (!data.success) throw new Error('update failed');
            toast.success('Student updated');
            fetchAcademy();
        } catch (err) {
            console.error('Update student error:', err);
            toast.error('Failed to update student');
        }
    };

    const removeWaitlistEntry = async (id: number) => {
        if (!confirm('Remove this email from the waitlist?')) return;
        try {
            const res = await fetch(getApiUrl(`/api/admin/academy/waitlist/${id}`), {
                method: 'DELETE',
                headers: authHeaders(),
                credentials: 'include',
            });
            const data = await res.json();
            if (!data.success) throw new Error('delete failed');
            toast.success('Waitlist entry removed');
            fetchAcademy();
        } catch (err) {
            console.error('Remove waitlist error:', err);
            toast.error('Failed to remove waitlist entry');
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
                        Full Access
                    </div>
                </div>

                <div className="admin-tabs">
                    <button className={`admin-tab ${tab === 'stories' ? 'active' : ''}`} onClick={() => setTab('stories')}>
                        <MessageSquare size={14} className="inline mr-1.5 align-[-2px]" />
                        Stories
                    </button>
                    <button className={`admin-tab ${tab === 'courses' ? 'active' : ''}`} onClick={() => setTab('courses')}>
                        <BookOpen size={14} className="inline mr-1.5 align-[-2px]" />
                        Courses
                    </button>
                    <button className={`admin-tab ${tab === 'academy' ? 'active' : ''}`} onClick={() => setTab('academy')}>
                        <GraduationCap size={14} className="inline mr-1.5 align-[-2px]" />
                        Academy
                    </button>
                </div>

                {tab === 'stories' && (
                    <>
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

                        <div className="admin-tabs admin-tabs--sub">
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
                    </>
                )}

                {tab === 'courses' && (
                    <div className="admin-section">
                        <div className="admin-section-header">
                            <div>
                                <h3 className="admin-section-title"><BookOpen size={18} className="inline mr-2 align-[-3px]" />Course Curriculum</h3>
                                <p className="admin-section-sub">Lessons shown in the student portal.</p>
                            </div>
                            <button className="admin-primary-btn" onClick={() => openLessonEditor()}>
                                <Plus size={16} className="mr-1.5" /> New Lesson
                            </button>
                        </div>

                        {editingLesson && (
                            <div className="admin-editor">
                                <div className="admin-editor-header">
                                    <h4>{editingLesson === 'new' ? 'New Lesson' : `Edit: ${editingLesson.title}`}</h4>
                                    <button className="admin-btn admin-btn--delete" onClick={() => setEditingLesson(null)} title="Close"><X size={16} /></button>
                                </div>
                                <div className="admin-form-grid">
                                    <label className="admin-field">
                                        <span>Lesson ID</span>
                                        <input className="admin-input" value={lessonDraft.id} onChange={e => setLessonDraft({ ...lessonDraft, id: e.target.value })} placeholder="e.g. 2.3" />
                                    </label>
                                    <label className="admin-field">
                                        <span>Week</span>
                                        <input className="admin-input" type="number" min={1} max={8} value={lessonDraft.week} onChange={e => setLessonDraft({ ...lessonDraft, week: Number(e.target.value) })} />
                                    </label>
                                    <label className="admin-field">
                                        <span>Week Title</span>
                                        <input className="admin-input" value={lessonDraft.weekTitle} onChange={e => setLessonDraft({ ...lessonDraft, weekTitle: e.target.value })} placeholder="e.g. Foundations" />
                                    </label>
                                    <label className="admin-field">
                                        <span>Sort Order</span>
                                        <input className="admin-input" type="number" value={lessonDraft.sortOrder} onChange={e => setLessonDraft({ ...lessonDraft, sortOrder: Number(e.target.value) })} />
                                    </label>
                                    <label className="admin-field admin-field--full">
                                        <span>Title</span>
                                        <input className="admin-input" value={lessonDraft.title} onChange={e => setLessonDraft({ ...lessonDraft, title: e.target.value })} placeholder="Lesson title" />
                                    </label>
                                    <label className="admin-field">
                                        <span>Duration</span>
                                        <input className="admin-input" value={lessonDraft.duration} onChange={e => setLessonDraft({ ...lessonDraft, duration: e.target.value })} placeholder="e.g. 45 min" />
                                    </label>
                                    <label className="admin-field">
                                        <span>Lab (LearnGitBranching)</span>
                                        <input className="admin-input" value={lessonDraft.lab} onChange={e => setLessonDraft({ ...lessonDraft, lab: e.target.value })} placeholder="Level slug" />
                                    </label>
                                    <label className="admin-field admin-field--full">
                                        <span>Description</span>
                                        <textarea className="admin-textarea" value={lessonDraft.description} onChange={e => setLessonDraft({ ...lessonDraft, description: e.target.value })} rows={3} />
                                    </label>
                                    <label className="admin-field admin-field--full">
                                        <span>Content (markdown)</span>
                                        <textarea className="admin-textarea" value={lessonDraft.content} onChange={e => setLessonDraft({ ...lessonDraft, content: e.target.value })} rows={8} />
                                    </label>
                                </div>
                                <div className="admin-editor-actions">
                                    <button className="admin-primary-btn" onClick={saveLesson}><Save size={16} className="mr-1.5" />Save</button>
                                    <button className="admin-ghost-btn" onClick={() => setEditingLesson(null)}>Cancel</button>
                                </div>
                            </div>
                        )}

                        {lessonsLoading ? (
                            <div className="admin-empty flex items-center justify-center py-12">
                                <Loader2 className="animate-spin text-primary" size={24} />
                            </div>
                        ) : (
                            <div className="admin-table-container">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Week</th>
                                            <th>Title</th>
                                            <th>Duration</th>
                                            <th>Lab</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {lessons.map(lesson => (
                                            <tr key={lesson.id}>
                                                <td className="font-mono text-primary">{lesson.id}</td>
                                                <td>
                                                    <span className="admin-badge admin-badge--featured">Week {lesson.week}</span>
                                                </td>
                                                <td>
                                                    <div className="admin-user-info">
                                                        <span className="admin-user-name">{lesson.title}</span>
                                                        <span className="admin-user-handle">{lesson.weekTitle}</span>
                                                    </div>
                                                </td>
                                                <td>{lesson.duration}</td>
                                                <td className="font-mono text-xs">{lesson.lab}</td>
                                                <td>
                                                    <div className="admin-actions">
                                                        <button className="admin-btn admin-btn--approve" onClick={() => openLessonEditor(lesson)} title="Edit"><Save size={16} /></button>
                                                        <button className="admin-btn admin-btn--delete" onClick={() => deleteLesson(lesson.id)} title="Delete"><Trash2 size={16} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {lessons.length === 0 && (
                                    <div className="admin-empty">
                                        <BookOpen size={40} className="mx-auto mb-4 opacity-20" />
                                        <p>No lessons yet. Create your first one.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {tab === 'academy' && (
                    <div className="admin-section">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-border/40">
                            <div>
                                <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                                    <GraduationCap className="text-primary w-5 h-5" /> Evergreeners Academy Management
                                </h3>
                                <p className="text-xs text-muted-foreground mt-1">Manage waitlist, enrolled cohort, curriculum lessons, and pre-launch preview access.</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 shrink-0">
                                <a
                                    href="/academy"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-secondary text-secondary-foreground border border-white/10 font-semibold text-xs hover:bg-secondary/80 transition-all shadow-sm"
                                >
                                    <Eye size={14} />
                                    <span>Public View (/academy)</span>
                                    <ExternalLink size={12} className="opacity-70" />
                                </a>
                                <a
                                    href="/academy/dashboard"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-primary text-black font-semibold text-xs hover:bg-primary/90 transition-all shadow-md shadow-primary/10"
                                >
                                    <GraduationCap size={14} />
                                    <span>Student Portal (/academy/dashboard)</span>
                                    <ExternalLink size={12} className="opacity-70" />
                                </a>
                            </div>
                        </div>
                        {academyLoading && !summary ? (
                            <div className="admin-empty flex items-center justify-center py-12">
                                <Loader2 className="animate-spin text-primary" size={24} />
                            </div>
                        ) : (
                            <>
                                <div className="admin-stats">
                                    <div className="admin-stat-card">
                                        <div className="admin-stat-label">Waitlist</div>
                                        <div className="admin-stat-value">{summary?.waitlistCount ?? 0}</div>
                                    </div>
                                    <div className="admin-stat-card">
                                        <div className="admin-stat-label">Enrolled</div>
                                        <div className="admin-stat-value text-amber-500">{summary?.enrolled ?? 0}</div>
                                    </div>
                                    <div className="admin-stat-card">
                                        <div className="admin-stat-label">Premium</div>
                                        <div className="admin-stat-value text-purple-500">{summary?.premium ?? 0}</div>
                                    </div>
                                    <div className="admin-stat-card">
                                        <div className="admin-stat-label">Graduates</div>
                                        <div className="admin-stat-value text-green-500">{summary?.graduates ?? 0}</div>
                                    </div>
                                    <div className="admin-stat-card">
                                        <div className="admin-stat-label">Avg Review Score</div>
                                        <div className="admin-stat-value text-cyan-500">{summary?.avgReviewScore ?? '—'}</div>
                                    </div>
                                    <div className="admin-stat-card">
                                        <div className="admin-stat-label">Lessons in Curriculum</div>
                                        <div className="admin-stat-value">{summary?.lessonCount ?? 0}</div>
                                    </div>
                                </div>

                                <div className="admin-section-header">
                                    <div>
                                        <h3 className="admin-section-title"><Users size={18} className="inline mr-2 align-[-3px]" />Students</h3>
                                        <p className="admin-section-sub">{students.length} in the cohort.</p>
                                    </div>
                                </div>
                                <div className="admin-table-container">
                                    <table className="admin-table">
                                        <thead>
                                            <tr>
                                                <th>Student</th>
                                                <th>Status</th>
                                                <th>Progress</th>
                                                <th>PR Score</th>
                                                <th>Joined</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {students.map(student => (
                                                <tr key={student.id}>
                                                    <td>
                                                        <div className="admin-user-cell">
                                                            <img src={student.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=random`} className="admin-user-avatar" alt="" />
                                                            <div className="admin-user-info">
                                                                <span className="admin-user-name">{student.name}</span>
                                                                <span className="admin-user-handle">{student.email}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <select
                                                            className="admin-input admin-input--sm"
                                                            value={student.academyStatus}
                                                            onChange={e => updateStudent(student, { academyStatus: e.target.value })}
                                                        >
                                                            {Object.entries(STATUS_LABELS).map(([value, label]) => (
                                                                <option key={value} value={value}>{label}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td>
                                                        <span className="text-sm">
                                                            {student.academyLessonsCompleted} / {student.totalLessons || 12}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {student.prScore !== null ? (
                                                            <span className={`admin-badge ${student.prScore >= 80 ? 'admin-badge--approved' : 'admin-badge--pending'}`}>
                                                                {student.prScore}
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted-foreground text-sm">—</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <span className="text-sm text-muted-foreground">
                                                            {student.academyJoinedAt ? new Date(student.academyJoinedAt).toLocaleDateString() : '—'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {students.length === 0 && (
                                        <div className="admin-empty">
                                            <Users size={40} className="mx-auto mb-4 opacity-20" />
                                            <p>No students enrolled yet. The Academy opens Aug 31.</p>
                                        </div>
                                    )}
                                </div>

                                <div className="admin-section-header admin-section-header--mt">
                                    <div>
                                        <h3 className="admin-section-title"><Inbox size={18} className="inline mr-2 align-[-3px]" />Waitlist</h3>
                                        <p className="admin-section-sub">{summary?.waitlistCount ?? 0} emails captured.</p>
                                    </div>
                                </div>
                                <div className="admin-table-container">
                                    <table className="admin-table">
                                        <thead>
                                            <tr>
                                                <th>Email</th>
                                                <th>Subscribed</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {waitlist.map(entry => (
                                                <tr key={entry.id}>
                                                    <td className="text-sm">{entry.email}</td>
                                                    <td className="text-sm text-muted-foreground">{new Date(entry.createdAt).toLocaleString()}</td>
                                                    <td>
                                                        <button className="admin-btn admin-btn--delete" onClick={() => removeWaitlistEntry(entry.id)} title="Remove"><Trash2 size={16} /></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {waitlist.length === 0 && (
                                        <div className="admin-empty">
                                            <Inbox size={40} className="mx-auto mb-4 opacity-20" />
                                            <p>No waitlist signups yet.</p>
                                        </div>
                                    )}
                                </div>

                                <div className="admin-section-header admin-section-header--mt">
                                    <div>
                                        <h3 className="admin-section-title"><Brain size={18} className="inline mr-2 align-[-3px]" />AI PR Reviews</h3>
                                        <p className="admin-section-sub">Gemini-scored capstone submissions.</p>
                                    </div>
                                </div>
                                <div className="admin-table-container">
                                    <table className="admin-table">
                                        <thead>
                                            <tr>
                                                <th>Cert</th>
                                                <th>PR</th>
                                                <th>Score</th>
                                                <th>Summary</th>
                                                <th>Checked</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reviews.map(review => (
                                                <tr key={review.id}>
                                                    <td className="text-xs font-mono">{review.certId}</td>
                                                    <td>
                                                        {review.prUrl && (
                                                            <a href={review.prUrl} target="_blank" rel="noreferrer" className="admin-link">
                                                                View PR <ExternalLink size={12} className="inline align-[-2px]" />
                                                            </a>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <span className={`admin-badge ${review.score >= 80 ? 'admin-badge--approved' : 'admin-badge--pending'}`}>
                                                            {review.score}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="max-w-md truncate text-muted-foreground text-sm">
                                                            {review.summary || '—'}
                                                        </div>
                                                    </td>
                                                    <td className="text-sm text-muted-foreground">{new Date(review.checkedAt).toLocaleDateString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {reviews.length === 0 && (
                                        <div className="admin-empty">
                                            <Brain size={40} className="mx-auto mb-4 opacity-20" />
                                            <p>No PR reviews submitted yet.</p>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}