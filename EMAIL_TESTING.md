# Email Testing Guide

> Dev-only test routes — only work when `NODE_ENV` is not `production`.  
> Make sure the server is running: `cd server && npm run dev`

---

## Welcome Email

Sends the welcome email to any address. Looks up the real name from the DB if the email matches a user.

```
http://localhost:3000/api/dev/test-welcome?to=muhammadadamualiyu33@gmail.com
```

Override the display name:
```
http://localhost:3000/api/dev/test-welcome?to=muhammadadamualiyu33@gmail.com&name=Adam
```

---

## Daily Digest Email

Pulls **real stats from the DB** automatically when the email matches your account.  
Two versions of the email exist — the route picks the right one based on your actual commit count (or your override).

### Use your real stats (recommended)
```
http://localhost:3000/api/dev/test-streak?to=muhammadadamualiyu33@gmail.com
```

### Force the "committed today" version (celebration email)
```
http://localhost:3000/api/dev/test-streak?to=muhammadadamualiyu33@gmail.com&committed=true
```

### Force the "no commits" version (warning email)
```
http://localhost:3000/api/dev/test-streak?to=muhammadadamualiyu33@gmail.com&committed=false
```

### Override the streak count manually
```
http://localhost:3000/api/dev/test-streak?to=muhammadadamualiyu33@gmail.com&streak=30
```

### Combine overrides
```
http://localhost:3000/api/dev/test-streak?to=muhammadadamualiyu33@gmail.com&committed=true&streak=30
```

---

## Programmer's Day Special Edition (Day 256)

Sends the special Programmer's Day edition email celebrating the 256th day of the year with the custom pixelated 256 GitHub contribution grid and Evergreeners branding.

### Test sending to your personal email:
```
http://localhost:3000/api/dev/test-programmers-day?to=muhammadadamualiyu33@gmail.com
```

### Override stats manually:
```
http://localhost:3000/api/dev/test-programmers-day?to=muhammadadamualiyu33@gmail.com&streak=30&todayCommits=5
```

### Preview the Admin Approval Email:
```
http://localhost:3000/api/dev/test-programmers-day-admin-approval?to=muhammadadamualiyu33@gmail.com
```

### 1-Click Admin Approval Link:
```
http://localhost:3000/api/admin/approve-programmers-day?token=...&year=2027
```
When clicked by the admin from their email inbox, this endpoint validates the token, broadcasts the celebration email to all registered accounts, and renders a web confirmation report.

### Broadcast directly via API:
```bash
curl -X POST http://localhost:3000/api/admin/broadcast-programmers-day
```

---

## Query Params Reference

| Param | Route | Description |
|---|---|---|
| `to` | all | **Required.** Email address to send to |
| `name` | welcome | Override the display name in the email |
| `committed` | streak | `true` = simulate committed day, `false` = simulate no commits |
| `streak` | streak | Override the streak number shown in the email |

---

## What the Response JSON Tells You

A successful test returns JSON in the browser like this:

```json
{
  "success": true,
  "message": "Daily digest sent to muhammadadamualiyu33@gmail.com",
  "stats": {
    "source": "database (real stats)",
    "streak": 7,
    "todayCommits": 2,
    "totalCommits": 341,
    "weeklyCommits": 14,
    "mode": "committed — celebration email"
  },
  "resendId": "re_abc123xyz"
}
```

- **`source`**: confirms whether it pulled from your real DB or used defaults
- **`mode`**: tells you which email variant was sent
- **`resendId`**: check this in the [Resend Dashboard → Logs](https://resend.com/emails) to confirm delivery

---

## Resend Dashboard

After sending, verify delivery at:  
**https://resend.com/emails**

You'll see the email, delivery status, open tracking, and any bounce/error details.

---

## How the Real Crons Work (WAT / Nigerian Time)

| Job | Schedule | What it does |
|---|---|---|
| GitHub sync | Every hour (`0 * * * *`) | Refreshes streaks, commits, contribution heatmaps for all GitHub-connected users |
| Programmer's Day check | 8:00 AM daily (`0 8 * * *`, Africa/Lagos) | On Day 256 only (Sep 13 normal, Sep 12 leap), sends an approval email to `muhammadadamualiyu33@gmail.com`. **Never broadcasts to users until admin approves!** |
| Academy nudge | 6:00 PM daily (`0 18 * * *`, Africa/Lagos) | Reminds enrolled students who have been inactive for 3+ days to continue their lessons (max once every 3 days) |
| Daily digest | 8:00 PM daily (`0 20 * * *`, Africa/Lagos) | Sends a single daily streak digest to active users with notifications on |

The digest email sends **regardless of whether you committed or not**:
- Committed → green stats, celebration copy
- No commits → red zero, streak-at-risk warning

