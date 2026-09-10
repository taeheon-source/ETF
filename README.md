# ETF NAV Dashboard

This MVP is now structured for Vercel deployment:

- Static frontend: `index.html`, `styles.css`, `app.js`
- Serverless API: `api/nav-data.js`

## Site password

The whole site sits behind HTTP Basic auth (`middleware.js`). Set the password
as a Vercel environment variable and redeploy:

- `SITE_PASSWORD` — required. Without it every request returns 503, so a missing
  setting locks the site rather than opening it.

The username is not checked. Leave it blank in the browser prompt and enter the
password only. The password lives only in Vercel, never in this repository.

## Vercel environment variables

Set these in your Vercel project:

- `SITE_PASSWORD`
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
