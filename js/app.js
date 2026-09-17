/* ==========================================================================
   NIELLOR — application
   Shared chrome, cart, reveals, scent finder.
   ========================================================================== */

/* --------------------------------------------------------------------------
   Icons
   -------------------------------------------------------------------------- */
const ICON = {
  bag:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M6 7h12l1 13H5L6 7z"/><path d="M9 7V5.5a3 3 0 0 1 6 0V7"/></svg>',
  search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M16.5 16.5 21 21"/></svg>',
  user:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5 9 17.5 20 6.5"/></svg>',
  star:  '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.3 6.8.8-5 4.7 1.3 6.8L12 17.3 6 20.6l1.3-6.8-5-4.7 6.8-.8z"/></svg>',
  sparkle:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linejoin="round"><path d="M12 2.5l2.4 6.1 6.1 2.4-6.1 2.4L12 19.5l-2.4-6.1L3.5 11l6.1-2.4z"/></svg>',
  diamond:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linejoin="round"><path d="M6 3h12l4 6-10 12L2 9z"/><path d="M2 9h20M9 3l-3 6 6 12 6-12-3-6"/></svg>',
  leaf:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21V9"/><path d="M12 12c0-3.3 2.7-6 6-6 0 3.3-2.7 6-6 6z"/><path d="M12 15c0-2.8-2.2-5-5-5 0 2.8 2.2 5 5 5z"/></svg>',
  bottle:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linejoin="round"><rect x="7" y="9" width="10" height="12" rx="2"/><path d="M10 9V6h4v3M9.5 3.5h5"/></svg>',
  hourglass:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12M6 21h12"/><path d="M7 3c0 5 5 6 5 9s-5 4-5 9M17 3c0 5-5 6-5 9s5 4 5 9"/></svg>',
  minimal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linejoin="round"><rect x="4" y="3" width="7" height="18"/><rect x="14" y="8" width="6" height="13"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linejoin="round"><path d="M12 20s-7-4.5-7-9.5A3.8 3.8 0 0 1 12 8a3.8 3.8 0 0 1 7 2.5C19 15.5 12 20 12 20z"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round"><circle cx="9" cy="8" r="3.4"/><path d="M2.5 20c0-3.6 2.9-5.6 6.5-5.6s6.5 2 6.5 5.6"/><circle cx="17.5" cy="9" r="2.6"/><path d="M17 14c2.8 0 4.5 1.7 4.5 4.4"/></svg>',
  globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.6 3.8 5.6 3.8 9S14.6 18.4 12 21c-2.6-2.6-3.8-5.6-3.8-9S9.4 5.6 12 3z"/></svg>',
  gift:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linejoin="round"><rect x="3" y="9" width="18" height="12" rx="1"/><path d="M2 9h20M12 9v12"/><path d="M12 9S9 3 6.5 4.5 9 9 12 9zM12 9s3-6 5.5-4.5S15 9 12 9z"/></svg>',
  shield:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linejoin="round"><path d="M12 3l8 3v6c0 5-3.4 8.3-8 9.5C7.4 20.3 4 17 4 12V6z"/></svg>',
  truck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linejoin="round"><path d="M2 7h11v10H2zM13 10h4.5l3.5 3.5V17h-8z"/><circle cx="6.5" cy="18.5" r="1.8"/><circle cx="17" cy="18.5" r="1.8"/></svg>',
  pin:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linejoin="round"><path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/></svg>',
  mail:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="M3.5 6.5 12 13l8.5-6.5"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linejoin="round"><path d="M6 3h3l2 5-2.4 1.4a12 12 0 0 0 6 6L16 13l5 2v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4 5.2 2 2 0 0 1 6 3z"/></svg>',
  sun:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2v2.6M12 19.4V22M2 12h2.6M19.4 12H22M4.9 4.9l1.9 1.9M17.2 17.2l1.9 1.9M19.1 4.9l-1.9 1.9M6.8 17.2l-1.9 1.9"/></svg>',
  moon:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linejoin="round"><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5.3l3.3 2"/></svg>',
  wood:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5.5"/><circle cx="12" cy="12" r="2"/></svg>',
  flower:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linejoin="round"><circle cx="12" cy="12" r="2.6"/><path d="M12 9.4C12 6 13.5 4 12 2c-1.5 2 0 4 0 7.4zM14.6 12c3.4 0 5.4 1.5 7.4 0-2-1.5-4 0-7.4 0zM12 14.6c0 3.4-1.5 5.4 0 7.4 1.5-2 0-4 0-7.4zM9.4 12C6 12 4 10.5 2 12c2 1.5 4 0 7.4 0z"/></svg>',
  wave:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round"><path d="M2 9c2.5-2.5 5-2.5 7.5 0S15 11.5 17.5 9 22 6.5 22 6.5M2 15c2.5-2.5 5-2.5 7.5 0s5.5 2.5 8 0 4.5-2.5 4.5-2.5"/></svg>',
  ig:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17" cy="7" r="1" fill="currentColor" stroke="none"/></svg>',
  fb:    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.25-1.5 1.55-1.5h1.65V3.6c-.29-.04-1.27-.13-2.41-.13-2.38 0-4.01 1.45-4.01 4.12v2.3H7.6V13h2.67v8z"/></svg>',
  pin2:  '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-3.6 19.3c-.09-.8-.16-2.05.03-2.93l1.2-5.1s-.3-.6-.3-1.5c0-1.4.82-2.45 1.83-2.45.87 0 1.28.65 1.28 1.43 0 .87-.55 2.17-.84 3.38-.24 1 .5 1.83 1.5 1.83 1.8 0 3.18-1.9 3.18-4.63 0-2.42-1.74-4.11-4.22-4.11-2.87 0-4.56 2.15-4.56 4.38 0 .87.33 1.8.75 2.3.08.1.1.19.07.3l-.28 1.15c-.05.18-.15.22-.34.13-1.25-.58-2.03-2.4-2.03-3.87 0-3.15 2.29-6.04 6.6-6.04 3.46 0 6.16 2.47 6.16 5.77 0 3.44-2.17 6.22-5.18 6.22-1.01 0-1.96-.53-2.29-1.15l-.62 2.38c-.22.87-.83 1.96-1.24 2.62A10 10 0 1 0 12 2z"/></svg>',
  x:     '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 3h3.1l-6.8 7.8L21.8 21h-6.2l-4.9-6.4L5.1 21H2l7.3-8.3L2.4 3h6.4l4.4 5.8zm-1.1 16.1h1.7L7.7 4.8H5.9z"/></svg>',
  card:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linejoin="round"><rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 9.5h19"/><path d="M6 15h4"/></svg>',
  upi:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linejoin="round"><path d="M12 2.5 5 12l7 9.5L19 12z"/><path d="M12 7.5 8.5 12l3.5 4.5 3.5-4.5z"/></svg>',
  bank:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linejoin="round"><path d="M3 9.5 12 4l9 5.5"/><path d="M5 9.5V19M9.5 9.5V19M14.5 9.5V19M19 9.5V19"/><path d="M3 19h18"/></svg>'
};

