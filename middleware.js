import { next } from "@vercel/edge";

/* 사이트 전체를 로그인 뒤로 숨긴다.
   비밀번호는 저장소에 두지 않고 Vercel 환경변수 SITE_PASSWORD로 주입한다.

   쿠키는 두 단계를 가진다. 로그인 직후에는 화면을 한 번 열 수 있는
   document 단계이고, 화면을 열어주는 순간 api 단계로 낮춘다. 그래서
   새로고침하거나 새 탭으로 들어오면 다시 로그인해야 하고, 이미 열린
   화면의 데이터 호출은 계속 동작한다. */
const SESSION_COOKIE = "hb_session";
const SESSION_ABSOLUTE_MAX_AGE = 60 * 60 * 8;
const STAGE_DOCUMENT = "d";
const STAGE_API = "a";
const LOGIN_PATH = "/login";
const AUTH_PATH = "/__auth";
const LOGOUT_PATH = "/__logout";
// 로그인 화면 자체와 탭 아이콘은 열어둔다. 그 외에는 전부 막힌다.
const PUBLIC_PATHS = new Set([LOGIN_PATH, "/login.html", "/favicon.svg"]);

export const config = {
  matcher: "/(.*)"
};

const encoder = new TextEncoder();

async function sign(value, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

// 길이가 달라도 같은 횟수를 돌려, 응답 시간으로 정답 길이가 새지 않게 한다
export function timingSafeEqual(input, expected) {
  if (typeof input !== "string" || typeof expected !== "string") {
    return false;
  }
  let diff = input.length ^ expected.length;
  const length = Math.max(input.length, expected.length);
  for (let i = 0; i < length; i += 1) {
    diff |= (input.charCodeAt(i) || 0) ^ (expected.charCodeAt(i) || 0);
  }
  return diff === 0;
}

export function readCookie(header, name) {
  if (typeof header !== "string") {
    return null;
  }
  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) {
      continue;
    }
    if (part.slice(0, separator).trim() === name) {
      return part.slice(separator + 1).trim();
    }
  }
  return null;
}

export async function issueToken(secret, stage, expiresAt) {
  const payload = `${stage}.${expiresAt}`;
  return `${payload}.${await sign(payload, secret)}`;
}

export async function readSession(token, secret, now = Date.now()) {
  if (typeof token !== "string") {
    return null;
  }
  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }
  const [stage, expires, signature] = parts;
  if (stage !== STAGE_DOCUMENT && stage !== STAGE_API) {
    return null;
  }
  const expiresAt = Number(expires);
  if (!expires || !Number.isFinite(expiresAt) || expiresAt <= now) {
    return null;
  }
  if (!timingSafeEqual(signature, await sign(`${stage}.${expires}`, secret))) {
    return null;
  }
  return { stage, expiresAt };
}

// Max-Age를 붙이지 않으면 세션 쿠키가 되어 브라우저 종료 시 사라진다
function sessionCookie(token, secure) {
  const parts = [`${SESSION_COOKIE}=${token}`, "Path=/", "HttpOnly", "SameSite=Lax"];
  if (!token) {
    parts.push("Max-Age=0");
  }
  if (secure) {
    parts.push("Secure");
  }
  return parts.join("; ");
}

/* 화면 이동인지 판별한다. 스타일이나 스크립트, API 호출은 여기 해당하지
   않으므로 이미 열린 화면이 중간에 끊기지 않는다. */
export function isDocumentRequest(request) {
  const destination = request.headers.get("sec-fetch-dest");
  if (destination) {
    return destination === "document";
  }
  return (request.headers.get("accept") || "").includes("text/html");
}

async function readSubmittedPassword(request) {
  const contentType = request.headers.get("content-type") || "";
  try {
    if (contentType.includes("application/json")) {
      const body = await request.json();
      return typeof body?.password === "string" ? body.password : "";
    }
    const form = await request.formData();
    const value = form.get("password");
    return typeof value === "string" ? value : "";
  } catch {
    return "";
  }
}

function jsonResponse(body, status, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...extraHeaders
    }
  });
}

function redirectToLogin(url) {
  const target = new URL(LOGIN_PATH, url);
  const from = url.pathname + url.search;
  if (from !== "/") {
    target.searchParams.set("next", from);
  }
  return new Response(null, {
    status: 303,
    headers: { location: target.toString(), "cache-control": "no-store" }
  });
}

export default async function middleware(request) {
  const password = process.env.SITE_PASSWORD;

  // 환경변수가 없으면 열어두지 않고 막는다. 설정 누락이 곧 무방비가 되면 안 된다.
  if (!password) {
    return new Response("SITE_PASSWORD 환경변수가 설정되지 않았습니다.", {
      status: 503,
      headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" }
    });
  }

  const url = new URL(request.url);
  const secure = url.protocol === "https:";

  if (url.pathname === AUTH_PATH) {
    if (request.method !== "POST") {
      return jsonResponse({ error: "POST만 허용됩니다." }, 405);
    }
    const submitted = await readSubmittedPassword(request);
    if (!timingSafeEqual(submitted, password)) {
      return jsonResponse({ error: "비밀번호가 올바르지 않습니다." }, 401);
    }
    const expiresAt = Date.now() + SESSION_ABSOLUTE_MAX_AGE * 1000;
    const token = await issueToken(password, STAGE_DOCUMENT, expiresAt);
    return jsonResponse({ ok: true }, 200, { "set-cookie": sessionCookie(token, secure) });
  }

  if (url.pathname === LOGOUT_PATH) {
    return new Response(null, {
      status: 303,
      headers: {
        location: LOGIN_PATH,
        "set-cookie": sessionCookie("", secure),
        "cache-control": "no-store"
      }
    });
  }

  if (PUBLIC_PATHS.has(url.pathname)) {
    return next();
  }

  const session = await readSession(readCookie(request.headers.get("cookie"), SESSION_COOKIE), password);

  if (isDocumentRequest(request)) {
    if (session?.stage !== STAGE_DOCUMENT) {
      return redirectToLogin(url);
    }
    /* 화면을 한 번 내주고 곧바로 API 전용으로 낮춘다.
       no-store를 붙여야 뒤로 가기에서 캐시로 되살아나지 않는다. */
    return next({
      headers: {
        "set-cookie": sessionCookie(await issueToken(password, STAGE_API, session.expiresAt), secure),
        "cache-control": "no-store"
      }
    });
  }

  if (session) {
    return next();
  }

  /* API 요청에 로그인 화면을 돌려주면 프런트가 HTML을 JSON으로 파싱한다.
     화면 이동만 로그인으로 보내고 나머지는 401로 끊는다. */
  if (url.pathname.startsWith("/api/")) {
    return jsonResponse({ error: "로그인이 필요합니다." }, 401);
  }

  return redirectToLogin(url);
}
