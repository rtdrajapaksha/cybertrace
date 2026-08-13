# CyberTrace — Digital Footprint Analysis Platform

University capstone project. CyberTrace scans a user's publicly available
digital identifiers, assesses privacy/security risk, and generates
personalized recommendations and PDF reports.

**Status:** project structure only — no application features implemented yet.

## Tech stack

- **Frontend:** React Native + Expo
- **Backend:** Node.js + Express
- **Database:** PostgreSQL via Supabase (Auth + Row-Level Security)

## Project structure

```
frontend/         React Native + Expo app (screens, components, services, state)
backend/          Node.js + Express API (routes, controllers, services, middleware)
database/         Supabase/PostgreSQL schema, migrations, seed data
ai/               Rule-based footprint analysis, risk scoring, recommendations
authentication/   Auth and access-control policy notes, session handling
reports/          PDF report generation and templates
testing/          Unit and integration tests
docs/             Diagrams, API docs, project documentation
config/           Environment-specific configuration
```

## Setup (placeholder — to be filled in as development begins)

1. Copy `.env.example` to `.env` and fill in your own Supabase project
   credentials. Never commit `.env`.
2. Frontend and backend dependency installation instructions will be
   added once each app is scaffolded with its package manager.

## Contributing

This repository is being built incrementally as part of an IT capstone
project. See `docs/project/` for planning and requirements documentation.
