console.log('Script Loaded');

(function () {
  const STORAGE_KEY = 'chkky_hook_state';
  const TOKENS = ['BTC', 'ETH', 'SOL', 'ADA', 'DOGE', 'XRP', 'AVAX', 'LINK', 'DOT', 'MATIC'];
  const NOTES = [
    'MACD crossover confirmed on the 4h chart.',
    'RSI diverging from price on the 1h timeframe.',
    'Both indicators aligned on the daily close.',
    'Momentum shift confirmed after volume spike.',
    'Trend confirmation on the 4h and 1h timeframes.'
  ];

  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  function daysBetween(a, b) {
    return Math.round((new Date(b) - new Date(a)) / 86400000);
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { streak: 0, lastRevealDate: null, todaysSignal: null, watchlist: [], notif: 'default' };
      return JSON.parse(raw);
    } catch (e) {
      return { streak: 0, lastRevealDate: null, todaysSignal: null, watchlist: [], notif: 'default' };
    }
  }

  function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  let state = loadState();

  const streakCountEl = document.getElementById('streakCount');
  const revealBtn = document.getElementById('revealBtn');
  const signalResult = document.getElementById('signalResult');
  const tokenName = document.getElementById('tokenName');
  const tokenDirection = document.getElementById('tokenDirection');
  const confidenceValue = document.getElementById('confidenceValue');
  const confidenceFill = document.getElementById('confidenceFill');
  const signalNote = document.getElementById('signalNote');
  const notifNudge = document.getElementById('notifNudge');
  const notifBtn = document.getElementById('notifBtn');
  const chipGrid = document.getElementById('chipGrid');
  const watchlistStatus = document.getElementById('watchlistStatus');

  function renderStreak() {
    streakCountEl.textContent = state.streak;
    document.querySelectorAll('.badge').forEach((b) => {
      const need = Number(b.dataset.badge);
      b.classList.toggle('unlocked', state.streak >= need);
    });
  }

  function renderSignal(signal) {
    tokenName.textContent = signal.token;
    tokenDirection.textContent = signal.direction;
    tokenDirection.className = 'direction ' + (signal.direction === 'LONG' ? 'long' : 'short');
    confidenceValue.textContent = signal.confidence + '%';
    signalNote.textContent = signal.note;
    signalResult.classList.add('show');
    requestAnimationFrame(() => { confidenceFill.style.width = signal.confidence + '%'; });
  }

  function generateSignal() {
    const token = TOKENS[Math.floor(Math.random() * TOKENS.length)];
    const direction = Math.random() > 0.5 ? 'LONG' : 'SHORT';
    const confidence = Math.floor(62 + Math.random() * 34); // 62-96
    const note = NOTES[Math.floor(Math.random() * NOTES.length)];
    return { token, direction, confidence, note };
  }

  function maybeShowNotifNudge() {
    if (state.notif === 'default' && typeof Notification !== 'undefined' && Notification.permission === 'default') {
      notifNudge.classList.add('show');
    }
  }

  function handleReveal() {
    const today = todayStr();

    if (state.lastRevealDate === today && state.todaysSignal) {
      renderSignal(state.todaysSignal);
      revealBtn.disabled = true;
      revealBtn.textContent = 'Come back tomorrow';
      return;
    }

    if (state.lastRevealDate) {
      const gap = daysBetween(state.lastRevealDate, today);
      state.streak = gap === 1 ? state.streak + 1 : 1;
    } else {
      state.streak = 1;
    }

    const signal = generateSignal();
    state.lastRevealDate = today;
    state.todaysSignal = signal;
    saveState(state);

    renderStreak();
    renderSignal(signal);
    revealBtn.disabled = true;
    revealBtn.textContent = 'Come back tomorrow';
    maybeShowNotifNudge();
  }

  function initReveal() {
    const today = todayStr();
    renderStreak();

    if (state.lastRevealDate === today && state.todaysSignal) {
      renderSignal(state.todaysSignal);
      revealBtn.disabled = true;
      revealBtn.textContent = 'Come back tomorrow';
    } else if (state.lastRevealDate && daysBetween(state.lastRevealDate, today) > 1) {
      // streak lapsed — reset on next reveal, but don't punish silently before they act
      state.streak = 0;
      saveState(state);
      renderStreak();
    }
  }

  function initNotif() {
    if (typeof Notification === 'undefined') {
      notifBtn.disabled = true;
      notifBtn.textContent = 'Unsupported';
      return;
    }
    notifBtn.addEventListener('click', () => {
      Notification.requestPermission().then((perm) => {
        state.notif = perm;
        saveState(state);
        notifNudge.classList.remove('show');
      });
    });
  }

  function renderWatchlist() {
    chipGrid.innerHTML = '';
    TOKENS.forEach((token) => {
      const chip = document.createElement('button');
      chip.className = 'chip' + (state.watchlist.includes(token) ? ' active' : '');
      chip.textContent = token;
      chip.addEventListener('click', () => {
        const idx = state.watchlist.indexOf(token);
        if (idx === -1) state.watchlist.push(token);
        else state.watchlist.splice(idx, 1);
        saveState(state);
        renderWatchlist();
      });
      chipGrid.appendChild(chip);
    });
    watchlistStatus.textContent = state.watchlist.length + ' token' + (state.watchlist.length === 1 ? '' : 's') + ' tracked';
  }

  revealBtn.addEventListener('click', handleReveal);
  initReveal();
  initNotif();
  renderWatchlist();
})();