/* Indian payment rail, shown at checkout and in the footer */
const PAY_METHODS = [
  { icon: 'upi',  label: 'UPI' },
  { icon: 'card', label: 'Cards' },
  { icon: 'bank', label: 'Net Banking' }
];

const payRail = () => {
  const list = PAY_METHODS;
  return `<div class="pay-rail">
    ${list.map(m => `<span class="pay-chip">${ICON[m.icon]}<em>${m.label}</em></span>`).join('')}
  </div>`;
};

/* Footer small print, assembled only from policy that has been set */
const footerTerms = () => {
  const bits = [];
  if (NIELLOR_POLICY.freeShippingOver) bits.push('Free delivery over ' + money(NIELLOR_POLICY.freeShippingOver));
  if (NIELLOR_POLICY.gstInclusive)     bits.push('All prices include GST');
  if (NIELLOR_POLICY.deliveryWindow)   bits.push('Delivered in ' + NIELLOR_POLICY.deliveryWindow);
  return bits.join(' &middot; ');
};

/* --------------------------------------------------------------------------
   Shared chrome
   -------------------------------------------------------------------------- */
const NAV_ITEMS = [
  { href: 'index.html',      label: 'Home' },
  { href: 'collection.html', label: 'Collection' },
  { href: 'house.html',      label: 'The House' },
  { href: 'about.html',      label: 'About' },
  { href: 'contact.html',    label: 'Contact' }
];

