/* ==========================================================================
   NIELLOR — authentication configuration

   The site is static, so it uses Supabase Auth: a production-grade provider
   that covers email/password, Google, Apple and phone OTP in one place, and
   works from a static host with no backend of our own.

   ── WHAT GOES IN THIS FILE ────────────────────────────────────────────────
   ONLY the project URL and the *anon* (publishable) key. Both are designed
   to be public and ship to the browser; Supabase protects your data with
   Row Level Security, not by hiding this key.

   ── WHAT MUST NEVER GO IN THIS FILE ───────────────────────────────────────
   • the service_role key            • any OAuth client SECRET
   • the Apple private key (.p8)     • SMS provider credentials
   Those live in the Supabase dashboard only. Anything placed in js/ is
   downloaded by every visitor.

   Full setup steps: see SETUP-AUTH.md
   ========================================================================== */

const NIELLOR_AUTH = {
  /* From Supabase → Project Settings → API */
  supabaseUrl:     'https://xqityglaejzudujobzng.supabase.co',
  supabaseAnonKey: 'sb_publishable_EUY3atoltR0IU2T3Mw5foA_grJGhy-h',   // publishable key — safe to ship to the browser

  /* Turn a method off here if it is not enabled in the Supabase dashboard,
     so the UI never offers a button that cannot work. */
  methods: {
    email:  true,
    google: false,
    /* Not enabled for launch. The code paths for both remain in js/auth.js —
       flip these to true once the provider is configured in Supabase and the
       buttons reappear. Nothing else needs changing. */
    apple:  false,
    phone:  false
  },

  /* Where the provider returns the user after OAuth / password reset.
     Leave blank to use the current origin. */
  redirectTo: ''
};

/* Auth is only live once both values above are filled in. Until then the
   sign-in panel says so plainly rather than pretending to work. */
const authConfigured = () =>
  Boolean((NIELLOR_AUTH.supabaseUrl || '').trim() &&
          (NIELLOR_AUTH.supabaseAnonKey || '').trim());
