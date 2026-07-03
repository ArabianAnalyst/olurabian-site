// lead.js - Memory Audit lead-magnet page: capture email, then reveal the PDF.
// Reuses the pure helpers from form.js so validation and submit stay in one place.
import { isValidEmail, buildPayload, submitAudit } from '/form.js';

if (typeof document !== 'undefined'){
  const form = document.getElementById('ma-form');
  if (form){
    const emailEl = document.getElementById('ma-email');
    const hpEl = document.getElementById('ma-hp');
    const status = document.getElementById('ma-status');
    const deliver = document.getElementById('ma-deliver');
    const reveal = () => { form.hidden = true; if (deliver) deliver.hidden = false; };
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      status.className = 'audit-status';
      if (hpEl && hpEl.value){ reveal(); return; } // honeypot: quietly reveal, never send
      if (!isValidEmail(emailEl.value)){
        status.textContent = 'Enter a valid email.'; status.classList.add('err'); return;
      }
      status.textContent = 'Sending...';
      const payload = { ...buildPayload(emailEl.value, 'memory-audit lead magnet'), company_url: hpEl ? hpEl.value : '' };
      const r = await submitAudit(payload);
      if (r.ok){ reveal(); }
      else { status.textContent = r.message; status.classList.add('err'); }
    });
  }
}
