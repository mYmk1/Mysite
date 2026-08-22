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

/* Company domain map for logos */
const COMPANY_DOMAINS = {
  'pixster studio':    'pixsterstudio.com',
  'amazon':            'amazon.com',
  'bolt.earth':        'bolt.earth',
  'signzy':            'signzy.com',
  'aditi consulting':  'aditiconsulting.com',
  'razorpay':          'razorpay.com',
  'swiggy':            'swiggy.com',
  'nextleap':          'nextleap.app',
};

function getLogoUrl(company) {
  const key = company.toLowerCase().trim();
  const domain = COMPANY_DOMAINS[key] || (key.replace(/\s+/g,'')+'.com');
  return 'https://www.google.com/s2/favicons?domain=' + domain + '&sz=64';
}

function logoHTML(company, name) {
  const initials = name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  const logoUrl  = getLogoUrl(company);
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
