# NIELLOR — Technical Handover

Complete technical documentation of the NIELLOR storefront, written for a
developer joining the project with no prior context.

**Last updated:** 21 August 2026 · **Commit:** `94ba7a7`

---

## 1. What this is

A luxury fragrance storefront for the Indian market. Brand identity, product
photography and copy are the owner's; the site is bespoke, not a theme or
template.

| | |
|---|---|
| **Production** | https://niellor.com |
| **www** | https://www.niellor.com → 307 redirect → apex |
| **Vercel preview** | https://niellor.vercel.app |
| **Repository** | https://github.com/ajinabhilash203-code/NIELLOR (public) |
| **Branch** | `main` — pushing here auto-deploys |

---

## 2. Tech stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | **Plain HTML + CSS + JavaScript** | No framework, no bundler, **no build step**, zero npm dependencies |
| Hosting | **Vercel** | Static output, "Other" framework preset |
| Database | **Supabase Postgres 17** | Project `xqityglaejzudujobzng`, region `eu-west-1` |
| Auth | **Supabase Auth (GoTrue)** | Email + password. Google/Apple/phone coded but disabled |
| Server code | **Supabase Edge Functions** (Deno/TypeScript) | One function: `contact-submit` |
| Transactional email | **Resend** | Two paths — SMTP for auth, HTTP API for support |
| DNS / registrar | **Namecheap** (BasicDNS) | DNSSEC enabled |
| Version control | Git → GitHub → Vercel | |

**There is deliberately no build step.** Files are served exactly as committed.
Do not introduce Webpack/Vite/Next without a strong reason — the simplicity is
load-bearing, and Vercel currently needs no configuration at all.

---

## 3. Repository layout

```
├── index.html            home (14 sections)
├── collection.html       all products + comparison table
├── product.html          product detail (?id=<slug>)
├── about.html            brand story
├── house.html            "The House"
├── contact.html          contact form + FAQ
├── account.html          customer account (auth-gated)
├── css/style.css         3,895 lines — the entire design system
├── js/
│   ├── products.js       catalogue, search index, render helpers
│   ├── auth-config.js    Supabase URL + publishable key, method toggles
│   ├── auth.js           all Supabase Auth + account data access
│   └── app.js            nav, cart, search, reveal, page bootstrap
├── assets/img/           .webp product and editorial imagery
├── supabase/
│   ├── schema.sql                     original schema (applied)
│   ├── migrations/0002_support_messages.sql
│   ├── functions/contact-submit/index.ts
│   └── email-confirm-signup.html      branded email template (NOT yet installed)
├── dev-server.js         zero-dependency local static server
├── CNAME                 niellor.com (for GitHub Pages; Vercel ignores it)
└── HANDOVER.md           this file
```

---

## 4. Frontend architecture

### 4.1 Page bootstrap

`js/app.js` registers one `DOMContentLoaded` handler that mounts shared chrome
(header, footer, nav, cart drawer, search overlay, auth panel), then calls a
per-page hook:

```js
document.addEventListener('DOMContentLoaded', () => {
  mountChrome(); initPreloader(); initNav(); initSearch();
  initAuth(); initCart(); initReveal(); /* … */
  if (typeof window.pageInit === 'function') window.pageInit();
});
```

Each page defines `window.pageInit` in an inline `<script>` at the bottom.
**Script order matters** — `products.js` → `auth-config.js` → `app.js` →
`auth.js` → inline page script.

### 4.2 The catalogue

`js/products.js` is the single source of truth for products. The site does
**not** read products from the database — `public.products` exists and is
seeded but nothing queries it.

> ⚠️ **The catalogue is placeholder data.** Roselle / Aéris / Valenor and the
> ₹1,499 / ₹2,399 / ₹4,699 price ladder are working values for build and
> testing, marked as such in the file. Replace before commercial launch.

### 4.3 The image-independence rule

**This is the most important structural convention in the codebase.**

Every product owns an explicit `image` object. Nothing is derived from an id,
and there is no shared lookup table:

```js
{
  id: 'valenor',
  image:   { src: 'assets/img/men.webp', alt: '…' },
  gallery: [ { src: 'assets/img/valenor-box.webp', alt: '…' } ],
}
```

A single renderer, `media(imageObject, opts)`, takes an **object, never an id**,
so callers cannot accidentally couple two products to the same file. This was
introduced after a bug where changing one product's photo silently changed
another's. Preserve it.

Images are 4:5 portrait `.webp`. Frames use `aspect-ratio` + `object-fit: cover`.

### 4.4 Design system

All styling lives in `css/style.css`, organised in ~33 numbered sections with
CSS custom properties under `:root` (ivory/linen surfaces, gold accents,
serif display + sans body).

Conventions worth knowing:
- `.brand-word`, `.cover-word`, `.wordmark` carry `white-space: nowrap` — the
  NIELLOR wordmark must never wrap to two lines.
- `:focus-visible` draws a gold ring; do not remove it (keyboard accessibility).
- Mobile-first breakpoints at 700px, 900px, 1080px.
- Product detail: below 700px the gallery thumbnails stack under the image;
  at ≥700px they move to a sticky vertical strip beside it, scoped with
  `:has(.pdp-gallery:not(:empty))` so single-image products stay flush.

