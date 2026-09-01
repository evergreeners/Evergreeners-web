import { Resend } from 'resend';

const getResend = () => new Resend(process.env.RESEND_API_KEY);

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

// Reusable themed countdown table (baked at send-time — email clients block JS)
const countdownBox = (value: number, label: string) => `
  <td align="center" style="padding:10px 14px;background-color:#000000;border:1px solid #1f1f1f;border-radius:10px;min-width:62px;">
    <div style="font-family:ui-monospace,'SF Mono','Fira Code',monospace;font-size:26px;font-weight:700;color:#4ade80;line-height:1;">${String(value).padStart(2, '0')}</div>
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:9px;color:#52525b;letter-spacing:0.14em;text-transform:uppercase;margin-top:4px;">${label}</div>
  </td>`;

const academyCountdownTable = (tl: AcademyTimeLeft) => `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;">
    <tr style="border-collapse:separate;">
      ${countdownBox(tl.days, 'Days')}
      <td style="width:6px;">&nbsp;</td>
      ${countdownBox(tl.hours, 'Hours')}
      <td style="width:6px;">&nbsp;</td>
      ${countdownBox(tl.minutes, 'Mins')}
      <td style="width:6px;">&nbsp;</td>
      ${countdownBox(tl.seconds, 'Secs')}
    </tr>
  </table>`;

// Time remaining until local midnight (streak reset). Baked at send-time.
function getTimeUntilMidnight() {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const diff = Math.max(0, midnight.getTime() - now.getTime());
    return {
        hours: Math.floor(diff / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
    };
}

const midnightCountdownTable = () => {
    const tl = getTimeUntilMidnight();
    return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;">
    <tr style="border-collapse:separate;">
      ${countdownBox(tl.hours, 'Hours')}
      <td style="width:6px;">&nbsp;</td>
      ${countdownBox(tl.minutes, 'Mins')}
      <td style="width:6px;">&nbsp;</td>
      ${countdownBox(tl.seconds, 'Secs')}
    </tr>
  </table>`;
};

// ─── Welcome Email ────────────────────────────────────────────────────────────

export async function sendWelcomeEmail(to: string, name: string, githubConnected = false) {
    const displayName = name?.split(' ')[0] || 'there';

    // Step 01 differs: GitHub users are already connected, email users still need to
    const step01 = githubConnected
        ? 'Your GitHub is connected — tracking has already started'
        : 'Connect your GitHub account in Settings to start tracking';

    // CTA differs too: GitHub users go straight to dashboard, email users to settings
    const ctaHref = githubConnected ? `${APP_URL}/dashboard` : `${APP_URL}/settings`;
    const ctaLabel = githubConnected ? 'Go to dashboard' : 'Connect GitHub';
    const ctaSecondaryHref = githubConnected ? `${APP_URL}/settings` : `${APP_URL}/dashboard`;
    const ctaSecondaryLabel = githubConnected ? 'Settings →' : 'Go to dashboard →';

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
                    ${step01}
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
                    Commits are detected automatically — your streak and stats always stay up to date
                  </span>
                </td>
              </tr>
            </table>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
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
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td width="28" valign="top" style="padding-top:2px;">
                  <span style="font-family:ui-monospace,'SF Mono',monospace;font-size:11px;font-weight:700;color:#10b981;">04</span>
                </td>
                <td>
                  <span class="text-body" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;color:#52525b;line-height:1.6;">
                    Hit milestones to earn badges and unlock rewards — the longer your streak, the more you collect
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        ${divider}

        <tr>
          <td style="padding-bottom:20px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="background-color:#10b981;border-radius:7px;">
                  <a href="${ctaHref}" style="display:inline-block;padding:11px 22px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:-0.1px;">
                    ${ctaLabel}
                  </a>
                </td>
                <td style="padding-left:20px;">
                  <a href="${ctaSecondaryHref}" class="cta-secondary" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;color:#71717a;text-decoration:none;">
                    ${ctaSecondaryLabel}
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Docs link — shown to all users -->
        <tr>
          <td>
            <p class="text-muted" style="margin:0 0 10px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;color:#71717a;line-height:1.6;">
              New to Evergreeners? The docs have guides, videos, and everything you need to hit the ground running.
            </p>
            <a href="https://docs.evergreeners.dev/" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;font-weight:600;color:#10b981;text-decoration:none;">
              Read the docs &rarr;
            </a>
          </td>
        </tr>

      </table>`;

    try {
        const result = await getResend().emails.send({
            from: FROM_EMAIL,
            to,
            subject: 'Welcome to Evergreeners',
            html: emailShell(body),
        });
        console.log(`Welcome email sent to ${to} [github=${githubConnected}]:`, result.data?.id);
        return result;
    } catch (err) {
        console.error(`Failed to send welcome email to ${to}:`, err);
        throw err;
    }
}

export interface AcademyTimeLeft {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

export interface AcademyWaitlistOptions {
    to: string;
    name?: string;
    launchDateLabel: string;
    launchHref: string;
}

export async function sendAcademyWaitlistConfirmationEmail(opts: AcademyWaitlistOptions) {
    const { to, name, launchDateLabel, launchHref } = opts;
    const displayName = name?.split(' ')[0] || 'there';

    const body = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding-bottom:8px;">
            <h1 class="text-heading" style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',Helvetica,Arial,sans-serif;font-size:26px;font-weight:700;color:#09090b;letter-spacing:-0.4px;line-height:1.3;">
              You're on the list, ${displayName}.
            </h1>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:4px;">
            <p class="text-body" style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;color:#52525b;line-height:1.75;">
              We've saved your spot for the <strong style="color:#09090b;">Evergreeners Academy</strong>, opening <strong style="color:#09090b;">${launchDateLabel}</strong>. You'll be one of the first to know when enrollment opens — no need to do anything else.
            </p>
          </td>
        </tr>

        ${divider}

        <tr>
          <td align="left" style="padding-top:4px;">
            <a href="${launchHref}" class="cta" style="display:inline-block;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;font-weight:700;color:#000000;text-decoration:none;background-color:#4ade80;padding:13px 24px;border-radius:9999px;">
              Visit the Academy →
            </a>
          </td>
        </tr>
      </table>`;

    try {
        const result = await getResend().emails.send({
            from: FROM_EMAIL,
            to,
            subject: `You're on the Academy waitlist`,
            html: emailShell(body),
        });
        console.log(`Academy waitlist confirmation email sent to ${to}:`, result.data?.id);
        return result;
    } catch (err) {
        console.error(`Failed to send waitlist confirmation email to ${to}:`, err);
        throw err;
    }
}

