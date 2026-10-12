// ChronoSport — moteur de minuteur partagé (index.html + 4fantastiques.html).
// Le temps est calculé à partir d'horodatages (Date.now()) et non en comptant
// des ticks : le minuteur reste juste en arrière-plan et survit à un
// rafraîchissement de page (l'état est persisté dans le localStorage).
'use strict';

const Chrono = (() => {
  const fmt = (s) => {
    s = Math.max(0, s);
    const m = Math.floor(s / 60), sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  // --- Stockage tolérant aux erreurs (navigation privée, quota, JSON corrompu) ---
  const storage = {
    get(key) { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; } catch { return null; } },
    set(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} },
    remove(key) { try { localStorage.removeItem(key); } catch {} },
  };

  // Anciennes clés (avant le moteur v2)
  storage.remove('chronoState');
  storage.remove('chronoState_v1');

  // Lève une erreur explicite si la séquence est invalide.
  function validateSeq(seq) {
    if (!Array.isArray(seq)) throw new Error('La séquence doit être un tableau');
    if (seq.length === 0) throw new Error('La séquence est vide');
    for (const it of seq) {
      if (typeof it !== 'object' || it === null) throw new Error('Chaque élément doit être un objet');
      if (typeof it.label !== 'string') throw new Error('Chaque étape doit avoir une propriété "label" de type string');
      if (!Number.isInteger(it.duration) || it.duration <= 0) throw new Error('Chaque étape doit avoir une propriété "duration" (nombre entier de secondes > 0)');
      if (it.type !== undefined && typeof it.type !== 'string') throw new Error('Propriété "type" invalide');
    }
    return seq;
  }
  const isValidSeq = (seq) => { try { validateSeq(seq); return true; } catch { return false; } };

  // --- Audio : un seul AudioContext, débloqué au premier geste utilisateur ---
  const audio = {
    ctx: null,
    listeners: [],
    unlock() {
      try {
        if (!this.ctx) {
          const AC = window.AudioContext || window.webkitAudioContext;
          if (!AC) return;
          this.ctx = new AC();
          this.ctx.addEventListener('statechange', () => this.listeners.forEach((fn) => fn(this.ready)));
        }
        if (this.ctx.state !== 'running') this.ctx.resume().catch(() => {});
      } catch {}
    },
    get ready() { return !!this.ctx && this.ctx.state === 'running'; },
    onChange(fn) { this.listeners.push(fn); },
    beep(high) {
      if (!this.ready) return;
      const ctx = this.ctx, t = ctx.currentTime;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = high ? 880 : 440;
      g.gain.setValueAtTime(0.6, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      o.connect(g); g.connect(ctx.destination);
      o.start(t); o.stop(t + 0.19);
    },
  };
  ['pointerdown', 'touchend', 'keydown'].forEach((ev) =>
    document.addEventListener(ev, () => audio.unlock(), { capture: true, passive: true }));

  // --- Wake Lock : maintenu tant que `wanted`, ré-acquis au retour sur la page ---
  const wake = {
    supported: 'wakeLock' in navigator,
    lock: null,
    pending: false,
    wanted: false,
    listeners: [],
    onChange(fn) { this.listeners.push(fn); fn(this.status()); },
    status() {
      if (!this.supported) return 'Non supporté';
      if (this.lock) return 'Actif';
      return this.wanted ? 'En attente' : 'Inactif';
    },
    emit() { const s = this.status(); this.listeners.forEach((fn) => fn(s)); },
    async acquire() {
      this.wanted = true;
      if (!this.supported || this.lock || this.pending || document.visibilityState !== 'visible') { this.emit(); return; }
      this.pending = true;
      try {
        const l = await navigator.wakeLock.request('screen');
        if (!this.wanted) { l.release().catch(() => {}); return; }
        this.lock = l;
        l.addEventListener('release', () => { if (this.lock === l) this.lock = null; this.emit(); });
      } catch (e) {
        console.warn('Wake lock refusé', e);
      } finally {
        this.pending = false;
        this.emit();
      }
    },
    async release() {
      this.wanted = false;
      const l = this.lock;
      this.lock = null;
      if (l) { try { await l.release(); } catch {} }
      this.emit();
    },
  };
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && wake.wanted) wake.acquire();
  });

  // --- Minuteur ---
  // hooks: { render(snap), state(snap), step(snap), countdown(sec, snap), finish(snap) }
  function createTimer({ storageKey, hooks = {} }) {
    let seq = [], idx = 0;
    let running = false, started = false, finished = false, loop = false;
    let stepEndAt = 0;   // horodatage (ms) de fin de l'étape courante, si running
    let remainingMs = 0; // temps restant (ms) dans l'étape courante, si en pause
    let meta = {};       // données libres persistées avec l'état (ex. preset)
    let intervalId = null;
    let lastSec = null;

    const call = (name, ...args) => { if (hooks[name]) hooks[name](...args); };
    const durMs = (i) => seq[i].duration * 1000;
    const totalMs = () => seq.reduce((a, s) => a + s.duration * 1000, 0);
    const currentRemainingMs = () => (running ? Math.max(0, stepEndAt - Date.now()) : remainingMs);

    function snapshot() {
      const remMs = finished ? 0 : currentRemainingMs();
      const total = totalMs();
      let elapsed = 0;
      if (finished) elapsed = total;
      else if (seq.length) {
        for (let i = 0; i < idx; i++) elapsed += durMs(i);
        elapsed += durMs(idx) - remMs;
      }
      return {
        seq, idx, current: seq[idx] || null,
        running, started, finished, loop, meta,
        secLeft: Math.ceil(remMs / 1000),
        totalSec: Math.round(total / 1000),
        totalLeftSec: Math.ceil((total - elapsed) / 1000),
        progress: total ? Math.min(1, Math.max(0, elapsed / total)) : 0,
      };
    }

    function save() {
      storage.set(storageKey, { v: 2, seq, idx, running, started, finished, loop, stepEndAt, remainingMs, meta });
    }

    function startInterval() { if (!intervalId) intervalId = setInterval(tick, 200); }
    function stopInterval() { if (intervalId) { clearInterval(intervalId); intervalId = null; } }

    function finish() {
      running = false; started = false; finished = true;
      idx = seq.length - 1; remainingMs = 0;
      stopInterval();
    }

    // Fait avancer la séquence jusqu'à `now`. Retourne le nombre d'étapes franchies.
    function advance(now) {
      let steps = 0;
      if (loop && now - stepEndAt > totalMs()) {
        // Absence très longue en mode boucle : on saute les cycles complets.
        stepEndAt += Math.floor((now - stepEndAt) / totalMs()) * totalMs();
      }
      while (running && now >= stepEndAt) {
        idx++;
        steps++;
        if (idx >= seq.length) {
          if (!loop) { finish(); break; }
          idx = 0;
        }
        stepEndAt += durMs(idx);
      }
      return steps;
    }

    function tick() {
      if (!running) return;
      const steps = advance(Date.now());
      const snap = snapshot();
      if (steps > 0) {
        save();
        if (finished) { call('finish', snap); call('state', snap); }
        else call('step', snap);
      } else if (snap.secLeft !== lastSec && snap.secLeft >= 1 && snap.secLeft <= 3) {
        call('countdown', snap.secLeft, snap);
      }
      lastSec = snap.secLeft;
      call('render', snap);
    }

    function emitState() {
      const snap = snapshot();
      lastSec = snap.secLeft;
      call('state', snap);
      call('render', snap);
    }

    function load(newSeq, newMeta = {}) {
      validateSeq(newSeq);
      stopInterval();
      seq = newSeq.map((s) => ({ ...s }));
      meta = newMeta;
      idx = 0; running = false; started = false; finished = false;
      remainingMs = durMs(0);
      save();
      emitState();
    }

    function start() {
      if (!seq.length || running) return;
      if (finished) { idx = 0; finished = false; remainingMs = durMs(0); }
      running = true; started = true;
      stepEndAt = Date.now() + remainingMs;
      startInterval();
      save();
      emitState();
    }

    function pause() {
      if (!running) return;
      remainingMs = Math.max(0, stepEndAt - Date.now());
      running = false;
      stopInterval();
      save();
      emitState();
    }

    function reset() { load(seq, meta); }

    function setLoop(v) { loop = !!v; if (seq.length) save(); }

    // Restaure l'état sauvegardé et rattrape le temps écoulé pendant le rechargement.
    function restore() {
      const s = storage.get(storageKey);
      if (!s || s.v !== 2 || !isValidSeq(s.seq) || !Number.isInteger(s.idx) || s.idx < 0 || s.idx >= s.seq.length) return false;
      seq = s.seq; idx = s.idx; meta = s.meta || {};
      running = !!s.running; started = !!s.started; finished = !!s.finished; loop = !!s.loop;
      stepEndAt = Number(s.stepEndAt) || 0;
      remainingMs = Math.min(Math.max(0, Number(s.remainingMs) || 0), durMs(idx));
      if (running) {
        advance(Date.now()); // rattrapage silencieux, sans bips
        if (running) startInterval();
        save();
      }
      emitState();
      return true;
    }

    // Recalcule immédiatement au retour sur la page (timers bridés en arrière-plan).
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') tick(); });
    window.addEventListener('pagehide', () => { if (seq.length) save(); });

    return { load, start, pause, reset, restore, setLoop, snapshot, get seq() { return seq; } };
  }

  // --- Helpers d'interface communs ---
  const STAGE_CLASS = { work: 'text-info', rest: 'text-warning', countin: 'text-secondary' };

  function renderCommon(snap, el) {
    const { current } = snap;
    el.stage.className = `fw-semibold text-uppercase small mb-2 ${snap.finished ? 'text-success' : (STAGE_CLASS[current && current.type] || 'text-info')}`;
    el.stage.textContent = snap.finished ? 'Terminé 🎉' : (current ? current.label : 'Prêt');
    el.time.textContent = fmt(snap.secLeft);
    const pct = Math.round(snap.progress * 100);
    el.progress.style.width = pct + '%';
    el.progress.setAttribute('aria-valuenow', String(pct));
    document.title = snap.running ? `${fmt(snap.secLeft)} · ${el.baseTitle}` : el.baseTitle;
  }

  // Démarrer / Pause / Reprendre / Reset / Recommencer
  function renderControls(snap, { startBtn, pauseBtn, resetBtn }) {
    startBtn.hidden = snap.running;
    pauseBtn.hidden = !snap.running;
    resetBtn.hidden = snap.running || !snap.started;
    if (snap.finished) startBtn.textContent = 'Recommencer';
    else if (snap.started) startBtn.textContent = 'Reprendre';
    else startBtn.textContent = 'Démarrer';
  }

  // Affiche un rappel quand les bips sont bloqués par le navigateur
  // (ex. minuteur restauré après un rafraîchissement, sans geste utilisateur).
  function bindSoundHint(hintEl, shouldShow) {
    const update = () => { hintEl.hidden = audio.ready || !shouldShow(); };
    audio.onChange(update);
    return update;
  }

  return { fmt, storage, validateSeq, audio, wake, createTimer, renderCommon, renderControls, bindSoundHint };
})();
