/* ==========================================================================
   NIELLOR — authentication

   Real Supabase Auth calls, no custom password handling:
     • passwords are hashed and stored by Supabase, never by us
     • sessions are managed and refreshed by the Supabase client
     • OTP codes are generated and verified server-side by the provider
     • nothing here logs a password, an OTP or a token

   Until js/auth-config.js is filled in, every entry point says clearly that
   sign-in is not configured yet. It never simulates a signed-in user.
   ========================================================================== */

let _sb = null;          // the Supabase client, created on first use
let _sbFailed = false;

/* Loaded from the CDN only when auth is actually configured and used, so an
   unconfigured site downloads nothing extra. */
let _sbPending = null;   // in-flight creation, so concurrent callers share one

async function supa() {
  if (_sb || _sbFailed) return _sb;
  if (!authConfigured()) return null;

  /* Memoise the PROMISE, not just the result. initAuth() and the page's own
     code can both call this before the dynamic import resolves; without this
     each would build its own client and Supabase would warn about multiple
     GoTrueClient instances sharing one storage key. */
  if (!_sbPending) {
    _sbPending = (async () => {
      try {
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
        _sb = createClient(NIELLOR_AUTH.supabaseUrl, NIELLOR_AUTH.supabaseAnonKey, {
          auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
        });
        return _sb;
      } catch (err) {
        _sbFailed = true;
        console.error('NIELLOR: could not load the auth library.', err && err.message);
        return null;
      } finally {
        _sbPending = null;
      }
    })();
  }
  return _sbPending;
}

const redirectTarget = () =>
  (NIELLOR_AUTH.redirectTo || '').trim() || location.origin + location.pathname;

/* --------------------------------------------------------------------------
   Session
   -------------------------------------------------------------------------- */
let currentUser = null;

async function refreshSession() {
  const sb = await supa();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  currentUser = data && data.session ? data.session.user : null;
  return currentUser;
}

/* Reads the customer's row from `profiles`. Returns null when the table is
   not there yet (before the schema is applied) so the account page still
   renders from the auth record alone. */
async function loadProfile() {
  const sb = await supa();
  if (!sb || !currentUser) return null;
  const { data, error } = await sb
    .from('profiles')
    .select('full_name, phone, avatar_url')
    .eq('id', currentUser.id)
    .maybeSingle();
  if (error) return null;
  return data;
}

/* Reads rows the signed-in customer owns. Row Level Security does the
   filtering at the database, so a missing or wrong user id returns nothing
   rather than someone else's data.
   Returns null when the table does not exist yet (schema not applied), so
   the account page can say so plainly instead of inventing content. */
async function accountRows(table, columns) {
  const sb = await supa();
  if (!sb || !currentUser) return null;
  const { data, error } = await sb.from(table).select(columns);
  if (error) return null;
  return data || [];
}

function userLabel(u) {
  if (!u) return '';
  const meta = u.user_metadata || {};
  return meta.full_name || meta.name || u.email || u.phone || 'Account';
}

/* Header reflects signed-in state */
function paintAccountButton() {
  const btn = document.getElementById('accountBtn');
  if (!btn) return;
  const signedIn = !!currentUser;
  btn.setAttribute('aria-label', signedIn ? 'Your account' : 'Sign in');
  btn.classList.toggle('is-authed', signedIn);
  btn.title = signedIn ? userLabel(currentUser) : 'Sign in';
}

/* --------------------------------------------------------------------------
   Validation — plain messages, never echoing the secret back
   -------------------------------------------------------------------------- */
const validEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '').trim());

/* Supabase enforces its own policy server-side; this mirrors the default so
   the customer hears about a problem before a round trip. */
function passwordProblem(v) {
  const s = String(v || '');
  if (s.length < 8) return 'Password must be at least 8 characters.';
  if (!/[a-z]/i.test(s) || !/[0-9]/.test(s))
    return 'Password must contain at least one letter and one number.';
  return null;
}

