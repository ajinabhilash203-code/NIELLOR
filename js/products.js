/* ==========================================================================
   NIELLOR — catalogue

   ARCHITECTURE NOTE — image independence
   Every image is an explicit field on its own data object:

       image: { src: 'assets/img/women.webp', alt: '…' }

   Nothing is derived from the product id, and no global flag sits in the
   lookup path. Replacing one product's image changes that product only.
   To swap an image, edit that product's `image.src`. To use a different
   file format for one product, just write a different filename — the
   others are untouched.

   If `src` is empty the card renders a clean placeholder frame rather than
   a broken image or invented artwork.
   ========================================================================== */

/* --------------------------------------------------------------------------
   Sizes and pricing (India). Prices are those supplied for the brand.
   Each product may override `sizes`; otherwise this ladder applies.
   -------------------------------------------------------------------------- */
const NIELLOR_SIZES = [
  { ml: 30,  price: 1499 },
  { ml: 50,  price: 2399, tag: 'Most Popular' },
  { ml: 100, price: 4699, tag: 'Best Value'   }
];

const NIELLOR_DEFAULT_ML = 50;

/* Indian digit grouping — 1,499 · 4,699 · 1,24,500 */
const money = n => '₹' + Number(n).toLocaleString('en-IN');

/* --------------------------------------------------------------------------
   COMMERCE POLICY
   Deliberately empty. These are business decisions, not facts we can invent.
   Fill them in and the matching UI appears; leave them null and the site
   simply says nothing rather than making a claim.
   -------------------------------------------------------------------------- */
const NIELLOR_POLICY = {
  freeShippingOver: null,   // e.g. 1999  → shows the free-delivery meter
  deliveryWindow:   null,   // e.g. '3–7 working days'
  returnWindow:     null,   // e.g. '30 days'
  gstInclusive:     true    // prices shown inclusive of GST
  /* NIELLOR does not offer cash on delivery. */
};

/* --------------------------------------------------------------------------
   CONTACT
   `email` is the official address, used for the mailto links and as the
   destination for the contact form.

   `formEndpoint` is where the contact form POSTs. It points at the
   `contact-submit` Supabase Edge Function, which saves the message, issues a
   ticket number (NL-1001, NL-1002 …) and emails NIELLOR. Success is only
   reported once the server confirms the message was stored.

   This URL is PUBLIC by design — it is just an address, and it carries no
   secret. The Resend API key lives only inside that function, on Supabase's
   servers, as the RESEND_API_KEY secret. Never put a private API key or
   secret in this file — it ships to every visitor's browser.

   If this is ever emptied, the form falls back to opening a pre-filled draft
   in the visitor's own mail app, so a message is still genuinely delivered.
   -------------------------------------------------------------------------- */
const NIELLOR_CONTACT = {
  email: 'niellor.co@gmail.com',
  formEndpoint: 'https://xqityglaejzudujobzng.supabase.co/functions/v1/contact-submit'
};

/* ==========================================================================
   ⚠  PLACEHOLDER CATALOGUE — NOT FINAL PRODUCT DATA
   Roselle / Aéris / Valenor, their descriptions, accords, tags and the
   1499 / 2399 / 4699 price ladder are working values for build and testing.
   Replace them with the final NIELLOR fragrances before launch.

   To swap in the real collection, edit only this file:
     • name / shortName / slug / category / audience / line / family
     • descriptors, accords, tags   → these drive search
     • description
     • image.src                    → each product keeps its OWN image
     • notes                        → leave null until notes are confirmed
     • NIELLOR_SIZES                → the shared price ladder
   Every page, the search index, the comparison table and the cart follow
   automatically. The same values are seeded in supabase/schema.sql — update
   both, or treat the database as the source of truth once it is live.
   ========================================================================== */

/* --------------------------------------------------------------------------
   THE COLLECTION
   Add a fourth, fifth or twentieth fragrance by appending an object here.
   Every page renders from this array, so nothing else needs to change.
   -------------------------------------------------------------------------- */
