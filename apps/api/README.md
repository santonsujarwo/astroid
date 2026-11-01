# Astroid API

Fastify REST API for the multi-site workspace.

## Configure

Copy the root `.env.example` to `.env` and configure:

- `DATABASE_URL`: PostgreSQL connection string.
- `ASTROID_API_KEY`: long random secret required in `x-astroid-key` on all API routes except health.
- `ASTROID_GITHUB_TOKEN`: GitHub fine-grained personal access token. It must be allowed to create repositories and write repository contents.
- `ASTROID_GITHUB_OWNER`: optional GitHub owner override.

Do not commit real secrets or expose the API key in browser code.

## Start

```bash
npm install
npm run db:migrate
npm run dev:api
```

API defaults to `http://localhost:8787`.

## Endpoints

- `GET /health`
- `GET /api/sites`
- `POST /api/sites`
- `GET /api/sites/:id`
- `PUT /api/sites/:id`
- `POST /api/sites/:id/publish`

All API endpoints except health require `x-astroid-key`.

## Publish behavior

The publish endpoint generates an independent Astro project, creates a GitHub repository if one is not already linked, commits generated source files and a GitHub Pages workflow, then records the repository and commit in PostgreSQL.

GitHub Pages must be enabled for the generated repository with its source set to GitHub Actions. The workflow deploys the generated static `dist` directory. Repository creation and source push are performed by the API token; the GitHub Actions workflow performs the subsequent build/deploy.

This is the first vertical slice. Production hardening still required before exposing it publicly: GitHub App installation tokens, user authentication and workspace authorization, rate limits, webhook verification, isolated build workers, audit retention and conflict/reconciliation handling.