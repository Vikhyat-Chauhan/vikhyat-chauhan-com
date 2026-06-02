# Understanding This Project — A Complete Beginner's Guide

This document explains how **vikhyatchauhan.com** is built, from the ground up. It assumes
you've never seen this kind of project before. Read it top to bottom and you'll understand
what every folder and file does, what technologies are used, and how all the pieces talk to
each other.

---

## 1. What is this project?

It's a **personal portfolio website**. It shows off the owner's résumé, work experience,
projects, blog posts, and personal notes. It has one unusual feature most portfolios don't
have: a **floating AI chatbot** (a "RAG assistant") that visitors can ask questions about
the owner's work.

Think of the whole thing as having three jobs:

1. **Show content** — pages of text, images, and links (the résumé, projects, blog).
2. **Answer questions** — the chat box talks to an AI service and streams back answers.
3. **Measure interest** — quietly records anonymous analytics (which pages get viewed, etc.).

---

## 2. The big-picture architecture

Here is the mental model. Don't worry if the words are unfamiliar yet — we explain each below.

```
                         YOU EDIT THESE                BUILD STEP            WHAT VISITORS GET
                    ┌────────────────────┐         ┌──────────────┐       ┌────────────────────┐
   Markdown posts ─▶│  src/content/      │         │              │       │  Fast static HTML  │
   Page templates ─▶│  src/pages/        │  ────▶  │  Astro build │ ────▶ │  + a little JS for │
   Components     ─▶│  src/components/   │         │  (npm run    │       │  the interactive   │
   Layout/styles  ─▶│  src/layouts/      │         │   build)     │       │  bits              │
                    └────────────────────┘         └──────────────┘       └─────────┬──────────┘
                                                                                      │
                                                          deployed on Netlify ◀───────┘
                                                                  │
                              ┌───────────────────────────────────┼───────────────────────────┐
                              │                                                                 │
                    visitor's browser                                              external RAG backend
                    (HTML + tiny JS)                                               (a separate AI service,
                              │                                                     not in this repo)
                              │   "Ask about my work" chat                                  ▲
                              └──────▶  /api/chat  ──────────────────────────────────────────┘
                              │   anonymous analytics                                        ▲
                              └──────▶  /api/track  ─────────────────────────────────────────┘
```

The key insight: **most of the site is pre-built into plain HTML files** ("static"), which
makes it extremely fast. Only two things happen *live* while someone is visiting — the chat
and the analytics — and both are handled by small server functions (`/api/chat`, `/api/track`)
that act as secure middlemen to an external AI service.

---

## 3. The technology stack

