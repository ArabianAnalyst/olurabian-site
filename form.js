// form.js - Memory Audit form: validation, submit, UI states.
export function isValidEmail(s){
  return typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}
export function buildPayload(email, note){
  return { email: (email||'').trim(), note: (note||'').trim() };
}
export async function submitAudit(payload, fetchImpl = (typeof fetch!=='undefined'?fetch:null)){
  try {
    const res = await fetchImpl('/api/subscribe', {
      method:'POST', headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) return { ok:true, message:"Got it. I'll be in touch." };
    return { ok:false, message:'That did not send. Try again in a moment.' };
  } catch {
    return { ok:false, message:'Network hiccup. Try again in a moment.' };
  }
}

if (typeof document !== 'undefined'){
  const form = document.getElementById('audit-form');
  if (form){
    const emailEl = document.getElementById('audit-email');
    const noteEl = document.getElementById('audit-note');
    const status = document.getElementById('audit-status');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      status.className = 'audit-status';
      if (!isValidEmail(emailEl.value)){
        status.textContent = 'Enter a valid email.'; status.classList.add('err'); return;
      }
      status.textContent = 'Sending...';
      const r = await submitAudit(buildPayload(emailEl.value, noteEl.value));
      status.textContent = r.message;
      status.classList.add(r.ok ? 'ok' : 'err');
      if (r.ok) form.reset();
    });
  }
}
