# Astroid — Static Website Publisher

Astroid is a multi-site workspace for building and publishing independent Astro websites. The current implementation includes a section-content editor, a PostgreSQL REST API, a code-defined template manifest, and the first GitHub publishing vertical slice.

## Requirements

- Node.js 20+
- PostgreSQL 14+
- A GitHub token for publishing (optional until you publish a site)

## Configure the application

```bash
cp .env.example .env
```

Set a strong random value for `ASTROID_API_KEY` in `.env`. Use the same key for the dashboard proxy and API server. Configure `DATABASE_URL`. Add a GitHub token with repository creation, Contents write and Workflows write permissions when you are ready to publish.

## Start locally

Terminal 1 — database schema and API:

```bash
npm install
npm run db:migrate
npm run dev:api
```

Terminal 2 — dashboard:

```bash
npm run dev
```

Open the Astro URL shown in the terminal (normally http://localhost:4321). The dashboard calls its own server-side `/api` proxy; the API key is never sent to browser JavaScript.

## Current dashboard functionality

- Manage multiple websites in one workspace.
- Create a website and save it to PostgreSQL when the API is configured.
- Add and remove page sections.
- Open an individual section editor.
- Edit section label, eyebrow, heading, body, image URL, button label, button URL and layout variant.
- Save website and section content to PostgreSQL.
- Preview the current section content in a new tab.
- Register template metadata in the browser prototype store.
- Browse and select the Business Starter template when creating a site.

If the API is not configured, the dashboard falls back to browser localStorage for evaluation. The status indicator distinguishes PostgreSQL connection from local prototype mode.

## Backend API

The Fastify API defaults to `http://localhost:8787`.

- `GET /health`
- `GET /api/sites`
- `POST /api/sites`
- `GET /api/sites/:id`
- `PUT /api/sites/:id`
- `POST /api/sites/:id/publish`

All API endpoints except `GET /health` require an `x-astroid-key` header. The Astro server-side proxy adds this header without exposing the key to the browser.

## GitHub publishing vertical slice

The publish endpoint:
1. Loads a site's page document from PostgreSQL.
2. Generates an independent Astro project.
3. Creates a GitHub repository if one is not already linked.
4. Writes the generated source and a GitHub Pages Actions workflow in one Git commit.
5. Stores the repository and commit reference in PostgreSQL.

The generated website is standalone and has no runtime dependency on Astroid. The included GitHub Actions workflow builds the generated Astro site and deploys its `dist` directory. GitHub Pages must be enabled with Actions as its deployment source if it is not automatically enabled for the new repository.

## Template registry

`templates/business-starter/manifest.json` defines the first code-based template and its eight section types, editable fields and supported layouts. The database stores template IDs and versions. Full template package validation, visual variants and a version-aware component renderer remain future implementation work.

## Build and production start

```bash
npm run build
npm run build:api
npm run start
```

GitHub Actions runs the dashboard and API build checks on pushes and pull requests to `main`.

## Production hardening still required

Before exposing this system beyond a trusted personal environment:
- Add user authentication, workspace membership and per-site authorization.
- Replace the personal access token with GitHub App installation tokens and an installation flow.
- Add isolated build workers, deployment status polling, webhook signature verification, rate limits and audit retention.
- Add explicit conflict handling between database revisions and external GitHub commits.
- Add automated tests for schema validation, generator output and GitHub failure recovery.