function currentPage() {
  const f = location.pathname.split('/').pop();
  return !f || f === '' ? 'index.html' : f;
}

function mountChrome() {
  const page = currentPage();

  /* Only statements we can actually stand behind. Anything policy-dependent
     is added from NIELLOR_POLICY, so nothing is claimed until it is set. */
  const announcements = [
    'NIELLOR — Timeless scents. Unforgettable impressions.',
    'Pay by UPI, card or net banking',
    NIELLOR_POLICY.gstInclusive ? 'All prices include GST' : 'Discover your signature scent'
  ];
  if (NIELLOR_POLICY.freeShippingOver) {
    announcements.push(`Free delivery on orders over ${money(NIELLOR_POLICY.freeShippingOver)}`);
  }

  const header = `
    <div class="announce">
      <span>${announcements.map(a => `<div>${a}</div>`).join('')}</span>
    </div>
    <nav class="nav" id="nav">
      <div class="wrap nav-inner">
        <button class="burger" id="burger" aria-label="Menu" aria-expanded="false">
          <i></i><i></i><i></i>
        </button>
        <ul class="nav-links" id="navLinks">
          ${NAV_ITEMS.map(n => `
            <li><a href="${n.href}"${n.href === page ? ' aria-current="page"' : ''}>${n.label}</a></li>
          `).join('')}
        </ul>
        <a class="brand" href="index.html" aria-label="NIELLOR home">
          <span class="brand-word">Niellor</span>
          <span class="brand-sub">Eau de Parfum</span>
        </a>
        <div class="nav-actions">
          <button class="icon-btn" id="searchBtn" aria-label="Search">${ICON.search}</button>
          <button class="icon-btn" id="accountBtn" aria-label="Sign in">${ICON.user}</button>
          <button class="icon-btn" id="cartBtn" aria-label="Open cart">
            ${ICON.bag}<span class="cart-count" id="cartCount">0</span>
          </button>
        </div>
      </div>
    </nav>`;

  const footer = `
    <footer class="footer">
      <div class="wrap footer-grid">
        <div class="footer-brand">
          <a class="brand" href="index.html">
            <span class="brand-word">Niellor</span>
            <span class="brand-sub">Eau de Parfum</span>
          </a>
          <p>Timeless fragrance, modern legacy. We create more than perfumes — we create emotions that connect.</p>
          <div class="socials">
            ${activeSocials().map(s => `
              <a href="${s.url}" target="_blank" rel="noopener noreferrer"
                 aria-label="${s.label}${s.handle ? ' ' + s.handle : ''}">
                ${ICON[s.icon]}<em>${s.label}${s.handle ? ' &mdash; ' + s.handle : ''}</em>
              </a>`).join('')}
            <a href="mailto:${NIELLOR_CONTACT.email}" aria-label="Email ${NIELLOR_CONTACT.email}">
              ${ICON.mail}<em>${NIELLOR_CONTACT.email}</em>
            </a>
          </div>
        </div>
        <div>
          <h5>Collection</h5>
          <ul class="footer-links">
            <li><a href="product.html?id=women">Women</a></li>
            <li><a href="product.html?id=unisex">Unisex</a></li>
            <li><a href="product.html?id=men">Men</a></li>
            <li><a href="collection.html">Gift Sets</a></li>
          </ul>
        </div>
        <div>
          <h5>The House</h5>
          <ul class="footer-links">
            <li><a href="house.html">Brand Identity</a></li>
            <li><a href="house.html#values">Our Values</a></li>
            <li><a href="about.html">Packaging &amp; Design</a></li>
            <li><a href="about.html#partnership">Partnership</a></li>
            <li><a href="contact.html">Contact</a></li>
          </ul>
        </div>
        <div>
          <h5>Client Care</h5>
          <ul class="footer-links">
            <li><a href="contact.html">Shipping &amp; Returns</a></li>
            <li><a href="contact.html">Order Tracking</a></li>
            <li><a href="contact.html">Fragrance Guide</a></li>
            <li><a href="contact.html">FAQ</a></li>
          </ul>
        </div>
      </div>
      <div class="wrap footer-pay">
        ${payRail()}
        <p class="footer-terms">${footerTerms()}</p>
      </div>
      <div class="wrap footer-bottom">
        <span>&copy; ${new Date().getFullYear()} NIELLOR. All rights reserved.</span>
        <span>Privacy &middot; Terms</span>
      </div>
    </footer>`;

  const drawer = `
    <div class="scrim" id="scrim"></div>
    <aside class="drawer" id="drawer" aria-label="Shopping bag">
      <div class="drawer-head">
        <h3>Your Bag</h3>
        <button class="icon-btn" id="drawerClose" aria-label="Close">${ICON.close}</button>
      </div>
      <div class="drawer-body" id="drawerBody"></div>
      <div class="drawer-foot">
        <div class="ship-meter" id="shipMeter"></div>
        <div class="drawer-total">
          <span>Subtotal <em>incl. GST</em></span>
          <b id="cartTotal">${money(0)}</b>
        </div>
        <a class="btn btn-full" href="checkout.html" id="drawerCheckout">Proceed to Checkout</a>
        ${payRail()}
      </div>
    </aside>
    <div class="toast" id="toast">${ICON.check}<span id="toastMsg"></span></div>`;

  document.getElementById('site-header').innerHTML = header;
  document.getElementById('site-footer').innerHTML = footer;
  document.body.insertAdjacentHTML('beforeend', drawer);
}