---

## 5. Database

Supabase Postgres. **Row Level Security is enabled on every table.**

### 5.1 Tables

| Table | Purpose | RLS policy |
|---|---|---|
| `profiles` | name, phone, avatar, marketing opt-in | own row: select / insert / update |
| `addresses` | delivery addresses | `ALL` where `auth.uid() = user_id` |
| `cart` | persistent cart | `ALL` where `auth.uid() = user_id` |
| `wishlist` | saved products | `ALL` where `auth.uid() = user_id` |
| `orders` | order header | `SELECT` own only |
| `order_items` | line items | `SELECT` via parent order ownership |
| `products` | catalogue | `SELECT` public — **currently unused by frontend** |
| `coupons` | discount codes | **RLS on, no policies** — sealed |
| `support_messages` | contact tickets | **RLS on, no policies** — sealed |

### 5.2 The "sealed table" pattern

`coupons` and `support_messages` have RLS enabled and **zero policies**. In
Postgres that means the table is closed: `anon` and `authenticated` can neither
read nor write it through the public API.

- `coupons` is read only via the `validate_coupon()` SECURITY DEFINER function.
- `support_messages` is written only by the `contact-submit` Edge Function
  using the service role, which bypasses RLS.

This is intentional, not an oversight. Supabase's linter flags it as INFO.

### 5.3 Functions and triggers

| Object | Type | Purpose |
|---|---|---|
| `handle_new_user()` | trigger, SECURITY DEFINER | creates a `profiles` row on signup |
| `validate_coupon(text)` | SECURITY DEFINER | checks a code without exposing the table |
| `support_ticket_seq` | sequence | ticket numbers, starts at 1001 |

Ticket ids are generated by a column default:
`('NL-' || nextval('support_ticket_seq'))`. **Gaps are normal** — a sequence
advances even when an insert fails. Never renumber tickets.

---

## 6. Authentication

Implemented in `js/auth.js` (810 lines) against Supabase Auth via the CDN ESM
build (`https://esm.sh/@supabase/supabase-js@2`).

**Enabled:** email + password with email confirmation.
**Coded but off:** Google, Apple, phone OTP — toggled in `js/auth-config.js`.
Flip a flag to `true` only after configuring the provider in Supabase, or the
UI will offer a button that cannot work.

Key behaviours:
- `supa()` memoises the **promise**, not just the client, so concurrent callers
  share one instance (prevents the "multiple GoTrueClient" warning).
- `requireSession()` re-reads the session before every account write; ownership
  is always derived from the session, never from anything the page supplies.
- `friendlyError()` never surfaces raw provider text to customers; technical
  detail is logged to console on development hosts only (`isDevHost()`).
- Sign-in failure shows one message for both "no such account" and "wrong
  password" — **deliberate anti-enumeration**, matching Supabase's own
  behaviour. Do not "improve" this into a specific message.
- `redirectTarget()` returns `location.origin + location.pathname`, so
  confirmation links resolve to whatever host is serving the page. **There are
  no hardcoded localhost URLs.**

**Supabase URL configuration**
- Site URL: `https://niellor.com`
- Redirect allow-list: `https://niellor.com`, `https://niellor.com/*`,
  `https://www.niellor.com/*`, `http://localhost:4399/*`, `http://localhost:4321`

---

## 7. Email

Two separate paths through the same Resend account and verified domain.

| Path | Used for | Transport | Credential location |
|---|---|---|---|
| **Auth emails** | confirm signup, password reset | SMTP | Supabase → Authentication → Emails → SMTP Settings |
| **Support notifications** | new contact message | Resend HTTP API | Supabase → Edge Functions → Secrets → `RESEND_API_KEY` |

**SMTP settings (do not change):**
```
Host: smtp.resend.com    Port: 465    Username: resend
Sender: hello@niellor.com    Sender name: NIELLOR
```

Port 465 is intentional and working. These are two *different* credential
stores holding the same key — updating one does not update the other.

**Resend domain `niellor.com` is verified**: DKIM ✅, `send` MX ✅, `send` SPF ✅.

> `supabase/email-confirm-signup.html` is a NIELLOR-branded confirmation email
> template. It has **not** been pasted into Supabase → Authentication → Emails →
> Templates, so confirmation emails currently use Supabase's default styling.

---

## 8. Support system (Phase 1)

Customer → contact form → Edge Function → Postgres + Resend → owner's inbox.

**`contact-submit`** (`supabase/functions/contact-submit/index.ts`),
`verify_jwt: false` because anonymous visitors must be able to submit. It
implements its own protection instead:

1. CORS allowlist (production, preview and localhost origins only)
2. Honeypot — form has a hidden `_gotcha` field; if filled, returns a fake
   success and saves nothing
3. Validation — required fields, email format, length caps
   (name 100 / email 254 / reason 100 / message 5000)
4. Rate limit — max 3 messages per email address per 10 minutes → 429
5. **Insert first**, then email. The ticket is returned only after the row is
   stored, so the page can never show success for a lost message
