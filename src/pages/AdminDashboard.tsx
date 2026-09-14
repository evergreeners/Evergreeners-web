import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { 
    Check, Star, Trash2, Award, 
    MessageSquare, Loader2, AlertCircle, ExternalLink, ShieldCheck,
    BookOpen, GraduationCap, Plus, Save, X, Users, Inbox, Brain, Eye,
    Mail, Send, CheckSquare, Square, Search, Sparkles, RefreshCw, AlertTriangle, Grid
} from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { getApiUrl } from '@/lib/api-config';
import { useSession } from '@/lib/auth-client';
import { buildCommitGridMatrix } from '@/lib/commit-grid';
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

export interface BroadcastUser {
    id: string;
    name: string | null;
    username: string | null;
    email: string;
    image: string | null;
    streak: number | null;
    totalCommits: number | null;
    createdAt: string;
    role: string | null;
}

type Tab = 'stories' | 'courses' | 'academy' | 'broadcast';

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

const COMMIT_GRID_PRESETS = [
    {
        id: '256',
        label: '256 (Programmer Day)',
        text: '256',
        repoTag: '● git://evergreeners/day-256',
        subBadge: '2⁸ = 256 bytes · 0x100',
        footerNote: '256 commits to the craft'
    },
    {
        id: '100',
        label: '100 (Century Milestone)',
        text: '100',
        repoTag: '● git://evergreeners/100-days-of-code',
        subBadge: 'century milestone',
        footerNote: '100 days of relentless execution'
    },
    {
        id: '365',
        label: '365 (Year in Code)',
        text: '365',
        repoTag: '● git://evergreeners/year-one',
        subBadge: 'full rotation complete',
        footerNote: '365/365 days committed'
    },
    {
        id: 'SHIP',
        label: 'SHIP',
        text: 'SHIP',
        repoTag: '● git://evergreeners/production',
        subBadge: 'build and ship',
        footerNote: 'unbroken shipping streak'
    },
    {
        id: 'DEV',
        label: 'DEV',
        text: 'DEV',
        repoTag: '● git://evergreeners/engineering',
        subBadge: 'developer craft',
        footerNote: 'code compounding daily'
    },
    {
        id: 'FIRE',
        label: 'FIRE',
        text: 'FIRE',
        repoTag: '● git://evergreeners/on-fire',
        subBadge: 'active streak',
        footerNote: 'unyielding developer discipline'
    }
];

