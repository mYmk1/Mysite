const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTsFwkypzI7JW_omDIy3g6Xv0d21pbZDByzSC42C4DpA7tsmszgKQlb--1Jts-X7ce2C0R5NL2DtZWp/pub?gid=630245143&single=true&output=csv';
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

/* PHONE RINGTONE */
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
  const notes = [{f:480,s:0},{f:620,s:0},{f:480,s:0.28},{f:620,s:0.28},{f:480,s:0.56},{f:620,s:0.56}];
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

/* Embedded logos — base64 */
const LOCAL_LOGOS = {
  'pixster studio': 'data:image/jpeg;base64,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',
  'amazon':         'data:image/jpeg;base64,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',
  'bolt.earth':     'data:image/jpeg;base64,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',
  'signzy':         'data:image/jpeg;base64,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',
};

function getLogoUrl(company) {
  const key = company.toLowerCase().trim();
  return LOCAL_LOGOS[key] || null;
}

function logoHTML(company, name) {
  const initials = name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  const logoUrl  = getLogoUrl(company);
  if (!logoUrl) {
    return `<div class="t-logo-wrap"><div class="t-logo-fallback" style="display:flex;">${initials}</div></div>`;
  }
  return `
    <div class="t-logo-wrap">
      <img
        class="t-logo"
        src="${logoUrl}"
        alt="${clean(company)} logo"
        onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"
      />
      <div class="t-logo-fallback" style="display:none;">${initials}</div>
    </div>`;
}

/* TESTIMONIALS */
async function loadTestimonials() {
  const grid = document.getElementById('testimonials-grid');
  try {
    const res  = await fetch(SHEET_CSV_URL);
    const text = await res.text();
    const rows = parseCSVByPosition(text);
    if (!rows.length) { hardcodedTestimonials(grid); return; }
    renderTestimonials(grid, rows);
  } catch(e) {
    hardcodedTestimonials(grid);
  }
}

function renderTestimonials(grid, rows) {
  grid.innerHTML = rows.map(r => `
    <div class="t-card sr">
      <p class="t-quote">${clean(r.feedback)}</p>
      <div class="t-meta">
        <div class="t-meta-left">
          ${logoHTML(r.company, r.name)}
          <div>
            <p class="t-name">${clean(r.name)}</p>
            <p class="t-role">
              <strong class="t-company">${clean(r.company)}</strong>
              ${r.rating ? ` · <span style="color:var(--amber);font-size:0.72rem;">${clean(r.rating)}</span>` : ''}
            </p>
          </div>
        </div>
        ${r.linkedin ? `<a href="${clean(r.linkedin)}" target="_blank" class="t-linkedin" title="LinkedIn">in</a>` : ''}
      </div>
    </div>`).join('');
  document.querySelectorAll('.t-card.sr').forEach(el => {
    const o = new IntersectionObserver(e => {
      if (e[0].isIntersecting) { el.classList.add('visible'); o.disconnect(); }
    }, { threshold: 0.1 });
    o.observe(el);
  });
}

/* RFC-compliant CSV parser — handles quoted fields with newlines */
function parseCSVByPosition(text) {
  const fields = parseCSVFields(text);
  const rows = [];
  for (let i = 1; i < fields.length; i++) {
    const row = fields[i];
    if (!row || row.length < 4) continue;
    const name     = (row[1] || '').trim();
    const company  = (row[2] || '').trim();
    const feedback = (row[3] || '').trim();
    const rating   = (row[4] || '').trim();
    const linkedin = (row[5] || '').trim();
    if (name && feedback) rows.push({ name, company, feedback, rating, linkedin });
  }
  return rows;
}

function parseCSVFields(text) {
  const rows = [];
  let row = [], field = '', inQ = false, i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"' && text[i+1] === '"') { field += '"'; i += 2; continue; }
      if (ch === '"') { inQ = false; i++; continue; }
      field += ch;
    } else {
      if (ch === '"') { inQ = true; i++; continue; }
      if (ch === ',') { row.push(field); field = ''; i++; continue; }
      if (ch === '\r' && text[i+1] === '\n') { row.push(field); rows.push(row); row = []; field = ''; i += 2; continue; }
      if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; i++; continue; }
      field += ch;
    }
    i++;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function hardcodedTestimonials(grid) {
  const testimonials = [
    { name:'Prantap Singh',         company:'Pixster Studio', rating:'Completely', linkedin:'',
      feedback:'He answers every problem in detail through personal and professional examples and helps with the smallest of doubts, no matter how big or small.' },
    { name:'Ankit Shaw',            company:'Amazon',         rating:'Completely', linkedin:'',
      feedback:'Yunus worked with me on finding solutions where I was stuck. His unwavering support throughout this recruitment cycle has been the bedrock of my success.' },
    { name:'Vignesh Cheepurapalli', company:'Bolt.earth',     rating:'Completely', linkedin:'',
      feedback:'Yunus worked closely with me throughout the entire process, helping me navigate challenges. His proactive approach and consistent support played a key role in driving successful outcomes.' },
    { name:'Ravi Kumar',            company:'Signzy',         rating:'Completely', linkedin:'https://www.linkedin.com/in/ravi-kumar-888564224/',
      feedback:'Always proactive in helping me find solutions whenever I faced a challenge. His problem-solving approach, responsiveness, and strong ownership made the entire process seamless.' },
  ];
  renderTestimonials(grid, testimonials);
}

function clean(s='') { return String(s).replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function setupFeedback() {
  const btn = document.getElementById('feedback-btn');
  if (!btn) return;
  if (FEEDBACK_FORM_URL) { btn.href = FEEDBACK_FORM_URL; btn.target = '_blank'; }
  else btn.addEventListener('click', e => { e.preventDefault(); alert('Feedback form coming soon!'); });
}
