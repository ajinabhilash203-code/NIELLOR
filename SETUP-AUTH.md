# NIELLOR — enabling accounts

The sign-in and account system is **fully built**. It is not **live** yet,
because live authentication needs accounts and credentials that only you can
create. Until you complete step 1, the sign-in panel says plainly that
accounts are not switched on — it never pretends to sign anyone in.

Everything below is done in provider dashboards. **Only two public values
ever come back into this project.**

---

## Why Supabase

The site is static (no build step, no server). Supabase Auth covers
email/password, Google, Apple and phone OTP in one place, works from a static
host, and stores passwords and sessions itself — we never handle either.

Free tier is enough to start. Firebase Auth would also work; if you switch,
only `js/auth.js` changes.

---

## 1. Create the project (required — 5 minutes)

1. Sign up at <https://supabase.com> and create a project.
2. Open **Project Settings → API**.
3. Copy **Project URL** and the **anon / public** key.
4. Paste both into `js/auth-config.js`:

```js
const NIELLOR_AUTH = {
  supabaseUrl:     'https://YOURPROJECT.supabase.co',
  supabaseAnonKey: 'eyJhbGciOi...'        // the anon public key
};
```

That is the only code change. Email sign-up, sign-in, logout, forgot/reset
password and sessions all start working immediately.

> **The anon key is meant to be public.** It ships to every visitor by design;
> Supabase protects data with Row Level Security, not by hiding this key.
>
> **The `service_role` key is not.** It bypasses all security. Never put it in
> `js/`, never commit it, never paste it into the browser.

### Redirect URLs

In **Authentication → URL Configuration**, add your site URL to
**Site URL** and **Redirect URLs** — e.g. `https://niellor.com`. Add
`http://localhost:4321` too while developing. Password resets and OAuth
return here.

---

## 2. Google sign-in

1. [Google Cloud Console](https://console.cloud.google.com) → **APIs &
   Services → Credentials → Create OAuth client ID → Web application**.
2. Under **Authorised redirect URIs** add the callback Supabase shows you:
   `https://YOURPROJECT.supabase.co/auth/v1/callback`
3. Copy the **Client ID** and **Client Secret**.
4. Supabase → **Authentication → Providers → Google** → enable, paste both,
   save.

The client **secret** goes in the Supabase dashboard only — never in this
project.

---

## 3. Apple sign-in

Requires a paid **Apple Developer** account (~$99/year).

1. [developer.apple.com](https://developer.apple.com) → **Certificates,
   Identifiers & Profiles**.
2. Create an **App ID**, enable **Sign in with Apple**.
3. Create a **Services ID** — this is your client ID. Enable Sign in with
   Apple on it and set:
   - Domain: `YOURPROJECT.supabase.co`
   - Return URL: `https://YOURPROJECT.supabase.co/auth/v1/callback`
4. Create a **Sign in with Apple key** and download the `.p8` file.
   **You can only download it once.**
5. Supabase → **Authentication → Providers → Apple** → enable and provide the
   Services ID, Team ID, Key ID and the contents of the `.p8`.

The `.p8` private key goes in the Supabase dashboard only. It must never be
committed or placed in `js/`.

---

## 4. Phone / OTP sign-in

Sending SMS costs money — every provider charges per message, and there is no
free production tier in India.

1. Create an account with a provider Supabase supports — **Twilio**,
   **MessageBird**, **Vonage** or **Textlocal**.
2. For India, complete **DLT registration** (TRAI requirement) and register
   your sender ID and message template. Without this, SMS to Indian numbers
   will not deliver.
3. Supabase → **Authentication → Providers → Phone** → enable and paste the
   provider's Account SID / API key / sender ID.

Credentials live in the Supabase dashboard. The OTP itself is generated and
verified by Supabase — this project never sees, stores or logs a code.

If you would rather not pay for SMS yet, set `methods.phone: false` in
`js/auth-config.js` and the button disappears cleanly.

---

## 5. Turn off what you have not configured

`js/auth-config.js` has a `methods` block. Set anything you have not set up to
`false` so the panel never shows a button that cannot work:

```js
methods: { email: true, google: true, apple: false, phone: false }
```

---

## What we never do

- **No custom password storage.** Passwords go straight to Supabase, which
  hashes them. This project has no password database and no hashing code.
- **No secrets in the frontend.** Only the project URL and anon key, both
  public by design.
- **No OTP handling.** Codes are created and checked by the provider.
- **No logging of credentials.** Passwords, codes and tokens are never
  written to the console or to storage by our code.
- **No account data before sign-in.** `account.html` renders nothing personal
  until Supabase returns a valid session.

## Where things live

| File | Role |
|---|---|
| `js/auth-config.js` | The two public values, and which methods are on |
| `js/auth.js` | All auth calls, the sign-in panel, session handling |
| `account.html` | The signed-in dashboard |

## After it is live — worth doing

- **Confirm email** — Authentication → Providers → Email → require confirmation.
- **Password policy** — set a minimum length in the dashboard. The panel
  already asks for 8+ characters with a letter and a number; keep the two in
  step.
- **Rate limiting** — enabled by default; review the limits.
- **Row Level Security** — on before you store any customer data in tables.
