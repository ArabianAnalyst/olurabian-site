// api/subscribe.js - Vercel serverless function. Forwards a Memory Audit
// request to Resend as a contact. Requires env RESEND_API_KEY and
// RESEND_AUDIENCE_ID (set in Vercel project settings, never in the repo).
// Recon note (Task 1): the previous static site had no server form; this is new.

export async function handleSubscribe({ method, body }, { resendKey, audienceId, fetchImpl = fetch }){
  if (method !== 'POST') return { status:405, json:{ error:'method not allowed' } };
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
    return { status:200, json:{ ok:true } };
  } catch {
    return { status:502, json:{ error:'upstream error' } };
  }
}

export default async function handler(req, res){
  const out = await handleSubscribe(
    { method:req.method, body:req.body },
    { resendKey:process.env.RESEND_API_KEY, audienceId:process.env.RESEND_AUDIENCE_ID }
  );
  res.status(out.status).json(out.json);
}
