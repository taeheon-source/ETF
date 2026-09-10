# ETF NAV Dashboard

This MVP is now structured for Vercel deployment:

- Static frontend: `index.html`, `styles.css`, `app.js`
- Serverless API: `api/nav-data.js`

## Site password

The whole site sits behind a login page (`login.html` + `middleware.js`). Set the
password as a Vercel environment variable and redeploy:

- `SITE_PASSWORD` — required. Without it every request returns 503, so a missing
  setting locks the site rather than opening it.

The password lives only in Vercel, never in this repository. There is no
username. A successful login sets an HttpOnly session cookie signed with the
password, so changing the password signs everyone out.

The cookie has two stages. A fresh login grants one page view; serving that page
downgrades the cookie to API-only. So every reload, new tab, or restart asks for
the password again, while the page already on screen keeps loading data. It is
also a session cookie with a signed 8-hour cap. `/__logout` clears it.

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