export interface AcademyAnnouncementOptions {
    to: string;
    name: string;
    launchDateLabel: string;
    launchHref: string;
    timeLeft: AcademyTimeLeft;
}

export async function sendAcademyAnnouncementEmail(opts: AcademyAnnouncementOptions) {
    const { to, name, launchDateLabel, launchHref, timeLeft } = opts;
    const displayName = name?.split(' ')[0] || 'there';

    const body = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding-bottom:8px;">
            <h1 class="text-heading" style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',Helvetica,Arial,sans-serif;font-size:26px;font-weight:700;color:#09090b;letter-spacing:-0.4px;line-height:1.3;">
              The Evergreeners Academy is coming, ${displayName}.
            </h1>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:4px;">
            <p class="text-body" style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;color:#52525b;line-height:1.75;">
              On <strong style="color:#09090b;">${launchDateLabel}</strong> we open a 4-week, hands-on Git &amp; Open Source course. You'll practice with interactive git labs, ship a real open-source pull request, and earn a verifiable certificate — all free.
            </p>
          </td>
        </tr>

        ${divider}

        <!-- Live countdown (static preview — interactive timer lives on evergreeners.dev/academy) -->
        <tr>
          <td style="padding-bottom:12px;">
            <p class="text-muted" style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:11px;color:#a1a1aa;letter-spacing:0.12em;text-transform:uppercase;font-weight:700;">The Academy opens in</p>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:24px;">
            ${academyCountdownTable(timeLeft)}
          </td>
        </tr>

        <tr>
          <td style="padding-bottom:8px;">
            <p class="text-body" style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;color:#52525b;line-height:1.75;">
              A live countdown is ticking on the Academy page — follow your progress, audit your GitHub profile, and be first in line when doors open.
            </p>
          </td>
        </tr>

        ${divider}

        <tr>
          <td align="left" style="padding-top:4px;">
            <a href="${launchHref}" class="cta" style="display:inline-block;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;font-weight:700;color:#000000;text-decoration:none;background-color:#4ade80;padding:13px 24px;border-radius:9999px;">
              Visit the Academy →
            </a>
          </td>
        </tr>
      </table>`;

    try {
        const result = await getResend().emails.send({
            from: FROM_EMAIL,
            to,
            subject: `The Evergreeners Academy opens ${launchDateLabel}`,
            html: emailShell(body),
        });
        console.log(`Academy announcement email sent to ${to}:`, result.data?.id);
        return result;
    } catch (err) {
        console.error(`Failed to send academy announcement email to ${to}:`, err);
        throw err;
    }
}

export interface AcademyNudgeOptions {
    to: string;
    name: string;
    lessonsCompleted: number;
    totalLessons: number;
    daysInactive: number;
    dashboardHref: string;
}

export async function sendAcademyNudgeEmail(opts: AcademyNudgeOptions) {
    const { to, name, lessonsCompleted, totalLessons, daysInactive, dashboardHref } = opts;
    const displayName = name?.split(' ')[0] || 'there';
    const percent = totalLessons > 0 ? Math.round((lessonsCompleted / totalLessons) * 100) : 0;

    const body = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding-bottom:8px;">
            <h1 class="text-heading" style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',Helvetica,Arial,sans-serif;font-size:26px;font-weight:700;color:#09090b;letter-spacing:-0.4px;line-height:1.3;">
              Your Academy lessons are waiting, ${displayName}.
            </h1>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:4px;">
            <p class="text-body" style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;color:#52525b;line-height:1.75;">
              It's been <strong style="color:#09090b;">${daysInactive} days</strong> since your last lesson. You're <strong style="color:#09090b;">${lessonsCompleted} of ${totalLessons}</strong> lessons in (${percent}%).
            </p>
          </td>
        </tr>

        ${divider}

        <tr>
          <td align="left" style="padding-top:4px;">
            <a href="${dashboardHref}" class="cta" style="display:inline-block;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;font-weight:700;color:#000000;text-decoration:none;background-color:#4ade80;padding:13px 24px;border-radius:9999px;">
              Continue Your Lessons →
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding-top:16px;">
            <p class="text-muted" style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12px;color:#a1a1aa;line-height:1.6;">
              A new lesson unlocks every day you stay enrolled. One merged external PR at the end earns your certificate.
            </p>
          </td>
        </tr>
      </table>`;

    try {
        const result = await getResend().emails.send({
            from: FROM_EMAIL,
            to,
            subject: `${lessonsCompleted}/${totalLessons} lessons done — keep the streak going, ${displayName}`,
            html: emailShell(body),
        });
        console.log(`Academy nudge email sent to ${to}:`, result.data?.id);
        return result;
    } catch (err) {
        console.error(`Failed to send academy nudge email to ${to}:`, err);
        throw err;
    }
}

