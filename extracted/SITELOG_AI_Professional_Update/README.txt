SITELOG AI — Professional Update

FILES
- src/App.jsx: replace the existing src/App.jsx
- src/styles.css: replace the existing src/styles.css
- database/admin_access_fix.sql: run once in the Supabase SQL Editor to allow company owners/admins to read their company's projects and reports under Row Level Security.

REQUIREMENTS
- Keep the existing src/supabase.js file and root .env file.
- The app uses the existing Supabase schema and the create_company(company_name) RPC created earlier.
- No service-role key is used by the frontend.

IMPORTANT
- Do not upload your .env file into a public repository.
- Team invitations and per-project email assignments are not implemented in this update; the UI clearly identifies the current account role.