const NIELLOR_PRODUCTS = [
  {
    id: 'roselle',
    name: 'NIELLOR Roselle',
    shortName: 'Roselle',
    category: 'For Women',
    line: 'Pour Femme',
    family: 'Floral',
    descriptors: ['Floral', 'Elegant', 'Feminine'],
    mood: 'Graceful. Feminine. Timeless.',
    icon: 'flower',
    slug: 'roselle',
    audience: 'Women',
    /* Accords and tags are taken from NIELLOR's own product copy
       ("floral and musky notes"). Nothing here is invented — where a
       note has not been confirmed it is simply absent. */
    accords: ['floral', 'musk'],
    tags: ['women', 'pour femme', 'floral', 'elegant', 'feminine', 'eau de parfum'],
    comingSoon: false,

    /* ── Roselle's image, and nothing else's ── */
    image: {
      src: 'assets/img/roselle.webp',
      alt: 'NIELLOR Roselle eau de parfum, rose glass flacon with a gold cap, among pink petals'
    },
    gallery: [],

    description: 'A delicate blend of floral and musky notes designed for the modern woman who embodies elegance and confidence.',
    tint: '#F7E7E3',
    sizes: NIELLOR_SIZES,
    available: true,
    concentration: 'Eau de Parfum',
    notes: null,          // not published — never invent these
    quiz: ['floral', 'soft', 'day']
  },
  {
    id: 'aeris',
    name: 'NIELLOR Aéris',
    shortName: 'Aéris',
    category: 'Unisex',
    line: 'Unisex',
    family: 'Fresh',
    descriptors: ['Fresh', 'Refined', 'Refreshing'],
    mood: 'Balanced. Refined. Effortless.',
    icon: 'leaf',
    slug: 'aeris',
    audience: 'Unisex',
    /* From "fresh, woody, and musk notes" in the confirmed copy. */
    accords: ['fresh', 'woody', 'musk'],
    tags: ['unisex', 'fresh', 'refined', 'refreshing', 'woody', 'eau de parfum'],
    comingSoon: false,

    /* ── Aéris's image, and nothing else's ── */
    image: {
      src: 'assets/img/unisex.webp',
      alt: 'NIELLOR Aéris eau de parfum, clear glass flacon with a black cap'
    },
    gallery: [],

    description: 'A harmonious fusion of fresh, woody, and musk notes — crafted for those who appreciate sophistication beyond gender.',
    tint: '#F3EFE2',
    sizes: NIELLOR_SIZES,
    available: true,
    concentration: 'Eau de Parfum',
    notes: null,
    quiz: ['fresh', 'balanced', 'any']
  },
  {
    id: 'valenor',
    name: 'NIELLOR Valenor',
    shortName: 'Valenor',
    category: 'For Men',
    line: 'Pour Homme',
    family: 'Woody',
    descriptors: ['Woody', 'Intense', 'Sophisticated'],
    mood: 'Bold. Confident. Distinctive.',
    icon: 'wood',
    slug: 'valenor',
    audience: 'Men',
    /* From "spicy, woody, and amber notes" in the confirmed copy. */
    accords: ['spicy', 'woody', 'amber'],
    tags: ['men', 'pour homme', 'woody', 'intense', 'sophisticated', 'amber', 'eau de parfum'],
    comingSoon: false,

    /* ── Valenor's image, and nothing else's ── */
    image: {
      src: 'assets/img/men.webp',
      alt: 'NIELLOR Valenor eau de parfum, black glass flacon with a gold collar'
    },
    /* Extra shots of THIS fragrance only, in the order the customer sees them.
       The product page turns these into thumbnails automatically; a product
       with none simply shows no gallery. The cover above always comes first. */
    gallery: [
      {
        src: 'assets/img/valenor-box.webp',
        alt: 'NIELLOR Valenor presentation box opened to show the flacon and the story card'
      }
    ],

    description: 'A powerful blend of spicy, woody, and amber notes, made for the man who leaves a lasting impression.',
    tint: '#E7E2DA',
    sizes: NIELLOR_SIZES,
    available: true,
    concentration: 'Eau de Parfum',
    notes: null,
    quiz: ['woody', 'bold', 'night']
  }

  /* Next fragrance — copy this shape:
  ,{
    id: 'noir',
    name: 'NIELLOR Noir',
    shortName: 'Noir',
    category: 'Noir',
    line: '',
    family: '',
    mood: '',
    image: { src: 'assets/img/noir.webp', alt: '' },   // its own image
    gallery: [],
    description: '',
    tint: '#EFEAE2',
    sizes: NIELLOR_SIZES,
    available: true,
    concentration: 'Eau de Parfum',
    notes: null,
    quiz: []
  }
  */
];

