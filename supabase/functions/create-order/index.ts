/* ==========================================================================
   NIELLOR — create-order

   Turns a cart into a real order row. This is the money path, so the rules
   are stricter than anywhere else in the codebase:

     1. The browser sends only WHAT was bought (slug, size, qty).
        It never sends a price, a subtotal or a total.
     2. Every price is re-read from public.products on the server.
        A tampered page cannot buy a ₹4,699 bottle for ₹1.
     3. The order is written with status 'pending'. It only becomes 'paid'
        after the payment gateway's signature is verified server-side.

   Payment gateway: the Razorpay block at the bottom activates automatically
   once RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET exist as Edge Function
   secrets. Until then the order is still created and the response says
   `gateway: null`, so the rest of checkout can be built and tested first.
   ========================================================================== */

import { createClient } from 'jsr:@supabase/supabase-js@2';

const ALLOWED_ORIGINS = [
  'https://niellor.com',
  'https://www.niellor.com',
  'https://niellor.vercel.app',
  'http://localhost:4399',
  'http://localhost:4321'
];

/* Shipping is a business decision, not a technical one. NIELLOR_POLICY in
   products.js still has these as null, so nothing is invented here: until a
   real rule is set, delivery is free and the checkout says so plainly. */
const SHIPPING_FLAT     = 0;
const FREE_SHIPPING_OVER = 0;   // 0 = always free

const MAX_LINES    = 20;   // distinct products in one order
const MAX_QTY_LINE = 10;   // of any single size

function cors(origin: string | null) {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'content-type, authorization, apikey',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin'
  };
}

function json(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(origin), 'Content-Type': 'application/json' }
  });
}

