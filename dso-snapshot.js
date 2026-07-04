(function(){
  "use strict";
  var QUESTIONS = [
    {t:"Roughly what do you invoice a month?",
     o:[["Under £20k",0],["£20k to £50k",1],["£50k to £150k",2],["£150k or more",3]]},
    {t:"What terms do you put on your invoices?",
     o:[["Due on receipt",0],["Net 14",1],["Net 30",2],["Net 60 or more",3]]},
    {t:"In reality, how long do clients take to pay?",
     o:[["About on time",0],["A week or two late",1],["Around a month late",2],["Six weeks or more, or I don't know",3]]},
    {t:"How much is sitting in overdue invoices right now?",
     o:[["Nothing",0],["Under £10k",1],["£10k to £50k",2],["£50k+, or I don't know",3]]},
    {t:"Who chases your overdue invoices?",
     o:[["A dedicated person or system",0],["An assistant, ad hoc",1],["Me, when I remember",2],["Nobody",3]]},
    {t:"When an invoice goes overdue, how fast does the first chase go out?",
     o:[["Automatically",0],["Within a few days",1],["Eventually",2],["It often doesn't",3]]},
    {t:"In the last year, how much did you write off as never paid?",
     o:[["Nothing",0],["A little",1],["A painful amount",2],["No idea",3]]},
    {t:"How often does late payment squeeze payroll, contractors, or your own pay?",
     o:[["Never",0],["Occasionally",1],["Regularly",2],["It's a constant stress",3]]}
  ];
  var INVOICE_MID = [12000,35000,100000,200000];
  var LATE_DAYS   = [0,10,30,45];

  var idx = 0;
  var answers = new Array(QUESTIONS.length).fill(null);
  function $(id){ return document.getElementById(id); }

  function show(id){
    var s = document.querySelectorAll('.screen');
    for(var i=0;i<s.length;i++){ s[i].classList.remove('on'); }
    $(id).classList.add('on');
    window.scrollTo({top:0,behavior:'smooth'});
  }
  function start(){ idx=0; $('progWrap').classList.remove('hidden'); render(); show('qscreen'); }
  function render(){
    var q = QUESTIONS[idx];
    $('count').textContent = 'Question ' + (idx+1) + ' of ' + QUESTIONS.length;
    $('qtext').textContent = q.t;
    $('progBar').style.width = (idx / QUESTIONS.length * 100) + '%';
    $('backBtn').classList.toggle('invisible', idx===0);
    var wrap = $('opts');
    wrap.innerHTML = '';
    q.o.forEach(function(opt,i){
      var b = document.createElement('button');
      b.className = 'opt' + (answers[idx]===i ? ' sel' : '');
      var dot = document.createElement('span'); dot.className = 'dot';
      var lab = document.createElement('span'); lab.textContent = opt[0];
      b.appendChild(dot); b.appendChild(lab);
      b.addEventListener('click', function(){ answers[idx]=i; render(); setTimeout(next,200); });
      wrap.appendChild(b);
    });
  }
  function next(){ if(answers[idx]===null) return; if(idx<QUESTIONS.length-1){ idx++; render(); } else { finish(); } }
  function back(){ if(idx>0){ idx--; render(); } }
  function gbp(n){ return '£' + Math.round(n).toLocaleString('en-GB'); }

  function finish(){
    $('progBar').style.width = '100%';
    var score = 0;
    for(var i=0;i<QUESTIONS.length;i++){ score += QUESTIONS[i].o[answers[i]][1]; }
    var invoice = INVOICE_MID[answers[0]];
    var late = LATE_DAYS[answers[2]];
    var trapped = invoice * late / 30;
    var band, cls, diag;
    if(score<=7){ band='Tight'; cls='tight';
      diag="You mostly get paid on time and someone (or something) is on it. The leak is minor. Keep an eye on it as you grow, because DSO creeps up quietly with headcount."; }
    else if(score<=15){ band='Leaking'; cls='leaking';
      diag="You're the bottleneck. Chasing depends on you remembering, and the cash shows it. This is where most founder-led agencies sit, and it's exactly the point where installing an AR function pays for itself."; }
    else{ band='Bleeding'; cls='bleeding';
      diag="Serious cash is trapped and you're financing your clients for free. This is costing you real money and real stress, and it will get worse before you hire, not after. Fix the receivables before you add another salary."; }

    var bl = $('bandLabel'); bl.textContent = band; bl.className = 'band ' + cls;
    var big = $('bigNum'), nl = $('numLabel');
    if(trapped >= 1000){
      big.className = 'num'; big.textContent = gbp(trapped);
      nl.textContent = "is roughly the cash sitting in someone else's account right now, on " + gbp(invoice) + "/month invoiced and clients paying about " + late + " days late. You're financing it, every month, for free.";
    } else {
      big.className = 'num small'; big.textContent = 'Barely a leak';
      nl.textContent = "On your answers, very little cash is trapped by late payment right now. Nice. The score below still flags where it could start.";
    }
    $('scorePill').textContent = 'Leak score ' + score + ' of 24';
    $('diag').textContent = diag;
    show('result');
  }
  function restart(){ idx=0; answers.fill(null); $('progWrap').classList.add('hidden'); show('intro'); }

  document.addEventListener('DOMContentLoaded', function(){
    $('startBtn').addEventListener('click', start);
    $('backBtn').addEventListener('click', back);
    $('restartLink').addEventListener('click', function(e){ e.preventDefault(); restart(); });
  });
})();