/* --------------------------------------------------------------------------
   Editorial imagery
   Separate objects so each can be replaced on its own. Empty `src` renders
   a placeholder frame — no stand-in photography, no invented artwork.
   -------------------------------------------------------------------------- */
const NIELLOR_MEDIA = {
  hero: {
    src: 'assets/img/women.webp',
    alt: 'NIELLOR eau de parfum'
  },
  house: {
    src: '',                       // lifestyle image to follow
    alt: 'Inside the NIELLOR house'
  },
  packaging: {
    /* Reusing an existing NIELLOR asset rather than leaving an empty frame.
       Repoint to dedicated packaging photography when it is ready — this is
       its own field, so it changes nothing else. */
    src: 'assets/img/women.webp',
    alt: 'NIELLOR eau de parfum presentation'
  },
  lifestyle: {
    /* Wide editorial band, composed from the existing NIELLOR render so the
       flacon is never cropped by the wide aspect. Its own field —
       independent of the products and of `packaging`. Swap in a dedicated
       wide campaign shot when available. */
    src: 'assets/img/lifestyle-band.webp',
    alt: 'NIELLOR eau de parfum in soft natural light'
  }
};

/* --------------------------------------------------------------------------
   SOCIAL ACCOUNTS
   Only accounts with a real `url` are rendered. Facebook is listed with an
   empty url so the slot is ready — fill in the url when the account exists
   and it appears in the footer and on the contact page automatically.
   Never invent a url, handle, email or phone number here.
   -------------------------------------------------------------------------- */
const NIELLOR_SOCIALS = [
  {
    key: 'instagram',
    label: 'Instagram',
    handle: '@niellor.co',
    url: 'https://www.instagram.com/niellor.co/',
    icon: 'ig'
  },
  {
    key: 'facebook',
    label: 'Facebook',
    handle: '',
    url: '',                       // ← add the Facebook url here when ready
    icon: 'fb'
  }
];

/* Only the accounts that actually exist */
const activeSocials = () => NIELLOR_SOCIALS.filter(s => s.url && s.url.trim());

/* Audience frames — one independent reference each */
const NIELLOR_AUDIENCE = [
  {
    key: 'women',
    title: 'Women',
    image: { src: 'assets/img/roselle.webp', alt: 'NIELLOR Women' },
    text: 'Modern, confident women who appreciate elegance, self-expression, and timeless beauty. They seek fragrances that complement their personality and lifestyle.'
  },
  {
    key: 'unisex',
    title: 'Unisex',
    image: { src: 'assets/img/unisex.webp', alt: 'NIELLOR Unisex' },
    text: 'Individuals who embrace versatility and balance. They prefer sophisticated scents that transcend traditional boundaries and reflect their unique identity.'
  },
  {
    key: 'men',
    title: 'Men',
    image: { src: 'assets/img/men.webp', alt: 'NIELLOR Men' },
    text: 'Ambitious, modern men who value quality, charisma, and authenticity. They choose fragrances that leave a lasting impression everywhere they go.'
  }
];

/* --------------------------------------------------------------------------
   COMING SOON
   Fragrances in development. These are NOT purchasable and carry no invented
   notes, prices or launch dates — only atmosphere.

   To turn one into a real fragrance later: move its object into
   NIELLOR_PRODUCTS, give it an id, image, sizes and description. Nothing
   else on the site needs redesigning.
   -------------------------------------------------------------------------- */
