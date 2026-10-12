'use strict';
const $ = (id) => document.getElementById(id);

const SEQ_4F = [
  { label: 'Partie 1 : Exos 1', duration: 30, type: 'work' },
  { label: 'Pause', duration: 10, type: 'rest' },
  { label: 'Partie 2 : Exos 1', duration: 30, type: 'work' },
  { label: 'Partie 2 : Exos 2', duration: 30, type: 'work' },
  { label: 'Pause', duration: 10, type: 'rest' },
  { label: 'Partie 3 : Exos 1', duration: 30, type: 'work' },
  { label: 'Partie 3 : Exos 2', duration: 30, type: 'work' },
  { label: 'Partie 3 : Exos 3', duration: 30, type: 'work' },
  { label: 'Pause', duration: 10, type: 'rest' },
  { label: 'Partie 4 : Exos 1', duration: 30, type: 'work' },
  { label: 'Partie 4 : Exos 2', duration: 30, type: 'work' },
  { label: 'Partie 4 : Exos 3', duration: 30, type: 'work' },
  { label: 'Partie 4 : Exos 4', duration: 30, type: 'work' }
];

// --- Elements ---
const el = { stage: $('stage'), time: $('timeDisplay'), progress: $('progressBar'), baseTitle: document.title };
const controls = { startBtn: $('startBtn'), pauseBtn: $('pauseBtn'), resetBtn: $('resetBtn') };
const overview = $('overview');

// --- Grille d'avancement ---
// Colonne = numéro de partie (extrait du label), ligne = rang de l'exo dans la partie.
const cols = [[], [], [], []];
SEQ_4F.forEach((s, i) => {
  if (s.type !== 'work') return;
  const m = /Partie\s*(\d+)/i.exec(s.label);
  const part = m ? Math.max(1, Math.min(4, parseInt(m[1], 10))) : 1;
  cols[part - 1].push({ i, label: s.label });
});

const cells = [];
for (let r = 0; r < 4; r++) {
  for (let c = 0; c < 4; c++) {
    const cell = document.createElement('div');
    cell.className = 'overview-cell';
    cell.setAttribute('role', 'listitem');
    const st = document.createElement('div');
    st.className = 'status';
    st.setAttribute('aria-hidden', 'true');
    cell.appendChild(st);
    overview.appendChild(cell);
    cells.push({ cell, st, item: cols[c][r] || null });
  }
}

function renderOverview(snap){
  for (const { cell, st, item } of cells) {
    let icon = '', state = '';
    if (item) {
      if (snap.finished || item.i < snap.idx) { icon = '🟩'; state = 'terminé'; }
      else if (item.i === snap.idx) { icon = snap.running ? '⏳' : '🟦'; state = 'en cours'; }
      else state = 'à venir';
    }
    if (st.textContent !== icon) st.textContent = icon;
    if (item) cell.setAttribute('aria-label', `${item.label} : ${state}`);
    else cell.setAttribute('aria-hidden', 'true');
  }
}

// --- Minuteur ---
function syncWake(snap){
  if (snap.running) Chrono.wake.acquire();
  else Chrono.wake.release();
}

const timer = Chrono.createTimer({
  storageKey: 'chronoSport:4f:v2',
  hooks: {
    render(snap){ Chrono.renderCommon(snap, el); renderOverview(snap); },
    state(snap){ Chrono.renderControls(snap, controls); syncWake(snap); updateSoundHint(); },
    step(){ Chrono.audio.beep(false); },
    countdown(){ Chrono.audio.beep(true); },
    finish(){ Chrono.audio.beep(false); }
  }
});

const updateSoundHint = Chrono.bindSoundHint($('soundHint'), () => timer.snapshot().running);
Chrono.wake.onChange((status) => { $('wakeStatus').textContent = status; });

controls.startBtn.addEventListener('click', () => timer.start());
controls.pauseBtn.addEventListener('click', () => timer.pause());
controls.resetBtn.addEventListener('click', () => timer.load(SEQ_4F));

// --- Init : restaure l'état (même en cours de séance) si la séquence n'a pas changé ---
if (!timer.restore() || JSON.stringify(timer.seq) !== JSON.stringify(SEQ_4F)) timer.load(SEQ_4F);