/* --------------------------------------------------------------------------
   Preloader
   -------------------------------------------------------------------------- */
function initPreloader() {
  const pre = document.getElementById('preloader');
  if (!pre) return;

  const mark = pre.querySelector('.preloader-mark');
  mark.innerHTML = [...mark.textContent.trim()]
    .map((c, i) => `<span style="animation-delay:${i * 70}ms">${c}</span>`).join('');

  const hide = () => setTimeout(() => {
    pre.classList.add('done');
    document.body.classList.add('loaded');
  }, 1350);

  document.readyState === 'complete' ? hide() : addEventListener('load', hide);
}

/* --------------------------------------------------------------------------
   Navigation behaviour
   -------------------------------------------------------------------------- */
function initNav() {
  const nav    = document.getElementById('nav');
  const burger = document.getElementById('burger');
  const links  = document.getElementById('navLinks');

  addEventListener('scroll', () => {
    nav.classList.toggle('stuck', scrollY > 40);
  }, { passive: true });

  /* The mobile menu is a full-screen overlay, so the page behind it must not
     scroll while it is open. */
  const setMenu = open => {
    links.classList.toggle('open', open);
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
    document.body.classList.toggle('menu-open', open);
  };

  burger.addEventListener('click', () => setMenu(!links.classList.contains('open')));

  links.addEventListener('click', e => {
    if (e.target.closest('a')) setMenu(false);
  });

  addEventListener('keydown', e => {
    if (e.key === 'Escape' && links.classList.contains('open')) setMenu(false);
  });

  /* Leaving the mobile breakpoint must not strand the lock */
  matchMedia('(min-width: 901px)').addEventListener('change', e => {
    if (e.matches) setMenu(false);
  });
}

/* --------------------------------------------------------------------------
   Scroll reveal
   -------------------------------------------------------------------------- */
const revealAll = () =>
  document.querySelectorAll('[data-reveal]').forEach(el => el.classList.add('in'));

let failsafeArmed = false;

function initReveal() {
  const items = document.querySelectorAll('[data-reveal]');
  if (!items.length) return;

  // Content must never be stranded at opacity 0 — without the observer,
  // show everything rather than showing nothing.
  if (!('IntersectionObserver' in window)) return revealAll();

  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });

  items.forEach(el => {
    // Stagger siblings that share a parent, so rows cascade
    const sibs = [...el.parentElement.querySelectorAll(':scope > [data-reveal]')];
    el.style.setProperty('--d', `${Math.max(0, sibs.indexOf(el)) * 110}ms`);
    io.observe(el);
  });

  // If the observer demonstrably never ran while the page was visible,
  // fall back to showing the content unanimated.
  if (failsafeArmed) return;
  failsafeArmed = true;

  setTimeout(() => {
    if (document.hidden) return;              // background tab: let the observer catch up
    if (document.querySelector('[data-reveal].in')) return;  // observer is working

    const anyInView = [...document.querySelectorAll('[data-reveal]')].some(el => {
      const r = el.getBoundingClientRect();
      return r.top < innerHeight && r.bottom > 0;
    });
    if (anyInView) revealAll();
  }, 2500);
}

