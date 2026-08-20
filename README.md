# NIELLOR — storefront

Plain HTML, CSS and JavaScript. No build step, no dependencies, no install.

## Running it

```bash
node dev-server.js
```

Binds `0.0.0.0`, so it prints both a Local and a Network URL — open the Network
one on your phone, on the same Wi-Fi. (On Windows you may need to allow Node
through the firewall for Private networks.)

`dev-server.js` is a local preview convenience and does not need to be uploaded
when you deploy.

## Deploying

Upload the folder to any static host — Netlify, Vercel, Cloudflare Pages,
GitHub Pages, or ordinary shared hosting. Nothing to compile.

## Pages

| File | Purpose |
|---|---|
| `index.html` | Cover, collection, audience, identity, Scent Finder, values, packaging, why NIELLOR, closing |
| `collection.html` | All fragrances, filter, comparison table |
| `product.html` | Product detail, driven by `?id=` |
| `house.html` | Brand identity, values, audience, why NIELLOR |
| `about.html` | Packaging & design, direction, manufacturing partnership |
| `contact.html` | Form, contact details, FAQ |

## Architecture

Everything on the site is rendered from **`js/products.js`**:

- `NIELLOR_PRODUCTS` — the catalogue. Each product owns its `image`, `sizes`,
  copy and availability. **Add an object to add a fragrance** — every page,
  the filter, the comparison table and the cart pick it up with no layout work.
- `NIELLOR_MEDIA` — editorial images (hero, packaging, house).
- `NIELLOR_AUDIENCE` — the three audience frames, each with its own image.
- `NIELLOR_SIZES` — the price ladder. A product may override it with its own.
- `NIELLOR_POLICY` — commerce policy, see below.

`js/app.js` builds the header, footer and cart once and shares them across
every page. `css/style.css` holds the design system; brand colours and
typography are CSS variables at the top under `:root`.

### Image independence

Images are explicit per-product data:

```js
image: { src: 'assets/img/women.webp', alt: '…' }
```

No path is derived from an id, and no global flag sits in the lookup. Replacing
one product's image changes that product only. See `assets/img/README.md`.

### The wordmark

NIELLOR must always render on one horizontal line. Every element that shows the
name carries `white-space: nowrap`, and letter-spacing narrows on small screens
rather than allowing a break. Verified down to 320 px. **Do not remove the
`nowrap` rules** in the wordmark block of `style.css`.

## Commerce policy — needs your decisions

`NIELLOR_POLICY` is deliberately mostly empty, because these are business facts
that should not be invented:

```js
const NIELLOR_POLICY = {
  freeShippingOver: null,   // e.g. 1999
  deliveryWindow:   null,   // e.g. '3–7 working days'
  returnWindow:     null,   // e.g. '30 days'
  gstInclusive:     true
};
```

Set a value and the matching UI appears — the free-delivery meter in the bag,
the delivery line on the product page, the returns FAQ. Leave it `null` and the
site simply says nothing rather than making a claim it cannot support.

## The collection

Three launch fragrances live in `NIELLOR_PRODUCTS` (js/products.js):

| Fragrance | For | Character |
|---|---|---|
| Roselle | Women | Floral · Elegant · Feminine |
| Aéris | Unisex | Fresh · Refined · Refreshing |
| Valenor | Men | Woody · Intense · Sophisticated |

Each owns its `image` object. Changing one never affects the others —
verified by mutating one and re-rendering.

## Coming Soon

`NIELLOR_COMING_SOON` holds fragrances in development. They carry no price,
no notes and no launch date, cannot be added to the bag, and are flagged
"Coming Soon" on the card. "Join the Waitlist" routes to the contact form with
that reason preselected rather than pretending to register anyone.

**To promote one to a real fragrance:** move its object into
`NIELLOR_PRODUCTS`, give it an `id`, `image`, `sizes` and description.
Every page picks it up — no redesign.

## Campaign / editorial

`NIELLOR_CAMPAIGN` holds one frame per fragrance, each with **its own**
`image` slot. Those slots are empty, so each frame currently falls back to
that fragrance's own product photograph — never another product's, and never
an invented bottle.

Drop model campaign photography in by setting `image.src` on the entry you
want. Setting one does not touch the others, and it does not touch the
product image either.

The section carries the line *"Editorial imagery. Models are not brand
representatives."* Keep that if you use model photography.

## Welcome offer

`NIELLOR_PROMO` controls the WELCOME10 banner:

```js
const NIELLOR_PROMO = {
  active: true,
  code: 'WELCOME10',
  checkoutConnected: false   // ← set true once checkout applies the code
};
```

While `checkoutConnected` is `false` the banner says the offer *"applies to
your first order once online checkout opens"* — it does not claim a discount
the site cannot yet apply. **When you connect a payment gateway, create the
WELCOME10 rule there and set this flag to `true`.** Set `active: false` to
remove the banner entirely.

## Contact form

The form on `contact.html` has two real delivery paths and never fakes a
confirmation.

**Right now** (`NIELLOR_CONTACT.formEndpoint` is empty): submitting opens a
pre-filled draft in the visitor's own mail app, addressed to
`niellor.co@gmail.com`, with their name, email, reason and message already in
the body. They press send. The confirmation text says exactly that — it does
not claim the message was sent on its own.

**To have messages arrive without the visitor's mail app**, connect a form
service. The site is static, so it cannot send email by itself; a service or
your own backend has to do it. [Formspree](https://formspree.io) is the usual
choice and has a free tier:

1. Sign up with **niellor.co@gmail.com** — that is where messages will land.
2. Create a form; it gives you an endpoint like
   `https://formspree.io/f/abcdwxyz`.
3. Put it in `js/products.js`:

   ```js
   const NIELLOR_CONTACT = {
     email: 'niellor.co@gmail.com',
     formEndpoint: 'https://formspree.io/f/abcdwxyz'
   };
   ```

Nothing else changes. The form then POSTs there, reports success only when the
service confirms it, and on failure shows the email address as a fallback
without discarding what the visitor typed.

**On secrets:** a form endpoint URL is public by design — it is safe in this
file. A private API key is not. Never put an API key, SMTP password or access
token in `js/`, because everything there is downloaded by the browser. If a
service asks for a secret key, it needs to sit on a server or serverless
function instead.

The form also carries a honeypot field that silently drops bot submissions.

## Before going live

- **Contact form endpoint** — see above; until it is set, the form uses the
  visitor's mail app.
- **Facebook** — `NIELLOR_SOCIALS` in `js/products.js` has an empty slot ready.
- **Commerce policy** — fill in `NIELLOR_POLICY` above.
- **Campaign photography** — `NIELLOR_CAMPAIGN` image slots are empty and
  currently fall back to the product photographs.
- **WELCOME10** — connect the code at checkout, then set `checkoutConnected`.

## What is and isn't wired up

**Working:** the cart (add, quantity, remove, persists across refresh via
`localStorage`), Scent Finder, filters, size selection, comparison table,
accordions, mobile navigation.

**Not connected:** checkout, the contact form and the newsletter have no
backend. To take payments in India you need a gateway — Razorpay, Cashfree or
PayU all cover UPI, cards and net banking in one integration — and that
requires a server, because payment signatures cannot be verified safely in
browser JavaScript.

## Content policy

No fabricated brand facts appear anywhere: no invented fragrance notes,
longevity figures, ingredient lists, certifications, awards, founding dates or
customer reviews. Product copy is taken from the NIELLOR brochure and product
sheet. Keep it that way — if a fact is not known, use general wording or leave
the field empty.
