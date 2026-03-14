import { db } from './src/db/index.js';
import * as schema from './src/db/schema.js';

async function seed() {
    console.log('Seeding community data...');

    // Seed constant stories
    const storiesData = [
        {
            name: "Muhammad Adamu Aliyu",
            handle: "muhammad_adamu",
            platform: 'twitter',
            role: "Founder",
            featured: true,
            quote: "The GitHub sync is magic. Seeing that green graph fill up is the best dopamine hit. It's transformed how I think about consistency.",
            image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200"
        },
        {
            name: "Sarah Chen",
            handle: "schen_dev",
            platform: 'twitter',
            role: "Software Engineer",
            featured: false,
            quote: "It's like an RPG for my career. The Quest system finally made documentation fun for our entire team.",
            image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200"
        },
        {
            name: "Nasir Ibrahim Imam",
            handle: "nasir_imam",
            platform: 'github',
            role: "Software Developer",
            featured: true,
            quote: "I used to code in bursts and burn out. Now I've coded for 100 days straight. Evergreeners made consistency my default.",
            image: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=200"
        }
    ];

    for (const s of storiesData) {
        await db.insert(schema.communityStories).values(s);
    }

    // Seed events
    const eventsData = [
        {
            title: "Monthly Streak Showcase",
            date: "Mar 28, 2026",
            time: "7:00 PM WAT",
            type: "Live Session",
            description: "Top streakers share their daily routines and tips for maintaining consistency over months.",
            attendees: 142,
            icon: 'Flame'
        },
        {
            title: "Open Source Sprint Weekend",
            date: "Apr 5-6, 2026",
            time: "All Day",
            type: "Hackathon",
            description: "48-hour collaborative sprint where community members contribute to the Evergreeners open source repos.",
            attendees: 89,
            icon: 'GitPullRequest'
        },
         {
            title: "Ask Me Anything — Core Team",
            date: "Apr 12, 2026",
            time: "5:00 PM WAT",
            type: "AMA",
            description: "Live Q&A with the Evergreeners core team. Ask about the roadmap, features, and what's coming next.",
            attendees: 231,
            icon: 'MessageSquare'
        }
    ];

    for (const e of eventsData) {
        await db.insert(schema.events).values(e);
    }

    console.log('Seeding complete!');
    process.exit(0);
}

seed().catch(err => {
    console.error('Seed failed:', err);
    process.exit(1);
});
