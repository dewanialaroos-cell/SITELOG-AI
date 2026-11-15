# Construction Site AI

A mobile-friendly construction site management workspace built with React, Vite and Supabase.

## Current features
- Company and engineer authentication
- Company workspaces and project membership
- Project portfolio and daily site reports
- Site photos (up to 8 compressed images per report)
- PDF report generation and native share / WhatsApp handoff
- Arabic (default) and English interface
- Responsive web app and installable PWA

## Development
```bash
npm install
npm run dev
```

## Production build
```bash
npm run build
```

## Required environment variables
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` (publishable/anon client key only)

Never expose the Supabase service-role or secret key in frontend code.

## Deployment
Cloudflare Pages builds the `v0.2-commercial` production branch. Pull requests should pass the production build workflow before merge.

## Operational notes
- Supabase Auth email delivery to external addresses requires a verified sender/domain and configured custom SMTP.
- Existing database records must be preserved during schema changes.
- Report photos are currently stored in the report JSON field as compressed data URLs; a private Storage migration is a planned reliability improvement.