/* Provider errors are shown as-is only when they are safe and useful */
function friendlyError(err) {
  const m = (err && err.message ? err.message : String(err || '')).toLowerCase();
  if (m.includes('invalid login')) return 'Incorrect email or password.';
  if (m.includes('email not confirmed')) return 'Please confirm your email address first — check your inbox.';
  if (m.includes('already registered')) return 'That email already has an account. Try signing in.';
  if (m.includes('rate limit') || m.includes('too many')) return 'Too many attempts. Please wait a moment and try again.';
  if (m.includes('otp') && m.includes('expired')) return 'That code has expired. Request a new one.';
  if (m.includes('invalid otp') || m.includes('token has expired')) return 'That code is not valid. Please check and try again.';
  /* Anything unrecognised is shown as a neutral NIELLOR message. Raw
     provider or database text must never reach a customer; the detail is
     kept in the console on development hosts only. */
  if (isDevHost()) console.warn('NIELLOR auth (dev detail):', err && err.message);
  return 'Something went wrong on our side. Please try again in a moment.';
}

/* --------------------------------------------------------------------------
   Auth actions — thin wrappers, all work happens at the provider
   -------------------------------------------------------------------------- */
const Auth = {
  configured: () => authConfigured(),
  user: () => currentUser,

  async signUpEmail(email, password, name) {
    const sb = await supa();
    if (!sb) throw new Error('Sign-in is not configured yet.');
    const { data, error } = await sb.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: (name || '').trim() }, emailRedirectTo: redirectTarget() }
    });
    if (error) throw error;
    return data;
  },

  async signInEmail(email, password) {
    const sb = await supa();
    if (!sb) throw new Error('Sign-in is not configured yet.');
    const { data, error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw error;
    currentUser = data.user;
    return data;
  },

  async resetPassword(email) {
    const sb = await supa();
    if (!sb) throw new Error('Sign-in is not configured yet.');
    const { error } = await sb.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: redirectTarget()
    });
    if (error) throw error;
  },

  /* Used on the page the reset link returns to */
  async updatePassword(password) {
    const sb = await supa();
    if (!sb) throw new Error('Sign-in is not configured yet.');
    const { error } = await sb.auth.updateUser({ password });
    if (error) throw error;
  },

  async signInOAuth(provider) {
    const sb = await supa();
    if (!sb) throw new Error('Sign-in is not configured yet.');
    const { error } = await sb.auth.signInWithOAuth({
      provider,                       // 'google' | 'apple'
      options: { redirectTo: redirectTarget() }
    });
    if (error) throw error;
  },

  /* Phone OTP — the code is created and checked by the provider */
  async sendOtp(phone) {
    const sb = await supa();
    if (!sb) throw new Error('Sign-in is not configured yet.');
    const { error } = await sb.auth.signInWithOtp({ phone: phone.trim() });
    if (error) throw error;
  },

  async verifyOtp(phone, token) {
    const sb = await supa();
    if (!sb) throw new Error('Sign-in is not configured yet.');
    const { data, error } = await sb.auth.verifyOtp({
      phone: phone.trim(), token: String(token).trim(), type: 'sms'
    });
    if (error) throw error;
    currentUser = data.user;
    return data;
  },

  async signOut() {
    const sb = await supa();
    if (!sb) return;
    await sb.auth.signOut();
    currentUser = null;
    paintAccountButton();
  }
};

/* --------------------------------------------------------------------------
   Sign-in panel
   -------------------------------------------------------------------------- */
function mountAuth() {
  if (document.getElementById('authOverlay')) return;

  document.body.insertAdjacentHTML('beforeend', `
    <div class="auth-overlay" id="authOverlay" role="dialog" aria-modal="true"
         aria-labelledby="authTitle">
      <div class="auth-panel">
        <button class="auth-close" id="authClose" type="button" aria-label="Close">${ICON.close}</button>
        <div class="auth-head">
          <span class="brand-word wordmark">Niellor</span>
          <h2 id="authTitle">Sign in</h2>
        </div>
        <div class="auth-body" id="authBody"></div>
      </div>
    </div>`);

  document.getElementById('authClose').addEventListener('click', closeAuth);
  document.getElementById('authOverlay').addEventListener('click', e => {
    if (e.target.id === 'authOverlay') closeAuth();
  });
  addEventListener('keydown', e => {
    const el = document.getElementById('authOverlay');
    if (e.key === 'Escape' && el && el.classList.contains('open')) closeAuth();
  });
}

