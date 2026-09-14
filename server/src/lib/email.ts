import { Resend } from 'resend';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getResend = () => new Resend(process.env.RESEND_API_KEY);

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
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&display=swap" rel="stylesheet" />
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&display=swap');
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

          <!-- Logo & Caveat Font Header -->
          <tr>
            <td style="padding-bottom:20px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td valign="middle" style="padding-right:10px;line-height:0;">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;">
                      <rect x="2" y="2" width="2.5" height="2.5" rx="0.5" fill="#14532d" />
                      <rect x="5.5" y="2" width="2.5" height="2.5" rx="0.5" fill="#166534" />
                      <rect x="9" y="2" width="2.5" height="2.5" rx="0.5" fill="#22c55e" />
                      <rect x="12.5" y="2" width="2.5" height="2.5" rx="0.5" fill="#4ade80" />
                      <rect x="16" y="2" width="2.5" height="2.5" rx="0.5" fill="#22c55e" />
                      <rect x="19.5" y="2" width="2.5" height="2.5" rx="0.5" fill="#14532d" />
                      <rect x="2" y="5.5" width="2.5" height="2.5" rx="0.5" fill="#166534" />
                      <rect x="5.5" y="5.5" width="2.5" height="2.5" rx="0.5" fill="#4ade80" />
                      <rect x="9" y="5.5" width="2.5" height="2.5" rx="0.5" fill="#86efac" />
                      <rect x="12.5" y="5.5" width="2.5" height="2.5" rx="0.5" fill="#22c55e" />
                      <rect x="16" y="5.5" width="2.5" height="2.5" rx="0.5" fill="#15803d" />
                      <rect x="19.5" y="5.5" width="2.5" height="2.5" rx="0.5" fill="#166534" />
                      <rect x="2" y="9" width="2.5" height="2.5" rx="0.5" fill="#22c55e" />
                      <rect x="5.5" y="9" width="2.5" height="2.5" rx="0.5" fill="#86efac" />
                      <rect x="9" y="9" width="2.5" height="2.5" rx="0.5" fill="#bbf7d0" />
                      <rect x="12.5" y="9" width="2.5" height="2.5" rx="0.5" fill="#4ade80" />
                      <rect x="16" y="9" width="2.5" height="2.5" rx="0.5" fill="#22c55e" />
                      <rect x="19.5" y="9" width="2.5" height="2.5" rx="0.5" fill="#15803d" />
                      <rect x="2" y="12.5" width="2.5" height="2.5" rx="0.5" fill="#4ade80" />
                      <rect x="5.5" y="12.5" width="2.5" height="2.5" rx="0.5" fill="#22c55e" />
                      <rect x="9" y="12.5" width="2.5" height="2.5" rx="0.5" fill="#4ade80" />
                      <rect x="12.5" y="12.5" width="2.5" height="2.5" rx="0.5" fill="#22c55e" />
                      <rect x="16" y="12.5" width="2.5" height="2.5" rx="0.5" fill="#4ade80" />
                      <rect x="19.5" y="12.5" width="2.5" height="2.5" rx="0.5" fill="#22c55e" />
                      <rect x="2" y="16" width="2.5" height="2.5" rx="0.5" fill="#22c55e" />
                      <rect x="5.5" y="16" width="2.5" height="2.5" rx="0.5" fill="#15803d" />
                      <rect x="9" y="16" width="2.5" height="2.5" rx="0.5" fill="#22c55e" />
                      <rect x="12.5" y="16" width="2.5" height="2.5" rx="0.5" fill="#166534" />
                      <rect x="16" y="16" width="2.5" height="2.5" rx="0.5" fill="#22c55e" />
                      <rect x="19.5" y="16" width="2.5" height="2.5" rx="0.5" fill="#15803d" />
                      <rect x="2" y="19.5" width="2.5" height="2.5" rx="0.5" fill="#14532d" />
                      <rect x="5.5" y="19.5" width="2.5" height="2.5" rx="0.5" fill="#166534" />
                      <rect x="9" y="19.5" width="2.5" height="2.5" rx="0.5" fill="#15803d" />
                      <rect x="12.5" y="19.5" width="2.5" height="2.5" rx="0.5" fill="#14532d" />
                      <rect x="16" y="19.5" width="2.5" height="2.5" rx="0.5" fill="#166534" />
                      <rect x="19.5" y="19.5" width="2.5" height="2.5" rx="0.5" fill="#14532d" />
                    </svg>
                  </td>
                  <td valign="middle">
                    <span style="font-family:'Caveat',cursive,'Segoe Print','Bradley Hand',sans-serif;font-size:28px;font-weight:700;color:#10b981;line-height:1;display:inline-block;letter-spacing:-0.5px;">Evergreeners</span>
                  </td>
                </tr>
              </table>
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