const NIELLOR_COMING_SOON = [
  {
    key: 'cs-1',
    label: 'Coming Soon',
    teaser: 'A new chapter in the NIELLOR collection.',
    tint: '#F4EAE6',
    image: { src: '', alt: 'NIELLOR — a future fragrance' }   // its own slot
  },
  {
    key: 'cs-2',
    label: 'Coming Soon',
    teaser: 'Composed in the quiet hours, for the hours that follow.',
    tint: '#F1EEE4',
    image: { src: '', alt: 'NIELLOR — a future fragrance' }
  },
  {
    key: 'cs-3',
    label: 'Coming Soon',
    teaser: 'Something warmer, for a season still ahead.',
    tint: '#EFE8DE',
    image: { src: '', alt: 'NIELLOR — a future fragrance' }
  },
  {
    key: 'cs-4',
    label: 'Coming Soon',
    teaser: 'The next signature, taking shape.',
    tint: '#EDE9E2',
    image: { src: '', alt: 'NIELLOR — a future fragrance' }
  }
];

/* --------------------------------------------------------------------------
   CAMPAIGN / EDITORIAL
   One frame per fragrance, each with its OWN image object — replacing one
   campaign image never touches another.

   `image.src` is empty by default: these are meant to be model campaign
   photographs, which are not in the project yet. Until one is supplied the
   card falls back to that fragrance's own product image (`fallback`), so the
   section is never empty and never shows an invented bottle.
   -------------------------------------------------------------------------- */
const NIELLOR_CAMPAIGN = [
  {
    key: 'roselle',
    productId: 'roselle',
    title: 'Roselle',
    audience: 'Women',
    line: 'A refined portrait, in bloom.',
    image: { src: '', alt: 'NIELLOR Roselle campaign' }
  },
  {
    key: 'aeris',
    productId: 'aeris',
    title: 'Aéris',
    audience: 'Unisex',
    line: 'Fresh air, clean light, no boundaries.',
    image: { src: '', alt: 'NIELLOR Aéris campaign' }
  },
  {
    key: 'valenor',
    productId: 'valenor',
    title: 'Valenor',
    audience: 'Men',
    line: 'Evening light, and a lasting impression.',
    image: { src: '', alt: 'NIELLOR Valenor campaign' }
  }
];

/* A campaign frame uses its own image when set, otherwise that fragrance's
   product photograph. Never another product's. */
function campaignImage(entry) {
  if (entry.image && entry.image.src) return entry.image;
  const p = NIELLOR_PRODUCTS.find(x => x.id === entry.productId);
  return p ? p.image : { src: '', alt: entry.title };
}

/* --------------------------------------------------------------------------
   WELCOME OFFER
   The code is displayed here, but a discount is only real once checkout
   exists to apply it. `active` controls whether the section renders at all,
   and `checkoutConnected` controls the honest wording underneath.
   -------------------------------------------------------------------------- */
const NIELLOR_PROMO = {
  active: true,
  code: 'WELCOME10',
  headline: 'Welcome to NIELLOR',
  offer: 'Enjoy 10% off your first order',
  checkoutConnected: false   // set true once the gateway applies WELCOME10
};

/* --------------------------------------------------------------------------
   Rendering helpers
   -------------------------------------------------------------------------- */

/* One image renderer for the whole site.
   Takes an image OBJECT, never an id, so callers cannot accidentally
   couple two products to the same source. */
function media(image, opts = {}) {
  const src = image && image.src ? String(image.src).trim() : '';
  const alt = (image && image.alt) || '';

  if (!src) {
    return `<div class="media-empty" role="img" aria-label="${alt || 'Image to follow'}">
        <span>Image to follow</span>
      </div>`;
  }

  const loading = opts.eager ? 'eager' : 'lazy';
  const priority = opts.eager ? ' fetchpriority="high"' : '';
  const sizes = opts.sizes ? ` sizes="${opts.sizes}"` : '';

  return `<img src="${src}" alt="${alt}" loading="${loading}"
    decoding="async"${priority}${sizes}>`;
}

