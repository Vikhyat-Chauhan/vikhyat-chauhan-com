// Lightweight analytics client. Proxies through /api/track so the bearer stays server-side.
// All functions are fire-and-forget — they never throw.

const ENDPOINT = '/api/track';

function isOptedOut(): boolean {
  if (typeof navigator === 'undefined') return false;
  // Do Not Track header
  // @ts-expect-error legacy MS prefix
  const dnt = navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack;
  if (dnt === '1' || dnt === 'yes') return true;
  // Global Privacy Control
  // @ts-expect-error not in lib.dom yet
  if (navigator.globalPrivacyControl === true) return true;
  return false;
}

function send(payload: Record<string, unknown>): void {
  if (isOptedOut()) return;
  try {
    const body = JSON.stringify(payload);
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      if (navigator.sendBeacon(ENDPOINT, blob)) return;
    }
    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // never block UX on analytics
  }
}

function deviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent;
  if (/Tablet|iPad/i.test(ua)) return 'tablet';
  if (/Mobi|Android|iPhone|iPod/i.test(ua)) return 'mobile';
  return 'desktop';
}

function readUTMs(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  const out: Record<string, string> = {};
  for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'ref']) {
    const v = params.get(k);
    if (v) out[k] = v;
  }
  return out;
}

export function trackPageview(): void {
  if (typeof window === 'undefined') return;
  const referrer = document.referrer || 'direct';
  let referrerHost = 'direct';
  try {
    if (referrer && referrer !== 'direct') {
      referrerHost = new URL(referrer).hostname || 'direct';
    }
  } catch {
    /* ignore */
  }
  send({
    event: 'pageview',
    page: window.location.pathname,
    referrer: referrerHost,
    screen_width: window.screen?.width,
    screen_height: window.screen?.height,
    viewport_width: window.innerWidth,
    viewport_height: window.innerHeight,
    device_type: deviceType(),
    language: navigator.language,
    theme: window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
    ...readUTMs(),
  });
}

export function trackTabClick(tab: string): void {
  send({ event: 'tab_click', page: location.pathname, tab });
}

export function trackOutbound(url: string): void {
  let hostname = '';
  try {
    hostname = new URL(url, location.href).hostname;
  } catch {
    /* ignore */
  }
  send({ event: 'outbound_click', page: location.pathname, url, hostname });
}

export function trackResumeDownload(): void {
  send({ event: 'resume_download', page: location.pathname });
}

export function trackChatMessage(question: string): void {
  send({ event: 'chat_message', page: location.pathname, question });
}

export function trackChatOpen(source: 'fab' | 'nudge' | 'other' = 'fab'): void {
  send({ event: 'chat_open', page: location.pathname, source });
}

export function trackChatClose(): void {
  send({ event: 'chat_close', page: location.pathname });
}

export function trackChatSuggestion(suggestion: string): void {
  send({
    event: 'chat_suggestion_click',
    page: location.pathname,
    question: suggestion,
  });
}

export function trackChatNudgeDismiss(): void {
  send({ event: 'chat_nudge_dismiss', page: location.pathname });
}

export function trackTimeOnSite(seconds: number): void {
  if (!seconds || seconds < 1) return;
  send({ event: 'time_on_site', page: location.pathname, seconds });
}