export interface AcademyGraduationOptions {
    to: string;
    name: string;
    username: string;
    certId: string;
    prUrl: string;
    reviewScore?: number | null;
    verifyHref: string;
}

export async function sendAcademyGraduationEmail(opts: AcademyGraduationOptions) {
    const { to, name, username, certId, prUrl, reviewScore, verifyHref } = opts;
    const displayName = name?.split(' ')[0] || 'there';

    const reviewLine = reviewScore != null
        ? `AI maintainer review: <strong style="color:#09090b;">${reviewScore}/10</strong>.`
        : '';

    const body = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding-bottom:8px;">
            <h1 class="text-heading" style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',Helvetica,Arial,sans-serif;font-size:26px;font-weight:700;color:#09090b;letter-spacing:-0.4px;line-height:1.3;">
              You did it, ${displayName}. You're an Academy graduate. 🎓
            </h1>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:4px;">
            <p class="text-body" style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;color:#52525b;line-height:1.75;">
              Your capstone pull request was verified and merged into an external repository:
              <a href="${prUrl}" style="color:#059669;text-decoration:underline;">${prUrl.replace('https://github.com/', '')}</a>.
              You've completed the full 4-week Git, GitHub &amp; Open Source program.${reviewLine ? ' ' + reviewLine : ''}
            </p>
          </td>
        </tr>

        ${divider}

        <tr>
          <td align="left" style="padding-top:4px;">
            <a href="${verifyHref}" class="cta" style="display:inline-block;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;font-weight:700;color:#000000;text-decoration:none;background-color:#4ade80;padding:13px 24px;border-radius:9999px;">
              View & Share Your Certificate →
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding-top:16px;">
            <p class="text-muted" style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12px;color:#a1a1aa;line-height:1.6;">
              Certificate ID: <span style="font-family:ui-monospace,monospace;color:#52525b;">${certId}</span> — verifiable anytime at ${
                (process.env.APP_URL || 'https://evergreeners.dev') + '/academy/verify/' + certId
              }
            </p>
          </td>
        </tr>
      </table>`;

    try {
        const result = await getResend().emails.send({
            from: FROM_EMAIL,
            to,
            subject: `🎓 You're an Evergreeners Academy graduate, ${displayName}!`,
            html: emailShell(body),
        });
        console.log(`Academy graduation email sent to ${to}:`, result.data?.id);
        return result;
    } catch (err) {
        console.error(`Failed to send academy graduation email to ${to}:`, err);
        throw err;
    }
}