/* Convenience: a product's own image */
const productMedia = (p, opts = {}) => media(p.image, opts);

const getProduct = id => NIELLOR_PRODUCTS.find(p => p.id === id);

/* Pricing helpers — a product's own ladder, falling back to the shared one */
const sizesOf = p => (p && p.sizes) || NIELLOR_SIZES;
const priceOf = (p, ml) => {
  const s = sizesOf(p).find(x => x.ml === ml) || sizesOf(p)[0];
  return s ? s.price : null;
};
const priceFrom = p => Math.min(...sizesOf(p).map(s => s.price));

/* Bag lines */
const linePrice = line => priceOf(getProduct(line.id), line.ml) || 0;
const lineMeta  = line => {
  const p = getProduct(line.id);
  return p ? `${p.family} · ${line.ml} ml` : `${line.ml} ml`;
};


/* --------------------------------------------------------------------------
   SEARCH INDEX

   Every product contributes a flat, lower-cased haystack built from its own
   fields. Adding a fragrance to NIELLOR_PRODUCTS makes it searchable
   immediately — there are no per-product search rules anywhere.

   Nothing is invented: `notes` is null until NIELLOR publishes notes, and
   `accords`/`tags` come from the brand's own product copy. A search for a
   note we have not confirmed correctly returns nothing.

   Scaling: searchIndex() and searchProducts() are the only two functions the
   UI calls. To move to a backend or a hosted search service later, replace
   searchProducts() with a fetch — the overlay does not change.
   -------------------------------------------------------------------------- */

const searchable = p => [
  p.name, p.shortName, p.slug, p.category, p.audience, p.line,
  p.family, p.concentration,
  ...(p.descriptors || []),
  ...(p.accords || []),
  ...(p.tags || []),
  ...(Array.isArray(p.notes) ? p.notes : []),
  p.description
].filter(Boolean).join(' ').toLowerCase();

/* Built once, reused for every keystroke */
const searchIndex = () => NIELLOR_PRODUCTS.map(p => ({ product: p, haystack: searchable(p) }));
let _index = null;
const getSearchIndex = () => (_index = _index || searchIndex());

/* Scores a product against the query. Word-prefix matches on the name rank
   highest, then category/audience, then anything else in the haystack. */
/* True when `term` begins a word inside `text`.
   Word-based rather than substring, so "men" does not match "women", while
   "musk" still matches "musky". Diacritics are folded so "aeris" finds
   "Aéris". */
const foldText = t => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const wordsOf = t => foldText(t).split(/[^a-z0-9]+/).filter(Boolean);
const wordMatch = (text, term) => {
  const needle = foldText(term);
  return wordsOf(text).some(w => w.startsWith(needle));
};

function searchProducts(query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/).filter(Boolean);

  return getSearchIndex()
    .map(({ product: p, haystack }) => {
      let score = 0;
      for (const t of terms) {
        /* Word-boundary match, not raw substring: searching "men" must not
           match "women", while "musk" should still match "musky". */
        if (!wordMatch(haystack, t)) return null;        // every term must match
        const name = (p.shortName + ' ' + p.name).toLowerCase();
        if (name.startsWith(t))            score += 100;
        else if (wordMatch(name, t))       score += 60;
        else if ((p.audience || '').toLowerCase() === t) score += 45;
        else if ((p.category || '').toLowerCase().includes(t)) score += 40;
        else if ((p.accords || []).some(a => a.startsWith(t))) score += 30;
        else if ((p.tags || []).some(x => x.startsWith(t))) score += 25;
        else                               score += 10;   // description match
      }
      return { product: p, score };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .map(r => r.product);
}

/* Suggestions offered under an empty or partial query */
const searchSuggestions = () => {
  const out = new Set();
  NIELLOR_PRODUCTS.forEach(p => {
    out.add(p.shortName);
    (p.accords || []).forEach(a => out.add(a));
    if (p.audience) out.add(p.audience);
  });
  return [...out];
};
