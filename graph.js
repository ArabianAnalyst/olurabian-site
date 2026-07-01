// graph.js . Living Graph engine. Pure logic + (Task 3) browser bootstrap.
export function mulberry32(seed){
  let a = seed >>> 0;
  return function(){
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const NAMED = [
  { id:'araba',        label:'ARABA',         section:null    },
  { id:'invobi',       label:'invobi',        section:'#work' },
  { id:'purse',        label:'Purse',         section:'#work' },
  { id:'companyBrain', label:'Company Brain', section:'#work' },
  { id:'thesis',       label:'Thesis',        section:'#thesis' },
  { id:'audit',        label:'Memory Audit',  section:'#audit' },
];

export function createGraph({ width, height, count = 30, seed = 1 }){
  const rnd = mulberry32(seed);
  const nodes = [];
  // center node first
  nodes.push({ id:'araba', label:'ARABA', section:null,
    x:width/2, y:height/2, vx:0, vy:0, r:9, accent:true, named:true });
  // remaining named nodes on a ring around center
  const ring = NAMED.slice(1);
  ring.forEach((n, k) => {
    const ang = (k / ring.length) * Math.PI * 2 + rnd()*0.4;
    const rad = Math.min(width, height) * 0.28;
    nodes.push({ id:n.id, label:n.label, section:n.section,
      x: clamp(width/2 + Math.cos(ang)*rad, 0, width),
      y: clamp(height/2 + Math.sin(ang)*rad, 0, height),
      vx:(rnd()-0.5)*0.06, vy:(rnd()-0.5)*0.06, r:6, accent:false, named:true });
  });
  // filler nodes
  for (let i = nodes.length; i < count; i++){
    nodes.push({ id:'n'+i, label:'', section:null,
      x: rnd()*width, y: rnd()*height,
      vx:(rnd()-0.5)*0.05, vy:(rnd()-0.5)*0.05,
      r: 2 + rnd()*2, accent:false, named:false });
  }
  // edges: connect named nodes to center, plus nearest-neighbour filler links
  const edges = [];
  for (let i = 1; i < ring.length + 1; i++) edges.push([0, i]);
  for (let i = ring.length + 1; i < nodes.length; i++){
    let best = 0, bd = Infinity;
    for (let j = 0; j < nodes.length; j++){
      if (j === i) continue;
      const d = dist2(nodes[i], nodes[j]);
      if (d < bd){ bd = d; best = j; }
    }
    edges.push([i, best]);
  }
  return { nodes, edges };
}

export function stepGraph(graph, dt, { width, height }){
  const s = dt / 16;
  for (const n of graph.nodes){
    if (n.id === 'araba') continue; // center stays put
    n.x += n.vx * s; n.y += n.vy * s;
    if (n.x < 0 || n.x > width){ n.vx *= -1; n.x = clamp(n.x, 0, width); }
    if (n.y < 0 || n.y > height){ n.vy *= -1; n.y = clamp(n.y, 0, height); }
  }
}

export function hitTest(graph, px, py, pad = 6){
  for (let i = 0; i < graph.nodes.length; i++){
    const n = graph.nodes[i];
    const dx = n.x - px, dy = n.y - py;
    if (dx*dx + dy*dy <= (n.r + pad) * (n.r + pad)) return i;
  }
  return -1;
}

export const shouldAnimate = (reduced) => !reduced;

function clamp(v, lo, hi){ return v < lo ? lo : v > hi ? hi : v; }
function dist2(a, b){ const dx=a.x-b.x, dy=a.y-b.y; return dx*dx+dy*dy; }

// ---- browser bootstrap (no effect under node:test) ----
if (typeof window !== 'undefined' && typeof document !== 'undefined'){
  const canvas = document.getElementById('graph');
  if (canvas){
    const ctx = canvas.getContext('2d');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    let graph, hover = -1, mx = -1, my = -1, raf = 0;

    function resize(){
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      graph = createGraph({ width: W, height: H, count: W < 640 ? 22 : 36, seed: 11 });
    }
    function draw(){
      ctx.clearRect(0, 0, W, H);
      ctx.lineWidth = 1;
      for (const [i, j] of graph.edges){
        const a = graph.nodes[i], b = graph.nodes[j];
        ctx.strokeStyle = 'rgba(120,120,132,0.10)';
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
      graph.nodes.forEach((n, idx) => {
        const lit = n.accent || idx === hover;
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI*2);
        ctx.fillStyle = lit ? '#F5CE1A' : '#3A3A42';
        if (lit){ ctx.shadowColor = 'rgba(245,206,26,0.6)'; ctx.shadowBlur = 14; }
        ctx.fill(); ctx.shadowBlur = 0;
        if (n.named && (idx === hover || n.accent)){
          ctx.font = '500 13px JetBrains Mono, monospace';
          ctx.fillStyle = '#EDEDEF';
          ctx.fillText(n.label, n.x + n.r + 8, n.y + 4);
        }
      });
    }
    function frame(){
      stepGraph(graph, 16, { width: W, height: H });
      if (mx >= 0) hover = hitTest(graph, mx, my);
      draw();
      raf = requestAnimationFrame(frame);
    }
    function start(){
      cancelAnimationFrame(raf);
      draw(); // paint an initial frame immediately (no blank first paint)
      if (shouldAnimate(reduced)) raf = requestAnimationFrame(frame);
    }
    canvas.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      const h = hitTest(graph, mx, my);
      canvas.style.cursor = (h >= 0 && graph.nodes[h].named) ? 'pointer' : 'default';
    });
    canvas.addEventListener('click', e => {
      const h = hitTest(graph, e.clientX, e.clientY);
      const sec = h >= 0 ? graph.nodes[h].section : null;
      if (sec) document.querySelector(sec)?.scrollIntoView({ behavior: 'smooth' });
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) cancelAnimationFrame(raf); else start();
    });
    window.addEventListener('resize', () => { resize(); start(); });
    resize(); start();
  }
}