| Technology | What it is | Why it's here |
|---|---|---|
| **[Astro](https://astro.build)** (v5) | A modern web framework that builds websites mostly into static HTML, shipping minimal JavaScript. | The backbone of the whole site. Turns templates + content into finished pages. |
| **[Tailwind CSS](https://tailwindcss.com)** (v4) | A styling system where you apply many tiny utility classes (`text-xl`, `flex`, `mt-4`) directly in the HTML. | All the visual design — colors, spacing, layout, hover effects. |
| **TypeScript** | JavaScript with type-checking (a safety net that catches mistakes before they ship). | Used in the page logic, API routes, and the analytics helper. |
| **Markdown / MDX** | A simple plain-text format for writing formatted documents (`# Heading`, `**bold**`). MDX additionally lets you embed components. | All the blog posts and personal notes are written in these. |
| **[Zod](https://zod.dev)** | A library that validates the *shape* of data. | Enforces that every blog post has a title, date, etc. (the "schema"). |
| **[Netlify](https://www.netlify.com)** | A hosting platform that builds and serves the site, and runs serverless functions. | Where the site lives. Auto-deploys whenever code is pushed to `main`. |
| **marked + DOMPurify** | `marked` turns Markdown text into HTML; `DOMPurify` cleans HTML to prevent security attacks. | Used **in the chat box** to safely display the AI's formatted replies. |
| **@astrojs/mdx, @astrojs/sitemap** | Astro plugins for MDX support and auto-generating a sitemap (helps Google index the site). | Wired up in `astro.config.mjs`. |

---

## 4. Folder-by-folder tour

```
vikhyat-chauhan-com/
├── astro.config.mjs        ← Astro's main configuration
├── netlify.toml            ← Hosting/deploy configuration
├── package.json            ← Project's dependencies & commands
├── tsconfig.json           ← TypeScript settings
├── README.md               ← Short project intro
│
├── public/                 ← Static files served as-is (images, favicon, robots.txt)
├── src/                    ← ALL the source code lives here
│   ├── content/            ← The writing (Markdown/MDX) + résumé PDF
│   ├── pages/              ← Each file = one URL on the site
│   ├── layouts/            ← Shared page "shell"
│   ├── components/         ← Reusable UI building blocks
│   ├── lib/                ← Helper code (analytics)
│   ├── styles/             ← Global CSS
│   └── content.config.ts   ← Rules for what content must contain
│
├── dist/                   ← The FINISHED built site (auto-generated — don't edit)
├── .netlify/               ← Netlify's build output (auto-generated)
└── node_modules/           ← Downloaded dependencies (auto-generated)
```

The three auto-generated folders (`dist/`, `.netlify/`, `node_modules/`) are created by tools —
you never edit them by hand. **Everything you actually work on is in `src/` and the config files.**

### `public/`
Files here are copied to the website untouched, available at the root URL. Contains the hero
photo (`vikhyat-hero.jpeg`), the social-share preview image (`og-image.png`), `favicon.svg`
(the little browser-tab icon), `robots.txt` (instructions for search engines), and project
images under `canavigator/`.

### `src/content/`
The raw writing, organized into **content collections**:
- `writing/` — blog posts, written in `.mdx` (e.g. `two-stage-retrieval.mdx`).
- `personal/` — shorter personal notes (e.g. `hello.md`).
- `resume/` — the résumé PDF that the "Download résumé" button links to.

### `src/pages/`
This is the most important folder to understand routing (covered in detail in section 5).

### `src/layouts/`
- `Layout.astro` — the master template wrapped around **every** page.

### `src/components/`
Reusable pieces dropped into pages (covered in section 6).

### `src/lib/`
- `track.ts` — the analytics helper functions.

### `src/styles/`
- `global.css` — global styles and the Tailwind import.

---

## 5. How pages become URLs (file-based routing)

Astro uses **file-based routing**: the *location* of a file in `src/pages/` decides its web
address. This is the single most important concept for understanding the site's structure.

| File | URL it creates | What it does |
|---|---|---|
| `src/pages/index.astro` | `/` | The homepage — hero, experience, projects, blog preview, education, contact, and the chat box. This is the biggest file; it holds the project/experience/education data as plain arrays right in the code. |
| `src/pages/blog/index.astro` | `/blog` | Lists all blog posts, grouped by year. |
| `src/pages/blog/[slug].astro` | `/blog/anything` | A **template** that generates one page per blog post. |
| `src/pages/personal/index.astro` | `/personal` | Lists all personal notes, with a tag sidebar. |
| `src/pages/personal/[slug].astro` | `/personal/anything` | One page per personal note. |
| `src/pages/projects/[slug].astro` | `/projects/anything` | Deep-dive project page (reuses a blog post that has a `projectSlug`). |
| `src/pages/api/chat.ts` | `/api/chat` | A **server function** (not a page) — the chat proxy. |
| `src/pages/api/track.ts` | `/api/track` | A **server function** — the analytics proxy. |

### What the `[slug]` brackets mean
A filename in square brackets is a **dynamic route** — one template that produces *many* pages.
Look at `blog/[slug].astro`:

```js
export async function getStaticPaths() {
  const posts = await getCollection('writing', (p) => !p.data.draft);
  return posts.map((post) => ({ params: { slug: post.id }, props: { post } }));
}
```

In plain English: *"At build time, fetch every non-draft blog post. For each one, create a page
whose URL is that post's name, and hand the post's data to the template."* So writing a new
Markdown file in `src/content/writing/` automatically produces a new live page — no manual work.

### The `.astro` file format
Every `.astro` file has two parts separated by a `---` fence:

```astro
---
// (1) The "frontmatter" — JavaScript/TypeScript that runs at BUILD time.
const posts = await getCollection('writing');
---
<!-- (2) The HTML template — can loop over data and insert values. -->
{posts.map((p) => <h2>{p.data.title}</h2>)}
```

The code above the fence runs once, on the developer's machine, while building. The HTML below
gets stamped out into the final files. This is why the site is so fast — by the time a visitor
arrives, the work is already done.

---

## 6. The components (reusable building blocks)

Instead of copy-pasting HTML, common pieces are written once as components and reused.

| Component | Job |
|---|---|
| `Layout.astro` | The page shell every page uses: the `<head>` (title, SEO meta tags, social-share tags, JSON-LD structured data, fonts), the dark-mode toggle button, the colorful scroll-progress bar, and global animation scripts. Pages slot their content into its `<slot />`. |
| `LongPost.astro` | The reading layout for a single blog post or note — header, title, date, and all the typography styling for article body text (headings, code blocks, tables, quotes). Builds the `BlogPosting` JSON-LD for SEO. |
| `Chat.astro` | The entire AI chat feature — the floating button, the nudge bubble, the chat panel, and the JavaScript that streams answers. (Section 7.) |
| `SectionHeader.astro` | A small title + subtitle pair used at the top of homepage sections. |
| `Callout.astro` | A highlighted box for use inside blog posts (MDX). |
| `Stat.astro` | A big number + label, for showing metrics. |

### How content rules are enforced — `src/content.config.ts`
This file defines, using Zod, exactly what fields each piece of content must have:

```js
const writing = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/writing' }),
  schema: z.object({
    title: z.string(),          // required
    blurb: z.string(),          // required
    date: z.coerce.date(),      // required, parsed into a real date
    draft: z.boolean().default(false),
    pinned: z.boolean().default(false),
    projectSlug: z.string().optional(),  // if set, also appears under /projects/
    // ...
  }),
});
```

If a post is missing a required field, **the build fails with a clear error** — a safety net
that prevents broken pages. The `draft: true` flag hides a post; `pinned: true` features it on
the homepage; `projectSlug` makes a post double as a project deep-dive page.

---

## 7. The AI chat feature (the interesting part)

This is the one truly dynamic feature. Here's the full flow, step by step.

**On the page (`Chat.astro`):**
1. A floating "Ask about my work" button sits in the corner. After 2.5 seconds, a little
   "👋 got questions?" nudge bubble pops up (once per session — it remembers via `sessionStorage`).
2. Clicking opens a chat panel with suggested questions you can click.
3. When you send a message, the browser JavaScript sends it to **`/api/chat`** on this same site.

**The proxy (`src/pages/api/chat.ts`):**
4. This is a small **serverless function** that runs on Netlify, *not* in the browser. Its job
   is to be a secure middleman. It holds two secret values (`API_URL` and `ProfessionalRAG_KEY`)
   as environment variables — these are **never exposed to the browser**.
5. It forwards your question to the real AI backend (a separate "RAG" service that lives
   elsewhere, not in this repo), attaching the secret API key as authorization.
6. The backend **streams** its answer back token-by-token. The proxy passes that stream
   straight through to the browser using Server-Sent Events (`text/event-stream`).

**Back in the browser (`Chat.astro` script):**
7. The JavaScript reads the stream piece by piece and updates the chat bubble live, so you see
   the answer appear as it's generated.
8. Each chunk of Markdown text is converted to HTML with `marked`, then sanitized with
   `DOMPurify` (so a malicious response can't inject harmful code), and shown.
9. When done, it displays metadata like number of sources, response time, and cost.

> **Why a proxy?** The secret API key must stay on the server. If the browser called the AI
> backend directly, anyone could steal the key from the network tab. The `/api/chat` function
> keeps the key server-side and only the safe, public proxy URL is exposed.

If the secret env vars aren't configured, the chat politely says "RAG backend isn't configured"
instead of breaking — you can see this fallback in the `connected` check.

---

## 8. The analytics feature

The site records anonymous, privacy-respecting usage data. Same proxy pattern as the chat.

- **`src/lib/track.ts`** — browser-side helper. Exposes functions like `trackPageview()`,
  `trackTabClick()`, `trackChatOpen()`, `trackTimeOnSite()`. It:
  - **Respects privacy**: checks Do-Not-Track and Global Privacy Control, and sends nothing if
    the visitor has opted out.
  - Uses `navigator.sendBeacon` (a reliable fire-and-forget method) so analytics never slow
    down or block the page.
  - Sends everything to **`/api/track`** on this same site.
- **`src/pages/api/track.ts`** — the serverless proxy that forwards the data to the same backend
  with the secret key, just like the chat proxy. It fails silently — analytics must never break
  the user experience.
- The actual wiring (what to track) lives in the script at the bottom of `Layout.astro`: it
  records a pageview on load, tracks scroll progress, runs the fade-in animations, measures
  active time on the page, and listens for clicks on links (outbound links, résumé downloads,
  nav tabs).

---

## 9. How a visitor's request flows through everything

Putting it all together, here's what happens for two kinds of interaction.

**Loading a normal page (e.g. a blog post):**
```
Browser requests /blog/two-stage-retrieval
        │
        ▼
Netlify serves the pre-built HTML file (instant — built ahead of time from the .mdx + LongPost.astro)
        │
        ▼
Browser renders it; tiny JS kicks in for dark mode, animations, and fires a pageview to /api/track
```

**Asking the chatbot a question:**
```
Browser (Chat.astro JS)  ──POST /api/chat──▶  Netlify function (chat.ts)
                                                   │  adds secret API key
                                                   ▼
                                          External RAG/AI backend
                                                   │  streams answer
                                                   ▼
Browser shows tokens live  ◀──streamed back──  chat.ts passes the stream through
```

---

## 10. How it gets built and deployed

- **`package.json`** defines the commands:
  - `npm run dev` — start a local development server (live-reloads as you edit).
  - `npm run build` — produce the finished static site into `dist/`.
  - `npm run preview` — preview the built site locally.
- **`astro.config.mjs`** ties it together: sets the site URL, enables the Netlify adapter
  (so the `/api/*` routes become serverless functions), and turns on the MDX, sitemap, and
  Tailwind plugins.
- **`netlify.toml`** tells Netlify to run `npm run build`, publish the `dist/` folder, use
  Node 20, and redirect old `/writing/*` links to `/blog/*`.
- **Deployment is automatic**: pushing code to the `main` branch triggers Netlify to rebuild
  and redeploy. The secret env vars (`API_URL`, `ProfessionalRAG_KEY`) are stored in Netlify's
  dashboard, not in the code.

---

## 11. Quick mental summary

- **Astro** turns your **Markdown content** + **`.astro` templates** into a fast, mostly-static
  website during a build step.
- **File-based routing**: files in `src/pages/` become URLs; `[slug]` files generate many pages
  from your content collections.
- **Tailwind CSS** handles all styling via utility classes in the markup.
- **Two serverless functions** (`/api/chat`, `/api/track`) are secure middlemen to an external
  AI/analytics backend, keeping secret keys off the browser.
- **The chat box** streams AI answers live; **analytics** quietly and privately measure interest.
- **Netlify** hosts it and redeploys automatically on every push to `main`.

If you want to add a blog post: drop a new `.mdx` file in `src/content/writing/`. If you want to
change the homepage: edit `src/pages/index.astro`. If you want to restyle: edit the Tailwind
classes in the markup. Everything else follows from there.