const authSay = (msg, kind) => {
  const el = document.getElementById('authStatus');
  if (!el) return;
  el.textContent = msg || '';
  el.className = 'auth-status' + (kind ? ' is-' + kind : '');
};

/* Development hosts see the technical reason a sign-in cannot run.
   Customers never do — on a real domain they get a brand-appropriate notice
   with no configuration detail in it. */
function isDevHost() {
  return ['localhost', '127.0.0.1', '::1', ''].includes(location.hostname) ||
  location.protocol === 'file:' ||
  /^192\.168\.|^10\.|^172\.(1[6-9]|2[0-9]|3[01])\./.test(location.hostname);
}

/* Official Google mark */
const GOOGLE_MARK = `
  <svg class="g-mark" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>`;

function socialButtons() {
  const m = NIELLOR_AUTH.methods || {};
  const rows = [];
  if (m.google) rows.push(`<button class="auth-social" type="button" data-oauth="google">
      ${GOOGLE_MARK}<span>Continue with Google</span></button>`);
  /* Apple and phone stay switched off for launch. The buttons appear
     automatically when their flags are turned on in auth-config.js. */
  if (m.apple) rows.push(`<button class="auth-social" type="button" data-oauth="apple">
      <span class="auth-social-mark" aria-hidden="true">&#63743;</span><span>Continue with Apple</span></button>`);
  if (m.phone) rows.push(`<button class="auth-social" type="button" data-view="phone">
      ${ICON.phone}<span>Continue with Phone</span></button>`);

  if (!rows.length) return '';
  return `<div class="auth-socials">${rows.join('')}</div>
    <div class="auth-or"><span>or</span></div>`;
}

/* Shown when sign-in cannot run. Two audiences, two messages. */
function viewUnavailable() {
  if (isDevHost()) {
    return `
      <div class="auth-notice">
        <p class="auth-notice-head">Sign-in is not configured on this machine.</p>
        <p>Add the Supabase project URL and anon key to
           <code>js/auth-config.js</code>. Full steps are in
           <code>SETUP-AUTH.md</code>.</p>
        <p class="auth-notice-fine">This message is only shown on local
           development hosts. Customers never see it.</p>
      </div>`;
  }
  return `
    <div class="auth-notice">
      <p class="auth-notice-head">Accounts are opening soon.</p>
      <p>NIELLOR accounts are not available just yet. In the meantime you are
         welcome to browse the collection, and we would be glad to help you
         directly.</p>
      <div class="auth-notice-cta">
        <a class="btn btn-full" href="collection.html">Explore the Collection</a>
        <a class="btn btn-ghost btn-full" href="contact.html">Contact Us</a>
      </div>
    </div>`;
}

function viewSignIn() {
  return `
    <p class="auth-lead">Sign in to continue your NIELLOR experience.</p>
    ${socialButtons()}
    <form id="authForm" novalidate>
      <div class="field">
        <label for="au-email">Email address</label>
        <input id="au-email" type="email" autocomplete="email" required
               placeholder="you@example.com">
      </div>
      <div class="field">
        <label for="au-pass">Password</label>
        <input id="au-pass" type="password" autocomplete="current-password" required
               placeholder="Your password">
        <button class="field-link" type="button" data-view="forgot">Forgot password?</button>
      </div>
      <button class="btn btn-full" type="submit">Sign In</button>
    </form>
    <p class="auth-status" id="authStatus" role="status" aria-live="polite"></p>
    <p class="auth-foot">Don&rsquo;t have an account?
      <button type="button" data-view="signup">Create account</button></p>`;
}

