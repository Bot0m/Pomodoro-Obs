(() => {
  const defaultSettings = {
    focusDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    cyclesBeforeLongBreak: 4,
    totalFocusCount: 1000,
    bgColor: '#ba4949',
    textColor: '#ffffff',
    accentColor: '#ffffff',
    fontFamily: 'google:Inter:wght@400;600',
    soundEnabled: true,
  };

  const elements = {
    timerDisplay: document.getElementById('timerDisplay'),
    stateLabel: document.getElementById('stateLabel'),
    sessionMessage: document.getElementById('sessionMessage'),
    startPauseBtn: document.getElementById('startPauseBtn'),
    resetBtn: document.getElementById('resetBtn'),
    skipBtn: document.getElementById('skipBtn'),
    restartBtn: document.getElementById('restartBtn'),
    saveHint: document.getElementById('saveHint'),
    applyBtn: document.getElementById('applyBtn'),
    resetSettingsBtn: document.getElementById('resetSettingsBtn'),
    cycleDots: document.getElementById('cycleDots'),
    settingsToggle: document.getElementById('settingsToggle'),
    inputs: {
      focusDuration: document.getElementById('focusDuration'),
      shortBreakDuration: document.getElementById('shortBreakDuration'),
      longBreakDuration: document.getElementById('longBreakDuration'),
      cyclesBeforeLongBreak: document.getElementById('cyclesBeforeLongBreak'),
      bgColor: document.getElementById('bgColor'),
      textColor: document.getElementById('textColor'),
      soundEnabled: document.getElementById('soundEnabled'),
    },
  };

  const storageKey = 'pomodoroSettingsV1';

  let settings = loadSettings();
  let currentState = 'focus'; // focus | shortBreak | longBreak
  let remainingSeconds = settings.focusDuration * 60;
  let isRunning = false;
  let timerId = null;
  let lastTick = null;
  let accumulator = 0;
  let focusCompleted = 0;
  let cycleCounter = 0;
  let sessionComplete = false;
  let audioContext;

  initialize();

  function initialize() {
    document.body.classList.add('settings-hidden');
    bindEvents();
    populateSettingsForm();
    applyTheme();
    updateUI();
    renderCycleDots();
  }

  function bindEvents() {
    elements.startPauseBtn.addEventListener('click', handleStartPause);
    elements.resetBtn.addEventListener('click', resetSession);
    elements.skipBtn.addEventListener('click', skipState);
    elements.restartBtn.addEventListener('click', restartCurrentSegment);
    elements.timerDisplay.addEventListener('click', handleStartPause);
    window.addEventListener('keydown', (event) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (event.code === 'Space') {
        event.preventDefault();
        handleStartPause();
      }
      if (event.key === 'r') resetSession();
      if (event.key === 's') skipState();
      if (event.key === 'Escape') {
        toggleSettings(true);
      }
    });
    elements.applyBtn.addEventListener('click', applySettingsFromForm);
    elements.resetSettingsBtn.addEventListener('click', () => {
      settings = { ...defaultSettings };
      saveSettings();
      populateSettingsForm();
      applyTheme();
      resetSession();
      flashHint('Défauts restaurés');
    });

    Object.entries(elements.inputs).forEach(([key, input]) => {
      input.addEventListener('input', () => {
        applySettingsFromForm({ silent: true });
      });
    });

    elements.settingsToggle?.addEventListener('click', () => toggleSettings());
  }

  function handleStartPause() {
    if (sessionComplete) {
      resetSession();
    }

    if (isRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  }

  function startTimer() {
    if (isRunning || sessionComplete) return;
    isRunning = true;
    lastTick = performance.now();
    accumulator = 0;
    timerId = setInterval(tick, 250);
    updateUI();
  }

  function pauseTimer() {
    isRunning = false;
    if (timerId) clearInterval(timerId);
    timerId = null;
    updateUI();
  }

  function resetSession() {
    pauseTimer();
    focusCompleted = 0;
    cycleCounter = 0;
    sessionComplete = false;
    setState('focus');
    elements.sessionMessage.textContent = 'Prêt à démarrer.';
    updateUI();
  }

  function restartCurrentSegment() {
    pauseTimer();
    sessionComplete = false;
    remainingSeconds = getDurationForState(currentState);
    accumulator = 0;
    lastTick = performance.now();
    elements.sessionMessage.textContent = 'Segment redémarré.';
    updateUI();
  }

  function skipState() {
    if (sessionComplete) {
      resetSession();
      return;
    }

    const wasRunning = isRunning;
    if (currentState === 'focus') {
      focusCompleted += 1;
      cycleCounter += 1;
      if (focusCompleted >= settings.totalFocusCount) {
        sessionComplete = true;
        pauseTimer();
        elements.sessionMessage.textContent = 'Session complète. Reset pour recommencer.';
        updateUI();
        return;
      }
      const nextState = cycleCounter % settings.cyclesBeforeLongBreak === 0 ? 'longBreak' : 'shortBreak';
      setState(nextState);
    } else {
      setState('focus');
    }

    if (wasRunning) startTimer();
  }

  function nextStateFromSkip() {
    if (currentState === 'focus') {
      // Skip focus without counting it
      return cycleCounter % settings.cyclesBeforeLongBreak === settings.cyclesBeforeLongBreak - 1
        ? 'longBreak'
        : 'shortBreak';
    }
    return 'focus';
  }

  function tick() {
    if (!isRunning || sessionComplete) return;
    const now = performance.now();
    if (!lastTick) {
      lastTick = now;
      return;
    }

    accumulator += now - lastTick;
    lastTick = now;

    let didChange = false;
    while (accumulator >= 1000 && remainingSeconds > 0) {
      remainingSeconds -= 1;
      accumulator -= 1000;
      didChange = true;
    }

    if (remainingSeconds <= 0) {
      remainingSeconds = 0;
      updateUI();
      completeCycle();
      return;
    }

    if (didChange) updateUI();
  }

  function completeCycle() {
    playChime();

    if (currentState === 'focus') {
      focusCompleted += 1;
      cycleCounter += 1;

      if (focusCompleted >= settings.totalFocusCount) {
        sessionComplete = true;
        pauseTimer();
        elements.sessionMessage.textContent = 'Session complète. Reset pour recommencer.';
        updateUI();
        return;
      }

      if (cycleCounter % settings.cyclesBeforeLongBreak === 0) {
        setState('longBreak');
      } else {
        setState('shortBreak');
      }
    } else {
      setState('focus');
    }

    // Continue running automatically if the timer was active
    if (!isRunning) {
      startTimer();
    } else {
      lastTick = performance.now();
      accumulator = 0;
    }
  }

  function setState(newState) {
    currentState = newState;
    remainingSeconds = getDurationForState(newState);
    accumulator = 0;
    lastTick = performance.now();
    updateUI();
  }

  function getDurationForState(state) {
    switch (state) {
      case 'focus':
        return settings.focusDuration * 60;
      case 'shortBreak':
        return settings.shortBreakDuration * 60;
      case 'longBreak':
        return settings.longBreakDuration * 60;
      default:
        return settings.focusDuration * 60;
    }
  }

  function applySettingsFromForm(options = {}) {
    const nextSettings = { ...settings };
    nextSettings.focusDuration = clampNumber(elements.inputs.focusDuration.value, 1, 180, settings.focusDuration);
    nextSettings.shortBreakDuration = clampNumber(elements.inputs.shortBreakDuration.value, 1, 120, settings.shortBreakDuration);
    nextSettings.longBreakDuration = clampNumber(elements.inputs.longBreakDuration.value, 1, 240, settings.longBreakDuration);
    nextSettings.cyclesBeforeLongBreak = clampNumber(elements.inputs.cyclesBeforeLongBreak.value, 2, 8, settings.cyclesBeforeLongBreak);
    nextSettings.totalFocusCount = settings.totalFocusCount;
    nextSettings.bgColor = parseHex(elements.inputs.bgColor.value, defaultSettings.bgColor);
    nextSettings.textColor = parseHex(elements.inputs.textColor.value, defaultSettings.textColor);
    nextSettings.accentColor = nextSettings.textColor;
    nextSettings.soundEnabled = elements.inputs.soundEnabled.checked;

    settings = nextSettings;
    saveSettings();
    applyTheme();
    renderCycleDots();

    if (!isRunning && !sessionComplete) {
      remainingSeconds = getDurationForState(currentState);
    }

    updateUI();
    if (!options.silent) {
      flashHint('Paramètres appliqués');
    }
  }

  function populateSettingsForm() {
    elements.inputs.focusDuration.value = settings.focusDuration;
    elements.inputs.shortBreakDuration.value = settings.shortBreakDuration;
    elements.inputs.longBreakDuration.value = settings.longBreakDuration;
    elements.inputs.cyclesBeforeLongBreak.value = settings.cyclesBeforeLongBreak;
    elements.inputs.bgColor.value = settings.bgColor;
    elements.inputs.textColor.value = settings.textColor;
    elements.inputs.soundEnabled.checked = settings.soundEnabled;
  }

  function flashHint(text) {
    elements.saveHint.textContent = text;
    elements.saveHint.classList.add('active');
    setTimeout(() => elements.saveHint.classList.remove('active'), 1200);
  }

  function updateUI() {
    elements.timerDisplay.textContent = formatTime(Math.max(0, Math.round(remainingSeconds)));
    elements.stateLabel.textContent = getStateLabel(currentState);
    elements.startPauseBtn.textContent = sessionComplete ? '↺' : isRunning ? '⏸' : '▶';
    elements.startPauseBtn.setAttribute('aria-label', sessionComplete ? 'Redémarrer la session' : isRunning ? 'Mettre en pause' : 'Démarrer');
    elements.skipBtn.disabled = sessionComplete;
    elements.startPauseBtn.disabled = false;
    elements.resetBtn.disabled = false;
    elements.skipBtn.disabled = sessionComplete;
    renderCycleDots();

    elements.sessionMessage.textContent = '';
  }

  function getStateLabel(state) {
    switch (state) {
      case 'focus':
        return 'Focus Time';
      case 'shortBreak':
        return 'Short Break';
      case 'longBreak':
        return 'Long Break';
      default:
        return 'Focus';
    }
  }

  function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  function loadSettings() {
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return { ...defaultSettings };
      return { ...defaultSettings, ...JSON.parse(stored) };
    } catch (error) {
      console.warn('Erreur chargement settings', error);
      return { ...defaultSettings };
    }
  }

  function saveSettings() {
    localStorage.setItem(storageKey, JSON.stringify(settings));
  }

  function applyTheme() {
    const root = document.documentElement;
    root.style.setProperty('--bg', settings.bgColor);
    root.style.setProperty('--text', settings.textColor);
    root.style.setProperty('--accent', settings.accentColor);
    const fontValue = settings.fontFamily.startsWith('google:') ? parseGoogleFont(settings.fontFamily) : settings.fontFamily;
    root.style.setProperty('--font', fontValue);
    injectGoogleFont(settings.fontFamily);
  }

  function parseHex(value, fallback) {
    const hex = (value || '').trim();
    if (/^#([0-9a-fA-F]{6})$/.test(hex)) return hex.toUpperCase();
    return fallback;
  }

  function parseGoogleFont(value) {
    // google:Inter:wght@400;700 => "Inter", sans-serif
    const family = value.replace(/^google:/, '').split(':')[0];
    return `'${family}', system-ui, sans-serif`;
  }

  function injectGoogleFont(value) {
    const existing = document.getElementById('google-font');
    if (!value.startsWith('google:')) {
      if (existing) existing.remove();
      return;
    }

    const fontTag = existing || document.createElement('link');
    fontTag.id = 'google-font';
    fontTag.rel = 'stylesheet';
    const fontRef = value.replace(/^google:/, '').replace(/ /g, '+');
    fontTag.href = `https://fonts.googleapis.com/css2?family=${fontRef}&display=swap`;
    if (!existing) document.head.appendChild(fontTag);
  }

  function clampNumber(value, min, max, fallback) {
    const parsed = parseInt(value, 10);
    if (Number.isNaN(parsed)) return fallback;
    return Math.max(min, Math.min(max, parsed));
  }

  function playChime() {
    if (!settings.soundEnabled) return;
    try {
      if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      const duration = 0.2;
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = 880;
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      gain.gain.setValueAtTime(0.001, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.15, audioContext.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + duration);
    } catch (err) {
      console.warn('Audio non disponible', err);
    }
  }

  function renderCycleDots() {
    if (!elements.cycleDots) return;
    elements.cycleDots.innerHTML = '';
    const totalDots = Math.max(1, settings.cyclesBeforeLongBreak);
    const completedInCycle = cycleCounter % settings.cyclesBeforeLongBreak;
    const activeCount = sessionComplete
      ? totalDots
      : Math.min(totalDots, completedInCycle);

    for (let i = 0; i < totalDots; i += 1) {
      const dot = document.createElement('span');
      dot.className = 'progress-dots__dot';
      if (i < activeCount) {
        dot.classList.add('progress-dots__dot--active');
      }
      elements.cycleDots.appendChild(dot);
    }
  }

  function toggleSettings(force) {
    const shouldHide = typeof force === 'boolean'
      ? force
      : !document.body.classList.contains('settings-hidden');
    if (shouldHide) {
      document.body.classList.add('settings-hidden');
    } else {
      document.body.classList.remove('settings-hidden');
    }
  }
})();
