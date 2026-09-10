// blackbox page. Scroll reveal + the live tamper-evident demo. CSP-safe, no inline anything.
// The demo runs the real SHA-256 hash chain in the browser, the same logic as
// hashRecord() and verifyChain() in @olurabian/blackbox. verify() is a call you
// make (the Verify chain button), not something running on its own, so tampering
// stays hidden until you run the check.

/* ---- scroll reveal (mirrors purse.js) ---- */
(function () {
  var root = document.documentElement;
  root.classList.add('js');
  var els = document.querySelectorAll('.rv');
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!('IntersectionObserver' in window) || reduced) {
    for (var i = 0; i < els.length; i++) els[i].classList.add('in');
  } else {
    var io = new IntersectionObserver(function (entries) {
      for (var j = 0; j < entries.length; j++) {
        if (entries[j].isIntersecting) {
          entries[j].target.classList.add('in');
          io.unobserve(entries[j].target);
        }
      }
    }, { threshold: 0.1, rootMargin: '0px 0px -8% 0px' });
    for (var k = 0; k < els.length; k++) io.observe(els[k]);
  }
})();

/* ---- the live hash chain ---- */
(function () {
// chain-logic:start
const GENESIS = "0".repeat(64);
async function sha256hex(str){
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2,"0")).join("");
}
// The canonical form of @olurabian/receipt, exactly this key order. Demo-only
// fields (anything starting with an underscore) never reach it.
async function hashRecord(r){
  return sha256hex(JSON.stringify({ id: r.id, ts: r.ts, kind: r.kind, payload: r.payload, prevHash: r.prevHash }));
}
// Mirrors verifyChain() in @olurabian/receipt. Same checks, same order, same
// result shape, same reason strings.
async function verifyChain(chain){
  let prev = GENESIS;
  for (let i = 0; i < chain.length; i++){
    const r = chain[i];
    if (r.prevHash !== prev) return { ok:false, brokenAt:i, id:r.id, reason:"prevHash mismatch (a record was inserted, removed, or reordered)" };
    if (await hashRecord(r) !== r.hash) return { ok:false, brokenAt:i, id:r.id, reason:"hash mismatch (a record was altered)" };
    prev = r.hash;
  }
  return { ok:true };
}
// chain-logic:end

  const TS = "2026-09-10T00:00:00.000Z";
  const SEED = [
    { action: "charge-card",   outcome: "ok",    latencyMs: 184, cost: 20.00 },
    { action: "query-ledger",  outcome: "ok",    latencyMs: 31,  cost: 0 },
    { action: "send-reminder", outcome: "ok",    latencyMs: 142, cost: 0.002 },
    { action: "charge-card",   outcome: "error", latencyMs: 12,  cost: 0, error: "over per-transaction cap" },
  ];
  const POOL = [
    { action: "reconcile-payment", outcome: "ok",      latencyMs: 88,  cost: 0 },
    { action: "post-webhook",      outcome: "ok",      latencyMs: 57,  cost: 0 },
    { action: "charge-card",       outcome: "ok",      latencyMs: 169, cost: 48.00 },
    { action: "call-tool:search",  outcome: "ok",      latencyMs: 640, cost: 0.004 },
    { action: "refund-card",       outcome: "ok",      latencyMs: 203, cost: 12.50 },
    { action: "write-record",      outcome: "blocked", latencyMs: 3,   cost: 0, error: "over daily budget" },
    { action: "charge-card",       outcome: "ok",      latencyMs: 151, cost: 9.99 },
  ];

  let chain = [];
  let seq = 0;
  let poolIx = 0;
  // null = the chain has changed since it was last checked (pending). Otherwise
  // it holds the last verifyChain() result. Only a Verify chain press sets it.
  let verifyResult = null;
  // The truncation lesson. A dropped tail is invisible to verify(); the readout
  // says so instead of pretending otherwise.
  let droppedCount = 0;
  let lastDropped = null;

  function short(h) { return h.slice(0, 10) + "\u2026"; }

  // Every record is a Deadlatch receipt of kind "action". The action fields live
  // under payload, prevHash and hash on the envelope.
  async function addRecord(tpl) {
    seq++;
    const prevHash = chain.length ? chain[chain.length - 1].hash : GENESIS;
    const payload = { action: tpl.action, outcome: tpl.outcome, latencyMs: tpl.latencyMs, cost: tpl.cost };
    if (tpl.error) payload.error = tpl.error;
    const rec = { id: "id-" + seq, ts: TS, kind: "action", payload, prevHash };
    rec.hash = await hashRecord(rec);
    rec._orig = { action: tpl.action, cost: tpl.cost };
    rec._alt = false;
    rec._altField = null;
    chain.push(rec);
  }

  // What state class a record shows. Pending means "changed, not yet checked":
  // the altered value still shows red (that is your edit), but the break itself
  // stays hidden until Verify runs.
  function stateClass(i) {
    if (verifyResult === null) return "pending";
    if (verifyResult.ok) return "verified";
    if (i < verifyResult.brokenAt) return "verified";
    if (i === verifyResult.brokenAt) return "broken";
    return "after";
  }

  function render() {
    const led = document.getElementById("ledger");
    led.innerHTML = "";
    if (!chain.length) {
      led.innerHTML = '<div class="bb-empty">no records yet &middot; hit &ldquo;record an action&rdquo;</div>';
    }
    chain.forEach((rec, i) => {
      const p = rec.payload;
      const el = document.createElement("div");
      el.className = "rec " + stateClass(i);
      el.style.animationDelay = (i * 18) + "ms";

      const actAlt = (rec._alt && rec._altField === "action") ? " altered" : "";
      const costAlt = (rec._alt && rec._altField === "cost") ? " altered" : "";
      const costTxt = p.cost ? ("$" + p.cost.toFixed(2)) : "$0.00";
      const showBreak = verifyResult && !verifyResult.ok && i === verifyResult.brokenAt;
      el.innerHTML =
        '<div class="rec-head">' +
          '<span class="seq">' + rec.id + '</span>' +
          '<span class="kind">' + rec.kind + '</span>' +
          '<span class="plabel">payload</span>' +
          '<span class="action tamperable' + actAlt + '" data-tamper="action" data-i="' + i + '" role="button" tabindex="0" title="click to tamper">' + p.action + '</span>' +
          '<span class="chip ' + p.outcome + '">' + p.outcome + '</span>' +
          '<span class="rec-meta">' +
            '<span>' + p.latencyMs + 'ms</span>' +
            '<span class="cost tamperable' + costAlt + '" data-tamper="cost" data-i="' + i + '" role="button" tabindex="0" title="click to tamper">' + costTxt + '</span>' +
          '</span>' +
        '</div>' +
        '<div class="hashes">' +
          '<span><span class="link">prev</span> <span class="arrow">\u21B0</span> ' + short(rec.prevHash) + '</span>' +
          '<span><span class="link">hash</span> <span class="h">' + short(rec.hash) + '</span></span>' +
        '</div>' +
        (showBreak ? '<div class="break-flag">chain broken here &middot; verify() \u2192 { ok: false, brokenAt: ' + i + ', id: &quot;' + rec.id + '&quot; }</div>' : "");
      led.appendChild(el);
    });

    const ro = document.getElementById("readout");
    const verdict = document.getElementById("verdict");
    const sub = document.getElementById("sub");
    if (verifyResult === null) {
      ro.dataset.state = "pending";
      verdict.textContent = "NOT VERIFIED";
      sub.textContent = chain.length
        ? "chain changed since last check \u00B7 press Verify chain"
        : "no records yet";
    } else if (verifyResult.ok) {
      ro.dataset.state = "ok";
      verdict.textContent = "VERIFIED";
      const n = chain.length + " record" + (chain.length === 1 ? "" : "s");
      sub.textContent = droppedCount > 0
        ? "chain intact \u00B7 " + n + " \u00B7 " + droppedCount + " dropped from the tail and verify() cannot tell"
        : "chain intact \u00B7 " + n;
    } else {
      ro.dataset.state = "broken";
      verdict.textContent = "BROKEN AT " + chain[verifyResult.brokenAt].id;
      sub.textContent = verifyResult.reason + " \u00B7 nothing past it can be trusted";
    }
    document.getElementById("note").hidden = !(verifyResult && verifyResult.ok && droppedCount > 0);
    const dropBtn = document.getElementById("drop");
    dropBtn.textContent = lastDropped ? "Put it back" : "Drop the last record";
    dropBtn.disabled = !lastDropped && chain.length === 0;
  }

  // mark the chain as changed since the last check, then repaint (pending state).
  function markChanged() { verifyResult = null; }

  async function runVerify() {
    verifyResult = await verifyChain(chain);
    render();
  }

  // tamper: toggle a payload field between its original and an altered value.
  // Does NOT recompute the record's stored hash, exactly what an attacker editing
  // the log does. It also does not run verify, so the break stays hidden until
  // you check.
  function tamper(i, field) {
    const rec = chain[i];
    const p = rec.payload;
    if (!rec._alt) {
      if (field === "cost") p.cost = (rec._orig.cost || 0) + 5000;
      else p.action = rec._orig.action === "refund-card" ? "charge-card" : "refund-card";
      rec._alt = true;
      rec._altField = field;
    } else {
      p.cost = rec._orig.cost;
      p.action = rec._orig.action;
      rec._alt = false;
      rec._altField = null;
    }
    markChanged();
    render();
  }

  const ledger = document.getElementById("ledger");
  ledger.addEventListener("click", (e) => {
    const t = e.target.closest("[data-tamper]");
    if (!t) return;
    tamper(+t.dataset.i, t.dataset.tamper);
  });
  ledger.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const t = e.target.closest("[data-tamper]");
    if (!t) return;
    e.preventDefault();
    tamper(+t.dataset.i, t.dataset.tamper);
  });
  document.getElementById("verify").addEventListener("click", runVerify);
  document.getElementById("record").addEventListener("click", async () => {
    lastDropped = null;
    const tpl = POOL[poolIx % POOL.length]; poolIx++;
    await addRecord(tpl);
    markChanged();
    render();
  });
  document.getElementById("drop").addEventListener("click", () => {
    if (lastDropped) {
      chain.push(lastDropped);
      lastDropped = null;
      droppedCount--;
    } else if (chain.length) {
      lastDropped = chain.pop();
      droppedCount++;
    }
    markChanged();
    render();
  });
  document.getElementById("reset").addEventListener("click", async () => {
    chain = []; seq = 0; poolIx = 0; droppedCount = 0; lastDropped = null;
    for (const t of SEED) await addRecord(t);
    await runVerify();
  });

  (async () => { for (const t of SEED) await addRecord(t); await runVerify(); })();
})();
