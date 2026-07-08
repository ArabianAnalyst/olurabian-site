// deal-screen.js - Deal Screen free-scan form. Validation, submit, UI states.
export function isValidEmail(s){
  return typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}
export function buildPayload(email, note){
  return { email: (email||'').trim(), note: '[Deal Screen] ' + (note||'').trim() };
}
export async function submitScan(payload, fetchImpl = (typeof fetch!=='undefined'?fetch:null)){
  try {
    const res = await fetchImpl('/api/subscribe', {
      method:'POST', headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) return { ok:true, message:'Got it. I will be in touch within 48 hours.' };
    return { ok:false, message:'That did not send. Try again in a moment.' };
  } catch {
    return { ok:false, message:'Network hiccup. Try again in a moment.' };
  }
}

if (typeof document !== 'undefined'){
  const form = document.getElementById('deal-form');
  if (form){
    const emailEl = document.getElementById('deal-email');
    const noteEl = document.getElementById('deal-note');
    const hpEl = document.getElementById('deal-hp');
    const status = document.getElementById('deal-status');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!status) return;
      status.className = 'audit-status';
      if (hpEl && hpEl.value){ // honeypot filled, silently accept without sending
        status.textContent = 'Got it. I will be in touch within 48 hours.'; status.classList.add('ok'); form.reset(); return;
      }
      if (!emailEl || !isValidEmail(emailEl.value)){
        status.textContent = 'Enter a valid email.'; status.classList.add('err'); return;
      }
      status.textContent = 'Sending...';
      const payload = { ...buildPayload(emailEl.value, noteEl ? noteEl.value : ''), company_url: hpEl ? hpEl.value : '' };
      const r = await submitScan(payload);
      status.textContent = r.message;
      status.classList.add(r.ok ? 'ok' : 'err');
      if (r.ok) form.reset();
    });
  }
}
