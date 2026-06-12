import { createClient } from 'jsr:@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const FEEDBACK_TO_EMAIL = Deno.env.get('FEEDBACK_TO_EMAIL');
const RESEND_FROM = Deno.env.get('RESEND_FROM') ?? 'Before <onboarding@resend.dev>';
const WEBHOOK_SECRET = Deno.env.get('FEEDBACK_WEBHOOK_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface FeedbackRecord {
  id: string;
  user_id: string;
  kind: 'bug' | 'idea';
  message: string;
  page: string | null;
  session_code: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function parseRecord(body: unknown): FeedbackRecord | null {
  if (!body || typeof body !== 'object') return null;
  const payload = body as Record<string, unknown>;
  const record = (payload.record ?? payload) as Record<string, unknown>;
  if (!record?.id || !record?.user_id || !record?.message) return null;
  return record as unknown as FeedbackRecord;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const secret = req.headers.get('x-webhook-secret');
  if (!WEBHOOK_SECRET || secret !== WEBHOOK_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (!RESEND_API_KEY || !FEEDBACK_TO_EMAIL) {
    console.error('Missing RESEND_API_KEY or FEEDBACK_TO_EMAIL');
    return new Response('Email not configured', { status: 500 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const record = parseRecord(body);
  if (!record) {
    return new Response('Invalid payload', { status: 400 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: userData, error: userError } =
    await supabase.auth.admin.getUserById(record.user_id);

  const userEmail = userData?.user?.email ?? 'inconnu';
  const kindLabel = record.kind === 'bug' ? 'Bug' : 'Idée';
  const subject = `[Before] ${kindLabel} — ${record.message.slice(0, 60)}`;

  const html = `
    <div style="font-family: system-ui, sans-serif; line-height: 1.5; color: #f4f2f7; background: #09080c; padding: 24px;">
      <div style="max-width: 560px; margin: 0 auto; background: #13111a; border: 1px solid #2d2838; border-radius: 16px; padding: 24px;">
        <p style="margin: 0 0 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #a855f7;">Nouveau retour Before</p>
        <h1 style="margin: 0 0 16px; font-size: 20px;">${escapeHtml(kindLabel)}</h1>
        <p style="margin: 0 0 16px; white-space: pre-wrap; color: #f4f2f7;">${escapeHtml(record.message)}</p>
        <table style="width: 100%; font-size: 13px; color: #9d97ab; border-collapse: collapse;">
          <tr><td style="padding: 4px 0;">Utilisateur</td><td style="color: #f4f2f7;">${escapeHtml(userEmail)}</td></tr>
          <tr><td style="padding: 4px 0;">Page</td><td style="color: #f4f2f7;">${escapeHtml(record.page ?? '—')}</td></tr>
          <tr><td style="padding: 4px 0;">Code partie</td><td style="color: #f4f2f7;">${escapeHtml(record.session_code ?? '—')}</td></tr>
          <tr><td style="padding: 4px 0;">Date</td><td style="color: #f4f2f7;">${escapeHtml(record.created_at)}</td></tr>
        </table>
      </div>
    </div>
  `;

  if (userError) {
    console.error('getUserById failed', userError.message);
  }

  const resendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: [FEEDBACK_TO_EMAIL],
      subject,
      html,
    }),
  });

  if (!resendResponse.ok) {
    const errText = await resendResponse.text();
    console.error('Resend error', resendResponse.status, errText);
    return new Response('Resend failed', { status: 502 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
