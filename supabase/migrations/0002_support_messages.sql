-- ==========================================================================
-- NIELLOR — Phase 1: customer support messages
--
-- ADDITIVE ONLY. This creates one sequence, one table and two indexes.
-- It does not alter, drop or touch any existing table, policy, function or
-- trigger. Authentication is unaffected.
-- ==========================================================================

-- Ticket numbers: NL-1001, NL-1002, NL-1003 ...
-- A sequence guarantees each ticket number is handed out exactly once, even
-- if two people submit the form at the same instant.
create sequence if not exists public.support_ticket_seq
  start with 1001
  increment by 1;

create table if not exists public.support_messages (
  id             uuid primary key default gen_random_uuid(),

  -- Human-facing reference shown to the customer and used in the email
  ticket_id      text        not null unique
                 default ('NL-' || nextval('public.support_ticket_seq')),

  customer_name  text        not null,
  customer_email text        not null,
  reason         text,
  message        text        not null,

  -- Lifecycle for the Phase 3 admin dashboard
  status         text        not null default 'open'
                 constraint support_messages_status_check
                 check (status in ('open', 'waiting', 'resolved')),

  -- Set only when the sender happened to be signed in. Null for guests.
  -- ON DELETE SET NULL so removing an account never destroys the ticket.
  user_id        uuid        references auth.users(id) on delete set null,

  created_at     timestamptz not null default now()
);

-- --------------------------------------------------------------------------
-- Row Level Security
--
-- RLS is ON and there are DELIBERATELY NO POLICIES.
--
-- In Postgres, "RLS enabled + no policy" means the table is closed: the
-- `anon` and `authenticated` roles can neither read nor write it through the
-- public API. Nobody can query another customer's message, because nobody
-- can query the table at all from a browser.
--
-- Writes happen only inside the `contact-submit` Edge Function, which runs on
-- Supabase's servers using the service role and therefore bypasses RLS. That
-- keeps validation and rate limiting on the server where it cannot be skipped.
--
-- This mirrors the existing `public.coupons` table, which is closed the same
-- way on purpose.
--
-- Phase 2 will add ONE narrow read policy so a signed-in customer can see
-- their own tickets. It is intentionally not added yet.
-- --------------------------------------------------------------------------
alter table public.support_messages enable row level security;

-- Newest tickets first, for the future admin dashboard
create index if not exists support_messages_created_idx
  on public.support_messages (created_at desc);

-- Supports the per-email rate-limit check done by the Edge Function
create index if not exists support_messages_email_idx
  on public.support_messages (customer_email, created_at desc);
