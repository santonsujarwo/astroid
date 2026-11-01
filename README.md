# Astroid — Static Website Publisher

Astroid is a multi-site workspace for creating, editing and publishing independent static websites. This repository currently contains the first interactive product prototype.

## Run locally

Requirements: Node.js 20.3+ and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by Astro (normally http://localhost:4321).

Build and preview:

```bash
npm run build
npm run preview
```

## Prototype scope (v0.1.0)

- Multi-site dashboard with example projects.
- Create a website and open its section-based editor.
- Edit website name, domain, hero heading and description.
- Add and remove page sections.
- Save draft data to browser localStorage.
- Open a simple page preview in a new tab.
- Dashboard views for websites, templates, activity and settings.

## Important prototype boundaries

This is a frontend interaction prototype, not yet the production publishing platform. The following are not implemented yet:

- GitHub OAuth / GitHub App connection and repository provisioning.
- PostgreSQL persistence, API and authentication.
- Component/template registry and version pinning.
- Astro site generator for each managed website.
- Build worker, GitHub Actions deployment, deploy status and rollback.
- Multi-user permissions, audit persistence and production security controls.

The Publish action is intentionally labelled as demo-only; it does not push code or deploy a website. Prototype edits are stored only in the current browser.

## Product direction

- Multi-site platform for personal and client projects.
- Astro + React + Tailwind dashboard.
- Section-based editor.
- Hybrid template architecture: shared components, template-specific sections and website extensions.
- PostgreSQL as operational draft source of truth; GitHub as synchronized source artifact and version history.
- Each generated website is a standalone Astro project and has no runtime dependency on the dashboard.

See the technical specification documents in the project planning package for the proposed architecture and data model.