function viewSignUp() {
  return `
    <p class="auth-lead">Create an account to manage your NIELLOR experience.</p>
    ${socialButtons()}
    <form id="authForm" novalidate>
      <div class="field">
        <label for="au-name">Full name</label>
        <input id="au-name" type="text" autocomplete="name" placeholder="Your name">
      </div>
      <div class="field">
        <label for="au-email">Email address</label>
        <input id="au-email" type="email" autocomplete="email" required
               placeholder="you@example.com">
      </div>
      <div class="field">
        <label for="au-pass">Password</label>
        <input id="au-pass" type="password" autocomplete="new-password" required
               placeholder="At least 8 characters">
        <p class="field-hint">At least 8 characters, including a letter and a number.</p>
      </div>
      <button class="btn btn-full" type="submit">Create Account</button>
    </form>
    <p class="auth-status" id="authStatus" role="status" aria-live="polite"></p>
    <p class="auth-foot">Already have an account?
      <button type="button" data-view="signin">Sign in</button></p>`;
}

function viewSignInFailed() {
  return `
    <div class="auth-sent">
      <span class="auth-sent-mark" aria-hidden="true">${ICON.user}</span>
      <p class="auth-sent-head">We couldn&rsquo;t sign you in</p>
      <p class="auth-sent-body">Those details don&rsquo;t match an account.
        Please check your password &mdash; or create an account if you are new
        to NIELLOR.</p>
      <div class="auth-notice-cta">
        <button class="btn btn-full" type="button" data-view="signup">Create Account</button>
        <button class="btn btn-ghost btn-full" type="button" data-view="signin">Try Again</button>
      </div>
      <p class="auth-sent-fine"><button type="button" data-view="forgot"
        class="auth-inline-link">Forgot your password?</button></p>
    </div>`;
}

function viewForgot() {
  return `
    <p class="auth-lead">Enter your email address and we&rsquo;ll send you a
      secure reset link.</p>
    <form id="authForm" novalidate>
      <div class="field">
        <label for="au-email">Email address</label>
        <input id="au-email" type="email" autocomplete="email" required
               placeholder="you@example.com">
      </div>
      <button class="btn btn-full" type="submit">Send Reset Link</button>
    </form>
    <p class="auth-status" id="authStatus" role="status" aria-live="polite"></p>
    <p class="auth-foot"><button type="button" data-view="signin">Back to sign in</button></p>`;
}

/* Shown after a reset link has been requested */
function viewForgotSent(email) {
  return `
    <div class="auth-sent">
      <span class="auth-sent-mark" aria-hidden="true">${ICON.mail}</span>
      <p class="auth-sent-head">Check your inbox</p>
      <p class="auth-sent-body">If an account exists for <strong>${email}</strong>,
        a secure reset link is on its way. The link expires in one hour.</p>
      <p class="auth-sent-fine">Not there? Look in your spam folder, or try again
        in a few minutes.</p>
      <button class="btn btn-ghost btn-full" type="button" data-view="signin">Back to sign in</button>
    </div>`;
}

function viewNewPassword() {
  return `
    <p class="auth-lead">Choose a new password for your account.</p>
    <form id="authForm" novalidate>
      <div class="field">
        <label for="au-pass">New password</label>
        <input id="au-pass" type="password" autocomplete="new-password" required
               placeholder="At least 8 characters">
        <p class="field-hint">At least 8 characters, including a letter and a number.</p>
      </div>
      <div class="field">
        <label for="au-pass2">Confirm new password</label>
        <input id="au-pass2" type="password" autocomplete="new-password" required
               placeholder="Repeat the password">
      </div>
      <button class="btn btn-full" type="submit">Update Password</button>
    </form>
    <p class="auth-status" id="authStatus" role="status" aria-live="polite"></p>`;
}

