// api/subscribe.js - Vercel serverless function. Forwards a Memory Audit
// request to Resend as a contact. Requires env RESEND_API_KEY and
// RESEND_AUDIENCE_ID (set in Vercel project settings, never in the repo).
// Hardening: Origin allowlist (blocks cross-site posts) + honeypot field
// (bots that fill the hidden company_url field get a silent fake success).

// Day-0 email, sent the instant someone signs up. Resend Broadcasts do NOT fire
// on contact-add, so without this the lead is captured and hears silence.
const DAY0_EMAIL = `Thanks for grabbing the Memory Audit. Here it is again in case you need it, https://olurabian.com/memory-audit-checklist.pdf

If you only answer one of the twelve questions honestly, make it this one. If your most senior person vanished tomorrow, how much of how you actually operate would leave with them?

Most founders already know, and it is more than they are comfortable with. That is not a people problem. It is a knowledge location problem, and it is fixable.

Score yourself, then hit reply and tell me your number. I read every one.

ARABA`;

export async function handleSubscribe({ method, body, origin }, { resendKey, audienceId, fetchImpl = fetch, allowedOrigins }){
  if (method !== 'POST') return { status:405, json:{ error:'method not allowed' } };
  if (origin && allowedOrigins && !allowedOrigins.includes(origin)) return { status:403, json:{ error:'forbidden' } };
  // honeypot: a real user never fills this hidden field; pretend success, do nothing
  if (body && body.company_url) return { status:200, json:{ ok:true } };
  const email = (body && body.email || '').trim();
  const note = (body && body.note || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { status:400, json:{ error:'invalid email' } };
  if (!resendKey || !audienceId) return { status:500, json:{ error:'not configured' } };
  try {
    const res = await fetchImpl(`https://api.resend.com/audiences/${audienceId}/contacts`, {
      method:'POST',
      headers:{ 'Authorization':`Bearer ${resendKey}`, 'Content-Type':'application/json' },
      body: JSON.stringify({ email, unsubscribed:false, first_name: note.slice(0,60) }),
    });
    if (!res.ok) return { status:502, json:{ error:'upstream failed' } };
    // Fire the Day-0 email immediately. Non-fatal: the capture already succeeded,
    // so an email-send error must not fail the request or lose the contact.
    try {
      await fetchImpl('https://api.resend.com/emails', {
        method:'POST',
        headers:{ 'Authorization':`Bearer ${resendKey}`, 'Content-Type':'application/json' },
        body: JSON.stringify({
          from: 'ARABA <araba@olurabian.com>',
          to: [email],
          reply_to: 'araba@olurabian.com',
          subject: 'Your Memory Audit, and the one question that matters most',
          text: DAY0_EMAIL,
        }),
      });
    } catch { /* capture succeeded; ignore email-send error */ }
    return { status:200, json:{ ok:true } };
  } catch {
    return { status:502, json:{ error:'upstream error' } };
  }
}

export default async function handler(req, res){
  const allowedOrigins = ['https://www.olurabian.com', 'https://olurabian.com'];
  const out = await handleSubscribe(
    { method:req.method, body:req.body, origin:req.headers && req.headers.origin },
    { resendKey:process.env.RESEND_API_KEY, audienceId:process.env.RESEND_AUDIENCE_ID, allowedOrigins }
  );
  res.status(out.status).json(out.json);
}
