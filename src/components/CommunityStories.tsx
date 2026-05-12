import { useState, useEffect } from 'react';
import { getApiUrl } from '@/lib/api-config';
import { Github, Twitter, ArrowRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import './CommunityStories.css';

interface StoryProps {
    id?: number;
    name: string;
    handle: string;
    quote: string;
    image: string;
    platform: 'github' | 'twitter';
    featured?: boolean;
    heroFeatured?: boolean;
    variant?: 'normal' | 'featured' | 'large';
}

function StoryCard({ name, handle, quote, image, platform, featured, heroFeatured, variant }: StoryProps) {
    // If layout variant is not explicitly provided, map it from database fields
    let activeVariant = variant || 'normal';
    if (!variant) {
        if (heroFeatured) {
            activeVariant = 'large';
        } else if (featured) {
            activeVariant = 'featured';
        }
    }
    const variantClass = activeVariant !== 'normal' ? `story-card--${activeVariant}` : '';
    
    // Fallback image if null/empty
    const avatarUrl = image || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;

    return (
        <div className={`story-card ${variantClass}`}>
            <div className="card-header">
                <img src={avatarUrl} alt={name} className="avatar" loading="lazy" />
                <div className="user-info">
                    <span className="user-name">{name}</span>
                    <span className="user-handle">@{handle}</span>
                </div>
                <div className="platform-icon">
                    {platform === 'github' ? <Github size={15} /> : <Twitter size={15} />}
                </div>
            </div>
            <p className="story-quote">"{quote}"</p>
        </div>
    );
}

export function CommunityStories() {
    const [stories, setStories] = useState<StoryProps[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const fetchStories = async () => {
            try {
                const res = await fetch(getApiUrl('/api/community/stories'));
                if (res.ok) {
                    const data = await res.json();
                    if (isMounted) {
                        setStories(data.stories || []);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch community stories:', err);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchStories();
        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <section className="community-section">
            <div className="cyber-background" />

            <div className="container mx-auto px-4 max-w-7xl relative z-10">
                <div className="community-header">
                    <div className="community-eyebrow">
                        <span className="community-eyebrow-dot" />
                        10,000+ developers worldwide
                    </div>
                    <h2>Join the community</h2>
                    <p>Real stories from real developers who turned consistency into their greatest competitive advantage.</p>

                    <div className="community-cta-row">
                        {/* Discord — cosmic hand-drawn style */}
                        <a
                            href="https://discord.gg/evergreeners"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="community-action-btn"
                        >
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.06.06 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                            </svg>
                            Join us on Discord
                        </a>

                        {/* WhatsApp — same cosmic style */}
                        <a
                            href="https://chat.whatsapp.com/evergreeners"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="community-action-btn"
                        >
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                            Join WhatsApp Community
                        </a>
                    </div>
                </div>

                <div className="community-grid">
                    {loading ? (
                        <div className="col-span-full flex justify-center items-center py-12 w-full">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : stories.length > 0 ? (
                        stories.map((story, index) => (
                            <StoryCard key={story.id || index} {...story} />
                        ))
                    ) : (
                        <div className="col-span-full text-center py-12 text-muted-foreground w-full">
                            <p>No community stories found. Be the first to share yours!</p>
                        </div>
                    )}

                    {/* CTA card — links to the community page */}
                    <Link
                        to="/community"
                        className="story-card story-card--cta"
                    >
                        <div className="cta-card-inner">
                            <div className="cta-card-icon">
                                <ArrowRight size={28} />
                            </div>
                            <p className="cta-card-title">View all stories</p>
                            <p className="cta-card-sub">See the full community wall and share your own Evergreeners journey.</p>
                            <span className="cta-card-action">Explore community →</span>
                        </div>
                    </Link>
                </div>
            </div>
        </section>
    );
}
