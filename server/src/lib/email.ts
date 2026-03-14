import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.EMAIL_FROM || 'Evergreeners <noreply@yourdomain.com>';
const APP_URL = process.env.APP_URL || 'https://evergreeners.dev';

// ─── Shared shell ─────────────────────────────────────────────────────────────
const emailShell = (body: string) => `
<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>Evergreeners</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; }
    @media (prefers-color-scheme: dark) {
      body, .email-bg   { background-color: #0d0d0d !important; }
      .email-card       { background-color: #141414 !important; border-color: #1f1f1f !important; }
      .text-heading     { color: #f5f5f5 !important; }
      .text-body        { color: #8a8a8a !important; }
      .text-muted       { color: #525252 !important; }
      .divider          { background-color: #1f1f1f !important; }
      .stat-box         { background-color: #1a1a1a !important; border-color: #242424 !important; }
      .stat-label       { color: #525252 !important; }
      .stat-unit        { color: #525252 !important; }
      .footer-link      { color: #525252 !important; }
      .footer-text      { color: #404040 !important; }
      .cta-secondary    { color: #525252 !important; }
      .step-label       { color: #525252 !important; }
    }
  </style>
</head>
<body class="email-bg" style="margin:0;padding:0;background-color:#f4f4f5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td class="email-bg" align="center" style="padding:48px 16px;background-color:#f4f4f5;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">

          <!-- Wordmark -->
          <tr>
            <td style="padding-bottom:24px;">
              <span style="font-family:ui-monospace,'SF Mono','Fira Code',monospace;font-size:13px;font-weight:700;letter-spacing:0.12em;color:#10b981;text-transform:uppercase;">EVERGREENERS</span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td class="email-card" style="background-color:#ffffff;border:1px solid #e4e4e7;border-radius:12px;padding:40px 40px 36px;">
              ${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:28px;">
              <p class="footer-text" style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12px;color:#71717a;line-height:1.7;">
                You're receiving this because you have an account on
                <a href="${APP_URL}" class="footer-link" style="color:#71717a;text-decoration:underline;">evergreeners.dev</a>.
                &nbsp;·&nbsp;
                <a href="${APP_URL}/settings" class="footer-link" style="color:#71717a;text-decoration:underline;">Manage notifications</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const divider = `
  <tr>
    <td style="padding:24px 0;">
      <div class="divider" style="height:1px;background-color:#e4e4e7;font-size:0;line-height:0;">&nbsp;</div>
    </td>
  </tr>`;

// ─── Welcome Email ────────────────────────────────────────────────────────────

export async function sendWelcomeEmail(to: string, name: string) {
    const displayName = name?.split(' ')[0] || 'there';

    const body = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding-bottom:8px;">
            <h1 class="text-heading" style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',Helvetica,Arial,sans-serif;font-size:26px;font-weight:700;color:#09090b;letter-spacing:-0.4px;line-height:1.3;">
              Welcome, ${displayName}.
            </h1>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:4px;">
            <p class="text-body" style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;color:#52525b;line-height:1.75;">
              Your account is live. Evergreeners tracks your GitHub contributions and turns your daily commits into a streak you can't afford to break.
            </p>
          </td>
        </tr>

        ${divider}

        <tr>
          <td>
            <p class="step-label" style="margin:0 0 20px;font-family:ui-monospace,'SF Mono',monospace;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#a1a1aa;">
              Get started
            </p>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
              <tr>
                <td width="28" valign="top" style="padding-top:2px;">
                  <span style="font-family:ui-monospace,'SF Mono',monospace;font-size:11px;font-weight:700;color:#10b981;">01</span>
                </td>
                <td>
                  <span class="text-body" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;color:#52525b;line-height:1.6;">
                    Connect your GitHub account in Settings to start tracking
                  </span>
                </td>
              </tr>
            </table>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
              <tr>
                <td width="28" valign="top" style="padding-top:2px;">
                  <span style="font-family:ui-monospace,'SF Mono',monospace;font-size:11px;font-weight:700;color:#10b981;">02</span>
                </td>
                <td>
                  <span class="text-body" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;color:#52525b;line-height:1.6;">
                    Your streak and stats update automatically every hour
                  </span>
                </td>
              </tr>
            </table>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td width="28" valign="top" style="padding-top:2px;">
                  <span style="font-family:ui-monospace,'SF Mono',monospace;font-size:11px;font-weight:700;color:#10b981;">03</span>
                </td>
                <td>
                  <span class="text-body" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;color:#52525b;line-height:1.6;">
                    Climb the leaderboard, set goals, and complete quests
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        ${divider}

        <tr>
          <td>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="background-color:#10b981;border-radius:7px;">
                  <a href="${APP_URL}/settings" style="display:inline-block;padding:11px 22px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:-0.1px;">
                    Connect GitHub
                  </a>
                </td>
                <td style="padding-left:20px;">
                  <a href="${APP_URL}/dashboard" class="cta-secondary" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;color:#71717a;text-decoration:none;">
                    Go to dashboard &rarr;
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>`;

    try {
        const result = await resend.emails.send({
            from: FROM_EMAIL,
            to,
            subject: 'Welcome to Evergreeners',
            html: emailShell(body),
        });
        console.log(`Welcome email sent to ${to}:`, result.data?.id);
        return result;
    } catch (err) {
        console.error(`Failed to send welcome email to ${to}:`, err);
        throw err;
    }
}

