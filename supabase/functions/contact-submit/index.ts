/* ==========================================================================
   NIELLOR — contact-submit

   The only server-side piece of the contact form. It exists for one reason:
   the Resend API key must never reach the browser. It lives here, on
   Supabase's servers, as the RESEND_API_KEY secret.

   Flow:
     validate  ->  honeypot  ->  rate limit  ->  save row  ->  email NIELLOR
                                                            ->  return ticket

   The ticket number is only returned once the row is safely saved, so the
   page can never show a success state for a message that was not stored.
   ========================================================================== */

import { createClient } from 'jsr:@supabase/supabase-js@2';

/* Only our own front-ends may call this. Anything else gets no CORS grant. */
const ALLOWED_ORIGINS = [
  'https://niellor.com',
  'https://www.niellor.com',
  'https://niellor.vercel.app',
  'http://localhost:4399',
  'http://localhost:4321'
];

const NOTIFY_TO   = 'niellor.co@gmail.com';
const NOTIFY_FROM = 'NIELLOR <hello@niellor.com>';

/* Field limits: generous for real people, closed for abuse. */
const LIMITS = { name: 100, email: 254, reason: 100, message: 5000 };

/* Same address may send at most 3 messages per 10 minutes. */
const RATE_MAX     = 3;
const RATE_WINDOW  = 10 * 60 * 1000;

function corsHeaders(origin: string | null) {
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
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' }
  });
}

/* User text is untrusted. Escape it before it goes anywhere near HTML. */
function esc(s: string) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

const validEmail = (e: string) =>
  /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(e) && e.length <= LIMITS.email;

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(origin) });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405, origin);
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'Invalid request.' }, 400, origin);
  }

  const name    = String(payload.name    ?? '').trim();
  const email   = String(payload.email   ?? '').trim().toLowerCase();
  const reason  = String(payload.reason  ?? '').trim();
  const message = String(payload.message ?? '').trim();
  const gotcha  = String(payload._gotcha ?? '').trim();

  /* Honeypot: the form has a hidden field real people never see. If it is
     filled in, this is a bot. Answer 200 so the bot learns nothing, but
     save nothing and send nothing. */
  if (gotcha) {
    return json({ ok: true, ticket: null }, 200, origin);
  }

  if (!name || !email || !message) {
    return json({ error: 'Please complete every required field.' }, 400, origin);
  }
  if (!validEmail(email)) {
    return json({ error: 'Please enter a valid email address.' }, 400, origin);
  }
  if (name.length > LIMITS.name || reason.length > LIMITS.reason ||
      message.length > LIMITS.message) {
    return json({ error: 'That message is too long.' }, 400, origin);
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } }
  );

  /* ---- Rate limit ---------------------------------------------------- */
  const since = new Date(Date.now() - RATE_WINDOW).toISOString();
  const { count, error: countErr } = await supabase
    .from('support_messages')
    .select('id', { count: 'exact', head: true })
    .eq('customer_email', email)
    .gte('created_at', since);

  if (countErr) {
    console.error('rate-limit check failed:', countErr.message);
    return json({ error: 'We could not send your message. Please try again shortly.' }, 500, origin);
  }
  if ((count ?? 0) >= RATE_MAX) {
    return json(
      { error: 'You have sent several messages already. Please give us a little time to reply.' },
      429, origin
    );
  }

  /* ---- Save first. No email is sent for a message we failed to store. -- */
  const { data: row, error: insErr } = await supabase
    .from('support_messages')
    .insert({
      customer_name:  name,
      customer_email: email,
      reason:         reason || null,
      message
    })
    .select('ticket_id')
    .single();

  if (insErr || !row) {
    console.error('insert failed:', insErr?.message);
    return json({ error: 'We could not send your message. Please try again shortly.' }, 500, origin);
  }

  const ticket = row.ticket_id as string;

  /* ---- Notify NIELLOR ------------------------------------------------- */
  const resendKey = Deno.env.get('RESEND_API_KEY');
  let emailed = false;

  if (!resendKey) {
    console.error('RESEND_API_KEY is not set — message saved as ' + ticket + ' but not emailed.');
  } else {
    const html = `
      <div style="font-family:Helvetica,Arial,sans-serif;font-size:15px;color:#17140f;line-height:1.7">
        <p style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#b0803f;margin:0 0 18px">
          New NIELLOR customer message
        </p>
        <p style="margin:0 0 18px"><strong>Ticket:</strong> ${esc(ticket)}</p>
        <p style="margin:0 0 6px"><strong>Customer:</strong><br>${esc(name)}</p>
        <p style="margin:0 0 6px"><strong>Email:</strong><br>${esc(email)}</p>
        <p style="margin:0 0 6px"><strong>Reason:</strong><br>${esc(reason || '—')}</p>
        <p style="margin:18px 0 6px"><strong>Message:</strong></p>
        <div style="white-space:pre-wrap;border-left:2px solid #e8dcc8;padding-left:14px">${esc(message)}</div>
      </div>`;

    const text =
      `NEW NIELLOR CUSTOMER MESSAGE\n\n` +
      `Ticket: ${ticket}\n\n` +
      `Customer:\n${name}\n\n` +
      `Email:\n${email}\n\n` +
      `Reason:\n${reason || '—'}\n\n` +
      `Message:\n${message}\n`;

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: NOTIFY_FROM,
          to: [NOTIFY_TO],
          reply_to: email,           // replying in Gmail goes straight to the customer
          subject: `New NIELLOR message — ${ticket}${reason ? ' — ' + reason : ''}`,
          html,
          text
        })
      });
      emailed = res.ok;
      if (!res.ok) console.error('resend rejected:', res.status, (await res.text()).slice(0, 300));
    } catch (err) {
      console.error('resend request failed:', String(err));
    }
  }

  /* The message is stored either way, so the customer is genuinely served.
     `emailed` tells us whether the notification also went out. */
  return json({ ok: true, ticket, emailed }, 200, origin);
});