// ─── Daily Digest Email ───────────────────────────────────────────────────────
// Sent every day at 8 PM regardless of commit status.
// Two modes:
//   - Committed today  → celebration / summary card
//   - No commits today → streak-at-risk warning

export interface DailyAcademyInfo {
    isEnrolled: boolean;
    lessonsCompleted?: number;
    totalLessons?: number;
    lockedUntil?: number | null; // days until next lesson unlocks; null = lessons available now
    daysToLaunch: number;
    launchDateLabel: string;
    timeLeft: AcademyTimeLeft;
    href: string;
}

export interface DailyDigestOptions {
    to: string;
    name: string;
    username: string;
    streak: number;
    todayCommits: number;
    totalCommits: number;
    weeklyCommits: number;
    eyeInsight?: string | null;
    academy?: DailyAcademyInfo | null;
}

function formatMarkdownToHtml(md: string): string {
    return md
        .replace(/\r?\n/g, '<br/>')
        .replace(/## 🧠 (.*?)<br\/>/g, '<p style="margin:20px 0 8px;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Helvetica,Arial,sans-serif;font-size:16px;font-weight:700;color:#10b981;">🧠 $1</p>')
        .replace(/## 🔥 (.*?)<br\/>/g, '<p style="margin:20px 0 8px;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Helvetica,Arial,sans-serif;font-size:16px;font-weight:700;color:#ef4444;">🔥 $1</p>')
        .replace(/## 📊 (.*?)<br\/>/g, '<p style="margin:20px 0 8px;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Helvetica,Arial,sans-serif;font-size:16px;font-weight:700;color:#3b82f6;">📊 $1</p>')
        .replace(/## ⚡ (.*?)<br\/>/g, '<p style="margin:20px 0 8px;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Helvetica,Arial,sans-serif;font-size:16px;font-weight:700;color:#a855f7;">⚡ $1</p>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/- (.*?)<br\/>/g, '<div style="margin-bottom:6px;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Helvetica,Arial,sans-serif;font-size:14px;color:#52525b;line-height:1.6;">• $1</div>')
        .replace(/• (.*?)<br\/>/g, '• $1<br/>');
}

export async function sendDailyDigestEmail(opts: DailyDigestOptions) {
    const { to, name, username, streak, todayCommits, totalCommits, weeklyCommits, eyeInsight, academy } = opts;
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
        <!-- Warning note + time-until-midnight countdown (only shown when no commits) -->
        <tr>
          <td style="padding-bottom:12px;">
            <p class="text-muted" style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;color:#71717a;line-height:1.75;">
              Push something small — a fix, a note, a doc update. The day resets at midnight:
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:24px;">${midnightCountdownTable()}</td>
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

        <!-- The Eye AI Insight Block (Sunday only) -->
        ${eyeInsight ? `
        ${divider}
        <tr>
          <td class="stat-box" style="padding:24px;background-color:#fafafa;border:1px solid #e4e4e7;border-radius:12px;">
            <p class="stat-label" style="margin:0 0 12px;font-family:ui-monospace,'SF Mono',monospace;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#10b981;">
              👁️ THE EYE: WEEKLY INTEL REPORT
            </p>
            <div class="text-body" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;color:#52525b;line-height:1.7;">
              ${formatMarkdownToHtml(eyeInsight)}
            </div>
          </td>
        </tr>` : ''}

        <!-- Academy block (enrolled students: progress; everyone: launch countdown).
             Skipped for the streak-at-risk digest so the midnight countdown stays the focus. -->
        ${academy && committed ? `
        ${divider}
        <tr>
          <td class="stat-box" style="padding:24px;background-color:#fafafa;border:1px solid #e4e4e7;border-radius:12px;">
            <p class="stat-label" style="margin:0 0 12px;font-family:ui-monospace,'SF Mono',monospace;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#10b981;">
              🎓 EVERGREENERS ACADEMY
            </p>

            ${academy.isEnrolled ? `
            <p class="text-body" style="margin:0 0 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;color:#52525b;line-height:1.75;">
              Course progress: <strong style="color:#09090b;">${academy.lessonsCompleted ?? 0} of ${academy.totalLessons ?? 12}</strong> lessons
              · ${
                (academy.lessonsCompleted ?? 0) >= (academy.totalLessons ?? 12)
                  ? 'all lessons complete — time for the capstone PR!'
                  : academy.lockedUntil && Number(academy.lockedUntil) > 0
                  ? `next lesson unlocks in <strong style="color:#09090b;">${academy.lockedUntil} day${Number(academy.lockedUntil) === 1 ? '' : 's'}</strong>`
                  : 'lessons are unlocked — keep going'
              }
            </p>
            <p style="margin:0 0 16px;">
              <a href="${academy.href}" class="cta" style="display:inline-block;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;font-weight:700;color:#000000;text-decoration:none;background-color:#4ade80;padding:13px 24px;border-radius:9999px;">
                Continue Your Lessons →
              </a>
            </p>
            ` : `
            <p class="text-body" style="margin:0 0 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;color:#52525b;line-height:1.75;">
              Admission opens <strong style="color:#09090b;">${academy.launchDateLabel}</strong> — ${academy.daysToLaunch} days away. Complete the lessons and earn a verifiable certificate.
            </p>
            <p style="margin:0 0 16px;">${academyCountdownTable(academy.timeLeft)}</p>
            <p style="margin:0;">
              <a href="${academy.href}" class="cta" style="display:inline-block;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;font-weight:700;color:#000000;text-decoration:none;background-color:#4ade80;padding:13px 24px;border-radius:9999px;">
                Visit the Academy →
              </a>
            </p>
            `}
          </td>
        </tr>` : ''}

      </table>`;

    try {
        const result = await getResend().emails.send({
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

// ─── Streak Broken Email ──────────────────────────────────────────────────────
// Sent once when a user's streak drops to 0. After this, their email
// notifications are disabled until they opt back in from Settings.

export interface StreakBrokenEmailOptions {
    to: string;
    name: string;
    username: string;
    previousStreak: number; // How many days they had
}

export async function sendStreakBrokenEmail(opts: StreakBrokenEmailOptions) {
    const { to, name, username, previousStreak } = opts;
    const displayName = name?.split(' ')[0] || username || 'there';

    const subject = previousStreak >= 7
        ? `Your ${previousStreak}-day streak ended — here's what's next`
        : `Streak ended — no worries, ${displayName}`;

    const heading = previousStreak >= 30
        ? `${previousStreak} days. That's real.`
        : previousStreak >= 7
            ? `Your ${previousStreak}-day streak ended.`
            : `Streak broken, ${displayName}.`;

    const bodyText = previousStreak >= 30
        ? `You built a ${previousStreak}-day streak. That's not nothing — that's discipline. Today didn't go as planned, but the foundation you built doesn't disappear. Start fresh tomorrow.`
        : previousStreak >= 7
            ? `A ${previousStreak}-day streak is something to be proud of. Take a breath, and restart tomorrow. The leaderboard will be waiting.`
            : `Missing a day happens. What matters is what you do next. Open GitHub tomorrow and start a new streak.`;

    const body = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding-bottom:8px;">
            <h1 class="text-heading" style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',Helvetica,Arial,sans-serif;font-size:26px;font-weight:700;color:#09090b;letter-spacing:-0.4px;line-height:1.3;">
              ${heading}
            </h1>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:4px;">
            <p class="text-body" style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;color:#52525b;line-height:1.75;">
              ${bodyText}
            </p>
          </td>
        </tr>

        ${divider}

        <!-- Stat box: previous streak -->
        <tr>
          <td style="padding-bottom:24px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td class="stat-box" style="padding:16px 24px;background-color:#fafafa;border:1px solid #e4e4e7;border-radius:8px;">
                  <p class="stat-label" style="margin:0 0 4px;font-family:ui-monospace,'SF Mono',monospace;font-size:10px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#a1a1aa;">Previous streak</p>
                  <p style="margin:0;font-family:ui-monospace,'SF Mono','Fira Code',monospace;font-size:28px;font-weight:700;line-height:1;color:#10b981;">
                    ${previousStreak}<span class="stat-unit" style="font-size:12px;font-weight:400;color:#a1a1aa;margin-left:3px;">days</span>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding-bottom:20px;">
            <p class="text-muted" style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;color:#71717a;line-height:1.75;">
              We've paused your daily streak reminders. When you're ready to start tracking again, re-enable them in your
              <a href="${APP_URL}/settings" style="color:#10b981;text-decoration:underline;">Settings</a>.
            </p>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="background-color:#09090b;border-radius:7px;">
                  <a href="${APP_URL}/dashboard" style="display:inline-block;padding:11px 22px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:-0.1px;">
                    Back to dashboard
                  </a>
                </td>
                <td style="padding-left:20px;">
                  <a href="https://github.com/${username}" class="cta-secondary" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;color:#71717a;text-decoration:none;">
                    Open GitHub &rarr;
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>`;

    try {
        const result = await getResend().emails.send({
            from: FROM_EMAIL,
            to,
            subject,
            html: emailShell(body),
        });
        console.log(`Streak broken email sent to ${to}:`, result.data?.id);
        return result;
    } catch (err) {
        console.error(`Failed to send streak broken email to ${to}:`, err);
        throw err;
    }
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
        const result = await getResend().emails.send({
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
        const result = await getResend().emails.send({
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
        const result = await getResend().emails.send({
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

// ─── Badge Awarded Email ───────────────────────────────────────────────────────
export interface BadgeAwardedEmailOptions {
    to: string;
    name: string;
    badgeName: string;
    badgeDescription: string;
    badgeRarity: string;
}

export async function sendBadgeAwardedEmail(opts: BadgeAwardedEmailOptions) {
    const { to, name, badgeName, badgeDescription, badgeRarity } = opts;
    const displayName = name?.split(' ')[0] || 'there';

    const subject = `You've earned a new badge: ${badgeName}! 🏆`;
    
    // Rarity colors mirroring the UI
    const rarityColors: Record<string, string> = {
        'common': '#A1A1AA',
        'rare': '#3B82F6',
        'epic': '#A855F7',
        'legendary': '#EAB308'
    };
    const color = rarityColors[badgeRarity.toLowerCase()] || '#10b981';

    const body = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding-bottom:12px;">
             <span style="display:inline-block;padding:4px 10px;border-radius:12px;background-color:#fafafa;border:1px solid ${color}40;font-family:ui-monospace,'SF Mono',monospace;font-size:11px;font-weight:700;color:${color};letter-spacing:0.05em;text-transform:uppercase;">
              ${badgeRarity} Achievement
            </span>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:12px;">
            <h1 class="text-heading" style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',Helvetica,Arial,sans-serif;font-size:26px;font-weight:700;color:#09090b;letter-spacing:-0.4px;line-height:1.3;">
              Nice work, ${displayName}.
            </h1>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:20px;">
            <p class="text-body" style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;color:#52525b;line-height:1.75;">
              You've officially unlocked the <strong>${badgeName}</strong> badge on Evergreeners.
            </p>
          </td>
        </tr>

        <tr>
          <td class="stat-box" style="padding:24px;background-color:#fafafa;border:1px solid #e4e4e7;border-radius:12px;text-align:center;">
             <div style="font-size:48px;margin-bottom:16px;">🏆</div>
             <h2 style="margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:20px;font-weight:700;color:#09090b;">${badgeName}</h2>
             <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;color:#71717a;line-height:1.5;">${badgeDescription}</p>
          </td>
        </tr>

        ${divider}

        <tr>
          <td style="padding-bottom:20px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="background-color:#10b981;border-radius:7px;">
                  <a href="${APP_URL}/profile" style="display:inline-block;padding:11px 22px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:-0.1px;">
                    View Badge Wall
                  </a>
                </td>
                <td style="padding-left:20px;">
                  <a href="${APP_URL}/profile" class="cta-secondary" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;color:#71717a;text-decoration:none;">
                    View Profile &rarr;
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>`;

    try {
        const result = await getResend().emails.send({
            from: FROM_EMAIL,
            to,
            subject,
            html: emailShell(body),
        });
        console.log(`Badge award email sent to ${to} for [${badgeName}]:`, result.data?.id);
        return result;
    } catch (err) {
        console.error(`Failed to send badge email to ${to}:`, err);
    }
}
