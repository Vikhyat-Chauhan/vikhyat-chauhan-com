# vikhyatchauhan.com

Personal site and portfolio for Vikhyat Chauhan, built with [Astro](https://astro.build) and [Tailwind CSS](https://tailwindcss.com), deployed on [Netlify](https://www.netlify.com).

## Stack

- **Astro 5** with MDX and sitemap integrations
- **Tailwind CSS 4** via the Vite plugin
- **Netlify** adapter for deployment
- Content collections under `src/content` (`personal`, `resume`, `writing`)

## Getting started

```bash
npm install
npm run dev      # start local dev server
npm run build    # production build
npm run preview  # preview the build locally
```

## Project layout

```
src/
  components/   # Astro components
  content/      # Markdown/MDX content collections
  layouts/      # Page layouts
  lib/          # Helpers
  pages/        # Routes (index, blog, projects, personal, api)
  styles/       # Global styles
public/         # Static assets
```

## Deployment

Pushes to `main` build and deploy automatically via Netlify (`netlify.toml`).
