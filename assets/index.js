'use strict';
const $ = (id) => document.getElementById(id);

// --- Elements ---
const el = { stage: $('stage'), time: $('timeDisplay'), progress: $('progressBar'), baseTitle: document.title };
const controls = { startBtn: $('startBtn'), pauseBtn: $('pauseBtn'), resetBtn: $('resetBtn') };
const roundInfo = $('roundInfo');
const inputs = { tabataWork: $('tabataWork'), tabataRest: $('tabataRest'), tabataRounds: $('tabataRounds'), countIn: $('countIn') };
const loopToggle = $('loopToggle');
const soundOn = $('soundOn');
const wakeLockToggle = $('wakeLockToggle');

// --- Réglages persistés ---
const SETTINGS_KEY = 'chronoSport:settings:v1';
const TABATA_DEFAULTS = { tabataWork: 20, tabataRest: 10, tabataRounds: 8, countIn: 5 };

function loadSettings(){
  const s = Chrono.storage.get(SETTINGS_KEY) || {};
  for (const k in inputs) if (Number.isFinite(s[k])) inputs[k].value = s[k];
  if (typeof s.loop === 'boolean') loopToggle.checked = s.loop;
  if (typeof s.sound === 'boolean') soundOn.checked = s.sound;
  if (typeof s.wakeLock === 'boolean') wakeLockToggle.checked = s.wakeLock;
}
function saveSettings(){
  const s = { loop: loopToggle.checked, sound: soundOn.checked, wakeLock: wakeLockToggle.checked };
  for (const k in inputs) s[k] = Number(inputs[k].value);
  Chrono.storage.set(SETTINGS_KEY, s);
}

// --- Séquences ---
const intVal = (input, min, fallback) => Math.max(min, Math.floor(Number(input.value) || fallback));

function buildTabata(){
  const w = intVal(inputs.tabataWork, 1, 20);
  const r = intVal(inputs.tabataRest, 0, 10);
  const rounds = intVal(inputs.tabataRounds, 1, 8);
  const ci = Math.max(0, Math.floor(Number(inputs.countIn.value) || 0));
  const s = [];
  if (ci > 0) s.push({ label: 'Précompte', duration: ci, type: 'countin' });
  for (let i = 1; i <= rounds; i++) {
    s.push({ label: `Exercice ${i}`, duration: w, type: 'work' });
    if (i < rounds && r > 0) s.push({ label: `Pause ${i}`, duration: r, type: 'rest' });
  }
  return s;
}

function build4Fantastiques(){
  return [
    { label: 'Ex 1', duration: 30, type: 'work' },
    { label: 'Pause 1', duration: 10, type: 'rest' },
    { label: 'Ex 2', duration: 60, type: 'work' },
    { label: 'Pause 2', duration: 10, type: 'rest' },
    { label: 'Ex 3', duration: 90, type: 'work' },
    { label: 'Pause 3', duration: 10, type: 'rest' },
    { label: 'Ex 4', duration: 120, type: 'work' }
  ];
}

// --- Minuteur ---
const beep = (high) => { if (soundOn.checked) Chrono.audio.beep(high); };

function syncWake(snap){
  if (snap.running && wakeLockToggle.checked) Chrono.wake.acquire();
  else Chrono.wake.release();
}

const timer = Chrono.createTimer({
  storageKey: 'chronoSport:index:v2',
  hooks: {
    render(snap){
      Chrono.renderCommon(snap, el);
      roundInfo.textContent = snap.finished
        ? `Séquence terminée · ${Chrono.fmt(snap.totalSec)}`
        : `Étape ${snap.idx + 1}/${snap.seq.length} · Total restant ${Chrono.fmt(snap.totalLeftSec)}`;
    },
    state(snap){ Chrono.renderControls(snap, controls); syncWake(snap); updateSoundHint(); },
    step(){ beep(false); },
    countdown(){ beep(true); },
    finish(){ beep(false); }
  }
});

const updateSoundHint = Chrono.bindSoundHint($('soundHint'), () => soundOn.checked && timer.snapshot().running);
Chrono.wake.onChange((status) => { $('wakeStatus').textContent = status; });

// Évite d'écraser par mégarde une séquence en cours.
function confirmReplace(){
  const snap = timer.snapshot();
  return !snap.started || snap.finished || confirm('Une séquence est en cours. La remplacer ?');
}

// --- Event bindings ---
controls.startBtn.addEventListener('click', () => timer.start());
controls.pauseBtn.addEventListener('click', () => timer.pause());
controls.resetBtn.addEventListener('click', () => timer.reset());

$('presetTabata').addEventListener('click', () => {
  if (!confirmReplace()) return;
  for (const k in inputs) inputs[k].value = TABATA_DEFAULTS[k];
  saveSettings();
  timer.load(buildTabata(), { preset: 'tabata' });
});
$('preset4F').addEventListener('click', () => {
  if (!confirmReplace()) return;
  timer.load(build4Fantastiques(), { preset: '4f' });
});
$('customStart').addEventListener('click', () => {
  if (!confirmReplace()) return;
  timer.load(buildTabata(), { preset: 'custom' });
  timer.start();
});

for (const k in inputs) inputs[k].addEventListener('change', saveSettings);
loopToggle.addEventListener('change', () => { saveSettings(); timer.setLoop(loopToggle.checked); });
soundOn.addEventListener('change', () => { saveSettings(); updateSoundHint(); });
wakeLockToggle.addEventListener('change', () => { saveSettings(); syncWake(timer.snapshot()); });

$('exportBtn').addEventListener('click', () => {
  const seq = timer.seq;
  if (!seq.length) return alert('Aucune séquence chargée');
  const blob = new Blob([JSON.stringify(seq, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'sequence.json';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

const importFile = $('importFile');
$('importBtn').addEventListener('click', () => importFile.click());
importFile.addEventListener('change', (ev) => {
  const f = ev.target.files && ev.target.files[0];
  if (!f) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = Chrono.validateSeq(JSON.parse(e.target.result));
      if (!confirmReplace()) return;
      timer.load(data, { preset: 'import' });
      alert('Séquence importée avec succès');
    } catch (err) {
      console.error(err);
      alert('Erreur lors de l\'import : ' + err.message);
    } finally { importFile.value = ''; }
  };
  reader.onerror = () => { alert('Impossible de lire le fichier'); importFile.value = ''; };
  reader.readAsText(f);
});

// Raccourci : touche 4 = lancer les 4 Fantastiques (ignoré pendant la saisie)
document.addEventListener('keydown', (e) => {
  if (e.key !== '4' || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.target.closest && e.target.closest('input, textarea, select, [contenteditable]')) return;
  if (!confirmReplace()) return;
  timer.load(build4Fantastiques(), { preset: '4f' });
  timer.start();
});

// --- Init : restaure l'état (même en cours de séance), sinon preset Tabata ---
loadSettings();
if (!timer.restore()) timer.load(buildTabata(), { preset: 'tabata' });
timer.setLoop(loopToggle.checked);