// ─── Daily Digest Email ───────────────────────────────────────────────────────
// Sent every day at 8 PM regardless of commit status.
// Two modes:
//   - Committed today  → celebration / summary card
//   - No commits today → streak-at-risk warning

export interface DailyDigestOptions {
    to: string;
    name: string;
    username: string;
    streak: number;
    todayCommits: number;
    totalCommits: number;
    weeklyCommits: number;
}

export async function sendDailyDigestEmail(opts: DailyDigestOptions) {
    const { to, name, username, streak, todayCommits, totalCommits, weeklyCommits } = opts;
    const displayName = name?.split(' ')[0] || username || 'there';
    const committed = todayCommits > 0;

    // ── Subject line ──
    const subject = committed
        ? streak > 0
            ? `${streak}-day streak — ${todayCommits} commit${todayCommits !== 1 ? 's' : ''} today`
            : `${todayCommits} commit${todayCommits !== 1 ? 's' : ''} today — keep it going`
        : streak > 0
            ? `Your ${streak}-day streak is at risk`
            : 'No commits today — start your streak';

    // ── Dynamic heading & body copy ──
    const heading = committed
        ? `Good work today, ${displayName}.`
        : `No commits yet today, ${displayName}.`;

    const bodyText = committed
        ? streak >= 30
            ? `${streak} days straight. Today's ${todayCommits} commit${todayCommits !== 1 ? 's' : ''} keep that run alive.`
            : streak >= 7
                ? `${streak}-day streak and counting. You pushed ${todayCommits} commit${todayCommits !== 1 ? 's' : ''} today — solid.`
                : streak > 0
                    ? `${streak} days in a row. Today you pushed ${todayCommits} commit${todayCommits !== 1 ? 's' : ''}. Keep the momentum.`
                    : `${todayCommits} commit${todayCommits !== 1 ? 's' : ''} today. Connect GitHub in settings to start tracking your streak.`
        : streak >= 30
            ? `${streak} days without a break. That record doesn't survive tonight without a commit.`
            : streak >= 7
                ? `${streak} days in. You're building something real — don't let it slip tonight.`
                : streak > 0
                    ? `${streak}-day streak on the line. One commit is all it takes.`
                    : `No streak yet. Push something today and start one.`;

    // ── Commits today stat color ──
    const commitsColor = committed ? '#10b981' : '#ef4444';
    const commitsDisplay = String(todayCommits);

    // ── CTA ──
    const ctaHref = committed ? `${APP_URL}/dashboard` : `https://github.com/${username}`;
    const ctaLabel = committed ? 'View dashboard' : 'Open GitHub';
    const ctaBg = committed ? '#10b981' : '#09090b';
    const ctaTextColor = '#ffffff';

    const body = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">

        <!-- Heading -->
        <tr>
          <td style="padding-bottom:8px;">
            <h1 class="text-heading" style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',Helvetica,Arial,sans-serif;font-size:26px;font-weight:700;color:#09090b;letter-spacing:-0.4px;line-height:1.3;">
              ${heading}
            </h1>
          </td>
        </tr>

        <!-- Context line -->
        <tr>
          <td style="padding-bottom:4px;">
            <p class="text-body" style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;color:#52525b;line-height:1.75;">
              ${bodyText}
            </p>
          </td>
        </tr>

        ${divider}

        <!-- Stats row -->
        <tr>
          <td>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <!-- Streak -->
                <td width="31%" class="stat-box" style="padding:16px 18px;background-color:#fafafa;border:1px solid #e4e4e7;border-radius:8px;">
                  <p class="stat-label" style="margin:0 0 6px;font-family:ui-monospace,'SF Mono',monospace;font-size:10px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#a1a1aa;">Streak</p>
                  <p style="margin:0;font-family:ui-monospace,'SF Mono','Fira Code',monospace;font-size:28px;font-weight:700;line-height:1;color:${streak > 0 ? '#10b981' : '#a1a1aa'};">
                    ${streak}<span class="stat-unit" style="font-size:12px;font-weight:400;color:#a1a1aa;margin-left:3px;">days</span>
                  </p>
                </td>

                <td width="3%"></td>

                <!-- Today -->
                <td width="31%" class="stat-box" style="padding:16px 18px;background-color:#fafafa;border:1px solid #e4e4e7;border-radius:8px;">
                  <p class="stat-label" style="margin:0 0 6px;font-family:ui-monospace,'SF Mono',monospace;font-size:10px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#a1a1aa;">Today</p>
                  <p style="margin:0;font-family:ui-monospace,'SF Mono','Fira Code',monospace;font-size:28px;font-weight:700;line-height:1;color:${commitsColor};">
                    ${commitsDisplay}<span class="stat-unit" style="font-size:12px;font-weight:400;color:#a1a1aa;margin-left:3px;">commits</span>
                  </p>
                </td>

                <td width="3%"></td>

                <!-- This week -->
                <td width="32%" class="stat-box" style="padding:16px 18px;background-color:#fafafa;border:1px solid #e4e4e7;border-radius:8px;">
                  <p class="stat-label" style="margin:0 0 6px;font-family:ui-monospace,'SF Mono',monospace;font-size:10px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#a1a1aa;">This week</p>
                  <p style="margin:0;font-family:ui-monospace,'SF Mono','Fira Code',monospace;font-size:28px;font-weight:700;line-height:1;color:#09090b;">
                    ${weeklyCommits}<span class="stat-unit" style="font-size:12px;font-weight:400;color:#a1a1aa;margin-left:3px;">commits</span>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        ${divider}

        <!-- Total commits bar -->
        <tr>
          <td style="padding-bottom:24px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td>
                  <p class="stat-label" style="margin:0 0 4px;font-family:ui-monospace,'SF Mono',monospace;font-size:10px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#a1a1aa;">All-time commits</p>
                  <p class="text-heading" style="margin:0;font-family:ui-monospace,'SF Mono','Fira Code',monospace;font-size:20px;font-weight:700;color:#09090b;">${totalCommits.toLocaleString()}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        ${!committed ? `
        <!-- Warning note (only shown when no commits) -->
        <tr>
          <td style="padding-bottom:24px;">
            <p class="text-muted" style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;color:#71717a;line-height:1.75;">
              Push something small — a fix, a note, a doc update. The day resets at midnight.
            </p>
          </td>
        </tr>` : ''}

        <!-- CTA -->
        <tr>
          <td>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="background-color:${ctaBg};border-radius:7px;">
                  <a href="${ctaHref}" style="display:inline-block;padding:11px 22px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;color:${ctaTextColor};text-decoration:none;letter-spacing:-0.1px;">
                    ${ctaLabel}
                  </a>
                </td>
                ${committed ? '' : `
                <td style="padding-left:20px;">
                  <a href="${APP_URL}/dashboard" class="cta-secondary" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;color:#71717a;text-decoration:none;">
                    View dashboard &rarr;
                  </a>
                </td>`}
              </tr>
            </table>
          </td>
        </tr>

      </table>`;

    try {
        const result = await resend.emails.send({
            from: FROM_EMAIL,
            to,
            subject,
            html: emailShell(body),
        });
        console.log(`Daily digest sent to ${to} [committed=${committed}]:`, result.data?.id);
        return result;
    } catch (err) {
        console.error(`Failed to send daily digest to ${to}:`, err);
        throw err;
    }
}

// Keep the old name as an alias for backward compat with cron.ts
// (we'll update cron separately)
export async function sendStreakReminderEmail(opts: {
    to: string; name: string; username: string;
    streak: number; todayCommits: number; totalCommits?: number; weeklyCommits?: number;
}) {
    return sendDailyDigestEmail({
        ...opts,
        totalCommits: opts.totalCommits ?? 0,
        weeklyCommits: opts.weeklyCommits ?? 0,
    });
}

// ─── New Quest Email ────────────────────────────────────────────────────────
export interface NewQuestEmailOptions {
    to: string;
    userName: string;
    submitterName: string;
    questTitle: string;
    questUrl: string;
    hasGithub: boolean;
}

export async function sendNewQuestEmail(opts: NewQuestEmailOptions) {
    const { to, userName, submitterName, questTitle, questUrl, hasGithub } = opts;
    const displayName = userName?.split(' ')[0] || 'there';

    const subject = `${submitterName} has submitted a new quest`;
    
    // Fallbacks for email client rendering of liquid glass (translucent green, bordered)
    const buttonBg = '#cdf0e6'; // Primary/10 roughly (faked for solid background email clients)
    const buttonBorder = '#10b981'; // Primary solid
    const buttonText = '#10b981'; // Primary solid
    
    const bodyText = hasGithub 
        ? `Review the details below and see if you have what it takes to solve it.`
        : `To accept this quest, you will need to connect your GitHub account in your settings first. Review the details below.`;

    const body = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding-bottom:12px;">
             <span style="display:inline-block;padding:4px 10px;border-radius:12px;background-color:#f4f4f5;font-family:ui-monospace,'SF Mono',monospace;font-size:11px;font-weight:600;color:#52525b;letter-spacing:0.05em;text-transform:uppercase;">
              New Quest Available
            </span>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:12px;">
            <h1 class="text-heading" style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',Helvetica,Arial,sans-serif;font-size:24px;font-weight:700;color:#09090b;letter-spacing:-0.4px;line-height:1.3;">
              Hello ${displayName},<br/>${submitterName} submitted a new quest.
            </h1>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:4px;">
            <p class="text-body" style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;color:#52525b;line-height:1.75;">
              "${questTitle}"<br/><br/>
              ${bodyText}
            </p>
          </td>
        </tr>

        ${divider}

        <!-- CTA liquid-glass style button -->
        <tr>
          <td>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="background-color:${buttonBg};border-radius:12px;border:1px solid ${buttonBorder};">
                  <a href="${questUrl}" style="display:inline-block;padding:12px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;color:${buttonText};text-decoration:none;letter-spacing:-0.1px;">
                    Review & Accept Quest
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>`;

    try {
        const result = await resend.emails.send({
            from: FROM_EMAIL,
            to,
            subject,
            html: emailShell(body),
        });
        console.log(`New quest email sent to ${to}:`, result.data?.id);
        return result;
    } catch (err) {
        console.error(`Failed to send new quest email to ${to}:`, err);
        throw err;
    }
}
// ─── Story Published Email ───────────────────────────────────────────────────
export async function sendStoryPublishedEmail(to: string, name: string) {
    const displayName = name?.split(' ')[0] || 'there';
    const subject = 'Your Evergreeners story is published! 🎉';
    
    const body = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding-bottom:12px;">
            <h1 class="text-heading" style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',Helvetica,Arial,sans-serif;font-size:24px;font-weight:700;color:#09090b;letter-spacing:-0.4px;line-height:1.3;">
              It's live, ${displayName}!
            </h1>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:4px;">
            <p class="text-body" style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;color:#52525b;line-height:1.75;">
              Your story has been approved and is now featured in the Evergreeners community. 
              Thanks for sharing your journey and inspiring other developers to stay consistent.
            </p>
          </td>
        </tr>

        ${divider}

        <tr>
          <td>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="background-color:#10b981;border-radius:12px;">
                  <a href="${APP_URL}/community" style="display:inline-block;padding:12px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:-0.1px;">
                    View in Community
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        ${divider}

        <tr>
          <td>
            <p class="text-muted" style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;color:#71717a;line-height:1.6;">
              If you ever want to update or remove your story, just reply to this email or contact us at support@evergreeners.dev.
            </p>
          </td>
        </tr>
      </table>`;

    try {
        const result = await resend.emails.send({
            from: FROM_EMAIL,
            to,
            subject,
            html: emailShell(body),
        });
        console.log(`Story published email sent to ${to}:`, result.data?.id);
        return result;
    } catch (err) {
        console.error(`Failed to send story published email to ${to}:`, err);
        throw err;
    }
}

// ─── Admin Story Submitted Email ──────────────────────────────────────────────
export async function sendAdminStorySubmittedEmail(to: string[], storyAuthor: string, quote: string) {
    const subject = 'New story submitted for moderation 📝';
    
    const body = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding-bottom:12px;">
             <span style="display:inline-block;padding:4px 10px;border-radius:12px;background-color:#fef3c7;font-family:ui-monospace,'SF Mono',monospace;font-size:11px;font-weight:600;color:#d97706;letter-spacing:0.05em;text-transform:uppercase;">
              Pending Review
            </span>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:12px;">
            <h1 class="text-heading" style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',Helvetica,Arial,sans-serif;font-size:24px;font-weight:700;color:#09090b;letter-spacing:-0.4px;line-height:1.3;">
              New Story Submission
            </h1>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:4px;">
            <p class="text-body" style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;color:#52525b;line-height:1.75;">
              <strong>${storyAuthor}</strong> just submitted a story for review:
              <br/><br/>
              <em style="opacity: 0.8;">"${quote}"</em>
            </p>
          </td>
        </tr>

        ${divider}

        <tr>
          <td>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="background-color:#10b981;border-radius:12px;">
                  <a href="${APP_URL}/admin" style="display:inline-block;padding:12px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:-0.1px;">
                    Review in Admin Dashboard
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>`;

    try {
        const result = await resend.emails.send({
            from: FROM_EMAIL,
            to,
            subject,
            html: emailShell(body),
        });
        console.log(`Admin story notification sent to ${to.length} admins:`, result.data?.id);
        return result;
    } catch (err) {
        console.error(`Failed to send admin story notification:`, err);
        throw err;
    }
}