// ─── Programmer's Day (Day 256) Special Edition Email ────────────────────────
export function generateGithub256GridHtml(): string {
    const d2 = [
        [1, 1, 1, 1],
        [0, 0, 0, 1],
        [0, 0, 0, 1],
        [1, 1, 1, 1],
        [1, 0, 0, 0],
        [1, 0, 0, 0],
        [1, 1, 1, 1],
    ];
    const d5 = [
        [1, 1, 1, 1],
        [1, 0, 0, 0],
        [1, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 1],
        [0, 0, 0, 1],
        [1, 1, 1, 1],
    ];
    const d6 = [
        [1, 1, 1, 1],
        [1, 0, 0, 0],
        [1, 0, 0, 0],
        [1, 1, 1, 1],
        [1, 0, 0, 1],
        [1, 0, 0, 1],
        [1, 1, 1, 1],
    ];

    const totalCols = 24;
    const grid: number[][] = Array.from({ length: 7 }, () => Array(totalCols).fill(0));

    // Place 2, 5, 6 with exact 3-column spacing and symmetric flanks
    for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 4; c++) {
            if (d2[r][c]) grid[r][3 + c] = 4;
            if (d5[r][c]) grid[r][10 + c] = 4;
            if (d6[r][c]) grid[r][17 + c] = 4;
        }
    }

    // Faint authentic background activity in the surrounding columns
    const faintCoords: [number, number][] = [
        [0, 0], [1, 1], [3, 0], [5, 1], [6, 0],
        [0, 8], [2, 7], [4, 9], [6, 8],
        [1, 14], [3, 15], [5, 16],
        [0, 22], [2, 21], [3, 23], [5, 22], [6, 23]
    ];
    for (const [r, c] of faintCoords) {
        if (grid[r][c] === 0) grid[r][c] = (r + c) % 2 === 0 ? 2 : 1;
    }

    const getCellColor = (val: number) => {
        switch (val) {
            case 4: return '#39d353'; // Vibrant neon emerald for "256"
            case 2: return '#006d32'; // Medium green
            case 1: return '#0e4429'; // Subtle green
            default: return '#161b22'; // Dark GitHub empty cell
        }
    };

    const getCellBorder = (val: number) => {
        if (val === 4) return '1px solid rgba(255,255,255,0.25)';
        if (val > 0) return '1px solid rgba(0,0,0,0.3)';
        return '1px solid #21262d';
    };

    let rowsHtml = '';
    for (let r = 0; r < 7; r++) {
        const showLabel = r === 1 ? 'Mon' : r === 3 ? 'Wed' : r === 5 ? 'Fri' : '';
        let cellsHtml = '';
        for (let c = 0; c < totalCols; c++) {
            const val = grid[r][c];
            const color = getCellColor(val);
            const border = getCellBorder(val);
            const glow = val === 4 ? 'box-shadow:0 0 3px rgba(57,211,83,0.6);' : '';
            cellsHtml += `
              <td style="padding:1.5px 1.5px;">
                <div style="width:10px;height:10px;min-width:10px;min-height:10px;background-color:${color};border:${border};border-radius:2px;${glow}font-size:0;line-height:0;">&nbsp;</div>
              </td>`;
        }

        rowsHtml += `
          <tr>
            <td align="left" style="padding-right:8px;font-family:ui-monospace,'SF Mono','Fira Code',monospace;font-size:9px;color:#7d8590;line-height:1;width:24px;">
              ${showLabel}
            </td>
            ${cellsHtml}
          </tr>`;
    }

    return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0d1117;border:1px solid #30363d;border-radius:10px;overflow:hidden;margin:28px 0 24px;">
        <!-- Card Header -->
        <tr>
          <td style="padding:14px 18px 10px;border-bottom:1px solid #21262d;background-color:#090d13;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="left">
                  <span style="font-family:ui-monospace,'SF Mono','Fira Code',monospace;font-size:12px;font-weight:600;color:#58a6ff;">● git://evergreeners/day-256</span>
                </td>
                <td align="right">
                  <span style="font-family:ui-monospace,'SF Mono','Fira Code',monospace;font-size:11px;font-weight:600;color:#7d8590;">2⁸ = 256 bytes · 0x100</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Month Bar -->
        <tr>
          <td align="center" style="padding:14px 12px 0;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="width:24px;padding-right:8px;">&nbsp;</td>
                <td align="left" style="font-family:ui-monospace,'SF Mono',monospace;font-size:9px;color:#7d8590;letter-spacing:0.05em;padding-bottom:6px;">
                  <span style="display:inline-block;width:60px;">JAN</span>
                  <span style="display:inline-block;width:60px;">MAR</span>
                  <span style="display:inline-block;width:60px;">MAY</span>
                  <span style="display:inline-block;width:60px;">JUL</span>
                  <span style="color:#39d353;font-weight:700;">SEP 13 (DAY 256)</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Heatmap Grid -->
        <tr>
          <td align="center" style="padding:4px 12px 14px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;">
              ${rowsHtml}
            </table>
          </td>
        </tr>

        <!-- Card Footer / Legend -->
        <tr>
          <td style="padding:10px 18px 12px;border-top:1px solid #21262d;background-color:#090d13;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="left">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="font-family:ui-monospace,'SF Mono',monospace;font-size:10px;color:#7d8590;padding-right:5px;line-height:1;">Less</td>
                      <td style="padding:1px;"><div style="width:9px;height:9px;border-radius:2px;background-color:#161b22;border:1px solid #21262d;font-size:0;line-height:0;">&nbsp;</div></td>
                      <td style="padding:1px;"><div style="width:9px;height:9px;border-radius:2px;background-color:#0e4429;font-size:0;line-height:0;">&nbsp;</div></td>
                      <td style="padding:1px;"><div style="width:9px;height:9px;border-radius:2px;background-color:#006d32;font-size:0;line-height:0;">&nbsp;</div></td>
                      <td style="padding:1px;"><div style="width:9px;height:9px;border-radius:2px;background-color:#26a641;font-size:0;line-height:0;">&nbsp;</div></td>
                      <td style="padding:1px;"><div style="width:9px;height:9px;border-radius:2px;background-color:#39d353;box-shadow:0 0 3px rgba(57,211,83,0.6);font-size:0;line-height:0;">&nbsp;</div></td>
                      <td style="font-family:ui-monospace,'SF Mono',monospace;font-size:10px;color:#7d8590;padding-left:5px;line-height:1;">More</td>
                    </tr>
                  </table>
                </td>
                <td align="right">
                  <span style="font-family:ui-monospace,'SF Mono',monospace;font-size:11px;font-weight:600;color:#39d353;">256 commits to the craft</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>`;
}

export interface CommitGridRenderOptions {
    enabled?: boolean;
    text?: string;
    repoTag?: string;
    subBadge?: string;
    footerNote?: string;
    position?: 'top' | 'middle' | 'bottom';
}

export interface CustomBroadcastImageOptions {
    enabled?: boolean;
    url?: string;
    alt?: string;
    caption?: string;
    linkUrl?: string;
    position?: 'top' | 'middle' | 'bottom';
    dataUrl?: string;
}

export function generateCustomImageHtml(options: CustomBroadcastImageOptions = {}, imageSrcOverride?: string): string {
    if (!options.enabled) return '';
    const resolvedSrc = imageSrcOverride || options.url || options.dataUrl;
    if (!resolvedSrc) return '';
    const { alt, caption, linkUrl } = options;

    const imgTag = `
      <img src="${resolvedSrc}" alt="${alt || 'Evergreeners Announcement'}" width="520" style="width:100%;max-width:520px;height:auto;border-radius:10px;border:1px solid #27272a;display:block;margin:0 auto;" />
    `;

    const linkedImg = linkUrl ? `
      <a href="${linkUrl}" target="_blank" style="text-decoration:none;display:block;">
        ${imgTag}
      </a>
    ` : imgTag;

    const captionHtml = caption ? `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12px;color:#71717a;text-align:center;margin-top:6px;line-height:1.4;">
        ${caption}
      </div>
    ` : '';

    return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0 18px;">
        <tr>
          <td align="center">
            ${linkedImg}
            ${captionHtml}
          </td>
        </tr>
      </table>`;
}

