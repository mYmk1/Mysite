const SHEET_CSV_URL    = 'https://corsproxy.io/?' + encodeURIComponent('https://docs.google.com/spreadsheets/d/e/2PACX-1vTsFwkypzI7JW_omDIy3g6Xv0d21pbZDByzSC42C4DpA7tsmszgKQlb--1Jts-X7ce2C0R5NL2DtZWp/pub?gid=630245143&single=true&output=csv');
const FEEDBACK_FORM_URL = 'https://forms.gle/eQr23g1ryaqf8FsR9';
let audioCtx = null;

document.addEventListener('DOMContentLoaded', () => {
  setupClock();
  setupSound();
  setupReveal();
  loadTestimonials();
  setupFeedback();
  drawRain();
});

/* LIVE CLOCK */
function setupClock() {
  const el = document.querySelector('.clock');
  function tick() {
    const now = new Date();
    el.textContent = String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');
  }
  tick();
  setInterval(tick, 30000);
}

/* PHONE RINGTONE — plays once */
function setupSound() {
  const btn  = document.getElementById('sound-btn');
  const eq   = document.getElementById('eq');
  const icon = document.getElementById('phone-icon');
  let played = false;

  btn.addEventListener('click', () => {
    if (played) return;
    played = true;
    icon.classList.add('ringing');
    eq.classList.add('playing');
    setTimeout(() => { icon.classList.remove('ringing'); eq.classList.remove('playing'); }, 1600);
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      playRingtone(audioCtx);
    } catch(e) {}
  });
}

function playRingtone(ctx) {
  const master = ctx.createGain();
  master.gain.value = 0.2;
  master.connect(ctx.destination);
  const notes = [
    {f:480,s:0},{f:620,s:0},
    {f:480,s:0.28},{f:620,s:0.28},
    {f:480,s:0.56},{f:620,s:0.56},
  ];
  notes.forEach(n => {
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.type = 'sine'; osc.frequency.value = n.f;
    const t = ctx.currentTime + n.s;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(1, t + 0.01);
    g.gain.linearRampToValueAtTime(0, t + 0.2);
    osc.connect(g); g.connect(master);
    osc.start(t); osc.stop(t + 0.22);
  });
}

/* RAIN CANVAS */
function drawRain() {
  const canvas = document.getElementById('rain');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
  resize();
  window.addEventListener('resize', resize);
  const drops = Array.from({length:110}, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    len: Math.random() * 16 + 7,
    speed: Math.random() * 4 + 2.5,
    op: Math.random() * 0.22 + 0.04,
  }));
  function frame() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    drops.forEach(d => {
      ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x-1, d.y+d.len);
      ctx.strokeStyle = `rgba(200,215,220,${d.op})`; ctx.lineWidth = 0.7; ctx.stroke();
      d.y += d.speed;
      if (d.y > canvas.height) { d.y = -d.len; d.x = Math.random() * canvas.width; }
    });
    requestAnimationFrame(frame);
  }
  frame();
}

/* SCROLL REVEAL */
function setupReveal() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const siblings = el.parentElement.querySelectorAll('.sr');
      const idx = Array.from(siblings).indexOf(el);
      setTimeout(() => el.classList.add('visible'), idx * 100);
      obs.unobserve(el);
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.sr').forEach(el => obs.observe(el));
}

/* TESTIMONIALS */
async function loadTestimonials() {
  const grid = document.getElementById('testimonials-grid');
  if (!SHEET_CSV_URL) { grid.innerHTML = '<div class="t-empty">Testimonials coming soon.</div>'; return; }
  try {
    const rows = parseCSV(await (await fetch(SHEET_CSV_URL)).text());
    if (!rows.length) { grid.innerHTML = '<div class="t-empty">Testimonials loading.</div>'; return; }
    grid.innerHTML = rows.map(r => `
      <div class="t-card sr">
        <p class="t-quote">${clean(r.feedback)}</p>
        <div class="t-meta">
          <p class="t-name">${clean(r.name)}</p>
          <p class="t-role">${clean(r.company)}${r.rating ? ' · <span style="color:var(--amber);font-size:0.72rem;">' + clean(r.rating) + '</span>' : ''}</p>
        </div>
      </div>`).join('');
    document.querySelectorAll('.t-card.sr').forEach(el => {
      const o = new IntersectionObserver(e=>{if(e[0].isIntersecting){el.classList.add('visible');o.disconnect();}},{threshold:0.1});
      o.observe(el);
    });
  } catch { grid.innerHTML = '<div class="t-empty">Testimonials coming soon.</div>'; }
}

function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const cols = splitLine(lines[0]);
  /* Map by column position — matches Google Form export order:
     0: Timestamp, 1: Name, 2: Company, 3: Standout, 4: Followthrough */
  return lines.slice(1).map(line => {
    const c = splitLine(line);
    return {
      name:     (c[1]||'').trim().replace(/^"|"$/g,''),
      company:  (c[2]||'').trim().replace(/^"|"$/g,''),
      feedback: (c[3]||'').trim().replace(/^"|"$/g,''),
      rating:   (c[4]||'').trim().replace(/^"|"$/g,''),
    };
  }).filter(r => r.feedback && r.name);
}
function splitLine(line){const r=[];let c='',q=false;for(const ch of line){if(ch==='"')q=!q;else if(ch===','&&!q){r.push(c);c='';}else c+=ch;}r.push(c);return r;}
function clean(s=''){return s.replace(/</g,'&lt;').replace(/>/g,'&gt;');}

function setupFeedback() {
  const btn = document.getElementById('feedback-btn');
  if (!btn) return;
  if (FEEDBACK_FORM_URL){btn.href=FEEDBACK_FORM_URL;btn.target='_blank';}
  else btn.addEventListener('click',e=>{e.preventDefault();alert('Feedback form coming soon!');});
}