/* --------------------------------------------------------------------------
   Ambient tint — the page warms toward whichever bottle you hover
   -------------------------------------------------------------------------- */
function initAmbient() {
  const zones = document.querySelectorAll('[data-ambient]');
  if (!zones.length) return;
  const base = getComputedStyle(document.documentElement).getPropertyValue('--ivory').trim();

  zones.forEach(z => {
    z.addEventListener('mouseenter', () => {
      document.documentElement.style.setProperty('--ambient', z.dataset.ambient);
    });
    z.addEventListener('mouseleave', () => {
      document.documentElement.style.setProperty('--ambient', base);
    });
  });
}

/* --------------------------------------------------------------------------
   Cart
   -------------------------------------------------------------------------- */
const Cart = {
  key: 'niellor.cart',

  read() {
    let items;
    try { items = JSON.parse(localStorage.getItem(this.key)) || []; }
    catch { return []; }
    /* Drop lines whose fragrance no longer exists — a bag saved before the
       collection was renamed must not break the drawer. */
    const live = items.filter(l => l && getProduct(l.id));
    if (live.length !== items.length) {
      localStorage.setItem(this.key, JSON.stringify(live));
    }
    return live;
  },

  write(items) {
    localStorage.setItem(this.key, JSON.stringify(items));
    this.render();
  },

  add(id, ml = NIELLOR_DEFAULT_ML, qty = 1) {
    const items = this.read();
    const line = items.find(i => i.id === id && i.ml === ml);
    line ? line.qty += qty : items.push({ id, ml, qty });
    this.write(items);

    const p = getProduct(id);
    if (p) toast(`${p.shortName} ${ml} ml added to bag`);
    openDrawer();
  },

  setQty(idx, delta) {
    const items = this.read();
    if (!items[idx]) return;
    items[idx].qty += delta;
    if (items[idx].qty < 1) items.splice(idx, 1);
    this.write(items);
  },

  remove(idx) {
    const items = this.read();
    items.splice(idx, 1);
    this.write(items);
  },

  priceOf: linePrice,

  subtotal() {
    return this.read().reduce((sum, l) => sum + this.priceOf(l) * l.qty, 0);
  },

  render() {
    const items = this.read();
    const body  = document.getElementById('drawerBody');
    const count = document.getElementById('cartCount');
    const total = document.getElementById('cartTotal');
    const meter = document.getElementById('shipMeter');
    if (!body) return;

    const units = items.reduce((n, i) => n + i.qty, 0);
    count.textContent = units;
    count.classList.toggle('show', units > 0);

    /* Progress toward free delivery — only when a threshold has been set */
    const sub = this.subtotal();
    const threshold = NIELLOR_POLICY.freeShippingOver;
    if (!threshold || !items.length) {
      meter.innerHTML = '';
    } else {
      const short = threshold - sub;
      meter.innerHTML = short > 0
        ? `<p>Add <b>${money(short)}</b> more for free delivery</p>
           <i><span style="width:${Math.min(100, (sub / threshold) * 100)}%"></span></i>`
        : `<p class="done">${ICON.check} Free delivery unlocked</p>
           <i><span style="width:100%"></span></i>`;
    }

    if (!items.length) {
      body.innerHTML = `
        <div class="cart-empty">
          ${ICON.bag}
          <p>Your bag is empty</p>
          <a class="btn btn-sm btn-ghost" href="collection.html">Explore the Collection</a>
        </div>`;
      total.textContent = money(0);
      return;
    }

    body.innerHTML = items.map((line, i) => {
      const p = getProduct(line.id);
      const unit = this.priceOf(line);
      return `
        <div class="cart-item">
          <div class="cart-thumb" style="--tint:${p.tint}">${productMedia(p)}</div>
          <div>
            <h4>${p.shortName}</h4>
            <div class="meta">${lineMeta(line)}</div>
            <div class="qty">
              <button data-qty="${i}" data-delta="-1" aria-label="Decrease">&minus;</button>
              <span>${line.qty}</span>
              <button data-qty="${i}" data-delta="1" aria-label="Increase">+</button>
            </div>
          </div>
          <div class="cart-item-right">
            <strong>${money(unit * line.qty)}</strong>
            <button class="cart-remove" data-remove="${i}">Remove</button>
          </div>
        </div>`;
    }).join('');

    total.textContent = money(sub);
  }
};