/* Kept for when phone sign-in is switched on later */
function viewPhone() {
  return `
    <p class="auth-lead">We will text you a one-time code.</p>
    <form id="authForm" novalidate>
      <div class="field">
        <label for="au-phone">Phone number</label>
        <input id="au-phone" type="tel" autocomplete="tel" required
               inputmode="tel" placeholder="+91 00000 00000">
        <p class="field-hint">Include your country code, for example +91.</p>
      </div>
      <button class="btn btn-full" type="submit">Send Code</button>
    </form>
    <p class="auth-status" id="authStatus" role="status" aria-live="polite"></p>
    <p class="auth-foot"><button type="button" data-view="signin">Use email instead</button></p>`;
}

function viewOtp(phone) {
  return `
    <p class="auth-lead">Enter the 6-digit code sent to <strong>${phone}</strong>.</p>
    <form id="authForm" novalidate>
      <div class="field">
        <label for="au-otp">Verification code</label>
        <input id="au-otp" type="text" inputmode="numeric" autocomplete="one-time-code"
               maxlength="6" required placeholder="000000" class="otp-input">
      </div>
      <button class="btn btn-full" type="submit">Verify &amp; Continue</button>
    </form>
    <p class="auth-status" id="authStatus" role="status" aria-live="polite"></p>
    <p class="auth-foot"><button type="button" data-view="phone">Use a different number</button></p>`;
}


let pendingPhone = '';
let sentToEmail = '';

function renderAuth(view) {
  const body = document.getElementById('authBody');
  const title = document.getElementById('authTitle');

  if (!authConfigured()) {
    title.textContent = isDevHost() ? 'Sign in' : 'Accounts';
    body.innerHTML = viewUnavailable();
    return;
  }

  const titles = {
    signin:     'Welcome back',
    signup:     'Create your account',
    forgot:     'Reset your password',
    forgotsent: 'Reset your password',
    signinfailed: 'Welcome back',
    newpass:    'Set a new password',
    phone:      'Sign in with phone',
    otp:        'Verify your number'
  };
  title.textContent = titles[view] || 'Welcome back';

  body.innerHTML =
    view === 'signup' ? viewSignUp() :
    view === 'forgot' ? viewForgot() :
    view === 'forgotsent' ? viewForgotSent(sentToEmail) :
    view === 'signinfailed' ? viewSignInFailed() :
    view === 'phone'  ? viewPhone()  :
    view === 'otp'    ? viewOtp(pendingPhone) :
    view === 'newpass' ? viewNewPassword() :
                        viewSignIn();

  body.querySelectorAll('[data-view]').forEach(b =>
    b.addEventListener('click', () => renderAuth(b.dataset.view)));

  body.querySelectorAll('[data-oauth]').forEach(b =>
    b.addEventListener('click', async () => {
      authSay('Redirecting…');
      try { await Auth.signInOAuth(b.dataset.oauth); }
      catch (err) { authSay(friendlyError(err), 'error'); }
    }));

  const form = document.getElementById('authForm');
  if (form) form.addEventListener('submit', e => { e.preventDefault(); submitAuth(view, form); });
}

