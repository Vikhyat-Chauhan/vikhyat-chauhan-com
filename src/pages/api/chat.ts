import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const apiBase = import.meta.env.API_URL;
  const apiKey = import.meta.env.ProfessionalRAG_KEY;

  if (!apiBase || !apiKey) {
    return new Response(
      JSON.stringify({ detail: 'Server missing API_URL or ProfessionalRAG_KEY' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const body = await request.text();

  const upstream = await fetch(apiBase.replace(/\/$/, '') + '/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body,
  });

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => '');
    return new Response(
      JSON.stringify({ detail: detail || `Upstream HTTP ${upstream.status}` }),
      { status: upstream.status, headers: { 'Content-Type': 'application/json' } },
    );
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
};