6. All user text is HTML-escaped before it enters the email body

Response: `{ ok: true, ticket: "NL-1001", emailed: true }`

`emailed: false` means the message **was saved** but the notification failed —
check `RESEND_API_KEY`. The customer is still served; nothing is lost.

The frontend calls it from `contact.html` via
`NIELLOR_CONTACT.formEndpoint` in `js/products.js`. If that string is emptied,
the form falls back to opening a `mailto:` draft.

---

## 9. Deployment

Push to `main` → Vercel builds and deploys automatically. No CI config, no
build command, no environment variables on Vercel.

**Vercel domains:** `niellor.com` → Production · `www.niellor.com` → 307 →
apex · `niellor.vercel.app` → Production.

### DNS (Namecheap, BasicDNS)

| Type | Host | Value | Purpose |
|---|---|---|---|
| A | `@` | `216.198.79.1` | Vercel apex |
| CNAME | `www` | `14c42f966b041fbb.vercel-dns-017.com.` | Vercel www (project-specific) |
| TXT | `resend._domainkey` | `p=MIGf…` | Resend DKIM |
| MX | `send` | `feedback-smtp.eu-west-1.amazonses.com` (pri 10) | Resend bounces |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` | Resend SPF |

**Mail Settings must stay on "Custom MX."** Namecheap hides the MX record type
entirely when set to "Email Forwarding", which makes the Resend MX record
impossible to add.

---

## 10. Security model

**Public by design (safe in the repo):**
- Supabase project URL and `sb_publishable_…` anon key — RLS is the security
  boundary, not key secrecy
- The `contact-submit` function URL

**Server-side only (never in the repo or browser):**
- Supabase `service_role` key — only inside Edge Functions via `Deno.env`
- Resend API key — SMTP settings + Edge Function secret
- SMTP password

Rules for contributors:
1. Never put a private key in `js/` — everything there ships to every visitor
2. Never trust a `user_id` from the frontend; derive ownership from the session
3. Do not weaken RLS to make a query easier — add a narrow policy instead
4. Escape user content before putting it in HTML or email

---

## 11. Local development

```bash
node dev-server.js          # http://localhost:4321
node dev-server.js . 4399   # custom port
```

Zero dependencies. Binds `0.0.0.0` so you can open the printed Network URL on a
phone. Sends `Cache-Control: no-store` — added after stale caching caused a
laptop and phone to disagree about the deployed code for hours.

Auth works locally because `localhost:4321` and `localhost:4399/*` are in the
Supabase redirect allow-list.

---

## 12. Current state — what is NOT built

**The site cannot take an order.** It looks like a shop but there is no
checkout.

| Missing | Notes |
|---|---|
| Checkout flow | no cart → address → payment → confirmation |
| Payment gateway | none. India target ⇒ Razorpay/Cashfree (needs Indian entity + bank) |
| Order writes | `orders` / `order_items` exist; nothing inserts into them |
| Legal pages | Terms, Privacy, Refund, Shipping — **required for gateway approval** |
| Real catalogue | placeholder products and prices |
| Admin dashboard | no way to view orders or tickets in-app |
| Customer ticket view | Phase 2; needs one narrow `SELECT` policy on `support_messages` |
| Avatar upload | needs a Supabase Storage bucket |
| Google OAuth | coded, disabled |

**Known cosmetic issue:** the "OUR STORY" card in
`assets/img/valenor-box.webp` contains Lorem ipsum placeholder text. Illegible
at display size, but regenerate before print or social use.

`NIELLOR_POLICY` in `products.js` holds shipping/returns values that are all
`null` except `gstInclusive: true` — the UI hides any field that is null rather
than inventing a claim. Keep that discipline.

---

## 13. Gotchas

1. **No build step.** Don't add one casually.
2. **Script order matters** — `products.js` must load before `app.js`.
3. **`pageInit`** — page-specific code goes in `window.pageInit`, not a
   separate `DOMContentLoaded` listener.
4. **Image objects, never ids** — see §4.3.
5. **Two credential stores for one Resend key** — SMTP settings and the Edge
   Function secret are separate. Update both.
6. **Ticket number gaps are normal.**
7. **Sealed tables are intentional** — `coupons` and `support_messages`.
8. **Anti-enumeration in sign-in errors is intentional.**
9. **Namecheap Mail Settings must remain "Custom MX."**
10. **The wordmark must never wrap.**

---

## 14. Roadmap

| Phase | Scope | Status |
|---|---|---|
| 1 | Contact form → Supabase + ticket + email | ✅ done |
| 2 | Customer ticket/conversation view | planned |
| 3 | Private admin support dashboard | planned |
| 4 | AI support assistant with human handoff | planned |
| 5 | Order lookup, analytics, search | planned |

Commercial launch additionally needs: legal pages, payment gateway, checkout,
real product data, and — for India — a manufacturer holding a valid cosmetics
manufacturing licence, plus Legal Metrology-compliant labelling (MRP, net
quantity, manufacturer address and licence number, mfg date, batch, consumer
care contact).