async function submitAuth(view, form) {
  const btn = form.querySelector('button[type="submit"]');
  const lock = on => { btn.disabled = on; btn.style.opacity = on ? .6 : ''; };

  try {
    if (view === 'signup') {
      const email = form.querySelector('#au-email').value;
      const pass  = form.querySelector('#au-pass').value;
      const name  = form.querySelector('#au-name').value;
      if (!validEmail(email)) return authSay('Please enter a valid email address.', 'error');
      const bad = passwordProblem(pass);
      if (bad) return authSay(bad, 'error');

      lock(true); authSay('Creating your account…');
      const data = await Auth.signUpEmail(email, pass, name);
      lock(false);
      authSay(data && data.session
        ? 'Welcome to NIELLOR.'
        : 'Check your inbox to confirm your email address.', 'ok');
      if (data && data.session) await afterSignIn();
      return;
    }

    if (view === 'forgot') {
      const email = form.querySelector('#au-email').value;
      if (!validEmail(email)) return authSay('Please enter a valid email address.', 'error');
      lock(true); authSay('Sending…');
      await Auth.resetPassword(email);
      lock(false);
      sentToEmail = email.trim();
      return renderAuth('forgotsent');
    }

    if (view === 'newpass') {
      const pass  = form.querySelector('#au-pass').value;
      const pass2 = form.querySelector('#au-pass2').value;
      const bad = passwordProblem(pass);
      if (bad) return authSay(bad, 'error');
      if (pass !== pass2) return authSay('Both passwords must match.', 'error');

      lock(true); authSay('Updating…');
      await Auth.updatePassword(pass);
      lock(false);
      authSay('Password updated. You are signed in.', 'ok');
      /* Clear the recovery token out of the address bar */
      history.replaceState(null, '', location.pathname);
      return afterSignIn();
    }

    if (view === 'phone') {
      const phone = form.querySelector('#au-phone').value.trim();
      if (!/^\+?[0-9\s-]{8,16}$/.test(phone))
        return authSay('Please enter a valid phone number including country code.', 'error');
      lock(true); authSay('Sending code…');
      await Auth.sendOtp(phone);
      lock(false);
      pendingPhone = phone;
      return renderAuth('otp');
    }

    if (view === 'otp') {
      const code = form.querySelector('#au-otp').value.trim();
      if (!/^[0-9]{4,8}$/.test(code)) return authSay('Enter the code from the text message.', 'error');
      lock(true); authSay('Verifying…');
      await Auth.verifyOtp(pendingPhone, code);
      lock(false);
      return afterSignIn();
    }

    /* default: sign in */
    const email = form.querySelector('#au-email').value;
    const pass  = form.querySelector('#au-pass').value;
    if (!validEmail(email)) return authSay('Please enter a valid email address.', 'error');
    if (!pass) return authSay('Please enter your password.', 'error');
    lock(true); authSay('Signing in…');
    try {
      await Auth.signInEmail(email, pass);
    } catch (err) {
      lock(false);
      /* The provider deliberately returns one message for both "no such
         account" and "wrong password", so that an attacker cannot discover
         which addresses are registered. We keep that property: the copy
         covers both cases and simply offers the next step. */
      if (/invalid login/i.test(err && err.message || '')) return renderAuth('signinfailed');
      throw err;
    }
    lock(false);
    await afterSignIn();

  } catch (err) {
    lock(false);
    authSay(friendlyError(err), 'error');
  }
}

async function afterSignIn() {
  await refreshSession();
  paintAccountButton();
  authSay('Signed in.', 'ok');
  setTimeout(() => {
    closeAuth();
    if (document.body.dataset.page === 'account') location.reload();
  }, 600);
}

/* Open / close ------------------------------------------------------------ */
function openAuth(view) {
  mountAuth();
  renderAuth(view || 'signin');
  const el = document.getElementById('authOverlay');
  el.classList.add('open');
  document.body.classList.add('menu-open');
  setTimeout(() => {
    /* Focus the first field, never the close button — landing on the X put a
       focus ring on it the moment the panel opened. */
    const first = el.querySelector('input');
    if (first) first.focus({ preventScroll: true });
  }, 60);
}

function closeAuth() {
  const el = document.getElementById('authOverlay');
  if (!el) return;
  el.classList.remove('open');
  document.body.classList.remove('menu-open');
}

/* Boot -------------------------------------------------------------------- */
async function initAuth() {
  const btn = document.getElementById('accountBtn');

  if (btn) {
    btn.addEventListener('click', () => {
      if (currentUser) location.href = 'account.html';
      else openAuth('signin');
    });
  }

  if (!authConfigured()) { paintAccountButton(); return; }

  await refreshSession();
  paintAccountButton();

  const sb = await supa();
  if (sb) {
    sb.auth.onAuthStateChange((evt, session) => {
      currentUser = session ? session.user : null;
      paintAccountButton();
      /* Arriving from the reset email: Supabase signs the user in with a
         short-lived recovery session, then we ask for the new password. */
      if (evt === 'PASSWORD_RECOVERY') openAuth('newpass');
    });

    /* The event can fire before this listener attaches, so also check the URL */
    if (/type=recovery/.test(location.hash) || /type=recovery/.test(location.search)) {
      openAuth('newpass');
    }
  }
}

