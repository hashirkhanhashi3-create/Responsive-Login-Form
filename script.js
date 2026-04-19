/* ═══════════════════════════════════════════════════════════
   LOGIN FORM — script.js
   Production-ready authentication script.
   Demo credentials: username = "admin" | password = "password123"
   Remove mockAuthCall() and uncomment the fetch() block when
   connecting to a real backend.
═══════════════════════════════════════════════════════════ */

(() => {
  'use strict';

  /* ────────────────────────────────────────
     DOM REFERENCES
  ──────────────────────────────────────── */
  const form           = document.getElementById('loginForm');
  const uNameInput     = document.getElementById('uName');
  const passInput      = document.getElementById('userPassword');
  const rememberMe     = document.getElementById('rememberMe');
  const btnLogin       = document.getElementById('btnLogin');
  const userError      = document.getElementById('userError');
  const passError      = document.getElementById('passError');
  const statusMsg      = document.getElementById('statusMsg');
  const attemptsWarn   = document.getElementById('attemptsWarn');
  const togglePass     = document.getElementById('togglePass');
  const eyeIcon        = document.getElementById('eyeIcon');
  const lockoutOverlay = document.getElementById('lockoutOverlay');
  const lockCountdown  = document.getElementById('lockCountdown');
  const forgotLink     = document.getElementById('forgotLink');

  /* ────────────────────────────────────────
     CONSTANTS
  ──────────────────────────────────────── */
  const MAX_ATTEMPTS  = 5;
  const LOCKOUT_SECS  = 30;
  const STORAGE_KEY   = 'rememberedUsername';
  const LOCKOUT_KEY   = 'loginLockoutUntil';
  const ATTEMPTS_KEY  = 'loginAttempts';

  /* ────────────────────────────────────────
     STATE
  ──────────────────────────────────────── */
  let isLoading = false;
  let lockTimer = null;

  /* ────────────────────────────────────────
     UTILITY HELPERS
  ──────────────────────────────────────── */

  /** Strip dangerous HTML characters from input strings */
  const sanitize = (str) => str.replace(/[<>"'`]/g, '');

  /** Show inline field error with animation */
  function showError(el, msg) {
    el.textContent = msg;
    el.classList.add('visible');
  }

  /** Clear inline field error */
  function clearError(el) {
    el.textContent = '';
    el.classList.remove('visible');
  }

  /** Show the global status banner (success / error) */
  function showStatus(msg, type = 'error') {
    statusMsg.textContent = msg;
    statusMsg.className = `status-msg show ${type}`;
  }

  /** Hide the global status banner */
  function clearStatus() {
    statusMsg.className = 'status-msg';
    statusMsg.textContent = '';
  }

  /** Toggle button loading state */
  function setLoading(state) {
    isLoading = state;
    btnLogin.disabled = state;
    btnLogin.classList.toggle('loading', state);
  }

  /* ────────────────────────────────────────
     RATE-LIMIT / LOCKOUT LOGIC
  ──────────────────────────────────────── */

  function getAttempts() {
    return parseInt(localStorage.getItem(ATTEMPTS_KEY) || '0', 10);
  }

  function setAttempts(n) {
    localStorage.setItem(ATTEMPTS_KEY, String(n));
  }

  /**
   * Check if a lockout is currently active.
   * Returns true (and starts the countdown UI) if locked, false otherwise.
   */
  function checkLockout() {
    const until = parseInt(localStorage.getItem(LOCKOUT_KEY) || '0', 10);
    if (until > Date.now()) {
      startLockoutUI(Math.ceil((until - Date.now()) / 1000));
      return true;
    }
    return false;
  }

  /** Write a lockout timestamp and begin the lockout UI */
  function triggerLockout() {
    const until = Date.now() + LOCKOUT_SECS * 1000;
    localStorage.setItem(LOCKOUT_KEY, String(until));
    setAttempts(0);
    startLockoutUI(LOCKOUT_SECS);
  }

  /** Display the lockout overlay and count down seconds */
  function startLockoutUI(seconds) {
    lockoutOverlay.classList.add('active');
    let remaining = seconds;
    lockCountdown.textContent = remaining;

    clearInterval(lockTimer);
    lockTimer = setInterval(() => {
      remaining--;
      lockCountdown.textContent = remaining;
      if (remaining <= 0) {
        clearInterval(lockTimer);
        lockoutOverlay.classList.remove('active');
        localStorage.removeItem(LOCKOUT_KEY);
        setAttempts(0);
        attemptsWarn.textContent = '';
      }
    }, 1000);
  }

  /* ────────────────────────────────────────
     VALIDATION
  ──────────────────────────────────────── */

  function validateUsername(val) {
    if (!val)         return 'Username is required.';
    if (val.length < 3)  return 'Username must be at least 3 characters.';
    if (val.length > 60) return 'Username is too long.';
    if (!/^[a-zA-Z0-9._@-]+$/.test(val)) return 'Username contains invalid characters.';
    return null; // valid
  }

  function validatePassword(val) {
    if (!val)          return 'Password is required.';
    if (val.length < 6) return 'Password must be at least 6 characters.';
    return null; // valid
  }

  /* ────────────────────────────────────────
     PAGE LOAD — Restore saved username
  ──────────────────────────────────────── */
  window.addEventListener('load', () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      uNameInput.value = saved;
      rememberMe.checked = true;
    }
    checkLockout();
  });

  /* ────────────────────────────────────────
     REAL-TIME INPUT CLEARING
  ──────────────────────────────────────── */
  uNameInput.addEventListener('input', () => {
    clearError(userError);
    clearStatus();
    uNameInput.classList.remove('is-error');
  });

  passInput.addEventListener('input', () => {
    clearError(passError);
    clearStatus();
    passInput.classList.remove('is-error');
  });

  /* ────────────────────────────────────────
     PASSWORD SHOW / HIDE TOGGLE
  ──────────────────────────────────────── */
  togglePass.addEventListener('click', () => {
    const isHidden = passInput.type === 'password';

    passInput.type = isHidden ? 'text' : 'password';

    // Swap eye icon SVG paths
    eyeIcon.innerHTML = isHidden
      ? /* eye-off */
        `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
         <line x1="1" y1="1" x2="23" y2="23"/>`
      : /* eye-on */
        `<path d="M1 12S5 5 12 5s11 7 11 7-4 7-11 7S1 12 1 12z"/>
         <circle cx="12" cy="12" r="3"/>`;

    togglePass.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
    passInput.focus();
  });

  /* ────────────────────────────────────────
     FORGOT PASSWORD
  ──────────────────────────────────────── */
  forgotLink.addEventListener('click', (e) => {
    e.preventDefault();
    /*
     * BACKEND INTEGRATION POINT — Forgot password
     * Replace the stub below with a real API call, e.g.:
     *
     * const email = prompt('Enter your registered email:');
     * if (email) {
     *   await fetch('/api/auth/forgot-password', {
     *     method: 'POST',
     *     headers: { 'Content-Type': 'application/json' },
     *     body: JSON.stringify({ email })
     *   });
     * }
     */
    showStatus('Password reset link sent! Check your email.', 'success');
  });

  /* ────────────────────────────────────────
     FORM SUBMISSION
  ──────────────────────────────────────── */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Guard: prevent double-submission or submission while locked
    if (isLoading)    return;
    if (checkLockout()) return;

    clearStatus();

    const uname = sanitize(uNameInput.value.trim());
    const pwd   = passInput.value.trim(); // Do NOT sanitize — passwords allow special chars

    // Validate both fields
    const uErr = validateUsername(uname);
    const pErr = validatePassword(pwd);
    let hasErrors = false;

    if (uErr) {
      showError(userError, uErr);
      uNameInput.classList.add('is-error');
      uNameInput.focus();
      hasErrors = true;
    }

    if (pErr) {
      showError(passError, pErr);
      passInput.classList.add('is-error');
      if (!hasErrors) passInput.focus();
      hasErrors = true;
    }

    if (hasErrors) return;

    // ── Begin async auth request ──
    setLoading(true);

    try {
      /*
       * ───────────────────────────────────────────────────────────
       * BACKEND INTEGRATION POINT — Replace mockAuthCall() with:
       *
       * const res = await fetch('/api/auth/login', {
       *   method: 'POST',
       *   headers: { 'Content-Type': 'application/json' },
       *   credentials: 'same-origin',
       *   body: JSON.stringify({ username: uname, password: pwd })
       * });
       *
       * if (!res.ok) {
       *   const errData = await res.json().catch(() => ({}));
       *   throw new Error(errData.message || 'Login failed. Please try again.');
       * }
       *
       * const { token, redirectUrl } = await res.json();
       * localStorage.setItem('authToken', token);
       * window.location.href = redirectUrl || '/dashboard';
       * ───────────────────────────────────────────────────────────
       */
      await mockAuthCall(uname, pwd);

      // ── Success path ──
      setAttempts(0);
      localStorage.removeItem(LOCKOUT_KEY);
      attemptsWarn.textContent = '';

      // Handle Remember Me
      if (rememberMe.checked) {
        localStorage.setItem(STORAGE_KEY, uname);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }

      showStatus('✓ Login successful! Redirecting…', 'success');

      // Redirect after brief delay — replace '#' with your dashboard URL
      setTimeout(() => {
        /* window.location.href = '/dashboard'; */
        showStatus('✓ Logged in! (Demo mode — no redirect configured.)', 'success');
        setLoading(false);
      }, 1500);

    } catch (err) {
      // ── Failure path ──
      setLoading(false);

      const attempts  = getAttempts() + 1;
      setAttempts(attempts);
      const remaining = MAX_ATTEMPTS - attempts;

      if (attempts >= MAX_ATTEMPTS) {
        triggerLockout();
      } else {
        showStatus(err.message || 'Invalid credentials. Please try again.', 'error');
        attemptsWarn.textContent = remaining > 0
          ? `${remaining} attempt${remaining !== 1 ? 's' : ''} remaining before lockout.`
          : '';
        passInput.value = '';
        passInput.focus();
      }
    }
  });

  /* ────────────────────────────────────────
     MOCK AUTH — REMOVE IN PRODUCTION
     Demo accepts: admin / password123
  ──────────────────────────────────────── */
  function mockAuthCall(username, password) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (username === 'admin' && password === 'password123') {
          resolve({ token: 'demo-token-abc123' });
        } else {
          reject(new Error('Invalid username or password.'));
        }
      }, 900);
    });
  }

  /* ────────────────────────────────────────
     SOCIAL LOGIN — expose globally for onclick
  ──────────────────────────────────────── */
  window.socialLogin = (provider) => {
    /*
     * BACKEND INTEGRATION POINT — OAuth redirect, e.g.:
     * window.location.href = `/auth/${provider.toLowerCase()}`;
     */
    showStatus(`Connecting to ${provider}… (OAuth integration pending)`, 'success');
  };

})();
