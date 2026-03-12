
import { useState } from 'react';
import { PublicHeader } from '@/components/PublicHeader';
import { CosmicButton } from '@/components/ui/cosmic-button';
import { Link } from 'react-router-dom';
import {
    Github, Twitter, X, Send, ArrowRight, Star, Users,
    Flame, Calendar, MessageSquare, GitPullRequest, Trophy,
    BookOpen, ExternalLink, Clock, Zap
} from 'lucide-react';
import './Community.css';

/* ─────────────── DATA ─────────────── */

const floatingAvatars = [
    { src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200", style: { top: '18%', left: '8%' }, size: 'lg', delay: '0s' },
    { src: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200", style: { top: '10%', left: '22%' }, size: 'md', delay: '0.5s' },
    { src: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=200", style: { top: '55%', left: '5%' }, size: 'sm', delay: '1s' },
    { src: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=200", style: { top: '75%', left: '18%' }, size: 'md', delay: '1.5s' },
    { src: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200", style: { top: '12%', right: '20%' }, size: 'lg', delay: '0.3s' },
    { src: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200", style: { top: '8%', right: '7%' }, size: 'md', delay: '0.8s' },
    { src: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=200", style: { top: '55%', right: '8%' }, size: 'sm', delay: '1.2s' },
    { src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200", style: { top: '72%', right: '20%' }, size: 'md', delay: '0.6s' },
];

const stories = [
    { id: 1, name: "Muhammad Adamu Aliyu", handle: "muhammad_adamu", platform: 'twitter' as const, role: "Founder", featured: true, quote: "The GitHub sync is magic. Seeing that green graph fill up is the best dopamine hit. It's transformed how I think about consistency.", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200" },
    { id: 2, name: "Sarah Chen", handle: "schen_dev", platform: 'twitter' as const, role: "Software Engineer", quote: "It's like an RPG for my career. The Quest system finally made documentation fun for our entire team.", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200" },
    { id: 3, name: "Nasir Ibrahim Imam", handle: "nasir_imam", platform: 'github' as const, role: "Software Developer", featured: true, quote: "I used to code in bursts and burn out. Now I've coded for 100 days straight. Evergreeners made consistency my default.", image: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=200" },
    { id: 4, name: "Abdulmumini Muhammad Bello", handle: "abdul_mumi", platform: 'github' as const, role: "Founder", quote: "Leaderboards made it a game for our whole team. Productivity is up 70% since we started tracking.", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200" },
    { id: 5, name: "Elena Rodriguez", handle: "elena_codes", platform: 'twitter' as const, role: "Full-stack Engineer", featured: true, quote: "The DX is incredibly smooth. Within a week I saw the benefits — cleaner commits, longer focused sessions, less burnout.", image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200" },
    { id: 6, name: "Marcus Thorne", handle: "mthorne_eng", platform: 'github' as const, role: "Backend Engineer", quote: "Three months in and the insights are incredibly deep. It helped me identify exactly where my bottlenecks were hiding.", image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200" },
    { id: 7, name: "James Wilson", handle: "jwil_dev", platform: 'github' as const, role: "DevOps Engineer", featured: true, quote: "My team follows my public profile now — it became our unofficial daily accountability board. Game changer.", image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=200" },
    { id: 8, name: "Aisha Yusuf", handle: "aisha_codes", platform: 'twitter' as const, role: "Frontend Developer", quote: "Finally a tool that understands the developer workflow. No more manual tracking. It just lives where I work.", image: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=200" },
];

const events = [
    { id: 1, title: "Monthly Streak Showcase", date: "Mar 28, 2026", time: "7:00 PM WAT", type: "Live Session", desc: "Top streakers share their daily routines and tips for maintaining consistency over months.", attendees: 142, icon: <Flame size={20} className="text-orange-400" /> },
    { id: 2, title: "Open Source Sprint Weekend", date: "Apr 5-6, 2026", time: "All Day", type: "Hackathon", desc: "48-hour collaborative sprint where community members contribute to the Evergreeners open source repos.", attendees: 89, icon: <GitPullRequest size={20} className="text-purple-400" /> },
    { id: 3, title: "Ask Me Anything — Core Team", date: "Apr 12, 2026", time: "5:00 PM WAT", type: "AMA", desc: "Live Q&A with the Evergreeners core team. Ask about the roadmap, features, and what's coming next.", attendees: 231, icon: <MessageSquare size={20} className="text-blue-400" /> },
    { id: 4, title: "100-Day Streak Club Meetup", date: "Apr 19, 2026", time: "6:00 PM WAT", type: "Community", desc: "Exclusive gathering for developers who've maintained a 100+ day streak. Share your story and get your badge.", attendees: 67, icon: <Trophy size={20} className="text-yellow-400" /> },
    { id: 5, title: "Dev Tools Deep Dive", date: "May 3, 2026", time: "4:00 PM WAT", type: "Workshop", desc: "A workshop on integrating Evergreeners with your existing workflow — GitHub Actions, WakaTime, custom scripts.", attendees: 115, icon: <Zap size={20} className="text-green-400" /> },
    { id: 6, title: "Community Roadmap Vote", date: "May 10, 2026", time: "Async", type: "Community", desc: "Vote on the features you want to see next. Your voice directly shapes the Evergreeners roadmap.", attendees: 408, icon: <Star size={20} className="text-green-400" /> },
];

const members = [
    { rank: 1, name: "Abdulmumini Bello", handle: "abdul_mumi", streak: 312, role: "Founder", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200", badge: "🏆" },
    { rank: 2, name: "Nasir Ibrahim Imam", handle: "nasir_imam", streak: 289, role: "Software Developer", image: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=200", badge: "🥈" },
    { rank: 3, name: "Marcus Thorne", handle: "mthorne_eng", streak: 241, role: "Backend Engineer", image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200", badge: "🥉" },
    { rank: 4, name: "James Wilson", handle: "jwil_dev", streak: 198, role: "DevOps Engineer", image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=200", badge: null },
    { rank: 5, name: "Elena Rodriguez", handle: "elena_codes", streak: 175, role: "Full-stack Engineer", image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200", badge: null },
    { rank: 6, name: "Sarah Chen", handle: "schen_dev", streak: 154, role: "Software Engineer", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200", badge: null },
];

const openSourceItems = [
    { title: "Evergreeners Core", desc: "The main app — React + TypeScript. Great first issues available for UI improvements and new features.", stars: 847, issues: 23, lang: "TypeScript", color: "#3178c6", link: "https://github.com/evergreeners/core" },
    { title: "Evergreeners API", desc: "The backend service — Node.js + Express. Looking for contributors on the GitHub sync and analytics engine.", stars: 412, issues: 11, lang: "JavaScript", color: "#f7df1e", link: "https://github.com/evergreeners/api" },
    { title: "Streak CLI", desc: "A terminal-first companion for Evergreeners. Log streaks, view stats, and push updates from your terminal.", stars: 234, issues: 8, lang: "Rust", color: "#ce422b", link: "https://github.com/evergreeners/cli" },
    { title: "Docs & Wiki", desc: "Help us document Evergreeners better. Great for non-code contributions — writing, diagrams, examples.", stars: 89, issues: 34, lang: "MDX", color: "#4ade80", link: "https://github.com/evergreeners/docs" },
];

const stats = [
    { icon: <Users size={18} />, value: "10,000+", label: "Developers" },
    { icon: <Flame size={18} />, value: "2.4M+", label: "Streak Days" },
    { icon: <Star size={18} />, value: "98%", label: "Satisfaction" },
    { icon: <GitPullRequest size={18} />, value: "340+", label: "Contributions" },
];

/* ─────────────── COMPONENTS ─────────────── */

function StoryCard({ story }: { story: typeof stories[0] }) {
    return (
        <div className={`comm-card ${story.featured ? 'comm-card--featured' : ''}`}>
            {story.featured && <div className="comm-card-featured-badge">⭐ Featured</div>}
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
        </div>
    );
}

function EventCard({ event }: { event: typeof events[0] }) {
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

function MemberRow({ member }: { member: typeof members[0] }) {
    return (
        <div className="comm-member-row">
            <span className={`comm-member-rank ${member.rank <= 3 ? 'top3' : ''}`}>
                {member.badge ?? `#${member.rank}`}
            </span>
            <img src={member.image} alt={member.name} className="comm-member-avatar" loading="lazy" />
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

function OpenSourceCard({ item }: { item: typeof openSourceItems[0] }) {
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
    platform: 'github' | 'twitter'; story: string;
}

function SubmitModal({ onClose }: { onClose: () => void }) {
    const [form, setForm] = useState<SubmitFormData>({ name: '', handle: '', role: '', platform: 'github', story: '' });
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); setSubmitted(true); };

    return (
        <div className="comm-modal-overlay" onClick={onClose}>
            <div className="comm-modal" onClick={e => e.stopPropagation()}>
                <button className="comm-modal-close" onClick={onClose}><X size={18} /></button>
                {submitted ? (
                    <div className="comm-modal-success">
                        <div className="comm-modal-success-icon">🎉</div>
                        <h3>Story submitted!</h3>
                        <p>Thanks for sharing. We'll review your story and feature it on the community wall soon.</p>
                        <button className="comm-add-btn" onClick={onClose}>Close</button>
                    </div>
                ) : (
                    <>
                        <div className="comm-modal-header">
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
                                <label>Your story</label>
                                <textarea rows={5} placeholder="Tell us what Evergreeners has meant for your journey as a developer..." value={form.story} onChange={e => setForm(f => ({ ...f, story: e.target.value }))} required />
                            </div>
                            <button type="submit" className="comm-add-btn" style={{ gap: '10px' }}>
                                <Send size={16} /> Submit my story
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}

/* ─────────────── PAGE ─────────────── */

type Tab = 'stories' | 'events' | 'members' | 'opensource';

export default function Community() {
    const [tab, setTab] = useState<Tab>('stories');
    const [storyFilter, setStoryFilter] = useState<'all' | 'featured' | 'github' | 'twitter'>('all');
    const [showModal, setShowModal] = useState(false);

    const filteredStories = stories.filter(s => {
        if (storyFilter === 'all') return true;
        if (storyFilter === 'featured') return s.featured;
        return s.platform === storyFilter;
    });

    return (
        <div className="comm-page">
            <PublicHeader />

            {/* Background */}
            <div className="comm-bg"><div className="comm-bg-grid" /></div>

            <main className="comm-main">

                {/* ── Hero with floating avatars ── */}
                <section className="comm-hero">
                    {/* Floating member photos */}
                    {floatingAvatars.map((a, i) => (
                        <div
                            key={i}
                            className={`comm-float-avatar comm-float-avatar--${a.size}`}
                            style={{ ...a.style, animationDelay: a.delay } as React.CSSProperties}
                        >
                            <img src={a.src} alt="Community member" loading="lazy" />
                        </div>
                    ))}

                    <div className="comm-hero-content">
                        <div className="comm-eyebrow">
                            <span className="comm-eyebrow-dot" />
                            10,000+ developers worldwide
                        </div>
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

                {/* ── Stats ── */}
                <section className="comm-stats">
                    {stats.map((s, i) => (
                        <div key={i} className="comm-stat">
                            <div className="comm-stat-icon">{s.icon}</div>
                            <div className="comm-stat-value">{s.value}</div>
                            <div className="comm-stat-label">{s.label}</div>
                        </div>
                    ))}
                </section>

                {/* ── Tab Navigation ── */}
                <div className="comm-tabs">
                    {([
                        { id: 'stories', label: 'Stories', icon: <MessageSquare size={15} /> },
                        { id: 'events', label: 'Events', icon: <Calendar size={15} /> },
                        { id: 'members', label: 'Top Members', icon: <Trophy size={15} /> },
                        { id: 'opensource', label: 'Open Source', icon: <GitPullRequest size={15} /> },
                    ] as { id: Tab; label: string; icon: React.ReactNode }[]).map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`comm-tab-btn ${tab === t.id ? 'active' : ''}`}
                        >
                            {t.icon}
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* ── Tab Content ── */}
                <div className="comm-tab-content">

                    {/* STORIES */}
                    {tab === 'stories' && (
                        <>
                            <div className="comm-filters">
                                {(['all', 'featured', 'github', 'twitter'] as const).map(f => (
                                    <button
                                        key={f}
                                        className={`comm-filter-btn ${storyFilter === f ? 'active' : ''}`}
                                        onClick={() => setStoryFilter(f)}
                                    >
                                        {f === 'all' ? 'All Stories' : f === 'featured' ? '⭐ Featured' : f === 'github' ? 'GitHub' : 'Twitter / X'}
                                    </button>
                                ))}
                            </div>
                            <div className="comm-grid">
                                {filteredStories.map(s => <StoryCard key={s.id} story={s} />)}
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

                    {/* EVENTS */}
                    {tab === 'events' && (
                        <div className="comm-events-grid">
                            {events.map(e => <EventCard key={e.id} event={e} />)}
                        </div>
                    )}

                    {/* MEMBERS */}
                    {tab === 'members' && (
                        <div className="comm-members-section">
                            <div className="comm-members-header">
                                <h2>Streak Leaderboard</h2>
                                <p>The top developers by longest active streak. Updated daily.</p>
                            </div>
                            <div className="comm-members-list">
                                {members.map(m => <MemberRow key={m.rank} member={m} />)}
                            </div>
                            <div className="comm-members-cta">
                                <Link to="/signup">
                                    <CosmicButton>Join & track your streak</CosmicButton>
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* OPEN SOURCE */}
                    {tab === 'opensource' && (
                        <div className="comm-oss-section">
                            <div className="comm-oss-intro">
                                <h2>Contribute to Evergreeners</h2>
                                <p>Evergreeners is built in the open. Pick a repo, find a good first issue, and start contributing today.</p>
                            </div>
                            <div className="comm-oss-grid">
                                {openSourceItems.map((item, i) => <OpenSourceCard key={i} item={item} />)}
                            </div>
                        </div>
                    )}

                </div>
            </main>

            {showModal && <SubmitModal onClose={() => setShowModal(false)} />}
        </div>
    );
}
