
import { useState, useEffect } from 'react';
import './CommunityStories.css';

interface StoryProps {
    name: string;
    role: string;
    quote: string;
    image?: string;
}

const stories: StoryProps[] = [
    {
        name: "Sarah J.",
        role: "Senior Engineer",
        quote: "I used to code in bursts and burn out. Evergreeners helped me pace myself. Now I've coded for 300 days straight.",
        // Will be loaded asynchronously
        image: "",
    },
    {
        name: "Marcus Chen",
        role: "Indie Hacker",
        quote: "The GitHub sync is magic. It just works. Seeing that green graph fill up is the best dopamine hit.",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=2787&auto=format&fit=crop",
    },
    {
        name: "Alex Rivera",
        role: "CTO @ Startup",
        quote: "Leaderboards made it a game for our whole team. Productivity is up 40% since we started tracking.",
        image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=2787&auto=format&fit=crop",
    }
];

function StoryCard({ name, role, quote, image }: StoryProps) {
    return (
        <div className="story-card group">
            {image && (
                <img
                    src={image}
                    alt={`${name} avatar`}
                    loading="lazy"
                    className="story-card__bg-image"
                />
            )}
            <div className="story-card__content">
                <p className="story-card__description mb-4">"{quote}"</p>
                <div>
                    <p className="story-card__title">{name}</p>
                    <p className="story-card__role">{role}</p>
                </div>
            </div>
        </div>
    );
}

export function CommunityStories() {
    const [storiesWithImages, setStoriesWithImages] = useState(stories);

    useEffect(() => {
        // Load Sarah's avatar asynchronously
        import('@/assets/avatar-sarah.png').then(module => {
            setStoriesWithImages(prev => prev.map((story, idx) =>
                idx === 0 ? { ...story, image: module.default } : story
            ));
        });
    }, []);

    return (
        <section className="pt-32 pb-0 bg-[#050505] relative overflow-hidden">
            <div className="cyber-pattern" />
            <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-black via-black/80 to-transparent z-0 pointer-events-none" />

            <div className="container mx-auto px-4 max-w-7xl relative z-10">
                <div className="text-center mb-20">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">Community Stories</h2>
                    <p className="text-muted-foreground text-lg">Join 10,000+ developers building their legacy.</p>
                </div>

                <div className="marquee-container">
                    <div className="marquee-track">
                        {/* First set of stories */}
                        {storiesWithImages.map((story, index) => (
                            <StoryCard key={`original-${index}`} {...story} />
                        ))}
                        {storiesWithImages.map((story, index) => (
                            <StoryCard key={`dup1-${index}`} {...story} />
                        ))}

                        {/* Second set of stories (Duplicate for seamless loop) */}
                        {storiesWithImages.map((story, index) => (
                            <StoryCard key={`loop-original-${index}`} {...story} />
                        ))}
                        {storiesWithImages.map((story, index) => (
                            <StoryCard key={`loop-dup1-${index}`} {...story} />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
