# Command Center React Prototype

This folder contains the first real app prototype derived from the Stitch export.

## Stack

- Vite
- React
- Plain CSS with shared design tokens based on the Stitch design brief

## Run locally

```bash
cd /Users/jdjohns4/CommandCenter/stitch_the_workspace_project_management/prototype-app
npm install
npm run dev
```

Open the local URL Vite prints, usually:

- `http://localhost:5173/`

## Included MVP views

- Dashboard
- Projects
- Knowledge Base
- Semantic Search
- Settings

## What this prototype does

- consolidates the strongest Stitch concepts into one cohesive app shell
- uses shared navigation and reusable cards instead of isolated HTML exports
- includes mock project, search, and knowledge data
- supports quick capture interactions and project detail switching

## What is still mocked

- authentication
- persistence
- API integrations
- real embeddings or vector search
- notifications and background jobs

## Next recommended build step

If we continue, the highest-leverage next move is to add routing plus persisted mock data, then connect one real backend surface such as notes storage or search indexing.
