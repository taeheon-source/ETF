# ETF NAV Dashboard

This MVP is now structured for Vercel deployment:

- Static frontend: `index.html`, `styles.css`, `app.js`
- Serverless API: `api/nav-data.js`

## Vercel environment variables

Set these in your Vercel project:

- `KRX_UPSTREAM_URL`
- `KRX_AUTH_KEY`
- `KRX_AUTH_HEADER`

Recommended values for this project:

- `KRX_UPSTREAM_URL=https://data-dbg.krx.co.kr/svc/apis/etp/etf_bydd_trd`
- `KRX_AUTH_HEADER=AUTH_KEY`

## Deploy on Vercel

1. Push this folder to GitHub.
2. Import the repository in Vercel.
3. Add the environment variables above.
4. Deploy.

## Local preview

You can also run it locally with Vercel:

1. Install the Vercel CLI if needed.
2. Run `vercel dev`
3. Open the local URL Vercel prints.

## Notes

- The API route calls the KRX endpoint one business day at a time.
- The current Vercel API limits requests to about 70 business days per call.
- Request bodies send `basDd` as `YYYYMMDD`.
- Only `BAS_DD`, `ISU_CD`, `ISU_NM`, and `NAV` are used.
- If environment variables are missing or upstream data is empty, the UI falls back to sample data.
- Branding assets are included as `favicon.svg`, `social-card.svg`, and `site.webmanifest`.