function openDrawer() {
  document.getElementById('drawer').classList.add('open');
  document.getElementById('scrim').classList.add('open');
}
function closeDrawer() {
  document.getElementById('drawer').classList.remove('open');
  document.getElementById('scrim').classList.remove('open');
}

function initCart() {
  document.getElementById('cartBtn').addEventListener('click', openDrawer);
  document.getElementById('drawerClose').addEventListener('click', closeDrawer);
  document.getElementById('scrim').addEventListener('click', closeDrawer);
  addEventListener('keydown', e => e.key === 'Escape' && closeDrawer());

  document.getElementById('drawerBody').addEventListener('click', e => {
    const q = e.target.closest('[data-qty]');
    if (q) return Cart.setQty(+q.dataset.qty, +q.dataset.delta);
    const r = e.target.closest('[data-remove]');
    if (r) return Cart.remove(+r.dataset.remove);
  });

  // Any element carrying data-add="<id>" adds that fragrance
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-add]');
    if (!btn) return;
    e.preventDefault();
    Cart.add(btn.dataset.add, +(btn.dataset.ml || NIELLOR_DEFAULT_ML));
  });

  Cart.render();
}

let toastTimer;
function toast(msg) {
  const t = document.getElementById('toast');
  document.getElementById('toastMsg').textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

/* --------------------------------------------------------------------------
   Accordion
   -------------------------------------------------------------------------- */
function initAccordion() {
  document.querySelectorAll('.acc-item').forEach(item => {
    const head  = item.querySelector('.acc-head');
    const panel = item.querySelector('.acc-panel');
    head.addEventListener('click', () => {
      const open = item.classList.toggle('open');
      panel.style.maxHeight = open ? panel.scrollHeight + 'px' : 0;
    });
  });
}

/* --------------------------------------------------------------------------
   Scent Finder
   -------------------------------------------------------------------------- */
const QUIZ = [
  {
    q: 'Which world do you want to step into?',
    opts: [
      { v: 'floral', icon: 'flower', t: 'A Garden',  d: 'Petals, dew, first light' },
      { v: 'fresh',  icon: 'wave',   t: 'A Coastline', d: 'Salt air, citrus, open sky' },
      { v: 'woody',  icon: 'wood',   t: 'A Library',  d: 'Warm wood, leather, smoke' }
    ]
  },
  {
    q: 'How should a room remember you?',
    opts: [
      { v: 'soft',     icon: 'heart',   t: 'Softly',      d: 'A quiet, lingering trace' },
      { v: 'balanced', icon: 'sparkle', t: 'Effortlessly', d: 'Present, never insistent' },
      { v: 'bold',     icon: 'diamond', t: 'Boldly',      d: 'Felt before you are seen' }
    ]
  },
  {
    q: 'When do you reach for fragrance?',
    opts: [
      { v: 'day',   icon: 'sun',   t: 'Daylight',  d: 'Mornings, work, sunlight' },
      { v: 'any',   icon: 'clock', t: 'Always',    d: 'One scent, every hour' },
      { v: 'night', icon: 'moon',  t: 'After Dark', d: 'Evenings, dinners, occasions' }
    ]
  }
];

function initQuiz() {
  const root = document.getElementById('quiz');
  if (!root) return;

  const answers = [];

  const progress = () => `
    <div class="quiz-progress">
      ${QUIZ.map((_, i) => `<i class="${i <= answers.length ? 'on' : ''}"></i>`).join('')}
    </div>`;

  function renderStep(n) {
    const step = QUIZ[n];
    root.innerHTML = `
      <div class="quiz-step active">
        ${progress()}
        <p class="quiz-q">${step.q}</p>
        <div class="quiz-options">
          ${step.opts.map(o => `
            <button class="quiz-opt" data-v="${o.v}">
              ${ICON[o.icon]}
              <span>
                <strong>${o.t}</strong>
                <span>${o.d}</span>
              </span>
            </button>`).join('')}
        </div>
      </div>`;

    root.querySelectorAll('.quiz-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        answers.push(btn.dataset.v);
        answers.length < QUIZ.length ? renderStep(answers.length) : renderResult();
      });
    });
  }

  function renderResult() {
    // Score each fragrance by how many answers match its profile
    const scored = NIELLOR_PRODUCTS
      .map(p => ({ p, score: answers.filter(a => p.quiz.includes(a)).length }))
      .sort((a, b) => b.score - a.score);
    const win = scored[0].p;

    root.innerHTML = `
      <div class="quiz-step active quiz-result">
        <p class="eyebrow">Your Signature Scent</p>
        <div class="result-media">${productMedia(win)}</div>
        <h3>${win.shortName}</h3>
        <p class="result-mood">${win.mood}</p>
        <p>${win.description}</p>
        <div class="quiz-actions">
          <a class="btn btn-gold" href="product.html?id=${win.id}">Discover ${win.shortName}</a>
          <button class="btn btn-ghost" id="quizRestart">Start Again</button>
        </div>
      </div>`;

    document.getElementById('quizRestart').addEventListener('click', () => {
      answers.length = 0;
      renderStep(0);
    });
  }

  renderStep(0);
}