function CommitGridPreview({
    text = '256',
    repoTag = '● git://evergreeners/day-256',
    subBadge = '2⁸ = 256 bytes · 0x100',
    footerNote = '256 commits to the craft'
}: {
    text?: string;
    repoTag?: string;
    subBadge?: string;
    footerNote?: string;
}) {
    const grid = buildCommitGridMatrix(text, 24);
    const cleanText = (text || '256').trim().toUpperCase();

    return (
        <div className="commit-grid-card">
            <div className="commit-grid-card-header">
                <span className="commit-grid-repo-tag">{repoTag}</span>
                <span className="commit-grid-sub-badge">{subBadge}</span>
            </div>

            <div className="commit-grid-body">
                <div className="commit-grid-month-bar">
                    <span>JAN</span>
                    <span>MAR</span>
                    <span>MAY</span>
                    <span>JUL</span>
                    <span className="commit-grid-month-active">
                        {cleanText === '256' ? 'SEP 13 (DAY 256)' : `CURRENT: ${cleanText}`}
                    </span>
                </div>

                <table className="commit-grid-table" role="presentation">
                    <tbody>
                        {grid.map((row, rIdx) => {
                            const label = rIdx === 1 ? 'Mon' : rIdx === 3 ? 'Wed' : rIdx === 5 ? 'Fri' : '';
                            return (
                                <tr key={rIdx}>
                                    <td className="commit-grid-day-label">{label}</td>
                                    {row.map((val, cIdx) => (
                                        <td key={cIdx} className="p-0">
                                            <div
                                                className={`commit-grid-cell level-${val}`}
                                                title={`Row ${rIdx + 1}, Col ${cIdx + 1}: Level ${val}`}
                                            />
                                        </td>
                                    ))}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="commit-grid-card-footer">
                <div className="commit-grid-legend">
                    <span>Less</span>
                    <div className="commit-grid-legend-cell level-0" />
                    <div className="commit-grid-legend-cell level-1" />
                    <div className="commit-grid-legend-cell level-2" />
                    <div className="commit-grid-legend-cell level-3" />
                    <div className="commit-grid-legend-cell level-4" />
                    <span>More</span>
                </div>
                <div className="commit-grid-footer-note">{footerNote}</div>
            </div>
        </div>
    );
}

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

    // Broadcast Emails state
    const [broadcastUsers, setBroadcastUsers] = useState<BroadcastUser[]>([]);
    const [broadcastUsersLoading, setBroadcastUsersLoading] = useState(false);
    const [broadcastTarget, setBroadcastTarget] = useState<'all' | 'selected' | 'test'>('all');
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [broadcastSubject, setBroadcastSubject] = useState('');
    const [broadcastHeadline, setBroadcastHeadline] = useState('');
    const [broadcastPreviewText, setBroadcastPreviewText] = useState('');
    const [broadcastMessage, setBroadcastMessage] = useState('');
    const [broadcastButtonText, setBroadcastButtonText] = useState('Open Dashboard');
    const [broadcastButtonUrl, setBroadcastButtonUrl] = useState('https://evergreeners.dev/dashboard');
    const [testEmail, setTestEmail] = useState('muhammadadamualiyu33@gmail.com');
    const [broadcastSending, setBroadcastSending] = useState(false);
    const [broadcastConfirmOpen, setBroadcastConfirmOpen] = useState(false);
    const [broadcastResult, setBroadcastResult] = useState<{ sent: number; failed: number; message: string } | null>(null);

    // Pixel Commit Grid Graphic state
    const [commitGridEnabled, setCommitGridEnabled] = useState(false);
    const [commitGridText, setCommitGridText] = useState('256');
    const [commitGridRepoTag, setCommitGridRepoTag] = useState('● git://evergreeners/day-256');
    const [commitGridSubBadge, setCommitGridSubBadge] = useState('2⁸ = 256 bytes · 0x100');
    const [commitGridFooterNote, setCommitGridFooterNote] = useState('256 commits to the craft');

    const applyCommitGridPreset = (presetId: string) => {
        const found = COMMIT_GRID_PRESETS.find(p => p.id === presetId);
        if (found) {
            setCommitGridEnabled(true);
            setCommitGridText(found.text);
            setCommitGridRepoTag(found.repoTag);
            setCommitGridSubBadge(found.subBadge);
            setCommitGridFooterNote(found.footerNote);
        }
    };

    // AI Broadcast Copilot state (powered by Gemini 2.5 Flash)
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiTone, setAiTone] = useState<'badass' | 'direct' | 'celebratory'>('badass');
    const [aiLoading, setAiLoading] = useState(false);
    const [aiActionType, setAiActionType] = useState<'generate' | 'enhance' | null>(null);
    const [aiReviewOpen, setAiReviewOpen] = useState(false);
    const [aiReviewMode, setAiReviewMode] = useState<'generate' | 'enhance'>('generate');
    const [aiStagedDraft, setAiStagedDraft] = useState<{
        subject: string;
        headline: string;
        previewText: string;
        message: string;
        buttonText: string;
        buttonUrl: string;
        commitGrid?: {
            enabled: boolean;
            text: string;
            repoTag?: string;
            subBadge?: string;
            footerNote?: string;
        };
    }>({
        subject: '',
        headline: '',
        previewText: '',
        message: '',
        buttonText: 'Open Dashboard',
        buttonUrl: 'https://evergreeners.dev/dashboard',
        commitGrid: undefined,
    });
    const [aiOriginalDraft, setAiOriginalDraft] = useState<{
        subject: string;
        headline: string;
        previewText: string;
        message: string;
        buttonText: string;
        buttonUrl: string;
        commitGrid?: {
            enabled: boolean;
            text: string;
            repoTag?: string;
            subBadge?: string;
            footerNote?: string;
        };
    }>({
        subject: '',
        headline: '',
        previewText: '',
        message: '',
        buttonText: 'Open Dashboard',
        buttonUrl: 'https://evergreeners.dev/dashboard',
        commitGrid: undefined,
    });
    const [aiRevisionPrompt, setAiRevisionPrompt] = useState('');

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

    const fetchBroadcastUsers = async () => {
        setBroadcastUsersLoading(true);
        try {
            const res = await fetch(getApiUrl('/api/admin/broadcast/users'), {
                headers: authHeaders(),
                credentials: 'include'
            });
            const data = await res.json();
            if (data.success) {
                setBroadcastUsers(data.users || []);
            } else {
                throw new Error(data.error || 'Failed to fetch users');
            }
        } catch (err: any) {
            console.error('Failed to load broadcast users:', err);
            toast.error('Failed to load users for email broadcast');
        } finally {
            setBroadcastUsersLoading(false);
        }
    };

    const executeSendBroadcast = async (targetOverride?: 'test') => {
        const target = targetOverride || broadcastTarget;

        if (!broadcastSubject.trim()) {
            toast.error('Subject line is required');
            return;
        }
        if (!broadcastMessage.trim()) {
            toast.error('Email message body is required');
            return;
        }
        if (target === 'test' && !testEmail.trim()) {
            toast.error('Test recipient email is required');
            return;
        }
        if (target === 'selected' && selectedUserIds.length === 0) {
            toast.error('Please select at least one recipient');
            return;
        }

        setBroadcastSending(true);
        setBroadcastConfirmOpen(false);

        try {
            const res = await fetch(getApiUrl('/api/admin/broadcast/send'), {
                method: 'POST',
                headers: {
                    ...authHeaders(),
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    target,
                    subject: broadcastSubject.trim(),
                    headline: broadcastHeadline.trim() || undefined,
                    previewText: broadcastPreviewText.trim() || undefined,
                    message: broadcastMessage.trim(),
                    buttonText: broadcastButtonText.trim() || undefined,
                    buttonUrl: broadcastButtonUrl.trim() || undefined,
                    selectedUserIds: target === 'selected' ? selectedUserIds : undefined,
                    testEmail: target === 'test' ? testEmail.trim() : undefined,
                    commitGrid: commitGridEnabled ? {
                        enabled: true,
                        text: commitGridText.trim().toUpperCase().slice(0, 5) || '256',
                        repoTag: commitGridRepoTag.trim() || undefined,
                        subBadge: commitGridSubBadge.trim() || undefined,
                        footerNote: commitGridFooterNote.trim() || undefined,
                    } : undefined,
                })
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || 'Broadcast failed');
            }

            setBroadcastResult({
                sent: data.sent,
                failed: data.failed,
                message: data.message,
            });

            if (target === 'test') {
                toast.success(`Test email successfully delivered to ${testEmail}`);
            } else {
                toast.success(`Broadcast sent: ${data.sent} delivered, ${data.failed} failed`);
            }
        } catch (err: any) {
            console.error('Broadcast send error:', err);
            toast.error(err.message || 'Failed to send broadcast');
        } finally {
            setBroadcastSending(false);
        }
    };

    const handleAiAssist = async (mode: 'generate' | 'enhance', customInstruction?: string) => {
        const instructionToUse = (customInstruction || aiPrompt).trim();
        
        if (mode === 'enhance' && !broadcastMessage.trim() && !broadcastSubject.trim()) {
            toast.error('Please draft a subject or message in the composer first before enhancing.');
            return;
        }

        setAiLoading(true);
        setAiActionType(mode);

        try {
            const currentDraft = {
                subject: broadcastSubject.trim() || undefined,
                headline: broadcastHeadline.trim() || undefined,
                previewText: broadcastPreviewText.trim() || undefined,
                message: broadcastMessage.trim() || undefined,
                buttonText: broadcastButtonText.trim() || undefined,
                buttonUrl: broadcastButtonUrl.trim() || undefined,
                commitGrid: commitGridEnabled ? {
                    enabled: true,
                    text: commitGridText.trim().toUpperCase().slice(0, 5) || '256',
                    repoTag: commitGridRepoTag.trim() || undefined,
                    subBadge: commitGridSubBadge.trim() || undefined,
                    footerNote: commitGridFooterNote.trim() || undefined,
                } : undefined,
            };

            const res = await fetch(getApiUrl('/api/admin/broadcast/ai-assist'), {
                method: 'POST',
                headers: {
                    ...authHeaders(),
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    mode,
                    instruction: instructionToUse || undefined,
                    currentDraft,
                    tone: aiTone,
                }),
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || 'AI assistance failed');
            }

            setAiOriginalDraft({
                subject: broadcastSubject,
                headline: broadcastHeadline,
                previewText: broadcastPreviewText,
                message: broadcastMessage,
                buttonText: broadcastButtonText,
                buttonUrl: broadcastButtonUrl,
                commitGrid: commitGridEnabled ? {
                    enabled: true,
                    text: commitGridText,
                    repoTag: commitGridRepoTag,
                    subBadge: commitGridSubBadge,
                    footerNote: commitGridFooterNote,
                } : undefined,
            });

            setAiStagedDraft({
                subject: data.draft.subject || '',
                headline: data.draft.headline || '',
                previewText: data.draft.previewText || '',
                message: data.draft.message || '',
                buttonText: data.draft.buttonText || 'Open Dashboard',
                buttonUrl: data.draft.buttonUrl || 'https://evergreeners.dev/dashboard',
                commitGrid: data.draft.commitGrid || (commitGridEnabled ? {
                    enabled: true,
                    text: commitGridText,
                    repoTag: commitGridRepoTag,
                    subBadge: commitGridSubBadge,
                    footerNote: commitGridFooterNote,
                } : undefined),
            });

            setAiReviewMode(mode);
            setAiReviewOpen(true);
            setAiRevisionPrompt('');
            toast.success(mode === 'enhance' ? 'Draft elevated by Gemini. Review before applying.' : 'AI draft synthesized. Review before applying.');
        } catch (err: any) {
            console.error('AI assist error:', err);
            toast.error(err.message || 'Failed to communicate with AI assist');
        } finally {
            setAiLoading(false);
            setAiActionType(null);
        }
    };

    const handleAiRefine = async () => {
        if (!aiRevisionPrompt.trim()) return;
        await handleAiAssist('enhance', `Admin revision adjustment: ${aiRevisionPrompt.trim()}`);
    };

    const handleAiApply = () => {
        setBroadcastSubject(aiStagedDraft.subject);
        setBroadcastHeadline(aiStagedDraft.headline);
        setBroadcastPreviewText(aiStagedDraft.previewText);
        setBroadcastMessage(aiStagedDraft.message);
        setBroadcastButtonText(aiStagedDraft.buttonText);
        setBroadcastButtonUrl(aiStagedDraft.buttonUrl);
        if (aiStagedDraft.commitGrid) {
            setCommitGridEnabled(Boolean(aiStagedDraft.commitGrid.enabled));
            if (aiStagedDraft.commitGrid.text) setCommitGridText(aiStagedDraft.commitGrid.text);
            if (aiStagedDraft.commitGrid.repoTag) setCommitGridRepoTag(aiStagedDraft.commitGrid.repoTag);
            if (aiStagedDraft.commitGrid.subBadge) setCommitGridSubBadge(aiStagedDraft.commitGrid.subBadge);
            if (aiStagedDraft.commitGrid.footerNote) setCommitGridFooterNote(aiStagedDraft.commitGrid.footerNote);
        }
        setAiReviewOpen(false);
        toast.success('AI copy applied directly to composer.');
    };

    useEffect(() => {
        if (!authLoading) fetchStories();
    }, [authLoading]);

    useEffect(() => {
        if (isAdmin && tab === 'courses') fetchLessons();
        if (isAdmin && tab === 'academy') fetchAcademy();
        if (isAdmin && tab === 'broadcast') fetchBroadcastUsers();
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
                    <div className="flex items-center gap-3.5">
                        <div className="admin-header-badge-icon">
                            <ShieldCheck size={20} className="text-emerald-400" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2.5">
                                <h1>Admin Command Center</h1>
                                <span className="admin-live-badge">
                                    <span className="admin-live-dot" />
                                    ROOT
                                </span>
                            </div>
                            <p className="admin-header-subtitle">
                                Evergreeners Core Platform &amp; Communications
                            </p>
                        </div>
                    </div>
                    <div className="admin-header-auth-chip">
                        <span className="admin-live-dot" />
                        <span>SESSION ACTIVE</span>
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
                    <button className={`admin-tab ${tab === 'broadcast' ? 'active' : ''}`} onClick={() => setTab('broadcast')}>
                        <Mail size={14} className="inline mr-1.5 align-[-2px]" />
                        Broadcast Emails
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
                                        <div className="admin-stat-value text-cyan-500">{summary?.avgReviewScore ?? 'N/A'}</div>
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
                                                            <span className="text-muted-foreground text-sm font-mono">N/A</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <span className="text-sm text-muted-foreground">
                                                            {student.academyJoinedAt ? new Date(student.academyJoinedAt).toLocaleDateString() : 'N/A'}
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
                                                            {review.summary || '-'}
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

                {tab === 'broadcast' && (
                    <div className="space-y-6">
                        {/* Section Header */}
                        <div className="admin-section-header">
                            <div>
                                <h2 className="admin-section-title">
                                    <Mail size={20} className="inline mr-2 align-[-3px] text-primary" />
                                    Broadcast Emails
                                </h2>
                                <p className="admin-section-sub">
                                    Dispatch announcements, holiday editions, and customized communications directly to user inboxes.
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    className="admin-btn admin-btn--secondary text-xs flex items-center gap-1.5"
                                    onClick={() => fetchBroadcastUsers()}
                                    disabled={broadcastUsersLoading}
                                >
                                    <RefreshCw size={14} className={broadcastUsersLoading ? 'animate-spin' : ''} />
                                    Refresh Users ({broadcastUsers.length})
                                </button>
                            </div>
                        </div>

                        {/* Stats Row */}
                        <div className="admin-stats">
                            <div className="admin-stat-card">
                                <div className="admin-stat-label">Registered With Email</div>
                                <div className="admin-stat-value">{broadcastUsers.length}</div>
                            </div>
                            <div className="admin-stat-card">
                                <div className="admin-stat-label">Selected Recipients</div>
                                <div className="admin-stat-value text-primary">
                                    {broadcastTarget === 'test' ? '1 (Test)' : broadcastTarget === 'selected' ? selectedUserIds.length : broadcastUsers.length}
                                </div>
                            </div>
                            <div className="admin-stat-card">
                                <div className="admin-stat-label">Dispatch Mode</div>
                                <div className="admin-stat-value text-sm font-semibold uppercase tracking-wider text-muted-foreground mt-1">
                                    {broadcastTarget === 'all' ? 'All Users' : broadcastTarget === 'selected' ? 'Selected Users' : 'Test Send'}
                                </div>
                            </div>
                        </div>

                        {broadcastResult && (
                            <div className="p-4 rounded-xl border border-primary/30 bg-primary/10 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                        <Check size={16} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-white">Latest Dispatch Status</p>
                                        <p className="text-xs text-muted-foreground">{broadcastResult.message}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setBroadcastResult(null)}
                                    className="text-xs text-muted-foreground hover:text-white"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        )}

                        {/* Main Grid: Composer on Left, Live Preview on Right */}
                        <div className="broadcast-grid">
                            {/* Left: Email Composer */}
                            <div className="broadcast-card space-y-6">
                                {/* Target Audience Selector */}
                                <div>
                                    <label className="admin-label mb-2 block font-semibold text-white text-xs uppercase tracking-wider">
                                        Target Audience
                                    </label>
                                    <div className="broadcast-target-group">
                                        <button
                                            type="button"
                                            className={`broadcast-target-btn ${broadcastTarget === 'all' ? 'active' : ''}`}
                                            onClick={() => setBroadcastTarget('all')}
                                        >
                                            <Users size={16} />
                                            All Users ({broadcastUsers.length})
                                        </button>
                                        <button
                                            type="button"
                                            className={`broadcast-target-btn ${broadcastTarget === 'selected' ? 'active' : ''}`}
                                            onClick={() => setBroadcastTarget('selected')}
                                        >
                                            <CheckSquare size={16} />
                                            Selected Users ({selectedUserIds.length})
                                        </button>
                                        <button
                                            type="button"
                                            className={`broadcast-target-btn ${broadcastTarget === 'test' ? 'active' : ''}`}
                                            onClick={() => setBroadcastTarget('test')}
                                        >
                                            <Send size={16} />
                                            Test Send Only
                                        </button>
                                    </div>
                                </div>

                                {/* Test Email Input */}
                                {broadcastTarget === 'test' && (
                                    <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-semibold text-primary uppercase tracking-wider">
                                                Test Email Recipient
                                            </label>
                                            <span className="text-[11px] text-muted-foreground">Safe test inbox</span>
                                        </div>
                                        <input
                                            type="email"
                                            className="admin-input"
                                            placeholder="you@email.com"
                                            value={testEmail}
                                            onChange={(e) => setTestEmail(e.target.value)}
                                        />
                                    </div>
                                )}

                                {/* Selected Users Roster & Filter */}
                                {broadcastTarget === 'selected' && (
                                    <div className="space-y-3 p-4 rounded-xl border border-white/10 bg-black/40">
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                                            <div className="relative w-full sm:w-64">
                                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                                <input
                                                    type="text"
                                                    className="admin-input !pl-9 !py-1.5 !text-xs"
                                                    placeholder="Filter users by name or email..."
                                                    value={userSearchQuery}
                                                    onChange={(e) => setUserSearchQuery(e.target.value)}
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    className="text-xs text-primary hover:underline font-medium"
                                                    onClick={() => {
                                                        const matchingIds = broadcastUsers
                                                            .filter(u => {
                                                                if (!userSearchQuery.trim()) return true;
                                                                const q = userSearchQuery.toLowerCase();
                                                                return (
                                                                    (u.name && u.name.toLowerCase().includes(q)) ||
                                                                    (u.username && u.username.toLowerCase().includes(q)) ||
                                                                    (u.email && u.email.toLowerCase().includes(q))
                                                                );
                                                            })
                                                            .map(u => u.id);
                                                        
                                                        const allSelected = matchingIds.every(id => selectedUserIds.includes(id));
                                                        if (allSelected) {
                                                            setSelectedUserIds(prev => prev.filter(id => !matchingIds.includes(id)));
                                                        } else {
                                                            setSelectedUserIds(prev => Array.from(new Set([...prev, ...matchingIds])));
                                                        }
                                                    }}
                                                >
                                                    Toggle All Filtered
                                                </button>
                                                <span className="text-xs text-muted-foreground">
                                                    ({selectedUserIds.length} chosen)
                                                </span>
                                            </div>
                                        </div>

                                        <div className="broadcast-user-table-scroll">
                                            <table className="admin-table !text-xs">
                                                <thead>
                                                    <tr>
                                                        <th className="w-8"></th>
                                                        <th>User</th>
                                                        <th>Email</th>
                                                        <th>Streak</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {broadcastUsers
                                                        .filter(u => {
                                                            if (!userSearchQuery.trim()) return true;
                                                            const q = userSearchQuery.toLowerCase();
                                                            return (
                                                                (u.name && u.name.toLowerCase().includes(q)) ||
                                                                (u.username && u.username.toLowerCase().includes(q)) ||
                                                                (u.email && u.email.toLowerCase().includes(q))
                                                            );
                                                        })
                                                        .map(u => {
                                                            const isChecked = selectedUserIds.includes(u.id);
                                                            return (
                                                                <tr
                                                                    key={u.id}
                                                                    className={`cursor-pointer transition-colors ${isChecked ? 'bg-primary/5' : 'hover:bg-white/[0.02]'}`}
                                                                    onClick={() => {
                                                                        setSelectedUserIds(prev =>
                                                                            isChecked ? prev.filter(id => id !== u.id) : [...prev, u.id]
                                                                        );
                                                                    }}
                                                                >
                                                                    <td>
                                                                        {isChecked ? (
                                                                            <CheckSquare size={16} className="text-primary" />
                                                                        ) : (
                                                                            <Square size={16} className="text-muted-foreground" />
                                                                        )}
                                                                    </td>
                                                                    <td>
                                                                        <div className="font-semibold text-foreground">
                                                                            {u.name || u.username || 'Anonymous'}
                                                                        </div>
                                                                        {u.username && (
                                                                            <div className="text-[10px] text-muted-foreground">@{u.username}</div>
                                                                        )}
                                                                    </td>
                                                                    <td className="text-muted-foreground">{u.email}</td>
                                                                    <td>
                                                                        <span className="text-primary font-mono">{u.streak || 0}d</span>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* AI Broadcast Copilot Console */}
                                <div className="admin-ai-copilot">
                                    <div className="admin-ai-copilot-header">
                                        <div className="flex items-center gap-2.5">
                                            <div className="admin-ai-icon-chip">
                                                <Sparkles size={16} className="text-emerald-400" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="admin-ai-title">AI Broadcast Copilot</span>
                                                    <span className="admin-ai-model-pill">Gemini 2.5 Flash</span>
                                                </div>
                                                <p className="admin-ai-subtitle">
                                                    Draft announcements from instructions or elevate your draft into commanding developer prose.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Tone Selector */}
                                        <div className="admin-ai-tone-group">
                                            <button
                                                type="button"
                                                className={`admin-ai-tone-btn ${aiTone === 'badass' ? 'active' : ''}`}
                                                onClick={() => setAiTone('badass')}
                                            >
                                                Badass &amp; Elite
                                            </button>
                                            <button
                                                type="button"
                                                className={`admin-ai-tone-btn ${aiTone === 'direct' ? 'active' : ''}`}
                                                onClick={() => setAiTone('direct')}
                                            >
                                                Direct &amp; Concise
                                            </button>
                                            <button
                                                type="button"
                                                className={`admin-ai-tone-btn ${aiTone === 'celebratory' ? 'active' : ''}`}
                                                onClick={() => setAiTone('celebratory')}
                                            >
                                                Celebratory
                                            </button>
                                        </div>
                                    </div>

                                    <div className="admin-ai-prompt-row">
                                        <div className="relative flex-1">
                                            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                                            <input
                                                type="text"
                                                className="admin-ai-input"
                                                placeholder="Instruct AI (e.g. 'Announce streak shields and motivate engineers to ship today')..."
                                                value={aiPrompt}
                                                onChange={(e) => setAiPrompt(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleAiAssist('generate');
                                                    }
                                                }}
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                className="admin-btn admin-btn--ai-primary"
                                                onClick={() => handleAiAssist('generate')}
                                                disabled={aiLoading}
                                            >
                                                {aiLoading && aiActionType === 'generate' ? (
                                                    <>
                                                        <Loader2 size={13} className="animate-spin" />
                                                        Generating...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Sparkles size={13} />
                                                        Draft with AI
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                type="button"
                                                className="admin-btn admin-btn--ai-secondary"
                                                onClick={() => handleAiAssist('enhance')}
                                                disabled={aiLoading || (!broadcastMessage.trim() && !broadcastSubject.trim())}
                                                title={!broadcastMessage.trim() && !broadcastSubject.trim() ? "Type a subject or message below first to enhance" : "Advance grammar and vocabulary with Gemini"}
                                            >
                                                {aiLoading && aiActionType === 'enhance' ? (
                                                    <>
                                                        <Loader2 size={13} className="animate-spin" />
                                                        Elevating...
                                                    </>
                                                ) : (
                                                    <>
                                                        <RefreshCw size={13} />
                                                        Advance Writing
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Templates */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="admin-label block font-semibold text-white text-xs uppercase tracking-wider">
                                            Quick Templates
                                        </label>
                                        <span className="text-[11px] text-muted-foreground">Click to populate</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            className="broadcast-template-pill"
                                            onClick={() => {
                                                setBroadcastSubject('Important Community Update');
                                                setBroadcastHeadline('A Special Update From Evergreeners');
                                                setBroadcastPreviewText('Exciting improvements have arrived at your garden');
                                                setBroadcastMessage('Hey {name},\n\nWe wanted to share an exciting milestone with everyone building with Evergreeners.\n\nOver recent weeks, consistency across our developer community has reached record highs. Every line of code, every committed feature, and every preserved streak is proof of compounding momentum.\n\nKeep showing up every day. Your consistency is building an enduring legacy.');
                                                setBroadcastButtonText('Visit Your Garden');
                                                setBroadcastButtonUrl('https://evergreeners.dev/dashboard');
                                            }}
                                        >
                                            Feature Update
                                        </button>
                                        <button
                                            type="button"
                                            className="broadcast-template-pill"
                                            onClick={() => {
                                                setBroadcastSubject("Happy Programmer's Day: Day 256 of 365");
                                                setBroadcastHeadline('Honoring the Craft on Day 256');
                                                setBroadcastPreviewText('Celebrating the builders writing the future');
                                                setBroadcastMessage('Hey {name},\n\nToday is Programmer\'s Day: the 256th day of the year.\n\nTo every developer debugging through the night, writing clean code, and showing up with relentless discipline: today belongs to you.\n\nKeep committing. Keep growing your legacy.');
                                                setBroadcastButtonText('View Your Heatmap');
                                                setBroadcastButtonUrl('https://evergreeners.dev/dashboard');
                                            }}
                                        >
                                            Programmer's Day
                                        </button>
                                        <button
                                            type="button"
                                            className="broadcast-template-pill"
                                            onClick={() => {
                                                setBroadcastSubject('Protect your streak today');
                                                setBroadcastHeadline('Momentum is your greatest asset');
                                                setBroadcastPreviewText("Don't let your green square slip away");
                                                setBroadcastMessage('Hey {name},\n\nA quick check-in: every commit builds compounding evidence of your discipline. Do not let today\'s streak reset.\n\nShip a commit, push your work, and protect your digital reputation.');
                                                setBroadcastButtonText('Check Today\'s Status');
                                                setBroadcastButtonUrl('https://evergreeners.dev/dashboard');
                                            }}
                                        >
                                            Streak Motivation
                                        </button>
                                    </div>
                                </div>

                                {/* Subject Line */}
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="admin-label font-semibold text-white text-xs uppercase tracking-wider">
                                            Email Subject Line *
                                        </label>
                                        <span className="text-[11px] text-muted-foreground">{broadcastSubject.length}/80</span>
                                    </div>
                                    <input
                                        type="text"
                                        className="admin-input"
                                        placeholder="e.g. A Special Announcement for Evergreeners"
                                        value={broadcastSubject}
                                        onChange={(e) => setBroadcastSubject(e.target.value)}
                                        required
                                    />
                                </div>

                                {/* Card Headline & Preheader */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="admin-label mb-1 block font-semibold text-white text-xs uppercase tracking-wider">
                                            Card Headline
                                        </label>
                                        <input
                                            type="text"
                                            className="admin-input"
                                            placeholder="Defaults to subject line"
                                            value={broadcastHeadline}
                                            onChange={(e) => setBroadcastHeadline(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="admin-label mb-1 block font-semibold text-white text-xs uppercase tracking-wider">
                                            Inbox Preview Text
                                        </label>
                                        <input
                                            type="text"
                                            className="admin-input"
                                            placeholder="Snippet displayed in inbox preview"
                                            value={broadcastPreviewText}
                                            onChange={(e) => setBroadcastPreviewText(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Message Body */}
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="admin-label font-semibold text-white text-xs uppercase tracking-wider">
                                            Email Message Body *
                                        </label>
                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium disabled:opacity-40"
                                                disabled={aiLoading || (!broadcastMessage.trim() && !broadcastSubject.trim())}
                                                onClick={() => handleAiAssist('enhance')}
                                                title="Advance grammar, vocabulary, and phrasing with Gemini"
                                            >
                                                <Sparkles size={12} />
                                                Advance Writing
                                            </button>
                                            <button
                                                type="button"
                                                className="text-xs text-primary hover:underline font-medium"
                                                onClick={() => {
                                                    setBroadcastMessage(prev => prev + ' {name}');
                                                }}
                                            >
                                                + Insert {'{name}'}
                                            </button>
                                        </div>
                                    </div>
                                    <textarea
                                        className="admin-input admin-textarea !min-h-[160px]"
                                        placeholder="Write your email content here. Separate paragraphs with a blank line..."
                                        value={broadcastMessage}
                                        onChange={(e) => setBroadcastMessage(e.target.value)}
                                        rows={6}
                                        required
                                    />
                                    <p className="text-[11px] text-muted-foreground mt-1">
                                        Blank lines create separate paragraphs. {'{name}'} will be replaced with each user's first name.
                                    </p>
                                </div>

                                {/* Pixelated Commit Grid Graphic Section */}
                                <div className="p-4 rounded-xl border border-white/10 bg-[#0c0c0f] space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-7 h-7 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                                                <Grid size={15} />
                                            </div>
                                            <div>
                                                <label className="admin-label block font-semibold text-white text-xs uppercase tracking-wider">
                                                    Pixel Commit Heatmap Graphic
                                                </label>
                                                <p className="text-[11px] text-muted-foreground">
                                                    Embed an authentic 7-row developer commit grid graphic inside the email.
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            className={`admin-btn !text-xs !py-1 !px-3 ${commitGridEnabled ? 'bg-emerald-500 hover:bg-emerald-600 text-black font-bold' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'}`}
                                            onClick={() => setCommitGridEnabled(!commitGridEnabled)}
                                        >
                                            {commitGridEnabled ? 'Enabled' : 'Disabled'}
                                        </button>
                                    </div>

                                    {commitGridEnabled && (
                                        <div className="space-y-3 pt-2 border-t border-white/5">
                                            {/* Quick Presets */}
                                            <div>
                                                <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-1.5">
                                                    Heatmap Presets
                                                </label>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {COMMIT_GRID_PRESETS.map((preset) => (
                                                        <button
                                                            key={preset.id}
                                                            type="button"
                                                            className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                                                                commitGridText === preset.text
                                                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold'
                                                                    : 'bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/60'
                                                            }`}
                                                            onClick={() => applyCommitGridPreset(preset.id)}
                                                        >
                                                            {preset.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Custom Grid Controls */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                                                        Pixel Art Text (1 to 4 chars)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        maxLength={5}
                                                        className="admin-input !font-mono uppercase !text-sm"
                                                        placeholder="256"
                                                        value={commitGridText}
                                                        onChange={(e) => {
                                                            const val = e.target.value.toUpperCase();
                                                            setCommitGridText(val);
                                                            if (val && !commitGridRepoTag.includes(val.toLowerCase())) {
                                                                setCommitGridRepoTag(`● git://evergreeners/${val.toLowerCase()}`);
                                                            }
                                                        }}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                                                        Repository Tag / Header
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="admin-input !font-mono !text-sm"
                                                        placeholder="● git://evergreeners/day-256"
                                                        value={commitGridRepoTag}
                                                        onChange={(e) => setCommitGridRepoTag(e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                                                        Sub Badge (Top Right)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="admin-input !text-xs"
                                                        placeholder="2⁸ = 256 bytes · 0x100"
                                                        value={commitGridSubBadge}
                                                        onChange={(e) => setCommitGridSubBadge(e.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                                                        Footer Legend Note
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="admin-input !text-xs"
                                                        placeholder="256 commits to the craft"
                                                        value={commitGridFooterNote}
                                                        onChange={(e) => setCommitGridFooterNote(e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            {/* In-Composer Compact Graphic Preview */}
                                            <div className="pt-2">
                                                <CommitGridPreview
                                                    text={commitGridText}
                                                    repoTag={commitGridRepoTag}
                                                    subBadge={commitGridSubBadge}
                                                    footerNote={commitGridFooterNote}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Call to Action Button */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl border border-white/5 bg-black/30">
                                    <div>
                                        <label className="admin-label mb-1 block font-semibold text-white text-xs uppercase tracking-wider">
                                            Button Label (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            className="admin-input"
                                            placeholder="e.g. Open Dashboard"
                                            value={broadcastButtonText}
                                            onChange={(e) => setBroadcastButtonText(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="admin-label mb-1 block font-semibold text-white text-xs uppercase tracking-wider">
                                            Button URL
                                        </label>
                                        <input
                                            type="text"
                                            className="admin-input"
                                            placeholder="https://evergreeners.dev/..."
                                            value={broadcastButtonUrl}
                                            onChange={(e) => setBroadcastButtonUrl(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-white/10">
                                    <button
                                        type="button"
                                        className="admin-btn admin-btn--secondary flex items-center gap-2"
                                        disabled={broadcastSending}
                                        onClick={() => executeSendBroadcast('test')}
                                    >
                                        <Send size={15} />
                                        Send Test Email To Me
                                    </button>

                                    <button
                                        type="button"
                                        className="admin-btn admin-btn--approve flex items-center gap-2 !px-6 !py-2.5 font-bold"
                                        disabled={broadcastSending}
                                        onClick={() => {
                                            if (!broadcastSubject.trim()) {
                                                toast.error('Subject line is required');
                                                return;
                                            }
                                            if (!broadcastMessage.trim()) {
                                                toast.error('Email message body is required');
                                                return;
                                            }
                                            if (broadcastTarget === 'selected' && selectedUserIds.length === 0) {
                                                toast.error('Please select at least one recipient');
                                                return;
                                            }
                                            if (broadcastTarget === 'test') {
                                                executeSendBroadcast('test');
                                            } else {
                                                setBroadcastConfirmOpen(true);
                                            }
                                        }}
                                    >
                                        {broadcastSending ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" />
                                                Sending Broadcast...
                                            </>
                                        ) : (
                                            <>
                                                <Mail size={16} />
                                                Send Broadcast (
                                                {broadcastTarget === 'all'
                                                    ? `${broadcastUsers.length} Users`
                                                    : broadcastTarget === 'selected'
                                                    ? `${selectedUserIds.length} Users`
                                                    : '1 Test'}
                                                )
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Right: Live Preview */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-white text-sm uppercase tracking-wider flex items-center gap-2">
                                        <Sparkles size={16} className="text-primary" />
                                        Live Inbox Preview
                                    </h3>
                                    <span className="text-xs text-muted-foreground font-mono">
                                        560px Desktop Container
                                    </span>
                                </div>

                                <div className="broadcast-preview-container">
                                    {/* Simulated Email Client Envelope */}
                                    <div className="pb-4 mb-4 border-b border-white/10 text-xs text-muted-foreground space-y-1 font-mono">
                                        <div><span className="text-white">From:</span> Evergreeners &lt;noreply@evergreeners.dev&gt;</div>
                                        <div><span className="text-white">To:</span> {broadcastTarget === 'test' ? testEmail : 'user@example.com'}</div>
                                        <div><span className="text-white">Subject:</span> {broadcastSubject || '(No subject provided)'}</div>
                                        {broadcastPreviewText && (
                                            <div className="text-[11px] text-gray-500 truncate">
                                                <span className="text-gray-400">Preheader:</span> {broadcastPreviewText}
                                            </div>
                                        )}
                                    </div>

                                    {/* Email Card Shell */}
                                    <div className="broadcast-preview-card">
                                        {/* Branded Logo Header */}
                                        <div className="flex items-center gap-2.5 pb-5 mb-5 border-b border-white/10">
                                            <span className="font-handwritten text-2xl text-primary">
                                                Evergreeners
                                            </span>
                                        </div>

                                        {/* Headline */}
                                        <h3 className="text-xl font-bold text-white mb-4 tracking-tight">
                                            {(broadcastHeadline || broadcastSubject || 'Your Headline Here').replace(/\{name\}/gi, 'Alex')}
                                        </h3>

                                        {/* Body */}
                                        <div className="text-sm text-gray-300 leading-relaxed space-y-3">
                                            {broadcastMessage ? (
                                                broadcastMessage
                                                    .replace(/\{name\}/gi, 'Alex')
                                                    .split(/\n\s*\n/)
                                                    .map((paragraph, idx) => (
                                                        <p key={idx}>{paragraph}</p>
                                                    ))
                                            ) : (
                                                <p className="text-muted-foreground italic">
                                                    Start typing your email message on the left to see the live rendered preview here...
                                                </p>
                                            )}
                                        </div>

                                        {/* Pixel Commit Grid Graphic Preview */}
                                        {commitGridEnabled && (
                                            <div className="pt-2">
                                                <CommitGridPreview
                                                    text={commitGridText}
                                                    repoTag={commitGridRepoTag}
                                                    subBadge={commitGridSubBadge}
                                                    footerNote={commitGridFooterNote}
                                                />
                                            </div>
                                        )}

                                        {/* Optional Action Button */}
                                        {broadcastButtonText && (
                                            <div className="pt-6">
                                                <div className="inline-block px-6 py-2.5 bg-primary text-black font-semibold text-sm rounded-lg shadow-md">
                                                    {broadcastButtonText}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Footer */}
                                    <div className="pt-5 text-[11px] text-muted-foreground leading-relaxed">
                                        You are receiving this because you have an account on evergreeners.dev.
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Confirmation AlertDialog */}
                        <AlertDialog open={broadcastConfirmOpen} onOpenChange={setBroadcastConfirmOpen}>
                            <AlertDialogContent className="bg-black/95 border border-primary/20 text-white">
                                <AlertDialogHeader>
                                    <div className="flex items-center gap-2 text-yellow-400 mb-1">
                                        <AlertTriangle size={20} />
                                        <AlertDialogTitle className="text-white">
                                            Confirm Broadcast Email
                                        </AlertDialogTitle>
                                    </div>
                                    <AlertDialogDescription className="text-gray-300 space-y-3">
                                        <p>
                                            You are about to dispatch a live email broadcast to{' '}
                                            <strong className="text-primary font-bold">
                                                {broadcastTarget === 'all'
                                                    ? `${broadcastUsers.length} users`
                                                    : `${selectedUserIds.length} selected users`}
                                            </strong>.
                                        </p>
                                        <div className="p-3 bg-white/5 rounded-lg text-xs space-y-1 font-mono text-gray-200">
                                            <div><strong>Subject:</strong> {broadcastSubject}</div>
                                            <div><strong>Audience:</strong> {broadcastTarget === 'all' ? 'All Registered Users' : `${selectedUserIds.length} Selected Users`}</div>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Emails will be queued and sent via Resend. Make sure all wording and links are accurate before confirming.
                                        </p>
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel className="bg-white/10 text-white hover:bg-white/20 border-white/10">
                                        Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                        className="bg-primary text-black hover:bg-primary/90 font-bold"
                                        onClick={() => executeSendBroadcast()}
                                    >
                                        Confirm and Send Now
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                        {/* AI Staged Copy Review Dialog */}
                        <Dialog open={aiReviewOpen} onOpenChange={setAiReviewOpen}>
                            <DialogContent className="max-w-3xl bg-[#09090b] border border-zinc-800 text-white p-0 overflow-hidden shadow-2xl">
                                <DialogHeader className="p-5 border-b border-zinc-800/80 bg-[#0c0c0f]">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                                                <Sparkles size={18} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <DialogTitle className="text-base font-semibold text-white tracking-tight">
                                                        AI Copy Review &amp; Staging
                                                    </DialogTitle>
                                                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                                                        {aiReviewMode === 'enhance' ? 'Advanced &amp; Polished' : 'AI Generated'}
                                                    </span>
                                                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
                                                        {aiTone}
                                                    </span>
                                                </div>
                                                <DialogDescription className="text-xs text-zinc-400 mt-0.5">
                                                    Review and edit staged copy synthesized by Gemini 2.5 Flash before applying to the active composer.
                                                </DialogDescription>
                                            </div>
                                        </div>
                                    </div>
                                </DialogHeader>

                                <div className="p-6 max-h-[66vh] overflow-y-auto space-y-5">
                                    {aiReviewMode === 'enhance' && (
                                        <div className="p-3.5 rounded-lg border border-zinc-800 bg-[#0c0c0f] text-xs text-zinc-400">
                                            <span className="text-emerald-400 font-semibold">Prose Upgrade Applied:</span> Your draft has been elevated with enriched vocabulary, high-end phrasing, and proper cadence while preserving your core message.
                                        </div>
                                    )}

                                    {/* Subject and Headline */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-1.5">
                                                Proposed Subject Line
                                            </label>
                                            <input
                                                type="text"
                                                className="admin-input !bg-[#121215] !border-zinc-800 !text-white text-sm"
                                                value={aiStagedDraft.subject}
                                                onChange={(e) => setAiStagedDraft({ ...aiStagedDraft, subject: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-1.5">
                                                Proposed Headline
                                            </label>
                                            <input
                                                type="text"
                                                className="admin-input !bg-[#121215] !border-zinc-800 !text-white text-sm"
                                                value={aiStagedDraft.headline}
                                                onChange={(e) => setAiStagedDraft({ ...aiStagedDraft, headline: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* Preheader */}
                                    <div>
                                        <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-1.5">
                                            Inbox Preview Preheader
                                        </label>
                                        <input
                                            type="text"
                                            className="admin-input !bg-[#121215] !border-zinc-800 !text-white text-sm"
                                            value={aiStagedDraft.previewText}
                                            onChange={(e) => setAiStagedDraft({ ...aiStagedDraft, previewText: e.target.value })}
                                        />
                                    </div>

                                    {/* Message Body */}
                                    <div>
                                        <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-1.5">
                                            Proposed Message Body (Editable)
                                        </label>
                                        <textarea
                                            rows={7}
                                            className="admin-input admin-textarea !bg-[#121215] !border-zinc-800 !text-white text-sm leading-relaxed"
                                            value={aiStagedDraft.message}
                                            onChange={(e) => setAiStagedDraft({ ...aiStagedDraft, message: e.target.value })}
                                        />
                                    </div>

                                    {/* Button Settings */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-1.5">
                                                Call to Action Button Text
                                            </label>
                                            <input
                                                type="text"
                                                className="admin-input !bg-[#121215] !border-zinc-800 !text-white text-sm"
                                                value={aiStagedDraft.buttonText}
                                                onChange={(e) => setAiStagedDraft({ ...aiStagedDraft, buttonText: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-1.5">
                                                Destination URL
                                            </label>
                                            <input
                                                type="text"
                                                className="admin-input !bg-[#121215] !border-zinc-800 !text-white text-sm font-mono"
                                                value={aiStagedDraft.buttonUrl}
                                                onChange={(e) => setAiStagedDraft({ ...aiStagedDraft, buttonUrl: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* AI Staged Commit Grid Graphic */}
                                    {aiStagedDraft.commitGrid?.enabled && (
                                        <div className="p-4 rounded-xl border border-zinc-800 bg-[#0c0c0f] space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Grid size={15} className="text-emerald-400" />
                                                    <span className="text-xs font-mono uppercase text-zinc-300 font-semibold">
                                                        Synthesized Commit Grid Matrix
                                                    </span>
                                                </div>
                                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 font-bold">
                                                    {aiStagedDraft.commitGrid.text || '256'}
                                                </span>
                                            </div>

                                            <CommitGridPreview
                                                text={aiStagedDraft.commitGrid.text}
                                                repoTag={aiStagedDraft.commitGrid.repoTag}
                                                subBadge={aiStagedDraft.commitGrid.subBadge}
                                                footerNote={aiStagedDraft.commitGrid.footerNote}
                                            />
                                        </div>
                                    )}

                                    {/* Revision Row */}
                                    <div className="pt-3 border-t border-zinc-800/80">
                                        <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-1.5">
                                            Quick Revision Request
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                className="admin-input !bg-[#121215] !border-zinc-800 !text-xs"
                                                placeholder="Ask Gemini to adjust (e.g. 'Make paragraph 2 shorter', 'Focus on daily commit habits')..."
                                                value={aiRevisionPrompt}
                                                onChange={(e) => setAiRevisionPrompt(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleAiRefine();
                                                    }
                                                }}
                                            />
                                            <button
                                                type="button"
                                                className="admin-btn admin-btn--secondary !text-xs whitespace-nowrap flex items-center gap-1.5"
                                                onClick={handleAiRefine}
                                                disabled={aiLoading || !aiRevisionPrompt.trim()}
                                            >
                                                {aiLoading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                                                Adjust Copy
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 border-t border-zinc-800 bg-[#0c0c0f] flex items-center justify-between">
                                    <button
                                        type="button"
                                        className="admin-btn admin-btn--ghost text-xs text-zinc-400 hover:text-white"
                                        onClick={() => setAiReviewOpen(false)}
                                    >
                                        Discard
                                    </button>
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            className="admin-btn admin-btn--approve flex items-center gap-2 !px-5 !py-2 font-bold text-xs"
                                            onClick={handleAiApply}
                                        >
                                            <Check size={15} />
                                            Apply to Composer
                                        </button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                )}
            </div>
        </div>
    );
}