/* ==========================================================================
   ACCOUNT DATA

   Ownership is always taken from the authenticated session
   (`currentUser.id`), never from anything the page supplies. Row Level
   Security enforces the same rule at the database, so these two agree —
   a tampered id in the browser still cannot reach another customer's row.
   ========================================================================== */

/* Every call needs a live session; refresh it rather than trusting a stale
   variable, in case the token expired while the page was open. */
async function requireSession() {
  const sb = await supa();
  if (!sb) throw new Error('Sign-in is not available.');
  const { data } = await sb.auth.getSession();
  const user = data && data.session ? data.session.user : null;
  if (!user) throw new Error('Please sign in again.');
  currentUser = user;
  return { sb, user };
}

/* ---- Profile ---------------------------------------------------------- */
async function updateProfile(fields) {
  const { sb, user } = await requireSession();

  const patch = {
    full_name: (fields.full_name || '').trim() || null,
    phone:     (fields.phone || '').trim() || null,
    updated_at: new Date().toISOString()
  };

  /* Upsert rather than update: the row normally exists via the auth trigger,
     but this also covers an account created before the trigger was added. */
  const { data, error } = await sb
    .from('profiles')
    .upsert({ id: user.id, ...patch }, { onConflict: 'id' })
    .select('full_name, phone, avatar_url')
    .maybeSingle();

  if (error) throw error;
  return data;
}

/* ---- Addresses -------------------------------------------------------- */
async function listAddresses() {
  const { sb } = await requireSession();
  const { data, error } = await sb
    .from('addresses')
    .select('*')
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

/* Only these columns are ever written — anything else the form might carry
   is ignored, and user_id is set from the session. */
const ADDRESS_FIELDS = ['label', 'full_name', 'phone', 'line1', 'line2',
                        'city', 'state', 'postal_code', 'country', 'is_default'];

function cleanAddress(input) {
  const out = {};
  for (const k of ADDRESS_FIELDS) {
    if (k === 'is_default') out[k] = Boolean(input[k]);
    else out[k] = (input[k] == null ? '' : String(input[k])).trim() || null;
  }
  return out;
}

async function saveAddress(input, id) {
  const { sb, user } = await requireSession();
  const row = cleanAddress(input);

  if (!row.line1) throw new Error('Address line 1 is required.');
  if (!row.city)  throw new Error('City is required.');
  if (!row.country) row.country = 'India';

  let saved;
  if (id) {
    const { data, error } = await sb
      .from('addresses')
      .update(row)
      .eq('id', id)
      .eq('user_id', user.id)      // belt and braces alongside RLS
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('That address could not be found.');
    saved = data;
  } else {
    const { data, error } = await sb
      .from('addresses')
      .insert({ ...row, user_id: user.id })
      .select()
      .maybeSingle();
    if (error) throw error;
    saved = data;
  }

  if (row.is_default && saved) await setDefaultAddress(saved.id);
  return saved;
}

async function deleteAddress(id) {
  const { sb, user } = await requireSession();
  const { error } = await sb
    .from('addresses')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);
  if (error) throw error;
}

/* Exactly one default: clear the rest, then set this one. Both statements
   are scoped to the session user. */
async function setDefaultAddress(id) {
  const { sb, user } = await requireSession();

  const clear = await sb
    .from('addresses')
    .update({ is_default: false })
    .eq('user_id', user.id)
    .neq('id', id);
  if (clear.error) throw clear.error;

  const { error } = await sb
    .from('addresses')
    .update({ is_default: true })
    .eq('id', id)
    .eq('user_id', user.id);
  if (error) throw error;
}