/* --------------------------------------------------------------------------
   Parallax on the hero bottle
   -------------------------------------------------------------------------- */
function initParallax() {
  const els = document.querySelectorAll('[data-parallax]');
  if (!els.length) return;

  let ticking = false;
  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      els.forEach(el => {
        const rate = parseFloat(el.dataset.parallax) || 0.15;
        el.style.setProperty('--py', `${scrollY * rate}px`);
        el.style.transform = `translateX(-50%) translateY(${scrollY * rate}px)`;
      });
      ticking = false;
    });
  }, { passive: true });
}

/* --------------------------------------------------------------------------
   Forms — no backend yet, so acknowledge politely
   -------------------------------------------------------------------------- */
function initForms() {
  document.querySelectorAll('form[data-demo]').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      toast(form.dataset.demo);
      form.reset();
    });
  });
}

/* --------------------------------------------------------------------------
   Boot
   -------------------------------------------------------------------------- */

/* ==========================================================================
   SEARCH
   A luxury search overlay driven entirely by searchProducts() in
   products.js. The UI never knows about individual fragrances, so adding a
   product to NIELLOR_PRODUCTS makes it findable with no change here — and
   swapping searchProducts() for a backend call later needs no UI change.
   ========================================================================== */

const RECENT_KEY = 'niellor.recentSearches';

const readRecent = () => {
  try { return (JSON.parse(localStorage.getItem(RECENT_KEY)) || []).slice(0, 5); }
  catch { return []; }
};
const pushRecent = q => {
  const term = String(q || '').trim();
  if (term.length < 2) return;
  const list = [term, ...readRecent().filter(x => x.toLowerCase() !== term.toLowerCase())].slice(0, 5);
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(list)); } catch {}
};

