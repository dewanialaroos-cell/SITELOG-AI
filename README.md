# SITELOG AI — First Working Version

A mobile-friendly construction site daily reporting PWA.

## Included in v0.1

- Project and engineer information
- Date, weather and working hours
- Work completed notes
- Browser voice-to-text
- Labour log
- Material log
- Equipment log
- Issues / delays
- Additional notes
- Up to 8 site photos
- Local browser storage
- Saved reports list
- PDF daily report generation
- Share / WhatsApp text sharing
- Mobile responsive UI
- PWA manifest

## Run locally

```bash
npm install
npm run dev
```

Open the URL shown by Vite.

## Build

```bash
npm run build
```

## Important

This first version is a frontend MVP. Data is stored in the browser using localStorage.
For a commercial version we should add a real database, authentication, cloud photo storage,
company accounts, client accounts, Arabic/English, automated PDF/email/WhatsApp workflows,
and an admin dashboard.
