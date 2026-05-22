import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const apiBase = import.meta.env.API_URL;
  const apiKey = import.meta.env.ProfessionalRAG_KEY;

  if (!apiBase || !apiKey) {
    return new Response(null, { status: 204 });
  }

  const body = await request.text();

  try {
    await fetch(apiBase.replace(/\/$/, '') + '/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'X-Forwarded-For':
          request.headers.get('x-forwarded-for') ||
          request.headers.get('x-nf-client-connection-ip') ||
          '',
      },
      body,
    });
  } catch {
    // Silent — analytics must never block UX.
  }

  return new Response(null, { status: 204 });
};