const BITMAP_FONT_7X4_SERVER: Record<string, number[][]> = {
    '0': [[1,1,1,1],[1,0,0,1],[1,0,0,1],[1,0,0,1],[1,0,0,1],[1,0,0,1],[1,1,1,1]],
    '1': [[0,1],[1,1],[0,1],[0,1],[0,1],[0,1],[1,1]],
    '2': [[1,1,1,1],[0,0,0,1],[0,0,0,1],[1,1,1,1],[1,0,0,0],[1,0,0,0],[1,1,1,1]],
    '3': [[1,1,1,1],[0,0,0,1],[0,0,0,1],[1,1,1,1],[0,0,0,1],[0,0,0,1],[1,1,1,1]],
    '4': [[1,0,0,1],[1,0,0,1],[1,0,0,1],[1,1,1,1],[0,0,0,1],[0,0,0,1],[0,0,0,1]],
    '5': [[1,1,1,1],[1,0,0,0],[1,0,0,0],[1,1,1,1],[0,0,0,1],[0,0,0,1],[1,1,1,1]],
    '6': [[1,1,1,1],[1,0,0,0],[1,0,0,0],[1,1,1,1],[1,0,0,1],[1,0,0,1],[1,1,1,1]],
    '7': [[1,1,1,1],[0,0,0,1],[0,0,0,1],[0,0,1,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]],
    '8': [[1,1,1,1],[1,0,0,1],[1,0,0,1],[1,1,1,1],[1,0,0,1],[1,0,0,1],[1,1,1,1]],
    '9': [[1,1,1,1],[1,0,0,1],[1,0,0,1],[1,1,1,1],[0,0,0,1],[0,0,0,1],[1,1,1,1]],
    'A': [[0,1,1,0],[1,0,0,1],[1,0,0,1],[1,1,1,1],[1,0,0,1],[1,0,0,1],[1,0,0,1]],
    'B': [[1,1,1,0],[1,0,0,1],[1,0,0,1],[1,1,1,0],[1,0,0,1],[1,0,0,1],[1,1,1,0]],
    'C': [[1,1,1,1],[1,0,0,0],[1,0,0,0],[1,0,0,0],[1,0,0,0],[1,0,0,0],[1,1,1,1]],
    'D': [[1,1,1,0],[1,0,0,1],[1,0,0,1],[1,0,0,1],[1,0,0,1],[1,0,0,1],[1,1,1,0]],
    'E': [[1,1,1,1],[1,0,0,0],[1,0,0,0],[1,1,1,0],[1,0,0,0],[1,0,0,0],[1,1,1,1]],
    'F': [[1,1,1,1],[1,0,0,0],[1,0,0,0],[1,1,1,0],[1,0,0,0],[1,0,0,0],[1,0,0,0]],
    'G': [[1,1,1,1],[1,0,0,0],[1,0,0,0],[1,0,1,1],[1,0,0,1],[1,0,0,1],[1,1,1,1]],
    'H': [[1,0,0,1],[1,0,0,1],[1,0,0,1],[1,1,1,1],[1,0,0,1],[1,0,0,1],[1,0,0,1]],
    'I': [[1,1,1],[0,1,0],[0,1,0],[0,1,0],[0,1,0],[0,1,0],[1,1,1]],
    'L': [[1,0,0],[1,0,0],[1,0,0],[1,0,0],[1,0,0],[1,0,0],[1,1,1]],
    'M': [[1,0,0,0,1],[1,1,0,1,1],[1,0,1,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1]],
    'N': [[1,0,0,1],[1,1,0,1],[1,0,1,1],[1,0,0,1],[1,0,0,1],[1,0,0,1],[1,0,0,1]],
    'O': [[1,1,1,1],[1,0,0,1],[1,0,0,1],[1,0,0,1],[1,0,0,1],[1,0,0,1],[1,1,1,1]],
    'P': [[1,1,1,1],[1,0,0,1],[1,0,0,1],[1,1,1,1],[1,0,0,0],[1,0,0,0],[1,0,0,0]],
    'R': [[1,1,1,0],[1,0,0,1],[1,0,0,1],[1,1,1,0],[1,0,1,0],[1,0,0,1],[1,0,0,1]],
    'S': [[1,1,1,1],[1,0,0,0],[1,0,0,0],[1,1,1,1],[0,0,0,1],[0,0,0,1],[1,1,1,1]],
    'T': [[1,1,1],[0,1,0],[0,1,0],[0,1,0],[0,1,0],[0,1,0],[0,1,0]],
    'U': [[1,0,0,1],[1,0,0,1],[1,0,0,1],[1,0,0,1],[1,0,0,1],[1,0,0,1],[1,1,1,1]],
    'W': [[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,1,0,1],[1,0,1,0,1],[1,1,0,1,1],[1,0,0,0,1]],
    'Y': [[1,0,1],[1,0,1],[0,1,0],[0,1,0],[0,1,0],[0,1,0],[0,1,0]],
    '!': [[1],[1],[1],[1],[1],[0],[1]],
    ' ': [[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],
};

export function generatePixelCommitGridHtml(options: CommitGridRenderOptions = {}): string {
    const rawText = (options.text || '256').trim().toUpperCase();
    const repoTag = options.repoTag || (rawText === '256' ? '● git://evergreeners/day-256' : `● git://evergreeners/${rawText.toLowerCase()}`);
    const subBadge = options.subBadge || (rawText === '256' ? '2⁸ = 256 bytes · 0x100' : 'consistency matrix');
    const footerNote = options.footerNote || (rawText === '256' ? '256 commits to the craft' : `${rawText} · compounding momentum`);

    const totalCols = 24;
    const grid: number[][] = Array.from({ length: 7 }, () => Array(totalCols).fill(0));

    if (rawText === '256') {
        const d2 = BITMAP_FONT_7X4_SERVER['2'];
        const d5 = BITMAP_FONT_7X4_SERVER['5'];
        const d6 = BITMAP_FONT_7X4_SERVER['6'];

        for (let r = 0; r < 7; r++) {
            for (let c = 0; c < 4; c++) {
                if (d2[r][c]) grid[r][3 + c] = 4;
                if (d5[r][c]) grid[r][10 + c] = 4;
                if (d6[r][c]) grid[r][17 + c] = 4;
            }
        }

        const faintCoords: [number, number][] = [
            [0, 0], [1, 1], [3, 0], [5, 1], [6, 0],
            [0, 8], [2, 7], [4, 9], [6, 8],
            [1, 14], [3, 15], [5, 16],
            [0, 22], [2, 21], [3, 23], [5, 22], [6, 23]
        ];
        for (const [r, c] of faintCoords) {
            if (grid[r][c] === 0) grid[r][c] = (r + c) % 2 === 0 ? 2 : 1;
        }
    } else {
        const glyphs = rawText.split('').map(char => BITMAP_FONT_7X4_SERVER[char] || BITMAP_FONT_7X4_SERVER[' ']);
        const totalGlyphWidth = glyphs.reduce((sum, g) => sum + g[0].length, 0) + Math.max(0, glyphs.length - 1);
        let startCol = Math.max(1, Math.floor((totalCols - totalGlyphWidth) / 2));

        for (const glyph of glyphs) {
            const charWidth = glyph[0].length;
            for (let r = 0; r < 7; r++) {
                for (let c = 0; c < charWidth; c++) {
                    if (startCol + c < totalCols && glyph[r][c]) {
                        grid[r][startCol + c] = 4;
                    }
                }
            }
            startCol += charWidth + 1;
        }

        // Faint authentic background commit activity
        for (let c = 0; c < totalCols; c++) {
            const hasGlyph = grid.some(row => row[c] === 4);
            if (!hasGlyph && (c < 3 || c >= totalCols - 3 || c % 5 === 0)) {
                const r = (c * 3 + 2) % 7;
                if (grid[r][c] === 0) {
                    grid[r][c] = c % 2 === 0 ? 2 : 1;
                }
            }
        }
    }

    const getCellColor = (val: number) => {
        switch (val) {
            case 4: return '#39d353';
            case 2: return '#006d32';
            case 1: return '#0e4429';
            default: return '#161b22';
        }
    };

    const getCellBorder = (val: number) => {
        if (val === 4) return '1px solid rgba(255,255,255,0.25)';
        if (val > 0) return '1px solid rgba(0,0,0,0.3)';
        return '1px solid #21262d';
    };

    let rowsHtml = '';
    for (let r = 0; r < 7; r++) {
        const showLabel = r === 1 ? 'Mon' : r === 3 ? 'Wed' : r === 5 ? 'Fri' : '';
        let cellsHtml = '';
        for (let c = 0; c < totalCols; c++) {
            const val = grid[r][c];
            const color = getCellColor(val);
            const border = getCellBorder(val);
            const glow = val === 4 ? 'box-shadow:0 0 3px rgba(57,211,83,0.6);' : '';
            cellsHtml += `
              <td style="padding:1.5px 1.5px;">
                <div style="width:10px;height:10px;min-width:10px;min-height:10px;background-color:${color};border:${border};border-radius:2px;${glow}font-size:0;line-height:0;">&nbsp;</div>
              </td>`;
        }

        rowsHtml += `
          <tr>
            <td align="left" style="padding-right:8px;font-family:ui-monospace,'SF Mono','Fira Code',monospace;font-size:9px;color:#7d8590;line-height:1;width:24px;">
              ${showLabel}
            </td>
            ${cellsHtml}
          </tr>`;
    }

    return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0d1117;border:1px solid #30363d;border-radius:10px;overflow:hidden;margin:20px 0 20px;">
        <tr>
          <td style="padding:14px 18px 10px;border-bottom:1px solid #21262d;background-color:#090d13;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="left">
                  <span style="font-family:ui-monospace,'SF Mono','Fira Code',monospace;font-size:12px;font-weight:600;color:#58a6ff;">${repoTag}</span>
                </td>
                <td align="right">
                  <span style="font-family:ui-monospace,'SF Mono','Fira Code',monospace;font-size:11px;font-weight:600;color:#7d8590;">${subBadge}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td align="center" style="padding:14px 12px 0;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="width:24px;padding-right:8px;">&nbsp;</td>
                <td align="left" style="font-family:ui-monospace,'SF Mono',monospace;font-size:9px;color:#7d8590;letter-spacing:0.05em;padding-bottom:6px;">
                  <span style="display:inline-block;width:60px;">JAN</span>
                  <span style="display:inline-block;width:60px;">MAR</span>
                  <span style="display:inline-block;width:60px;">MAY</span>
                  <span style="display:inline-block;width:60px;">JUL</span>
                  <span style="color:#39d353;font-weight:700;">SEP 13 (DAY 256)</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td align="center" style="padding:4px 12px 14px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;">
              ${rowsHtml}
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:10px 18px 12px;border-top:1px solid #21262d;background-color:#090d13;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="left">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="font-family:ui-monospace,'SF Mono',monospace;font-size:10px;color:#7d8590;padding-right:5px;line-height:1;">Less</td>
                      <td style="padding:1px;"><div style="width:9px;height:9px;border-radius:2px;background-color:#161b22;border:1px solid #21262d;font-size:0;line-height:0;">&nbsp;</div></td>
                      <td style="padding:1px;"><div style="width:9px;height:9px;border-radius:2px;background-color:#0e4429;font-size:0;line-height:0;">&nbsp;</div></td>
                      <td style="padding:1px;"><div style="width:9px;height:9px;border-radius:2px;background-color:#006d32;font-size:0;line-height:0;">&nbsp;</div></td>
                      <td style="padding:1px;"><div style="width:9px;height:9px;border-radius:2px;background-color:#26a641;font-size:0;line-height:0;">&nbsp;</div></td>
                      <td style="padding:1px;"><div style="width:9px;height:9px;border-radius:2px;background-color:#39d353;box-shadow:0 0 3px rgba(57,211,83,0.6);font-size:0;line-height:0;">&nbsp;</div></td>
                      <td style="font-family:ui-monospace,'SF Mono',monospace;font-size:10px;color:#7d8590;padding-left:5px;line-height:1;">More</td>
                    </tr>
                  </table>
                </td>
                <td align="right">
                  <span style="font-family:ui-monospace,'SF Mono',monospace;font-size:11px;font-weight:600;color:#39d353;">${footerNote}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>`;
}

export interface ProgrammersDayEmailOptions {
    to: string;
    name?: string;
    username?: string;
    streak?: number;
    todayCommits?: number;
    totalCommits?: number;
    weeklyCommits?: number;
    isGithubConnected?: boolean;
}

export function buildProgrammersDayHtml(opts: ProgrammersDayEmailOptions): string {
    const { name, username, streak = 0, todayCommits = 0, totalCommits = 0 } = opts;
    const displayName = name?.split(' ')[0] || username || 'there';
    const committed = todayCommits > 0;
    const gridHtml = generateGithub256GridHtml();

    const divider = `
      <tr>
        <td style="padding:22px 0;">
          <div style="height:1px;background-color:#e4e4e7;font-size:0;line-height:0;">&nbsp;</div>
        </td>
      </tr>`;

    return `
<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>Happy Programmer's Day (Day 256)</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; }
    @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&display=swap');
    @media (prefers-color-scheme: dark) {
      body, .email-bg   { background-color: #09090b !important; }
      .email-card       { background-color: #121214 !important; border-color: #27272a !important; }
      .text-heading     { color: #fafafa !important; }
      .text-body        { color: #a1a1aa !important; }
      .text-body-dark   { color: #d4d4d8 !important; }
      .text-muted       { color: #71717a !important; }
      .divider          { background-color: #27272a !important; }
      .stat-box         { background-color: #18181b !important; border-color: #27272a !important; }
      .stat-label       { color: #71717a !important; }
      .stat-unit        { color: #71717a !important; }
      .footer-link      { color: #71717a !important; }
      .footer-text      { color: #52525b !important; }
    }
  </style>
</head>
<body class="email-bg" style="margin:0;padding:0;background-color:#f4f4f5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td class="email-bg" align="center" style="padding:40px 16px;background-color:#f4f4f5;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">

          <!-- Logo with header Caveat font attached to Evergreeners text only -->
          <tr>
            <td style="padding-bottom:20px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td valign="middle" style="padding-right:10px;line-height:0;">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;">
                      <rect x="2" y="2" width="2.5" height="2.5" rx="0.5" fill="#14532d" />
                      <rect x="5.5" y="2" width="2.5" height="2.5" rx="0.5" fill="#166534" />
                      <rect x="9" y="2" width="2.5" height="2.5" rx="0.5" fill="#22c55e" />
                      <rect x="12.5" y="2" width="2.5" height="2.5" rx="0.5" fill="#4ade80" />
                      <rect x="16" y="2" width="2.5" height="2.5" rx="0.5" fill="#22c55e" />
                      <rect x="19.5" y="2" width="2.5" height="2.5" rx="0.5" fill="#14532d" />

                      <rect x="2" y="5.5" width="2.5" height="2.5" rx="0.5" fill="#166534" />
                      <rect x="5.5" y="5.5" width="2.5" height="2.5" rx="0.5" fill="#4ade80" />
                      <rect x="9" y="5.5" width="2.5" height="2.5" rx="0.5" fill="#86efac" />
                      <rect x="12.5" y="5.5" width="2.5" height="2.5" rx="0.5" fill="#22c55e" />
                      <rect x="16" y="5.5" width="2.5" height="2.5" rx="0.5" fill="#15803d" />
                      <rect x="19.5" y="5.5" width="2.5" height="2.5" rx="0.5" fill="#166534" />

                      <rect x="2" y="9" width="2.5" height="2.5" rx="0.5" fill="#22c55e" />
                      <rect x="5.5" y="9" width="2.5" height="2.5" rx="0.5" fill="#86efac" />
                      <rect x="9" y="9" width="2.5" height="2.5" rx="0.5" fill="#bbf7d0" />
                      <rect x="12.5" y="9" width="2.5" height="2.5" rx="0.5" fill="#4ade80" />
                      <rect x="16" y="9" width="2.5" height="2.5" rx="0.5" fill="#22c55e" />
                      <rect x="19.5" y="9" width="2.5" height="2.5" rx="0.5" fill="#15803d" />

                      <rect x="2" y="12.5" width="2.5" height="2.5" rx="0.5" fill="#4ade80" />
                      <rect x="5.5" y="12.5" width="2.5" height="2.5" rx="0.5" fill="#22c55e" />
                      <rect x="9" y="12.5" width="2.5" height="2.5" rx="0.5" fill="#4ade80" />
                      <rect x="12.5" y="12.5" width="2.5" height="2.5" rx="0.5" fill="#22c55e" />
                      <rect x="16" y="12.5" width="2.5" height="2.5" rx="0.5" fill="#4ade80" />
                      <rect x="19.5" y="12.5" width="2.5" height="2.5" rx="0.5" fill="#22c55e" />

                      <rect x="2" y="16" width="2.5" height="2.5" rx="0.5" fill="#22c55e" />
                      <rect x="5.5" y="16" width="2.5" height="2.5" rx="0.5" fill="#15803d" />
                      <rect x="9" y="16" width="2.5" height="2.5" rx="0.5" fill="#22c55e" />
                      <rect x="12.5" y="16" width="2.5" height="2.5" rx="0.5" fill="#166534" />
                      <rect x="16" y="16" width="2.5" height="2.5" rx="0.5" fill="#22c55e" />
                      <rect x="19.5" y="16" width="2.5" height="2.5" rx="0.5" fill="#15803d" />

                      <rect x="2" y="19.5" width="2.5" height="2.5" rx="0.5" fill="#14532d" />
                      <rect x="5.5" y="19.5" width="2.5" height="2.5" rx="0.5" fill="#166534" />
                      <rect x="9" y="19.5" width="2.5" height="2.5" rx="0.5" fill="#15803d" />
                      <rect x="12.5" y="19.5" width="2.5" height="2.5" rx="0.5" fill="#14532d" />
                      <rect x="16" y="19.5" width="2.5" height="2.5" rx="0.5" fill="#166534" />
                      <rect x="19.5" y="19.5" width="2.5" height="2.5" rx="0.5" fill="#14532d" />
                    </svg>
                  </td>
                  <td valign="middle">
                    <span style="font-family:'Caveat',cursive,'Segoe Print','Bradley Hand',sans-serif;font-size:30px;font-weight:700;color:#10b981;line-height:1;display:inline-block;letter-spacing:-0.5px;">Evergreeners</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td class="email-card" style="background-color:#ffffff;border:1px solid #e4e4e7;border-radius:12px;padding:36px 36px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">

                <!-- Badge Pill -->
                <tr>
                  <td style="padding-bottom:14px;">
                    <span style="display:inline-block;padding:5px 12px;border-radius:20px;background-color:#ecfdf5;border:1px solid #a7f3d0;font-family:ui-monospace,'SF Mono','Fira Code',monospace;font-size:11px;font-weight:700;letter-spacing:0.08em;color:#059669;text-transform:uppercase;">
                      Day 256 of the Year · 0x100 · 2⁸
                    </span>
                  </td>
                </tr>

                <!-- Heading -->
                <tr>
                  <td style="padding-bottom:8px;">
                    <h1 class="text-heading" style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',Helvetica,Arial,sans-serif;font-size:26px;font-weight:700;color:#09090b;letter-spacing:-0.5px;line-height:1.25;">
                      Happy Programmer's Day, ${displayName}.
                    </h1>
                  </td>
                </tr>

                <!-- Subheading -->
                <tr>
                  <td style="padding-bottom:18px;">
                    <p class="text-body-dark" style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;font-weight:500;color:#27272a;line-height:1.6;">
                      Today is September 13th, the 256th day of the year. In our world, that number means everything.
                    </p>
                  </td>
                </tr>

                <!-- Heatmap Pixel Matrix Hero -->
                <tr>
                  <td>
                    ${gridHtml}
                  </td>
                </tr>

                <!-- Message Body -->
                <tr>
                  <td>
                    <p class="text-body" style="margin:0 0 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;color:#52525b;line-height:1.75;">
                      Outside of tech, 256 looks like just another date on the calendar. But to anyone who actually writes code, it is the number that shaped our entire world. It is two to the eighth power. It is the exact number of distinct values a single eight-bit byte can represent. It is the invisible boundary where integers overflow, where computer memory was born, and where every line of code we will ever ship has its roots.
                    </p>

                    <p class="text-body" style="margin:0 0 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;color:#52525b;line-height:1.75;">
                      We wanted to send you this note right around our daily commit report time because building software is a very specific, stubborn kind of craft. Most people only ever get to see the polished UI, the demo, or the feature that works in production. They never see the late nights, the silent frustration of staring at an incomprehensible error trace, the twenty tabs open to random GitHub issues from five years ago, or that sudden, incredible rush when you finally track down the bug and every single test turns green.
                    </p>

                    <p class="text-body" style="margin:0 0 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;color:#52525b;line-height:1.75;">
                      Most people do not understand how satisfying it is to look at your GitHub profile and see that clean, bright green square drop into place after a hard day of work. Writing code is not always smooth sailing. Some days you ship an entire system in one seamless flow, and other days you spend half your afternoon hunting down a missing bracket, an unhandled promise, or a misspelled environment variable. But every commit counts, and every problem you solve makes you a better engineer than you were yesterday.
                    </p>

                    <p class="text-body" style="margin:0 0 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;color:#52525b;line-height:1.75;">
                      We built Evergreeners for people who respect that daily grind. Whether you pushed ten commits today, are debugging a personal side project, contributing to open source, or simply showing up to learn something new, this day belongs to you.
                    </p>

                    <p class="text-body" style="margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;color:#52525b;line-height:1.75;">
                      Take a couple of minutes today to look back at your history and appreciate just how much you have built and learned so far. Celebrate today, take pride in the craft, and go push something to GitHub to keep the green alive.
                    </p>
                  </td>
                </tr>

                ${divider}

                <!-- User Stats Block -->
                <tr>
                  <td>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <!-- Streak -->
                        <td width="31%" class="stat-box" style="padding:16px 16px;background-color:#fafafa;border:1px solid #e4e4e7;border-radius:8px;">
                          <p class="stat-label" style="margin:0 0 6px;font-family:ui-monospace,'SF Mono',monospace;font-size:10px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#a1a1aa;">Current Streak</p>
                          <p style="margin:0;font-family:ui-monospace,'SF Mono','Fira Code',monospace;font-size:26px;font-weight:700;line-height:1;color:${streak > 0 ? '#10b981' : '#a1a1aa'};">
                            ${streak}<span class="stat-unit" style="font-size:12px;font-weight:400;color:#a1a1aa;margin-left:3px;">days</span>
                          </p>
                        </td>

                        <td width="3%"></td>

                        <!-- Today -->
                        <td width="31%" class="stat-box" style="padding:16px 16px;background-color:#fafafa;border:1px solid #e4e4e7;border-radius:8px;">
                          <p class="stat-label" style="margin:0 0 6px;font-family:ui-monospace,'SF Mono',monospace;font-size:10px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#a1a1aa;">Today (Day 256)</p>
                          <p style="margin:0;font-family:ui-monospace,'SF Mono','Fira Code',monospace;font-size:26px;font-weight:700;line-height:1;color:${committed ? '#10b981' : '#f59e0b'};">
                            ${todayCommits}<span class="stat-unit" style="font-size:12px;font-weight:400;color:#a1a1aa;margin-left:3px;">commits</span>
                          </p>
                        </td>

                        <td width="3%"></td>

                        <!-- Total -->
                        <td width="32%" class="stat-box" style="padding:16px 16px;background-color:#fafafa;border:1px solid #e4e4e7;border-radius:8px;">
                          <p class="stat-label" style="margin:0 0 6px;font-family:ui-monospace,'SF Mono',monospace;font-size:10px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#a1a1aa;">All-Time Commits</p>
                          <p style="margin:0;font-family:ui-monospace,'SF Mono','Fira Code',monospace;font-size:26px;font-weight:700;line-height:1;color:#09090b;">
                            ${totalCommits.toLocaleString()}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                ${divider}

                <!-- CTAs -->
                <tr>
                  <td style="padding-bottom:12px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="background-color:#10b981;border-radius:7px;">
                          <a href="${username ? `https://github.com/${username}` : `${APP_URL}/dashboard`}" style="display:inline-block;padding:12px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:-0.1px;">
                            ${committed ? 'View Your Commits on GitHub' : 'Push Your Day 256 Commit'}
                          </a>
                        </td>
                        <td style="padding-left:18px;">
                          <a href="${APP_URL}/dashboard" class="cta-secondary" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;font-weight:500;color:#71717a;text-decoration:none;">
                            Open Dashboard &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Signoff -->
                <tr>
                  <td style="padding-top:16px;">
                    <p class="text-body" style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;color:#71717a;line-height:1.6;">
                      Happy Programmer's Day,<br />
                      <strong style="color:#10b981;">The Evergreeners Team</strong>
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:24px;">
              <p class="footer-text" style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12px;color:#71717a;line-height:1.7;">
                Sent with admiration for every developer on
                <a href="${APP_URL}" class="footer-link" style="color:#71717a;text-decoration:underline;">evergreeners.dev</a>.
                &nbsp;·&nbsp;
                <a href="${APP_URL}/settings" class="footer-link" style="color:#71717a;text-decoration:underline;">Notification settings</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendProgrammersDayEmail(opts: ProgrammersDayEmailOptions) {
    const { to } = opts;
    const html = buildProgrammersDayHtml(opts);

    try {
        const result = await getResend().emails.send({
            from: FROM_EMAIL,
            to,
            subject: "Happy Programmer's Day: Day 256 of 365",
            html,
        });
        console.log(`Programmer's Day email sent to ${to}:`, result.data?.id);
        return result;
    } catch (err) {
        console.error(`Failed to send Programmer's Day email to ${to}:`, err);
        throw err;
    }
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

// ─── Goal Completed Email ────────────────────────────────────────────────────
export interface GoalCompletedEmailOptions {
    to: string;
    name: string;
    goalTitle: string;
    goalType: string;
    target: number;
    current: number;
    goalsUrl: string;
}

export async function sendGoalCompletedEmail(opts: GoalCompletedEmailOptions) {
    const { to, name, goalTitle, goalType, target, current, goalsUrl } = opts;
    const displayName = name?.split(' ')[0] || 'there';

    const subject = `Goal complete: ${goalTitle} 🎯`;

    const body = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding-bottom:12px;">
             <span style="display:inline-block;padding:4px 10px;border-radius:12px;background-color:#f4f4f5;font-family:ui-monospace,'SF Mono',monospace;font-size:11px;font-weight:600;color:#52525b;letter-spacing:0.05em;text-transform:uppercase;">
              Goal Achieved
            </span>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:12px;">
            <h1 class="text-heading" style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',Helvetica,Arial,sans-serif;font-size:24px;font-weight:700;color:#09090b;letter-spacing:-0.4px;line-height:1.3;">
              You did it, ${displayName}!
            </h1>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:4px;">
            <p class="text-body" style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;color:#52525b;line-height:1.75;">
              You've hit your goal — <strong>"${goalTitle}"</strong> is complete. Clarity, focus, results.
            </p>
          </td>
        </tr>

        ${divider}

        <!-- Stat box: goal progress -->
        <tr>
          <td style="padding-bottom:24px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td class="stat-box" style="padding:16px 24px;background-color:#fafafa;border:1px solid #e4e4e7;border-radius:8px;text-align:center;">
                  <p class="stat-label" style="margin:0 0 4px;font-family:ui-monospace,'SF Mono',monospace;font-size:10px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#a1a1aa;">${goalType}</p>
                  <p style="margin:0;font-family:ui-monospace,'SF Mono','Fira Code',monospace;font-size:28px;font-weight:700;line-height:1;color:#10b981;">
                    ${current}<span class="stat-unit" style="font-size:12px;font-weight:400;color:#a1a1aa;margin-left:3px;">/ ${target}</span>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="background-color:#10b981;border-radius:7px;">
                  <a href="${goalsUrl}" style="display:inline-block;padding:11px 22px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:-0.1px;">
                    View Goals
                  </a>
                </td>
                <td style="padding-left:20px;">
                  <a href="${APP_URL}/dashboard" class="cta-secondary" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;color:#71717a;text-decoration:none;">
                    Back to dashboard &rarr;
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
        console.log(`Goal completed email sent to ${to} for [${goalTitle}]:`, result.data?.id);
        return result;
    } catch (err) {
        console.error(`Failed to send goal completed email to ${to}:`, err);
        throw err;
    }
}

// ─── Quest Completed Email (to the solver) ───────────────────────────────────
export interface QuestCompletedEmailOptions {
    to: string;
    name: string;
    questTitle: string;
    questUrl: string;
}

export async function sendQuestCompletedEmail(opts: QuestCompletedEmailOptions) {
    const { to, name, questTitle, questUrl } = opts;
    const displayName = name?.split(' ')[0] || 'there';

    const subject = `Quest complete: ${questTitle} 🎉`;

    const body = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding-bottom:12px;">
             <span style="display:inline-block;padding:4px 10px;border-radius:12px;background-color:#f4f4f5;font-family:ui-monospace,'SF Mono',monospace;font-size:11px;font-weight:600;color:#52525b;letter-spacing:0.05em;text-transform:uppercase;">
              Quest Solved
            </span>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:12px;">
            <h1 class="text-heading" style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',Helvetica,Arial,sans-serif;font-size:24px;font-weight:700;color:#09090b;letter-spacing:-0.4px;line-height:1.3;">
              Quest complete, ${displayName}.
            </h1>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:4px;">
            <p class="text-body" style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;color:#52525b;line-height:1.75;">
              You solved <strong>"${questTitle}"</strong>. Ship. Ship. Ship. The community sees the kind of builder you are.
            </p>
          </td>
        </tr>

        ${divider}

        <!-- CTA -->
        <tr>
          <td>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="background-color:#10b981;border-radius:7px;">
                  <a href="${questUrl}" style="display:inline-block;padding:11px 22px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:-0.1px;">
                    View Quests
                  </a>
                </td>
                <td style="padding-left:20px;">
                  <a href="${APP_URL}/dashboard" class="cta-secondary" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;color:#71717a;text-decoration:none;">
                    Back to dashboard &rarr;
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
        console.log(`Quest completed email sent to ${to} for [${questTitle}]:`, result.data?.id);
        return result;
    } catch (err) {
        console.error(`Failed to send quest completed email to ${to}:`, err);
        throw err;
    }
}

// ─── Quest Solved Email (to the uploader) ────────────────────────────────────
export interface QuestSolvedEmailOptions {
    to: string;
    name: string;
    solverName: string;
    questTitle: string;
    questUrl: string;
}

export async function sendQuestSolvedEmail(opts: QuestSolvedEmailOptions) {
    const { to, name, solverName, questTitle, questUrl } = opts;
    const displayName = name?.split(' ')[0] || 'there';

    const subject = `${solverName} solved your quest "${questTitle}"`;

    const body = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding-bottom:12px;">
             <span style="display:inline-block;padding:4px 10px;border-radius:12px;background-color:#f4f4f5;font-family:ui-monospace,'SF Mono',monospace;font-size:11px;font-weight:600;color:#52525b;letter-spacing:0.05em;text-transform:uppercase;">
              Quest Solved
            </span>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:12px;">
            <h1 class="text-heading" style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',Helvetica,Arial,sans-serif;font-size:24px;font-weight:700;color:#09090b;letter-spacing:-0.4px;line-height:1.3;">
              ${solverName} solved your quest, ${displayName}.
            </h1>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:4px;">
            <p class="text-body" style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;color:#52525b;line-height:1.75;">
              Someone just completed <strong>"${questTitle}"</strong>, the quest you uploaded. Your work is helping the community level up.
            </p>
          </td>
        </tr>

        ${divider}

        <!-- CTA -->
        <tr>
          <td>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="background-color:#10b981;border-radius:7px;">
                  <a href="${questUrl}" style="display:inline-block;padding:11px 22px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:-0.1px;">
                    View Quests
                  </a>
                </td>
                <td style="padding-left:20px;">
                  <a href="${APP_URL}/dashboard" class="cta-secondary" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;color:#71717a;text-decoration:none;">
                    Back to dashboard &rarr;
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
        console.log(`Quest solved email sent to ${to} for [${questTitle}]:`, result.data?.id);
        return result;
    } catch (err) {
        console.error(`Failed to send quest solved email to ${to}:`, err);
        throw err;
    }
}

// Custom Admin Broadcast Email
export interface CustomBroadcastEmailOptions {
    to: string;
    name?: string;
    subject: string;
    headline?: string;
    previewText?: string;
    message: string;
    buttonText?: string;
    buttonUrl?: string;
    commitGrid?: CommitGridRenderOptions;
    customImage?: CustomBroadcastImageOptions;
    blockOrder?: string[];
}

export async function sendCustomBroadcastEmail(options: CustomBroadcastEmailOptions) {
    const { to, subject, headline, previewText, message, buttonText, buttonUrl, commitGrid, customImage, blockOrder } = options;
    const displayHeadline = headline || subject;

    const attachments: Array<{ filename: string; content: Buffer; contentId?: string; contentType?: string }> = [];
    let customImageSrcOverride: string | undefined = undefined;

    if (customImage?.enabled && (customImage.url || customImage.dataUrl)) {
        const url = customImage.url || '';
        const dataUrl = customImage.dataUrl || (url.startsWith('data:') ? url : '');

        if (dataUrl) {
            try {
                const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
                if (match) {
                    const contentType = match[1];
                    const base64Data = match[2];
                    const extension = contentType.split('/')[1] || 'png';
                    const buffer = Buffer.from(base64Data, 'base64');
                    const filename = `broadcast-image.${extension}`;
                    attachments.push({
                        filename,
                        content: buffer,
                        contentType,
                        contentId: 'broadcast-custom-image',
                    });
                    customImageSrcOverride = 'cid:broadcast-custom-image';
                }
            } catch (e) {
                console.error('Failed to parse dataUrl for custom broadcast image:', e);
            }
        }

        if (!customImageSrcOverride && url) {
            if (url.includes('/uploads/') || url.includes('/public/') || url.includes('localhost') || url.includes('127.0.0.1') || !url.startsWith('http')) {
                const cleanUrl = url.split('?')[0].split('#')[0];
                const filename = path.basename(cleanUrl);
                const candidates = [
                    path.join(process.cwd(), 'server', 'public', 'uploads', filename),
                    path.join(process.cwd(), 'public', 'uploads', filename),
                    path.join(__dirname, '..', '..', 'public', 'uploads', filename),
                    path.join(__dirname, '..', 'public', 'uploads', filename),
                ];

                for (const candidate of candidates) {
                    if (fs.existsSync(candidate)) {
                        try {
                            const buffer = fs.readFileSync(candidate);
                            const ext = path.extname(candidate).toLowerCase().replace('.', '');
                            const contentType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'webp' ? 'image/webp' : 'image/png';
                            attachments.push({
                                filename,
                                content: buffer,
                                contentType,
                                contentId: 'broadcast-custom-image',
                            });
                            customImageSrcOverride = 'cid:broadcast-custom-image';
                            break;
                        } catch (e) {
                            console.error(`Failed to read local image file at ${candidate}:`, e);
                        }
                    }
                }
            }
        }
    }

    const commitGridHtml = commitGrid?.enabled
        ? `<tr><td style="padding-top:10px;padding-bottom:12px;">${generatePixelCommitGridHtml(commitGrid)}</td></tr>`
        : '';

    const customImageHtml = customImage?.enabled && (customImage?.url || customImage?.dataUrl || customImageSrcOverride)
        ? `<tr><td style="padding-top:10px;padding-bottom:12px;">${generateCustomImageHtml(customImage, customImageSrcOverride)}</td></tr>`
        : '';

    const buttonHtml = buttonText && buttonUrl ? `
      <tr>
        <td style="padding-top:12px;padding-bottom:12px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="background-color:#10b981;border-radius:8px;">
                <a href="${buttonUrl}" style="display:inline-block;padding:12px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:-0.1px;">
                  ${buttonText}
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    ` : '';

    const rawParagraphs = message
        .split(/\n\s*\n/)
        .map(p => p.trim())
        .filter(Boolean);

    const renderParagraph = (p: string) =>
        `<p class="text-body" style="margin:0 0 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;color:#52525b;line-height:1.75;">${p.replace(/\n/g, '<br/>')}</p>`;

    let assembledBlocksHtml = '';

    // Check if inline placeholders {{grid}} or {{image}} exist in the message
    if (message.includes('{{grid}}') || message.includes('{{image}}')) {
        const headlineHtml = `<tr><td style="padding-bottom:12px;"><h1 class="text-heading" style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',Helvetica,Arial,sans-serif;font-size:24px;font-weight:700;color:#09090b;letter-spacing:-0.4px;line-height:1.3;">${displayHeadline}</h1></td></tr>`;
        const processedMessage = rawParagraphs.map(p => {
            if (p === '{{grid}}') return commitGridHtml;
            if (p === '{{image}}') return customImageHtml;
            let replaced = renderParagraph(p);
            if (replaced.includes('{{grid}}')) {
                replaced = replaced.replace(/\{\{grid\}\}/g, commitGridHtml);
            }
            if (replaced.includes('{{image}}')) {
                replaced = replaced.replace(/\{\{image\}\}/g, customImageHtml);
            }
            return replaced;
        }).join('');

        assembledBlocksHtml = [
            headlineHtml,
            `<tr><td style="padding-bottom:4px;">${processedMessage}</td></tr>`,
            buttonHtml
        ].join('');
    } else if (blockOrder && blockOrder.length > 0) {
        const midPoint = Math.max(1, Math.floor(rawParagraphs.length / 2));
        const headlineHtml = `<tr><td style="padding-bottom:12px;"><h1 class="text-heading" style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',Helvetica,Arial,sans-serif;font-size:24px;font-weight:700;color:#09090b;letter-spacing:-0.4px;line-height:1.3;">${displayHeadline}</h1></td></tr>`;
        const part1Html = rawParagraphs.length > 0 ? `<tr><td style="padding-bottom:4px;">${rawParagraphs.slice(0, midPoint).map(renderParagraph).join('')}</td></tr>` : '';
        const part2Html = rawParagraphs.length > midPoint ? `<tr><td style="padding-bottom:4px;">${rawParagraphs.slice(midPoint).map(renderParagraph).join('')}</td></tr>` : '';
        const allMessageHtml = rawParagraphs.length > 0 ? `<tr><td style="padding-bottom:4px;">${rawParagraphs.map(renderParagraph).join('')}</td></tr>` : '';

        const blockMap: Record<string, string> = {
            headline: headlineHtml,
            commit_grid: commitGridHtml,
            custom_image: customImageHtml,
            message: allMessageHtml,
            message_top: part1Html,
            message_bottom: part2Html,
            button: buttonHtml,
        };

        assembledBlocksHtml = blockOrder
            .map(id => blockMap[id] || '')
            .filter(Boolean)
            .join('');
    } else {
        const headlineHtml = `<tr><td style="padding-bottom:12px;"><h1 class="text-heading" style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',Helvetica,Arial,sans-serif;font-size:24px;font-weight:700;color:#09090b;letter-spacing:-0.4px;line-height:1.3;">${displayHeadline}</h1></td></tr>`;
        const midPoint = Math.max(1, Math.floor(rawParagraphs.length / 2));
        const part1Html = rawParagraphs.length > 0 ? `<tr><td style="padding-bottom:4px;">${rawParagraphs.slice(0, midPoint).map(renderParagraph).join('')}</td></tr>` : '';
        const part2Html = rawParagraphs.length > midPoint ? `<tr><td style="padding-bottom:4px;">${rawParagraphs.slice(midPoint).map(renderParagraph).join('')}</td></tr>` : '';

        const topBlocks: string[] = [];
        const middleBlocks: string[] = [];
        const bottomBlocks: string[] = [];

        if (commitGrid?.enabled) {
            const pos = commitGrid.position || 'bottom';
            if (pos === 'top') topBlocks.push(commitGridHtml);
            else if (pos === 'middle') middleBlocks.push(commitGridHtml);
            else bottomBlocks.push(commitGridHtml);
        }

        if (customImage?.enabled && (customImage?.url || customImage?.dataUrl || customImageSrcOverride)) {
            const pos = customImage.position || 'middle';
            if (pos === 'top') topBlocks.push(customImageHtml);
            else if (pos === 'middle') middleBlocks.push(customImageHtml);
            else bottomBlocks.push(customImageHtml);
        }

        assembledBlocksHtml = [
            headlineHtml,
            ...topBlocks,
            part1Html,
            ...middleBlocks,
            part2Html,
            ...bottomBlocks,
            buttonHtml,
        ].join('');
    }

    const body = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        ${previewText ? `<div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${previewText}</div>` : ''}
        ${assembledBlocksHtml}
      </table>`;

    try {
        const result = await getResend().emails.send({
            from: FROM_EMAIL,
            to,
            subject,
            html: emailShell(body),
            ...(attachments.length > 0 ? { attachments } : {}),
        });
        console.log(`Custom broadcast email sent to ${to} [${subject}]:`, result.data?.id);
        return result;
    } catch (err) {
        console.error(`Failed to send custom broadcast email to ${to}:`, err);
        throw err;
    }
}

