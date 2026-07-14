// api/nurture-cron.js — daily Vercel Cron. Sends the Day 2 / 5 / 9 Memory Audit
// nurture emails based on how long ago each contact signed up. Day 0 is sent on
// signup by subscribe.js; this handles the drip that Resend Broadcasts cannot.
//
// Stateless day-matching: runs once a day and sends the email for a contact's
// exact integer day since signup, so each contact gets each email once. A missed
// cron day would skip a boundary contact — acceptable for a nurture sequence.
//
// Protected by CRON_SECRET. Vercel sends `Authorization: Bearer <CRON_SECRET>`
// to cron requests automatically once CRON_SECRET is set in project env.

const EMAILS = {
  2: {
    subject: 'what your score actually means',
    text: `Quick follow up on the Memory Audit.

If you landed in the 8 to 15 range, you are where most growing companies sit. Things work, nobody is panicking, and it is quietly getting more expensive every month, because the knowledge that runs the place lives in heads and threads instead of somewhere your team, and your tools, can reach.

This is also the exact range where AI projects stall. You point a model at your data, it returns confident nonsense, and everyone decides AI is overhyped. It is not. The data was never in a shape a machine could use.

If that sounds familiar, I will show you where yours is leaking. Free, thirty minutes. cal.com/olurabian/memory-audit

ARABA`,
  },
  5: {
    subject: 'why AI cannot use your company data yet',
    text: `Here is the part nobody tells you about AI for your business.

Storing knowledge and engineering it are not the same thing. A folder of documents is storage, and a model cannot reason over storage. What it needs is structure, knowledge that is linked, labeled, and operable, so it can find the right thing and know why it matters.

That is what Company Brain is. I take a company's scattered memory and rebuild it as a graph you can read, edit, and hand to an AI agent without holding your breath. Not a black box. An asset.

The Memory Audit is step one. Want me to run yours? cal.com/olurabian/memory-audit

ARABA`,
  },
  9: {
    subject: 'want me to just map it for you?',
    text: `Last note on this, then I will leave your inbox alone.

If the Memory Audit hit a nerve, the fastest way forward is to let me look at your actual setup. In thirty minutes I map where your knowledge lives, where it disappears, and what it would look like as a graph your team and your AI can use. You leave with the map whether or not we ever work together.

No pitch, no slides. Grab a time. cal.com/olurabian/memory-audit

And if now is not the moment, that is fine. The day this starts to matter is usually the day someone important hands in their notice, or the day you try to scale a process that only lives in one person's head. When that day comes, you know where I am.

ARABA`,
  },
};

export async function runNurture({ resendKey, audienceId, now, fetchImpl = fetch }){
  if (!resendKey || !audienceId) return { status: 500, sent: 0, error: 'not configured' };
  const listRes = await fetchImpl(`https://api.resend.com/audiences/${audienceId}/contacts`, {
    headers: { Authorization: `Bearer ${resendKey}` },
  });
  if (!listRes.ok) return { status: 502, sent: 0, error: 'list failed' };
  const body = await listRes.json();
  const contacts = (body && body.data) || [];
  let sent = 0;
  const breakdown = { 2: 0, 5: 0, 9: 0 };
  for (const c of contacts) {
    if (!c || c.unsubscribed || !c.email || !c.created_at) continue;
    const days = Math.floor((now - new Date(c.created_at).getTime()) / 86400000);
    const em = EMAILS[days];
    if (!em) continue;
    const sendRes = await fetchImpl('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'ARABA <araba@olurabian.com>',
        to: [c.email],
        reply_to: 'araba@olurabian.com',
        subject: em.subject,
        text: em.text,
      }),
    });
    if (sendRes.ok) { sent++; breakdown[days]++; }
  }
  return { status: 200, sent, breakdown, scanned: contacts.length };
}

export default async function handler(req, res){
  const secret = process.env.CRON_SECRET;
  const auth = (req.headers && req.headers.authorization) || '';
  if (!secret || auth !== `Bearer ${secret}`) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  try {
    const out = await runNurture({
      resendKey: process.env.RESEND_API_KEY,
      audienceId: process.env.RESEND_AUDIENCE_ID,
      now: Date.now(),
    });
    res.status(out.status).json(out);
  } catch {
    res.status(500).json({ error: 'cron error' });
  }
}