function mountSearch() {
  if (document.getElementById('searchOverlay')) return;

  document.body.insertAdjacentHTML('beforeend', `
    <div class="search-overlay" id="searchOverlay" role="dialog" aria-modal="true"
         aria-label="Search fragrances">
      <div class="search-panel">
        <div class="search-bar">
          <span class="search-bar-icon" aria-hidden="true">${ICON.search}</span>
          <input type="search" id="searchInput" autocomplete="off" spellcheck="false"
                 placeholder="Search fragrances, notes or collections…"
                 aria-label="Search fragrances, notes or collections"
                 aria-controls="searchResults" aria-expanded="true">
          <button class="search-clear" id="searchClear" type="button"
                  aria-label="Clear search" hidden>${ICON.close}</button>
          <button class="search-close" id="searchClose" type="button"
                  aria-label="Close search">${ICON.close}</button>
        </div>
        <div class="search-body" id="searchResults" role="listbox" aria-label="Search results"></div>
      </div>
    </div>`);

  const overlay = document.getElementById('searchOverlay');
  const input   = document.getElementById('searchInput');
  const results = document.getElementById('searchResults');
  const clearBtn = document.getElementById('searchClear');

  let active = -1;                 // keyboard-highlighted result

  /* ---- rendering ---- */
  const resultRow = (p, i) => `
    <a class="s-result" role="option" id="s-opt-${i}" href="product.html?id=${p.id}"
       data-idx="${i}">
      <span class="s-thumb" style="--tint:${p.tint}">${productMedia(p)}</span>
      <span class="s-text">
        <strong>${p.name}</strong>
        <em>${p.audience || p.category}</em>
        <span>${p.description}</span>
      </span>
      <span class="s-price">${money(priceFrom(p))}</span>
    </a>`;

  const chips = (label, list) => !list.length ? '' : `
    <div class="s-chips">
      <p class="s-chips-label">${label}</p>
      <div class="s-chip-row">
        ${list.map(t => `<button class="s-chip" type="button" data-term="${t}">${t}</button>`).join('')}
      </div>
    </div>`;

  function paintIdle() {
    active = -1;
    results.innerHTML =
      chips('Recent searches', readRecent()) +
      chips('Try', searchSuggestions());
  }

  function paintResults(q) {
    const found = searchProducts(q);
    active = -1;

    if (!found.length) {
      results.innerHTML = `
        <div class="s-empty">
          <p class="s-empty-head">No fragrances found.</p>
          <p class="s-empty-sub">Try another fragrance, note or collection.</p>
          ${chips('Try', searchSuggestions())}
        </div>`;
      return;
    }

    results.innerHTML = `
      <p class="s-count">${found.length} ${found.length === 1 ? 'fragrance' : 'fragrances'}</p>
      <div class="s-list">${found.map(resultRow).join('')}</div>`;
  }

  /* ---- debounce: the catalogue is small, but this keeps typing smooth and
         is the seam where a network-backed search would slot in ---- */
  let timer;
  const onType = () => {
    const q = input.value;
    clearBtn.hidden = !q;
    clearTimeout(timer);
    timer = setTimeout(() => (q.trim() ? paintResults(q) : paintIdle()), 120);
  };

  /* ---- keyboard ---- */
  const rows = () => [...results.querySelectorAll('.s-result')];
  const highlight = n => {
    const list = rows();
    if (!list.length) return;
    active = (n + list.length) % list.length;
    list.forEach((el, i) => el.classList.toggle('on', i === active));
    list[active].scrollIntoView({ block: 'nearest' });
    input.setAttribute('aria-activedescendant', list[active].id);
  };

  input.addEventListener('input', onType);
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); highlight(active + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); highlight(active - 1); }
    else if (e.key === 'Enter') {
      const list = rows();
      if (!list.length) return;
      e.preventDefault();
      pushRecent(input.value);
      (list[active] || list[0]).click();
    }
  });

  results.addEventListener('click', e => {
    const chip = e.target.closest('[data-term]');
    if (chip) {
      input.value = chip.dataset.term;
      clearBtn.hidden = false;
      paintResults(input.value);
      input.focus();
      return;
    }
    if (e.target.closest('.s-result')) pushRecent(input.value);
  });

  clearBtn.addEventListener('click', () => {
    input.value = '';
    clearBtn.hidden = true;
    paintIdle();
    input.focus();
  });

  document.getElementById('searchClose').addEventListener('click', closeSearch);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeSearch(); });
  addEventListener('keydown', e => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) closeSearch();
  });

  paintIdle();
}

let searchOpener = null;

function openSearch() {
  mountSearch();
  const overlay = document.getElementById('searchOverlay');
  const input = document.getElementById('searchInput');
  searchOpener = document.activeElement;
  overlay.classList.add('open');
  document.body.classList.add('menu-open');       // reuse the scroll lock
  /* Delay focus so the overlay is painted first — avoids the mobile keyboard
     opening before the panel has settled. */
  setTimeout(() => input.focus({ preventScroll: true }), 60);
}

function closeSearch() {
  const overlay = document.getElementById('searchOverlay');
  if (!overlay) return;
  overlay.classList.remove('open');
  document.body.classList.remove('menu-open');
  if (searchOpener && searchOpener.focus) searchOpener.focus();
}

function initSearch() {
  const btn = document.getElementById('searchBtn');
  if (btn) btn.addEventListener('click', openSearch);

  /* "/" focuses search, as on many storefronts */
  addEventListener('keydown', e => {
    if (e.key === '/' && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) {
      e.preventDefault();
      openSearch();
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  mountChrome();
  initPreloader();
  initNav();
  initSearch();
  if (typeof initAuth === "function") initAuth();
  initCart();
  initReveal();
  initAmbient();
  initAccordion();
  initQuiz();
  initParallax();
  initForms();

  // Page-specific renderers declared on the page itself
  if (typeof window.pageInit === 'function') window.pageInit();
});
