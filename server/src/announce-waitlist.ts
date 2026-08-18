import './env.js';
import { db } from './db/index.js';
import * as schema from './db/schema.js';
import { sendAcademyAnnouncementEmail } from './lib/email.js';

const ACADEMY_LAUNCH_DATE = process.env.ACADEMY_LAUNCH_DATE || '2026-08-31T00:00:00Z';
const LAUNCH_MS = new Date(ACADEMY_LAUNCH_DATE).getTime();
const launchDateLabel = new Date(ACADEMY_LAUNCH_DATE).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
});
const launchHref = `${process.env.APP_URL || 'https://evergreeners.dev'}/academy`;

function timeLeft() {
    const difference = LAUNCH_MS - Date.now();
    if (difference <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    return {
        days: Math.floor(difference / 86400000),
        hours: Math.floor((difference / 3600000) % 24),
        minutes: Math.floor((difference / 60000) % 60),
        seconds: Math.floor((difference / 1000) % 60),
    };
}

async function main() {
    const rows = await db.select({ email: schema.academyWaitlist.email })
        .from(schema.academyWaitlist);

    const recipients = rows.map((r) => r.email).filter((e) => e && e.includes('@'));
    console.log(`Waitlist has ${rows.length} entries; ${recipients.length} usable email addresses.`);
    console.log(`Launch: ${launchDateLabel} (${ACADEMY_LAUNCH_DATE}) | Remaining:`, timeLeft());

    if (process.env.DRY_RUN === 'true') {
        console.log('DRY_RUN is set — no emails sent. Recipients:');
        recipients.forEach((email) => console.log(`  - ${email}`));
        return;
    }

    let sent = 0;
    let failed = 0;
    const queue = [...recipients];
    const worker = async () => {
        while (queue.length) {
            const email = queue.shift()!;
            try {
                await sendAcademyAnnouncementEmail({
                    to: email,
                    name: 'there',
                    launchDateLabel,
                    launchHref,
                    timeLeft: timeLeft(),
                });
                sent++;
            } catch (err) {
                failed++;
                console.error(`Failed for ${email}:`, (err as Error).message);
            }
        }
    };

    const started = Date.now();
    await Promise.all(Array.from({ length: 5 }, worker));
    console.log(`Done in ${((Date.now() - started) / 1000).toFixed(1)}s — sent ${sent}, failed ${failed}.`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});