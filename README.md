# Astroid — Static Website Publisher

Astroid is a multi-site workspace for building and publishing independent Astro websites. The repository now contains an interactive section editor, a PostgreSQL API, a code-defined template manifest, and the first GitHub publishing vertical slice.

## Dashboard

```bash
npm install
npm run dev
```

Open the Astro URL shown in the terminal (normally http://localhost:4321).

The current dashboard editor supports:
- Multiple website records in a workspace.
- Create a website and open its section-based editor.
- Add and remove sections.
- Edit section label, eyebrow, heading, body, image URL, button label, button URL and layout variant.
- Save section data in the browser prototype store.
- Preview the current page using its section content.
- Register template metadata in the browser prototype store.
- Browse the Business Starter template and select it when creating a site.

The dashboard is still using browser localStorage for its own UI state. It does not yet authenticate to or consume the API. Do not mistake the frontend local save indicator for a PostgreSQL save.

## Backend API

Configure environment variables from `.env.example`:

- `DATABASE_URL`: PostgreSQL connection string.
- `ASTROID_API_KEY`: long random secret for API access.
- `ASTROID_GITHUB_TOKEN`: GitHub fine-grained personal access token for repository creation and content writes.
- `ASTROID_GITHUB_OWNER`: optional owner override.

Run the API and migration:

```bash
npm run db:migrate
npm run dev:api
```

API defaults to `http://localhost:8787`.

All endpoints except `GET /health` require an `x-astroid-key` header.

- `GET /api/sites`
- `POST /api/sites`
- `GET /api/sites/:id`
- `PUT /api/sites/:id`
- `POST /api/sites/:id/publish`

Example create request:

```bash
curl -X POST http://localhost:8787/api/sites \
  -H "content-type: application/json" \
  -H "x-astroid-key: $ASTROID_API_KEY" \
  -d '{"name":"Demo Studio","description":"A sample business website."}'
```

## GitHub publishing vertical slice

The API publish endpoint:
1. Loads the site's page document from PostgreSQL.
2. Generates an independent Astro project.
3. Creates a GitHub repository when one is not already linked.
4. Writes the generated files and a GitHub Pages Actions workflow in one Git commit.
5. Stores the repository and commit reference in PostgreSQL.

The generated site is standalone and has no runtime dependency on Astroid.

The GitHub token needs repository creation and contents write permissions. GitHub Pages must be enabled with Actions as the deployment source if it is not automatically enabled for the generated repository. The included workflow builds the Astro project and deploys its `dist` output.

## Template registry

`templates/business-starter/manifest.json` defines the first code-based template and its eight section types, editable fields and supported layouts. The template registry table pins template ID and version. Template package validation and a complete component renderer are still to be implemented.

## Build checks

```bash
npm run build
npm run build:api
```

GitHub Actions runs both checks on pushes and pull requests to `main`.

## Production hardening still required

Before exposing this system beyond a trusted personal environment:
- Connect the dashboard to the API through a server-side session; never ship the API key to browser code.
- Add user authentication, workspace membership and per-site authorization.
- Replace the personal access token with GitHub App installation tokens and OAuth installation flow.
- Add isolated build workers, deploy status polling, webhook signature verification, rate limits and audit retention.
- Add explicit conflict handling between database revisions and external GitHub commits.
- Add automated tests for schema validation, generator output and GitHub failure recovery.