/* Money in paise as integers. Never use floats for currency. */
const toPaise = (rupees: number) => Math.round(rupees * 100);

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(origin) });
  if (req.method !== 'POST')    return json({ error: 'Method not allowed' }, 405, origin);

  /* ---- Who is ordering? Taken from the token, never from the body. ---- */
  const authHeader = req.headers.get('Authorization') ?? '';
  const jwt = authHeader.replace(/^Bearer\s+/i, '');
  if (!jwt) return json({ error: 'Please sign in to place an order.' }, 401, origin);

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } }
  );

  const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
  const user = userData?.user;
  if (userErr || !user) {
    return json({ error: 'Your session has expired. Please sign in again.' }, 401, origin);
  }

  let payload: Record<string, unknown>;
  try { payload = await req.json(); }
  catch { return json({ error: 'Invalid request.' }, 400, origin); }

  const rawItems  = Array.isArray(payload.items) ? payload.items : [];
  const addressId = payload.address_id ? String(payload.address_id) : null;
  const couponRaw = String(payload.coupon_code ?? '').trim().toUpperCase();

  if (!rawItems.length)            return json({ error: 'Your bag is empty.' }, 400, origin);
  if (rawItems.length > MAX_LINES) return json({ error: 'Too many items in one order.' }, 400, origin);
  if (!addressId)                  return json({ error: 'Please choose a delivery address.' }, 400, origin);

  /* ---- The address must belong to THIS customer. -------------------- */
  const { data: address, error: addrErr } = await admin
    .from('addresses')
    .select('id')
    .eq('id', addressId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (addrErr) return json({ error: 'We could not verify your address.' }, 500, origin);
  if (!address) return json({ error: 'That delivery address could not be found.' }, 400, origin);

  /* ---- Normalise the requested lines --------------------------------- */
  const wanted: { slug: string; ml: number; qty: number }[] = [];
  for (const raw of rawItems) {
    const slug = String((raw as any)?.slug ?? '').trim().toLowerCase();
    const ml   = Number((raw as any)?.size_ml);
    const qty  = Number((raw as any)?.qty);

    if (!slug || !Number.isInteger(ml) || ml <= 0) {
      return json({ error: 'That bag contains an item we do not recognise.' }, 400, origin);
    }
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY_LINE) {
      return json({ error: `Please choose between 1 and ${MAX_QTY_LINE} of each item.` }, 400, origin);
    }
    wanted.push({ slug, ml, qty });
  }

  /* ---- Authoritative prices, straight from the database -------------- */
  const { data: products, error: prodErr } = await admin
    .from('products')
    .select('id, slug, name, sizes, available, coming_soon, currency')
    .in('slug', [...new Set(wanted.map(w => w.slug))]);

  if (prodErr)  return json({ error: 'We could not price your order.' }, 500, origin);

  const bySlug = new Map((products ?? []).map(p => [p.slug as string, p]));

  const lines: {
    product_id: string; product_name: string;
    size_ml: number; unit_price: number; qty: number;
  }[] = [];
  let subtotalPaise = 0;

  for (const w of wanted) {
    const p = bySlug.get(w.slug);
    if (!p)              return json({ error: 'One of those fragrances is no longer listed.' }, 400, origin);
    if (!p.available || p.coming_soon) {
      return json({ error: `${p.name} is not available to order yet.` }, 400, origin);
    }

    const sizes = Array.isArray(p.sizes) ? p.sizes : [];
    const match = sizes.find((s: any) => Number(s?.ml) === w.ml);
    if (!match || typeof match.price !== 'number') {
      return json({ error: `${p.name} is not offered in ${w.ml} ml.` }, 400, origin);
    }

    subtotalPaise += toPaise(match.price) * w.qty;
    lines.push({
      product_id:   p.id as string,
      product_name: p.name as string,
      size_ml:      w.ml,
      unit_price:   match.price,
      qty:          w.qty
    });
  }

  /* ---- Coupon, validated by the database, never by the browser ------- */
  let discountPaise = 0;
  let couponApplied: string | null = null;

  if (couponRaw) {
    /* validate_coupon returns a TABLE(code, percent_off, amount_off,
       description). It yields ZERO rows when the code is unknown, inactive,
       expired or fully redeemed — so "a row came back" IS the validity test.
       Numerics can arrive as strings, hence Number() on both. */
    const { data: rows, error: cErr } = await admin.rpc('validate_coupon', { p_code: couponRaw });
    const c = Array.isArray(rows) ? rows[0] : null;

    if (!cErr && c) {
      const pct = Number(c.percent_off);
      const amt = Number(c.amount_off);
      if (Number.isFinite(pct) && pct > 0) {
        discountPaise = Math.round(subtotalPaise * (pct / 100));
      } else if (Number.isFinite(amt) && amt > 0) {
        discountPaise = Math.min(subtotalPaise, toPaise(amt));
      }
      if (discountPaise > 0) couponApplied = String(c.code ?? couponRaw);
    }
    /* An invalid code is not an error — the order proceeds at full price
       and the UI reports that the code was not applied. */
  }

  const afterDiscount = subtotalPaise - discountPaise;
  const shippingPaise =
    FREE_SHIPPING_OVER > 0 && afterDiscount < toPaise(FREE_SHIPPING_OVER)
      ? toPaise(SHIPPING_FLAT)
      : toPaise(SHIPPING_FLAT);
  const totalPaise = afterDiscount + shippingPaise;

  if (totalPaise <= 0) {
    return json({ error: 'We could not price your order. Please contact us.' }, 400, origin);
  }

  /* ---- Write the order (service role, so RLS is bypassed safely) ----- */
  const orderNumber = 'NLR-' + Date.now().toString(36).toUpperCase();

  const { data: order, error: oErr } = await admin
    .from('orders')
    .insert({
      user_id:     user.id,
      order_number: orderNumber,
      status:      'pending',
      currency:    'INR',
      subtotal:    subtotalPaise / 100,
      discount:    discountPaise / 100,
      shipping:    shippingPaise / 100,
      total:       totalPaise / 100,
      coupon_code: couponApplied,
      address_id:  addressId
    })
    .select('id, order_number, total')
    .single();

  if (oErr || !order) {
    console.error('order insert failed:', oErr?.message);
    return json({ error: 'We could not create your order. Please try again.' }, 500, origin);
  }

  const { error: liErr } = await admin
    .from('order_items')
    .insert(lines.map(l => ({ ...l, order_id: order.id })));

  if (liErr) {
    console.error('order_items insert failed:', liErr.message);
    /* Do not leave a total with no lines behind it. */
    await admin.from('orders').delete().eq('id', order.id);
    return json({ error: 'We could not create your order. Please try again.' }, 500, origin);
  }

  /* ---- Hand off to the gateway, once it is configured ---------------- */
  const rzpKey    = Deno.env.get('RAZORPAY_KEY_ID');
  const rzpSecret = Deno.env.get('RAZORPAY_KEY_SECRET');
  let gateway: Record<string, unknown> | null = null;

  if (rzpKey && rzpSecret) {
    try {
      const res = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${rzpKey}:${rzpSecret}`),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: totalPaise,                 // Razorpay works in paise
          currency: 'INR',
          receipt: order.order_number,
          notes: { niellor_order_id: order.id }
        })
      });
      if (res.ok) {
        const rzp = await res.json();
        await admin.from('orders').update({ payment_ref: rzp.id }).eq('id', order.id);
        /* key_id is public and safe to return; the secret never leaves here. */
        gateway = { provider: 'razorpay', order_id: rzp.id, key_id: rzpKey, amount: totalPaise };
      } else {
        console.error('razorpay order failed:', res.status, (await res.text()).slice(0, 300));
      }
    } catch (err) {
      console.error('razorpay request failed:', String(err));
    }
  } else {
    console.log('Razorpay not configured — order ' + order.order_number + ' created as pending.');
  }

  return json({
    ok: true,
    order_id:     order.id,
    order_number: order.order_number,
    currency:     'INR',
    subtotal:     subtotalPaise / 100,
    discount:     discountPaise / 100,
    shipping:     shippingPaise / 100,
    total:        totalPaise / 100,
    coupon_applied: couponApplied,
    gateway
  }, 200, origin);
});
